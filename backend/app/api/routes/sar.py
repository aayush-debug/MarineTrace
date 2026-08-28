"""
SAR Imagery & Radar View API Router.
Mounted under /sar
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/sar", tags=["sar"])

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
    return SAMPLE_S1_METADATA


@router.get("/scenes/{scene_id}/raster")
async def get_scene_raster(scene_id: str, channel: str = "vv"):
    # Return placeholder or generated PNG
    demo_png = Path(__file__).resolve().parents[4] / "frontend" / "public" / "sar" / f"sample_s1_{channel.lower()}.png"
    if demo_png.exists():
        return FileResponse(demo_png, media_type="image/png")
    raise HTTPException(status_code=404, detail="Raster image asset not found")


@router.get("/scenes/{scene_id}/mask")
async def get_scene_mask(scene_id: str, type: str = "binary"):
    suffix = "mask" if type == "binary" else "prob"
    demo_png = Path(__file__).resolve().parents[4] / "frontend" / "public" / "sar" / f"sample_s1_{suffix}.png"
    if demo_png.exists():
        return FileResponse(demo_png, media_type="image/png")
    raise HTTPException(status_code=404, detail="Mask asset not found")
