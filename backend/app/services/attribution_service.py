"""Attribution service — orchestrates feature extraction, scoring, and ranking."""

from __future__ import annotations

from app.core.logging import logger
from app.models.drift import DriftResult
from app.models.vessel import VesselAttribution, VesselTrack
from attribution.ranking import rank_vessels


class AttributionService:
    """High-level attribution interface."""

    async def attribute(
        self,
        drift: DriftResult,
        candidates: list[VesselTrack],
    ) -> list[VesselAttribution]:
        """
        Score and rank candidate vessels against the drift origin.

        Returns ranked list of VesselAttribution.
        """
        if not candidates:
            logger.warning("No candidate vessels for attribution")
            return []

        return rank_vessels(
            candidates,
            origin=drift.origin,
            time_window=drift.origin_time_window,
        )
