"""Tests for drift simulation service and backtracking/forecasting."""

import pytest
from datetime import datetime, timezone
from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection
from app.services.drift_service import DriftService


@pytest.mark.asyncio
async def test_backward_and_forward_drift():
    drift_service = DriftService()
    obs_time = datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)

    spill = SpillDetection(
        spill_detected=True,
        confidence=0.92,
        area_km2=18.4,
        centroid=SpillCentroid(latitude=18.721, longitude=72.914),
        geometry=GeoJSONGeometry(
            type="Polygon",
            coordinates=[[[72.89, 18.70], [72.92, 18.705], [72.935, 18.725], [72.89, 18.70]]],
        ),
        observation_time=obs_time,
    )

    result = await drift_service.run_full(spill, backward_hours=12, forward_hours=6)

    # Origin checks
    assert result.origin is not None
    assert 0.0 <= result.origin.confidence <= 1.0
    assert result.origin.geometry is not None
    assert result.origin.geometry.type == "Polygon"

    # Time window
    assert result.origin_time_window.start < result.origin_time_window.end

    # Trajectories
    assert result.backward_trajectory.direction == "backward"
    assert len(result.backward_trajectory.points) > 1
    assert result.forward_trajectory is not None
    assert result.forward_trajectory.direction == "forward"
    assert len(result.forward_trajectory.points) > 1
