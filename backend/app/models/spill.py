"""Oil-spill detection models — the contract between ML and the rest of the system."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    """GeoJSON-compatible geometry."""

    type: str = Field(..., description="GeoJSON geometry type, e.g. Polygon, LineString, Point")
    coordinates: list[Any] = Field(..., description="GeoJSON coordinate array")


class SpillCentroid(BaseModel):
    """Geographic centre of a detected oil spill."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class SpillDetection(BaseModel):
    """
    Standardised output from the ML oil-spill detection model.

    This is THE contract that the ML developer must honour.
    Everything downstream depends on this schema.
    """

    spill_detected: bool = Field(..., description="Whether an oil spill was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence 0–1")
    area_km2: float = Field(0.0, ge=0.0, description="Estimated spill area in km²")
    centroid: SpillCentroid | None = Field(None, description="Spill centre")
    geometry: GeoJSONGeometry | None = Field(None, description="Spill boundary polygon (GeoJSON)")
    observation_time: datetime | None = Field(None, description="Satellite observation timestamp")


class SpillSummary(BaseModel):
    """Simplified spill info included in investigation responses."""

    detected: bool
    confidence: float
    area_km2: float
    geometry: GeoJSONGeometry | None = None
