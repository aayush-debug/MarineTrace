"""Tests for AIS integration, track interpolation, and 3-stage filtering."""

import pytest
from datetime import datetime, timedelta, timezone
from ais.client import MockAISClient
from ais.filtering import filter_all, spatial_filter, temporal_filter, trajectory_filter
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.spill import GeoJSONGeometry


@pytest.mark.asyncio
async def test_ais_mock_generation_and_filtering():
    client = MockAISClient()
    start_time = datetime(2026, 8, 24, 0, 0, 0, tzinfo=timezone.utc)
    end_time = datetime(2026, 8, 25, 12, 0, 0, tzinfo=timezone.utc)

    tracks = await client.get_historical_tracks(18.0, 19.5, 72.5, 73.5, start_time, end_time)
    assert len(tracks) == 17

    # Setup drift origin for filtering in Arabian Sea open water
    origin = DriftOrigin(
        latitude=18.915,
        longitude=72.250,
        confidence=0.84,
        geometry=GeoJSONGeometry(type="Polygon", coordinates=[[[72.20, 18.89], [72.30, 18.89], [72.30, 18.95], [72.20, 18.89]]]),
    )
    time_win = DriftTimeWindow(
        start=datetime(2026, 8, 24, 10, 30, 0, tzinfo=timezone.utc),
        end=datetime(2026, 8, 24, 16, 30, 0, tzinfo=timezone.utc),
    )

    filtered = filter_all(tracks, origin, time_win, spatial_radius_km=50.0, temporal_buffer_hours=2.0, trajectory_max_km=30.0)

    # Filtering reduces candidate count
    assert 1 <= len(filtered) < len(tracks)
    # Ensure MV Ocean Star passed the filters
    mmsi_list = [v.mmsi for v in filtered]
    assert "419001234" in mmsi_list
