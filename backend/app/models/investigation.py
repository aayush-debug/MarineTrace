"""Investigation models — request, response, and status tracking."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from app.models.drift import DriftResult
from app.models.spill import SpillDetection, SpillSummary
from app.models.vessel import VesselAttribution


class InvestigationStatus(str, Enum):
    """Pipeline status for an investigation."""

    PENDING = "PENDING"
    DETECTING = "DETECTING"
    DRIFTING = "DRIFTING"
    TRACKING = "TRACKING"
    ATTRIBUTING = "ATTRIBUTING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class InvestigationRequest(BaseModel):
    """Request to start a new investigation."""

    image: str | None = Field(
        None,
        description="Base64-encoded SAR image or URL. Optional for demo mode.",
    )
    observation_time: datetime = Field(
        ...,
        description="Satellite observation timestamp (ISO 8601)",
    )
    # Optional overrides for the investigation
    backward_hours: int | None = None
    forward_hours: int | None = None
    custom_spill: SpillDetection | None = Field(
        None,
        description="Explicit spill detection instance (e.g. from SpaceShift real-time feed).",
    )


class InvestigationResponse(BaseModel):
    """Complete investigation result — the frontend renders everything from this."""

    investigation_id: str
    status: InvestigationStatus = InvestigationStatus.COMPLETE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    observation_time: datetime

    # Pipeline outputs
    spill: SpillSummary
    drift: DriftResult
    vessels: list[VesselAttribution] = Field(default_factory=list)

    # Metadata
    pipeline_duration_seconds: float | None = None
    is_demo: bool = False
    disclaimer: str = (
        "This analysis provides potential vessel attribution for investigative "
        "priority only. It does not constitute a definitive determination of "
        "responsibility."
    )
