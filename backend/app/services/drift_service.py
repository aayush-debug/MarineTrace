"""
Drift service — orchestrates backward/forward simulations.

Uses Copernicus Marine ocean current data + OpenDrift simulation when available,
and automatically falls back to geometric simulation if unavailable.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftResult, DriftTrajectory
from app.models.spill import SpillDetection
from app.services.copernicus_service import CopernicusService
from drift.backtracking import run_backward_mock, run_backward_opendrift
from drift.forecasting import run_forward_mock, run_forward_opendrift
from drift.opendrift_runner import OPENDRIFT_AVAILABLE


class DriftService:
    """High-level drift simulation interface combining Copernicus + OpenDrift."""

    def __init__(self, copernicus_service: CopernicusService | None = None):
        self.copernicus = copernicus_service or CopernicusService()

    async def _get_copernicus_nc(
        self, spill: SpillDetection, hours: int
    ) -> str | None:
        """Fetch or retrieve cached Copernicus ocean currents for the spill region."""
        centroid = spill.centroid
        obs_time = spill.observation_time or datetime.now(timezone.utc)
        start_time = obs_time - timedelta(hours=hours)
        end_time = obs_time + timedelta(hours=hours)

        try:
            return await self.copernicus.get_ocean_currents(
                min_lat=centroid.latitude - 0.5,
                max_lat=centroid.latitude + 0.5,
                min_lon=centroid.longitude - 0.5,
                max_lon=centroid.longitude + 0.5,
                start_time=start_time,
                end_time=end_time,
            )
        except Exception as e:
            logger.warning("Failed to get Copernicus ocean currents: %s", e)
            return None

    async def run_backward(
        self,
        spill: SpillDetection,
        backward_hours: int | None = None,
    ) -> DriftResult:
        """Run backward drift simulation from a detected spill."""
        bh = backward_hours or settings.drift_backward_hours
        if OPENDRIFT_AVAILABLE:
            nc_file = await self._get_copernicus_nc(spill, bh)
            try:
                logger.info(
                    "Running real OpenDrift backward simulation (Forcing: %s)",
                    "Copernicus Marine" if nc_file else "Built-in",
                )
                return run_backward_opendrift(spill, backward_hours=bh, nc_file=nc_file)
            except Exception as e:
                logger.warning(
                    "OpenDrift backward simulation error: %s — falling back to geometric mock",
                    e,
                )
                return run_backward_mock(spill, backward_hours=bh)
        else:
            logger.info("OpenDrift unavailable — using geometric mock")
            return run_backward_mock(spill, backward_hours=bh)

    async def run_forward(
        self,
        spill: SpillDetection,
        forward_hours: int | None = None,
    ) -> DriftTrajectory:
        """Run forward drift prediction from current spill position."""
        fh = forward_hours or settings.drift_forward_hours
        if OPENDRIFT_AVAILABLE:
            nc_file = await self._get_copernicus_nc(spill, fh)
            try:
                logger.info(
                    "Running real OpenDrift forward simulation (Forcing: %s)",
                    "Copernicus Marine" if nc_file else "Built-in",
                )
                return run_forward_opendrift(spill, forward_hours=fh, nc_file=nc_file)
            except Exception as e:
                logger.warning(
                    "OpenDrift forward simulation error: %s — falling back to geometric mock",
                    e,
                )
                return run_forward_mock(spill, forward_hours=fh)
        else:
            logger.info("OpenDrift unavailable — using geometric mock")
            return run_forward_mock(spill, forward_hours=fh)

    async def run_full(
        self,
        spill: SpillDetection,
        backward_hours: int | None = None,
        forward_hours: int | None = None,
    ) -> DriftResult:
        """Run both backward and forward simulations, returning a complete DriftResult."""
        result = await self.run_backward(spill, backward_hours=backward_hours)
        forward = await self.run_forward(spill, forward_hours=forward_hours)
        result.forward_trajectory = forward
        return result

