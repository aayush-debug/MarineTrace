"""Drift simulation models — backward/forward trajectory and origin estimation."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.spill import GeoJSONGeometry


class DriftOrigin(BaseModel):
    """Estimated origin of the spill from backward drift simulation."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    confidence: float = Field(..., ge=0.0, le=1.0, description="Origin confidence 0–1")
    geometry: GeoJSONGeometry | None = Field(
        None, description="Origin probability zone (GeoJSON Polygon)"
    )


class DriftTimeWindow(BaseModel):
    """Estimated time window when the spill originated."""

    start: datetime
    end: datetime


class DriftTrajectory(BaseModel):
    """A single trajectory (backward or forward)."""

    direction: str = Field(..., description="'backward' or 'forward'")
    geometry: GeoJSONGeometry | None = Field(None, description="Trajectory as GeoJSON LineString")
    timestamps: list[datetime] = Field(default_factory=list, description="Time at each point")
    points: list[list[float]] = Field(
        default_factory=list, description="[[lon, lat], …] trajectory points"
    )


class DriftResult(BaseModel):
    """Complete result from the drift simulation service."""

    origin: DriftOrigin
    origin_time_window: DriftTimeWindow
    backward_trajectory: DriftTrajectory
    forward_trajectory: DriftTrajectory | None = None
