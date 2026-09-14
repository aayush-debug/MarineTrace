"""
MarineTrace — Step 19: Comprehensive Test Suite for V2 ML Model & Pipeline Integration
"""

import os
import sys
import json
import pytest
import numpy as np
import torch
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from models.unet import create_model
from preprocessing.sar_preprocessing import preprocess_sar_image, handle_invalid_values
from inference.api_interface import detect_oil
from features.candidate_features import extract_candidates


class TestV2ModelIntegrity:
    """Test suite for V2 architecture, weights, and channel contracts."""

    def test_v2_checkpoint_exists_and_loads(self):
        ckpt_path = PROJECT_ROOT / "checkpoints" / "best_model_v2.pth"
        assert ckpt_path.exists(), f"V2 checkpoint missing at {ckpt_path}"
        
        ckpt = torch.load(str(ckpt_path), map_location="cpu", weights_only=False)
        assert "model_state_dict" in ckpt
        assert "config" in ckpt
        
        cfg = ckpt["config"]
        assert cfg["model"]["architecture"] == "Unet"
        assert cfg["model"]["encoder_name"] == "resnet34"
        assert cfg["model"]["in_channels"] == 2
        assert cfg["model"]["classes"] == 1
        
        model = create_model(cfg)
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        
        # Total parameters should match standard ResNet34 UNet
        total_params = sum(p.numel() for p in model.parameters())
        assert total_params > 20_000_000, f"Expected >20M params, got {total_params}"

    def test_v2_metadata_consistency(self):
        meta_path = PROJECT_ROOT / "checkpoints" / "model_v2_metadata.json"
        assert meta_path.exists(), "model_v2_metadata.json missing"
        
        with open(meta_path) as f:
            meta = json.load(f)
            
        assert meta["inference"]["default_threshold"] == 0.60
        assert meta["training"]["loss"] == "FocalDiceLoss"
        assert meta["metrics"]["test_dice"] > 0.90
        assert meta["metrics"]["test_pixel_fpr"] < 0.001

    def test_v2_input_channel_order_and_shape(self):
        ckpt_path = PROJECT_ROOT / "checkpoints" / "best_model_v2.pth"
        ckpt = torch.load(str(ckpt_path), map_location="cpu", weights_only=False)
        model = create_model(ckpt["config"])
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        
        # Test input shape [B, 2, 256, 256]
        dummy_input = torch.zeros(2, 2, 256, 256, dtype=torch.float32)
        # Channel 0 (VV) = -18 dB normalized -> 0.40
        dummy_input[:, 0] = 0.40
        # Channel 1 (VH) = -25 dB normalized -> 0.33
        dummy_input[:, 1] = 0.33
        
        with torch.no_grad():
            out = model(dummy_input)
            
        assert out.shape == (2, 1, 256, 256)
        probs = torch.sigmoid(out)
        assert torch.all(probs >= 0.0) and torch.all(probs <= 1.0)


class TestProductionAPIIntegration:
    """Test suite for api_interface.py, V2 selection, and fallback mechanism."""

    def test_api_v2_default_selection(self):
        if "ML_MODEL_VERSION" in os.environ:
            del os.environ["ML_MODEL_VERSION"]
            
        res = detect_oil(str(PROJECT_ROOT / "data" / "sample_s1.tif"))
        assert res["model_version"] == "marinetrace-unet-v2"
        assert "spill_detected" in res
        assert "confidence" in res
        assert "candidates" in res
        assert res["spill_detected"] is True

    def test_api_v1_explicit_fallback(self):
        os.environ["ML_MODEL_VERSION"] = "v1"
        try:
            res = detect_oil(str(PROJECT_ROOT / "data" / "sample_s1.tif"))
            assert res["model_version"] == "marinetrace-unet-v1"
            assert res["spill_detected"] is True
        finally:
            if "ML_MODEL_VERSION" in os.environ:
                del os.environ["ML_MODEL_VERSION"]

    def test_empty_mask_and_clean_ocean(self):
        # Create a synthetic clean ocean patch
        clean_sea = np.zeros((2, 256, 256), dtype=np.float32)
        clean_sea[0] = -18.0  # Normal open water VV
        clean_sea[1] = -25.0  # Normal open water VH
        
        import tempfile
        import tifffile
        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as f:
            temp_path = f.name
            
        try:
            tifffile.imwrite(temp_path, clean_sea)
            res = detect_oil(temp_path)
            assert res["spill_detected"] is False
            assert len(res["candidates"]) == 0
            assert res["spill"] is None
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_lookalike_low_wind_rejection(self):
        # Create a low-wind patch (gentle diffuse damping, not oil)
        h, w = 256, 256
        lookalike = np.zeros((2, h, w), dtype=np.float32)
        lookalike[0] = -18.0
        lookalike[1] = -25.0
        
        yy, xx = np.ogrid[:h, :w]
        dist = np.sqrt((xx - 128)**2 + (yy - 128)**2)
        damping = 3.5 * np.exp(-dist**2 / (2 * 60**2))
        lookalike[0] -= damping
        lookalike[1] -= damping * 0.6
        
        import tempfile
        import tifffile
        with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as f:
            temp_path = f.name
            
        try:
            tifffile.imwrite(temp_path, lookalike)
            res = detect_oil(temp_path, threshold=0.60)
            assert res["spill_detected"] is False
            assert len(res["candidates"]) == 0
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_corrupted_and_extreme_inputs(self):
        # Array with NaNs and Infs
        corrupt = np.full((2, 256, 256), np.nan, dtype=np.float32)
        corrupt[0, :50, :50] = np.inf
        corrupt[1, :50, :50] = -np.inf
        
        cleaned = handle_invalid_values(corrupt, fill_value=-35.0)
        assert not np.isnan(cleaned).any()
        assert not np.isinf(cleaned).any()
        assert (cleaned == -35.0).all()
        
        # Extreme backscatter values (-120 dB to +50 dB)
        extreme = np.array([[-120.0, 50.0], [-35.0, 0.0]], dtype=np.float32)
        norm = preprocess_sar_image(extreme, normalization="minmax", channel_bounds=[(-30.0, 0.0)])
        assert norm.min() >= 0.0
        assert norm.max() <= 1.0


class TestDatasetStandardAndPolicies:
    """Test verification of VV/VH policies and metadata catalogs."""

    def test_compatibility_matrix_exists(self):
        csv_path = PROJECT_ROOT / "data" / "dataset_compatibility.csv"
        assert csv_path.exists(), "dataset_compatibility.csv missing"
        
        content = csv_path.read_text()
        assert "DARTIS 2019" in content
        assert "VV_ONLY" in content
        assert "10.5281/zenodo.8346860" in content
        assert "COMPATIBLE_DUAL_POL" in content

    def test_scene_level_partitions_leakage_free(self):
        import csv
        samples_path = PROJECT_ROOT / "data" / "metadata" / "samples.csv"
        assert samples_path.exists(), "samples.csv missing"
        
        with open(samples_path) as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        train_scenes = {r["scene_id"] for r in rows if r["split"] == "train"}
        val_scenes = {r["scene_id"] for r in rows if r["split"] == "val"}
        test_scenes = {r["scene_id"] for r in rows if r["split"] == "test"}
        
        # Verify ZERO scene leakage
        assert len(train_scenes.intersection(val_scenes)) == 0
        assert len(train_scenes.intersection(test_scenes)) == 0
        assert len(val_scenes.intersection(test_scenes)) == 0
