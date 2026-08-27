"""Tests for ML client interface and mock model output."""

import pytest
from datetime import datetime, timezone
from app.services.ml_client import MockMLClient
from app.models.spill import SpillDetection


@pytest.mark.asyncio
async def test_mock_ml_client_output():
    ml = MockMLClient()
    obs_time = datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)
    spill = await ml.detect_oil(None, obs_time)

    assert isinstance(spill, SpillDetection)
    assert spill.spill_detected is True
    assert 0.0 <= spill.confidence <= 1.0
    assert spill.confidence > 0.8
    assert spill.area_km2 > 0
    assert spill.centroid is not None
    assert 18.0 <= spill.centroid.latitude <= 20.0
    assert 72.0 <= spill.centroid.longitude <= 74.0
    assert spill.geometry is not None
    assert spill.geometry.type == "Polygon"
    assert len(spill.geometry.coordinates[0]) >= 4


@pytest.mark.asyncio
async def test_real_ml_client_output():
    from app.services.ml_client import RealMLClient

    ml = RealMLClient()
    obs_time = datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)
    spill = await ml.detect_oil(None, obs_time)

    assert isinstance(spill, SpillDetection)
    assert spill.spill_detected is True
    assert 0.0 <= spill.confidence <= 1.0
    assert spill.area_km2 > 0
    assert spill.centroid is not None
    assert spill.geometry is not None
    assert spill.geometry.type == "Polygon"
