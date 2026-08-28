"""Drift simulation routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.drift import DriftResult, DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection
from app.services.drift_service import DriftService

router = APIRouter(prefix="/drift", tags=["drift"])

_drift_service = DriftService()


class DriftRequest(BaseModel):
    """Request for a standalone drift simulation."""
    centroid_lat: float = Field(..., ge=-90, le=90)
    centroid_lon: float = Field(..., ge=-180, le=180)
    observation_time: datetime
    geometry: GeoJSONGeometry | None = None
    hours: int = Field(24, ge=1, le=168, description="Simulation duration in hours (1-168)")


@router.post("/backward", response_model=DriftResult)
async def run_backward(request: DriftRequest):
    """Run a standalone backward drift simulation."""
    spill = SpillDetection(
        spill_detected=True,
        confidence=1.0,
        area_km2=0,
        centroid=SpillCentroid(
            latitude=request.centroid_lat,
            longitude=request.centroid_lon,
        ),
        geometry=request.geometry,
        observation_time=request.observation_time,
    )
    result = await _drift_service.run_backward(spill, backward_hours=request.hours)
    return result


@router.post("/forward", response_model=DriftTrajectory)
async def run_forward(request: DriftRequest):
    """Run a standalone forward drift prediction."""
    spill = SpillDetection(
        spill_detected=True,
        confidence=1.0,
        area_km2=0,
        centroid=SpillCentroid(
            latitude=request.centroid_lat,
            longitude=request.centroid_lon,
        ),
        geometry=request.geometry,
        observation_time=request.observation_time,
    )
    result = await _drift_service.run_forward(spill, forward_hours=request.hours)
    return result
