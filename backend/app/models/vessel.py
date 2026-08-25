"""Vessel and attribution models — AIS tracks, scoring, and ranking."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.spill import GeoJSONGeometry


class VesselPosition(BaseModel):
    """A single AIS position report."""

    timestamp: datetime
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed: float | None = Field(None, ge=0, description="Speed in knots")
    heading: float | None = Field(None, ge=0, le=360, description="Heading in degrees")
    course: float | None = Field(None, ge=0, le=360, description="Course over ground")


class VesselTrack(BaseModel):
    """Reconstructed AIS track for a single vessel."""

    mmsi: str
    name: str = "Unknown"
    vessel_type: str = "Unknown"
    imo: str | None = None
    flag: str | None = None
    positions: list[VesselPosition] = Field(default_factory=list)
    trajectory: GeoJSONGeometry | None = Field(
        None, description="Track as GeoJSON LineString"
    )


class FeatureScores(BaseModel):
    """Breakdown of the five attribution features (each 0–100)."""

    spatial: float = Field(0, ge=0, le=100)
    temporal: float = Field(0, ge=0, le=100)
    trajectory: float = Field(0, ge=0, le=100)
    behaviour: float = Field(0, ge=0, le=100)
    vessel_relevance: float = Field(0, ge=0, le=100)


class VesselAttribution(BaseModel):
    """Final attribution result for a single vessel."""

    rank: int = Field(..., ge=1)
    vessel_name: str
    mmsi: str
    score: float = Field(..., ge=0, le=100, description="Composite attribution score 0–100")
    confidence: str = Field("low", description="high / medium / low")
    feature_scores: FeatureScores
    reasons: list[str] = Field(default_factory=list, description="Human-readable explanations")
    investigative_priority: str = Field(
        "LOW", description="HIGH / MEDIUM / LOW"
    )

    # Vessel metadata for the UI
    vessel_type: str = "Unknown"
    flag: str | None = None
    trajectory: GeoJSONGeometry | None = None
