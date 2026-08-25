"""AIS service — orchestrates AIS client and filtering pipeline."""

from __future__ import annotations

from datetime import timedelta

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftResult
from app.models.vessel import VesselTrack
from app.utils.geo import expand_bbox
from ais.client import AISClientInterface, MockAISClient
from ais.filtering import filter_all


class AISService:
    """High-level AIS interface — fetch + filter in one call."""

    def __init__(self, client: AISClientInterface | None = None):
        self.client = client or MockAISClient()

    async def get_candidate_vessels(
        self, drift: DriftResult,
    ) -> tuple[list[VesselTrack], list[VesselTrack]]:
        """
        Fetch AIS tracks and run the 3-stage filter.

        Returns (all_tracks, filtered_tracks).
        """
        origin = drift.origin

        # Expand bbox around origin for AIS search
        min_lat, min_lon, max_lat, max_lon = expand_bbox(
            origin.latitude - 0.1,
            origin.longitude - 0.1,
            origin.latitude + 0.1,
            origin.longitude + 0.1,
            buffer_km=50,
        )

        # Time range: from origin window start to a few hours after observation
        start_time = drift.origin_time_window.start - timedelta(hours=6)
        end_time = drift.origin_time_window.end + timedelta(hours=6)

        logger.info(
            "AISService: fetching tracks in [%.2f–%.2f, %.2f–%.2f] "
            "from %s to %s",
            min_lat, max_lat, min_lon, max_lon,
            start_time.isoformat(), end_time.isoformat(),
        )

        all_tracks = await self.client.get_historical_tracks(
            min_lat, max_lat, min_lon, max_lon, start_time, end_time,
        )

        filtered = filter_all(
            all_tracks,
            origin=drift.origin,
            time_window=drift.origin_time_window,
        )

        return all_tracks, filtered
