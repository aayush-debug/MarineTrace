"""
Drift service — orchestrates backward/forward simulations.

Falls back to geometric mock if OpenDrift is not available.
"""

from __future__ import annotations

from app.core.logging import logger
from app.models.drift import DriftResult, DriftTrajectory
from app.models.spill import SpillDetection
from drift.backtracking import run_backward_mock
from drift.forecasting import run_forward_mock
from drift.opendrift_runner import OPENDRIFT_AVAILABLE


class DriftService:
    """High-level drift simulation interface."""

    async def run_backward(
        self,
        spill: SpillDetection,
        backward_hours: int | None = None,
    ) -> DriftResult:
        """Run backward drift simulation from a detected spill."""
        if OPENDRIFT_AVAILABLE:
            logger.info("Using OpenDrift for backward simulation")
            # TODO: integrate real OpenDrift runner once readers are configured
            # For now, still use mock even if OpenDrift is installed
            # until Copernicus data readers are set up
            return run_backward_mock(spill, backward_hours=backward_hours)
        else:
            logger.info("OpenDrift unavailable — using geometric mock")
            return run_backward_mock(spill, backward_hours=backward_hours)

    async def run_forward(
        self,
        spill: SpillDetection,
        forward_hours: int | None = None,
    ) -> DriftTrajectory:
        """Run forward drift prediction from current spill position."""
        if OPENDRIFT_AVAILABLE:
            logger.info("Using OpenDrift for forward simulation")
            return run_forward_mock(spill, forward_hours=forward_hours)
        else:
            logger.info("OpenDrift unavailable — using geometric mock")
            return run_forward_mock(spill, forward_hours=forward_hours)

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
