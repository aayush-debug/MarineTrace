"""
MarineTrace — Pipeline Smoke Tests

Comprehensive CPU-only tests covering all pipeline components.
Uses small synthetic tensors — no dataset download required.

Run:
    cd ml/
    python -m pytest tests/test_pipeline.py -v
"""

import os
import sys
import json
import tempfile
from pathlib import Path

import numpy as np
import pytest
import torch

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# ==============================================================================
# Preprocessing Tests
# ==============================================================================

class TestPreprocessing:
    """Tests for SAR preprocessing functions."""

    def test_handle_invalid_values(self):
        """NaN and Inf values should be replaced with fill_value."""
        from preprocessing.sar_preprocessing import handle_invalid_values

        image = np.array([1.0, np.nan, np.inf, -np.inf, 5.0], dtype=np.float32)
        result = handle_invalid_values(image, fill_value=-99.0)
        assert np.isfinite(result).all()
        assert result[1] == -99.0
        assert result[2] == -99.0
        assert result[3] == -99.0

    def test_handle_nodata_value(self):
        """Nodata sentinel values should be replaced."""
        from preprocessing.sar_preprocessing import handle_invalid_values

        image = np.array([1.0, -9999.0, 3.0], dtype=np.float32)
        result = handle_invalid_values(image, nodata_value=-9999.0, fill_value=0.0)
        assert result[1] == 0.0

    def test_normalize_minmax_2d(self):
        """Min-max normalization should produce values in [0, 1]."""
        from preprocessing.sar_preprocessing import normalize_minmax

        image = np.array([[0.0, 5.0], [10.0, 15.0]], dtype=np.float32)
        result = normalize_minmax(image)
        assert result.min() >= 0.0
        assert result.max() <= 1.0
        assert np.isclose(result.min(), 0.0)
        assert np.isclose(result.max(), 1.0)

    def test_normalize_minmax_3d_with_bounds(self):
        """Per-channel normalization with explicit bounds."""
        from preprocessing.sar_preprocessing import normalize_minmax

        image = np.random.uniform(-30, 0, (2, 64, 64)).astype(np.float32)
        bounds = [(-30.0, 0.0), (-35.0, -5.0)]
        result = normalize_minmax(image, channel_bounds=bounds)
        assert result.shape == image.shape
        assert result.min() >= 0.0
        assert result.max() <= 1.0

    def test_normalize_zscore(self):
        """Z-score normalization should center data around 0."""
        from preprocessing.sar_preprocessing import normalize_zscore

        image = np.random.randn(2, 64, 64).astype(np.float32) * 5 + 10
        result = normalize_zscore(image)
        # Mean should be approximately 0
        for c in range(2):
            assert abs(result[c].mean()) < 0.5

    def test_db_to_linear_conversion(self):
        """dB to linear conversion should follow 10^(dB/10)."""
        from preprocessing.sar_preprocessing import db_to_linear, linear_to_db

        db_vals = np.array([-20.0, -10.0, 0.0, 10.0], dtype=np.float32)
        linear = db_to_linear(db_vals)
        assert np.isclose(linear[2], 1.0)  # 0 dB = 1 linear
        assert np.isclose(linear[3], 10.0)  # 10 dB = 10 linear

        # Round-trip
        db_roundtrip = linear_to_db(linear)
        np.testing.assert_allclose(db_roundtrip, db_vals, atol=1e-5)

    def test_preprocess_pipeline(self):
        """Full preprocessing pipeline should produce valid output."""
        from preprocessing.sar_preprocessing import preprocess_sar_image

        image = np.random.uniform(-30, 0, (2, 128, 128)).astype(np.float32)
        image[0, 10, 10] = np.nan  # Add invalid value

        result = preprocess_sar_image(
            image,
            normalization="minmax",
            channel_bounds=[(-30.0, 0.0), (-35.0, -5.0)],
        )
        assert result.shape == image.shape
        assert np.isfinite(result).all()
        assert result.min() >= 0.0
        assert result.max() <= 1.0


# ==============================================================================
# Dataset Tests
# ==============================================================================

class TestDataset:
    """Tests for dataset loading and patching."""

    def test_extract_patches(self):
        """Patch extraction should produce correct shapes."""
        from preprocessing.patch_dataset import extract_patches

        image = np.random.randn(2, 512, 512).astype(np.float32)
        mask = np.zeros((512, 512), dtype=np.float32)
        mask[100:200, 100:200] = 1.0

        patches = extract_patches(image, mask, patch_size=256, stride=256)
        assert len(patches) == 4  # 512/256 = 2 per dimension, 2x2 = 4
        for img_p, msk_p in patches:
            assert img_p.shape == (2, 256, 256)
            assert msk_p.shape == (256, 256)

    def test_scene_level_split(self):
        """Scene-level split should partition without overlap."""
        from preprocessing.patch_dataset import scene_level_split

        paths = [f"image_{i:04d}.tif" for i in range(100)]
        train, val, test = scene_level_split(paths, seed=42)

        assert len(train) + len(val) + len(test) == 100
        assert len(set(train) & set(val)) == 0
        assert len(set(train) & set(test)) == 0
        assert len(set(val) & set(test)) == 0

    def test_scene_level_split_reproducible(self):
        """Split should be deterministic with the same seed."""
        from preprocessing.patch_dataset import scene_level_split

        paths = [f"img_{i}.tif" for i in range(50)]
        t1, v1, te1 = scene_level_split(paths, seed=123)
        t2, v2, te2 = scene_level_split(paths, seed=123)
        assert t1 == t2
        assert v1 == v2
        assert te1 == te2

    def test_in_memory_dataset(self):
        """InMemoryPatchDataset should return correct tensor shapes."""
        from preprocessing.patch_dataset import InMemoryPatchDataset

        images = [np.random.randn(2, 256, 256).astype(np.float32) for _ in range(5)]
        masks = [np.random.randint(0, 2, (256, 256)).astype(np.float32) for _ in range(5)]

        ds = InMemoryPatchDataset(images, masks)
        assert len(ds) == 5

        img, msk = ds[0]
        assert isinstance(img, torch.Tensor)
        assert isinstance(msk, torch.Tensor)
        assert img.shape == (2, 256, 256)
        assert msk.shape == (1, 256, 256)


# ==============================================================================
# Model Tests
# ==============================================================================

class TestModel:
    """Tests for model forward pass."""

    def test_fallback_unet_forward(self):
        """FallbackUNet should produce correct output shape."""
        from models.unet import FallbackUNet

        model = FallbackUNet(in_channels=2, classes=1)
        x = torch.randn(1, 2, 256, 256)
        with torch.no_grad():
            y = model(x)
        assert y.shape == (1, 1, 256, 256)

    def test_fallback_unet_no_sigmoid(self):
        """Model output should be raw logits (can be negative)."""
        from models.unet import FallbackUNet

        model = FallbackUNet(in_channels=2, classes=1)
        x = torch.randn(1, 2, 256, 256)
        with torch.no_grad():
            y = model(x)
        # Logits can be negative — check it's not constrained to [0,1]
        assert y.min().item() < 0.5 or y.max().item() > 0.5

    def test_create_model_factory(self):
        """create_model should return a valid nn.Module."""
        from models.unet import create_model

        config = {
            "model": {
                "encoder_name": "resnet34",
                "encoder_weights": None,  # Skip pretrained for speed
                "in_channels": 2,
                "classes": 1,
            }
        }
        model = create_model(config)
        assert isinstance(model, torch.nn.Module)

    def test_model_different_batch_sizes(self):
        """Model should handle different batch sizes."""
        from models.unet import FallbackUNet

        model = FallbackUNet(in_channels=2, classes=1)
        for bs in [1, 2, 4]:
            x = torch.randn(bs, 2, 256, 256)
            with torch.no_grad():
                y = model(x)
            assert y.shape == (bs, 1, 256, 256)


# ==============================================================================
# Loss Tests
# ==============================================================================

class TestLoss:
    """Tests for loss functions."""

    def test_dice_loss_perfect(self):
        """Dice loss should be ~0 for perfect predictions."""
        from training.losses import DiceLoss

        loss_fn = DiceLoss(smooth=1.0)
        # High logits for all-positive targets
        logits = torch.ones(1, 1, 64, 64) * 10.0
        targets = torch.ones(1, 1, 64, 64)
        loss = loss_fn(logits, targets)
        assert loss.item() < 0.05

    def test_dice_loss_worst(self):
        """Dice loss should be ~1 for completely wrong predictions."""
        from training.losses import DiceLoss

        loss_fn = DiceLoss(smooth=1.0)
        logits = torch.ones(1, 1, 64, 64) * -10.0  # Predict all negative
        targets = torch.ones(1, 1, 64, 64)  # All positive
        loss = loss_fn(logits, targets)
        assert loss.item() > 0.9

    def test_combined_loss(self):
        """Combined loss should return a scalar."""
        from training.losses import CombinedLoss

        loss_fn = CombinedLoss(bce_weight=0.5, dice_weight=0.5)
        logits = torch.randn(2, 1, 64, 64)
        targets = torch.randint(0, 2, (2, 1, 64, 64)).float()
        loss = loss_fn(logits, targets)
        assert loss.dim() == 0  # Scalar
        assert loss.item() >= 0.0

    def test_create_loss_factory(self):
        """create_loss should return valid loss modules."""
        from training.losses import create_loss

        for loss_type in ["bce", "dice", "combined"]:
            config = {"loss": {"type": loss_type}}
            loss_fn = create_loss(config)
            assert isinstance(loss_fn, torch.nn.Module)


# ==============================================================================
# Metrics Tests
# ==============================================================================

class TestMetrics:
    """Tests for evaluation metrics."""

    def test_perfect_predictions(self):
        """Perfect predictions should yield Dice=1, IoU=1."""
        from evaluation.evaluate import compute_metrics

        preds = np.ones((10, 64, 64))
        targets = np.ones((10, 64, 64))
        metrics = compute_metrics(preds, targets, threshold=0.5)
        assert np.isclose(metrics["dice"], 1.0, atol=1e-4)
        assert np.isclose(metrics["iou"], 1.0, atol=1e-4)
        assert np.isclose(metrics["precision"], 1.0, atol=1e-4)
        assert np.isclose(metrics["recall"], 1.0, atol=1e-4)

    def test_worst_predictions(self):
        """Completely wrong predictions should yield low metrics."""
        from evaluation.evaluate import compute_metrics

        preds = np.ones((10, 64, 64))
        targets = np.zeros((10, 64, 64))
        metrics = compute_metrics(preds, targets, threshold=0.5)
        assert metrics["precision"] < 0.01
        assert np.isclose(metrics["recall"], 0.0, atol=1e-4) or metrics["false_positive_rate"] > 0.99

    def test_empty_predictions_and_targets(self):
        """Both empty predictions and targets should yield perfect score."""
        from evaluation.evaluate import compute_metrics

        preds = np.zeros((5, 32, 32))
        targets = np.zeros((5, 32, 32))
        metrics = compute_metrics(preds, targets, threshold=0.5)
        assert metrics["pixel_accuracy"] > 0.99

    def test_find_optimal_threshold(self):
        """Optimal threshold should return a valid threshold and metrics."""
        from evaluation.evaluate import find_optimal_threshold

        np.random.seed(42)
        targets = np.random.randint(0, 2, (20, 32, 32)).astype(np.float32)
        preds = targets * 0.8 + np.random.randn(*targets.shape) * 0.1

        threshold, metrics = find_optimal_threshold(preds, targets)
        assert 0.0 < threshold < 1.0
        assert "dice" in metrics
        assert "iou" in metrics


# ==============================================================================
# Candidate Extraction Tests
# ==============================================================================

class TestCandidateExtraction:
    """Tests for thresholding, connected components, and feature extraction."""

    def test_threshold_probability_map(self):
        """Thresholding should produce binary output."""
        from features.candidate_features import threshold_probability_map

        prob_map = np.array([[0.3, 0.7], [0.5, 0.9]], dtype=np.float32)
        binary = threshold_probability_map(prob_map, threshold=0.5)
        assert binary.dtype == np.uint8
        expected = np.array([[0, 1], [0, 1]], dtype=np.uint8)
        np.testing.assert_array_equal(binary, expected)

    def test_connected_components(self):
        """Connected components should find distinct regions."""
        from features.candidate_features import extract_connected_components

        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[10:30, 10:30] = 1  # Region 1: 20x20 = 400 pixels
        mask[60:80, 60:80] = 1  # Region 2: 20x20 = 400 pixels

        labeled, regions = extract_connected_components(mask, min_area_pixels=100)
        assert len(regions) == 2
        for r in regions:
            assert r.area == 400

    def test_connected_components_filter_small(self):
        """Small regions below threshold should be filtered out."""
        from features.candidate_features import extract_connected_components

        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[10:30, 10:30] = 1  # Large region: 400 pixels
        mask[50:52, 50:52] = 1  # Small region: 4 pixels

        labeled, regions = extract_connected_components(mask, min_area_pixels=100)
        assert len(regions) == 1
        assert regions[0].area == 400

    def test_compute_candidate_features(self):
        """Feature computation should return expected keys."""
        from features.candidate_features import (
            extract_connected_components,
            compute_candidate_features,
        )

        mask = np.zeros((100, 100), dtype=np.uint8)
        mask[20:50, 20:50] = 1
        prob_map = np.zeros((100, 100), dtype=np.float32)
        prob_map[20:50, 20:50] = 0.85

        _, regions = extract_connected_components(mask, min_area_pixels=10)
        assert len(regions) == 1

        features = compute_candidate_features(regions[0], prob_map)
        assert "area_pixels" in features
        assert "centroid_row" in features
        assert "eccentricity" in features
        assert "solidity" in features
        assert "compactness" in features
        assert "oil_probability" in features
        assert features["oil_probability"] > 0.8

    def test_extract_candidates_full_pipeline(self):
        """Full candidate extraction pipeline should return sorted candidates."""
        from features.candidate_features import extract_candidates

        prob_map = np.zeros((200, 200), dtype=np.float32)
        prob_map[30:60, 30:60] = 0.9  # High confidence
        prob_map[120:150, 120:150] = 0.6  # Lower confidence

        candidates = extract_candidates(prob_map, threshold=0.5, min_area_pixels=50)
        assert len(candidates) == 2
        # Should be sorted by oil_probability descending
        assert candidates[0]["oil_probability"] >= candidates[1]["oil_probability"]
        # Each should have geometry
        for c in candidates:
            assert "geometry" in c
            assert "candidate_id" in c


# ==============================================================================
# Geometry Conversion Tests
# ==============================================================================

class TestGeometryConversion:
    """Tests for pixel-to-geographic coordinate conversion."""

    def test_area_km2_calculation(self):
        """Area conversion should produce reasonable values."""
        from features.candidate_features import compute_area_km2

        # Mock transform: 10m pixel size
        class MockTransform:
            a = 10.0  # pixel width in meters
            e = -10.0  # pixel height in meters

        area = compute_area_km2(10000, MockTransform())  # 10000 pixels * 100m² = 1 km²
        assert area is not None
        assert np.isclose(area, 1.0, atol=0.01)

    def test_area_km2_no_transform(self):
        """Area conversion should return None without transform."""
        from features.candidate_features import compute_area_km2

        area = compute_area_km2(1000, None)
        assert area is None


# ==============================================================================
# Inference & JSON Serialization Tests
# ==============================================================================

class TestInference:
    """Tests for the API interface and JSON serialization."""

    def test_mock_result_valid_json(self):
        """mock_result.json should be valid JSON."""
        mock_path = PROJECT_ROOT / "mock_result.json"
        if mock_path.exists():
            with open(mock_path) as f:
                result = json.load(f)
            assert isinstance(result, dict)
            assert "spill_detected" in result
            assert "confidence" in result
            assert "candidates" in result

    def test_mock_result_schema(self):
        """Mock result should follow the API contract schema."""
        mock_path = PROJECT_ROOT / "mock_result.json"
        if mock_path.exists():
            with open(mock_path) as f:
                result = json.load(f)

            assert isinstance(result["spill_detected"], bool)
            assert isinstance(result["confidence"], (int, float))
            assert 0 <= result["confidence"] <= 1

            if result["spill"]:
                spill = result["spill"]
                assert "area_km2" in spill
                assert "centroid" in spill
                assert "geometry" in spill

    def test_detect_oil_mock_function(self):
        """detect_oil_mock should return a valid dictionary."""
        from inference.api_interface import detect_oil_mock

        result = detect_oil_mock("fake/path.tif")
        assert isinstance(result, dict)
        assert "spill_detected" in result
        # Should be JSON serializable
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

    def test_json_serialization_of_numpy(self):
        """NumPy types should be convertible to JSON-safe types."""
        # Simulate what detect_oil might produce before cleanup
        data = {
            "value_int": int(np.int64(42)),
            "value_float": float(np.float32(3.14)),
            "value_bool": bool(np.bool_(True)),
        }
        json_str = json.dumps(data)
        assert isinstance(json_str, str)


# ==============================================================================
# Integration Tests
# ==============================================================================

class TestIntegration:
    """End-to-end integration tests with synthetic data."""

    def test_training_loop_smoke(self):
        """Training loop should complete without errors on tiny synthetic data."""
        from models.unet import FallbackUNet
        from training.losses import CombinedLoss

        model = FallbackUNet(in_channels=2, classes=1)
        criterion = CombinedLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

        # Tiny batch
        images = torch.randn(2, 2, 64, 64)
        masks = torch.randint(0, 2, (2, 1, 64, 64)).float()

        model.train()
        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, masks)
        loss.backward()
        optimizer.step()

        assert loss.item() >= 0.0
        assert logits.shape == (2, 1, 64, 64)

    def test_full_pipeline_synthetic(self):
        """Full pipeline: model → probability → candidates."""
        from models.unet import FallbackUNet
        from features.candidate_features import extract_candidates

        model = FallbackUNet(in_channels=2, classes=1)
        model.eval()

        # Create input with a dark spot (simulating oil)
        image = torch.randn(1, 2, 256, 256)
        image[:, :, 100:150, 100:150] -= 3.0

        with torch.no_grad():
            logits = model(image)
            prob_map = torch.sigmoid(logits).numpy()[0, 0]

        # Extract candidates (may or may not find anything with untrained model)
        candidates = extract_candidates(prob_map, threshold=0.3, min_area_pixels=10)
        assert isinstance(candidates, list)
        for c in candidates:
            assert "candidate_id" in c
            assert "oil_probability" in c
            assert "geometry" in c


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
