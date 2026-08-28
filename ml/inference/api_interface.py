"""
MarineTrace — API Interface

The clean Python interface for the backend developer.

Usage:
    from inference.api_interface import detect_oil
    result = detect_oil("path/to/sentinel1_image.tif")

The result is a JSON-serializable Python dictionary.
No PyTorch tensors. No NumPy arrays. No custom classes.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def _get_device() -> torch.device:
    """Select compute device."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


_MODEL_CACHE: dict[str, torch.nn.Module] = {}


def _load_model(checkpoint_path: str, config: dict, device: torch.device):
    """Load model from checkpoint (cached)."""
    cache_key = f"{checkpoint_path}:{device.type}"
    if cache_key in _MODEL_CACHE:
        return _MODEL_CACHE[cache_key]

    from models.unet import create_model

    # If checkpoint exists, skip downloading ImageNet weights since all weights are loaded from checkpoint
    model_cfg = dict(config)
    if os.path.exists(checkpoint_path):
        sub_cfg = dict(model_cfg.get("model", {}))
        sub_cfg["encoder_weights"] = None
        model_cfg["model"] = sub_cfg

    model = create_model(model_cfg)

    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        print(f"[WARNING] No checkpoint at {checkpoint_path}. Using untrained model.")

    model = model.to(device)
    model.eval()
    _MODEL_CACHE[cache_key] = model
    return model


def _tile_and_predict(
    model,
    image: np.ndarray,
    device: torch.device,
    tile_size: int = 256,
    overlap: int = 64,
) -> np.ndarray:
    """
    Run inference on a large image by tiling.

    Args:
        model: The segmentation model.
        image: Preprocessed SAR image [C, H, W].
        device: Compute device.
        tile_size: Size of each tile.
        overlap: Overlap between tiles.

    Returns:
        Probability map [H, W].
    """
    c, h, w = image.shape
    stride = tile_size - overlap

    # Pad image to fit tiles
    pad_h = (stride - (h - tile_size) % stride) % stride
    pad_w = (stride - (w - tile_size) % stride) % stride

    padded = np.pad(
        image,
        ((0, 0), (0, pad_h), (0, pad_w)),
        mode="reflect",
    )
    _, ph, pw = padded.shape

    # Accumulate predictions
    prob_sum = np.zeros((ph, pw), dtype=np.float32)
    count = np.zeros((ph, pw), dtype=np.float32)

    with torch.no_grad():
        for y in range(0, ph - tile_size + 1, stride):
            for x in range(0, pw - tile_size + 1, stride):
                tile = padded[:, y : y + tile_size, x : x + tile_size]
                tile_tensor = torch.from_numpy(tile[np.newaxis]).float().to(device)

                logits = model(tile_tensor)
                probs = torch.sigmoid(logits).cpu().numpy()[0, 0]

                prob_sum[y : y + tile_size, x : x + tile_size] += probs
                count[y : y + tile_size, x : x + tile_size] += 1.0

    # Average overlapping regions
    count = np.maximum(count, 1.0)
    prob_map = prob_sum / count

    # Remove padding
    return prob_map[:h, :w]


def detect_oil(
    image_path: str,
    checkpoint_path: str | None = None,
    config_path: str | None = None,
    threshold: float | None = None,
) -> dict:
    """
    Detect oil spills in a SAR image.

    This is the primary API function for the backend developer.

    Args:
        image_path: Path to a Sentinel-1 SAR GeoTIFF image.
        checkpoint_path: Path to model checkpoint (.pth file).
            Defaults to checkpoints/best_model.pth.
        config_path: Path to config.yaml.
            Defaults to ml/config.yaml.
        threshold: Oil probability threshold for detection.
            If None, uses the config default.

    Returns:
        JSON-serializable dictionary with detection results.
        See mock_result.json for the schema.
    """
    start_time = time.time()

    # --- Load configuration ---
    import yaml

    if config_path is None:
        config_path = str(PROJECT_ROOT / "config.yaml")

    if os.path.exists(config_path):
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        config = {}

    if checkpoint_path is None:
        env_ckpt = os.environ.get("ML_MODEL_PATH")
        if env_ckpt:
            candidates = [
                Path(env_ckpt),
                PROJECT_ROOT / env_ckpt,
                PROJECT_ROOT.parent / env_ckpt,
            ]
            for c in candidates:
                if c.exists():
                    checkpoint_path = str(c.resolve())
                    break

        if not checkpoint_path or not os.path.exists(checkpoint_path):
            checkpoint_path = str(
                PROJECT_ROOT / config.get("paths", {}).get("checkpoint_dir", "checkpoints") / "best_model.pth"
            )

    if threshold is None:
        threshold = config.get("inference", {}).get("default_threshold", 0.5)

    min_area = config.get("candidates", {}).get("min_area_pixels", 100)
    max_candidates = config.get("candidates", {}).get("max_candidates", 50)
    tile_overlap = config.get("inference", {}).get("tile_overlap", 64)
    tile_size = config.get("model", {}).get("image_size", 256)

    # --- Load and preprocess image ---
    from preprocessing.sar_preprocessing import load_sar_image, preprocess_sar_image

    image_raw, metadata = load_sar_image(image_path)

    # Get preprocessing bounds
    preproc_cfg = config.get("preprocessing", {})
    norm_bounds = preproc_cfg.get("norm_bounds", {})
    channel_bounds = [
        (norm_bounds.get("vv_min", -30.0), norm_bounds.get("vv_max", 0.0)),
        (norm_bounds.get("vh_min", -35.0), norm_bounds.get("vh_max", -5.0)),
    ]

    image_preprocessed = preprocess_sar_image(
        image_raw,
        nodata_value=metadata.get("nodata"),
        normalization=preproc_cfg.get("normalization", "minmax"),
        channel_bounds=channel_bounds,
    )

    # --- Load model and run inference ---
    device = _get_device()
    model = _load_model(checkpoint_path, config, device)

    prob_map = _tile_and_predict(
        model, image_preprocessed, device,
        tile_size=tile_size,
        overlap=tile_overlap,
    )

    # --- Extract candidates ---
    from features.candidate_features import extract_candidates

    transform = metadata.get("transform")
    crs = metadata.get("crs")

    candidates = extract_candidates(
        prob_map=prob_map,
        threshold=threshold,
        min_area_pixels=min_area,
        max_candidates=max_candidates,
        sar_image=image_raw,
        transform=transform,
        crs=crs,
    )

    # --- Build result ---
    processing_time = time.time() - start_time

    # Determine if spill was detected
    spill_detected = len(candidates) > 0

    # Build clean result dictionary
    result = {
        "spill_detected": bool(spill_detected),
        "confidence": float(candidates[0]["oil_probability"]) if candidates else 0.0,
        "observation_time": None,  # To be filled by backend from image metadata
        "image_path": str(image_path),
        "model_version": "marinetrace-unet-v1",
        "processing_time_seconds": round(processing_time, 2),
    }

    # Primary spill (largest/highest confidence candidate)
    if candidates:
        primary = candidates[0]
        result["spill"] = {
            "area_km2": primary.get("area_km2"),
            "area_pixels": primary.get("area_pixels", 0),
            "centroid": primary.get("centroid", {}),
            "geometry": primary.get("geometry", {}),
            "bounding_box": primary.get("bbox", {}),
        }
    else:
        result["spill"] = None

    # All candidates (cleaned for JSON serialization)
    result["candidates"] = []
    for cand in candidates:
        clean_cand = {
            "candidate_id": cand.get("candidate_id"),
            "oil_probability": round(cand.get("oil_probability", 0), 4),
            "area_km2": cand.get("area_km2"),
            "area_pixels": cand.get("area_pixels", 0),
            "centroid": cand.get("centroid", {}),
            "geometry": cand.get("geometry", {}),
            "properties": {
                k: round(v, 4) if isinstance(v, float) else v
                for k, v in cand.items()
                if k not in {
                    "candidate_id", "oil_probability", "area_km2",
                    "area_pixels", "centroid", "geometry", "bbox",
                    "centroid_row", "centroid_col", "georeferenced",
                }
            },
        }
        result["candidates"].append(clean_cand)

    # Metadata
    result["metadata"] = {
        "model_architecture": "U-Net (ResNet34 encoder)",
        "input_channels": ["VV", "VH"],
        "input_representation": "Sigma0 (dB)",
        "threshold_used": threshold,
        "georeferenced": bool(transform is not None and crs is not None),
        "crs": str(crs) if crs else None,
        "image_size": [int(image_raw.shape[1]), int(image_raw.shape[2])],
    }

    # Limitations
    result["limitations"] = [
        "Model confidence is not a guarantee of oil presence.",
        "Dark SAR features from low wind, biogenic slicks, or rain cells may produce false positives.",
        "Geographic geometry accuracy depends on input image georeferencing quality.",
        "This system does not perform vessel attribution.",
    ]

    # Validate JSON serializability
    try:
        json.dumps(result)
    except (TypeError, ValueError) as e:
        # Force serialization by converting problematic values
        result = json.loads(json.dumps(result, default=str))

    return result


def detect_oil_mock(image_path: str = "") -> dict:
    """
    Return a mock detection result for backend integration testing.

    The backend developer can use this before the actual model is ready.
    """
    mock_path = PROJECT_ROOT / "mock_result.json"
    if mock_path.exists():
        with open(mock_path) as f:
            return json.load(f)

    # Inline fallback
    return {
        "spill_detected": True,
        "confidence": 0.92,
        "observation_time": None,
        "image_path": str(image_path),
        "model_version": "marinetrace-mock-v1",
        "processing_time_seconds": 0.01,
        "spill": {
            "area_km2": 18.4,
            "centroid": {"latitude": 18.721, "longitude": 72.914},
            "geometry": {"type": "Polygon", "coordinates": []},
        },
        "candidates": [],
        "metadata": {"model_architecture": "MOCK", "georeferenced": False},
        "limitations": ["This is a mock response for testing purposes."],
    }
