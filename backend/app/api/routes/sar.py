"""
SAR Imagery & Radar View API Router.
Mounted under /sar
"""

from __future__ import annotations

import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.core.security import is_safe_path

router = APIRouter(prefix="/sar", tags=["sar"])

ALLOWED_CHANNELS = {"vv", "vh", "composite"}
ALLOWED_MASK_TYPES = {"binary", "probability", "prob", "mask"}
SAFE_SCENE_REGEX = re.compile(r"^[A-Za-z0-9_\-]{1,128}$")

SAMPLE_S1_METADATA = {
    "scene_id": "S1A_IW_GRDH_1SDV_20260825_ARABIAN_SEA",
    "satellite": "Sentinel-1A",
    "sensor_mode": "IW (Interferometric Wide Swath)",
    "product_type": "GRD (Ground Range Detected)",
    "polarization": "VV + VH (Dual-Polarization)",
    "acquisition_time": "2026-08-25T10:32:15Z",
    "center_coords": {"lat": 18.721, "lon": 72.914},
    "dimensions": {"width": 512, "height": 512},
    "pixel_spacing_meters": 10.0,
    "pass_direction": "DESCENDING",
    "relative_orbit": 142,
    "confidence_threshold": 0.35,
    "statistics": {
        "mean_vv_db": -16.4,
        "std_vv_db": 5.2,
        "mean_vh_db": -24.8,
        "std_vh_db": 4.1,
    },
    "candidates": [
        {
            "candidate_id": 1,
            "centroid": {"lat": 18.721, "lon": 72.914, "pixel_x": 256, "pixel_y": 256},
            "area_km2": 18.4,
            "confidence": 0.942,
            "mean_contrast_db": 8.4,
            "solidity": 0.91,
            "aspect_ratio": 2.65,
            "lookalike_score": 0.08,
            "verified_oil": True,
        }
    ],
}


@router.get("/scenes/{scene_id}")
async def get_scene_details(scene_id: str):
    if not SAFE_SCENE_REGEX.match(scene_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scene ID format.",
        )
    return SAMPLE_S1_METADATA


@router.get("/scenes/{scene_id}/raster")
async def get_scene_raster(
    scene_id: str,
    channel: str = Query("vv", description="Channel name: vv, vh, composite"),
):
    if not SAFE_SCENE_REGEX.match(scene_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scene ID format.")

    channel_clean = channel.lower().strip()
    if channel_clean not in ALLOWED_CHANNELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid channel '{channel}'. Allowed channels: {sorted(list(ALLOWED_CHANNELS))}",
        )

    sar_dir = Path(__file__).resolve().parents[4] / "frontend" / "public" / "sar"
    demo_png = sar_dir / f"sample_s1_{channel_clean}.png"

    if not is_safe_path(sar_dir, demo_png) or not demo_png.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raster image asset not found")

    return FileResponse(demo_png, media_type="image/png")


@router.get("/scenes/{scene_id}/mask")
async def get_scene_mask(
    scene_id: str,
    type: str = Query("binary", description="Mask type: binary, probability, mask, prob"),
):
    if not SAFE_SCENE_REGEX.match(scene_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scene ID format.")

    type_clean = type.lower().strip()
    if type_clean not in ALLOWED_MASK_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mask type '{type}'. Allowed types: {sorted(list(ALLOWED_MASK_TYPES))}",
        )

    suffix = "mask" if type_clean in ("binary", "mask") else "prob"
    sar_dir = Path(__file__).resolve().parents[4] / "frontend" / "public" / "sar"
    demo_png = sar_dir / f"sample_s1_{suffix}.png"

    if not is_safe_path(sar_dir, demo_png) or not demo_png.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mask asset not found")

    return FileResponse(demo_png, media_type="image/png")
