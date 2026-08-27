"""
Comprehensive unit tests for Datalastic AIS integration,
response parsing, error handling, mock fallback, and secret safety.
"""

import pytest
import httpx
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from ais.client import AISStreamClient, DatalasticClient, MockAISClient
from ais.filtering import filter_all
from app.services.ais_service import AISService
from app.services.attribution_service import AttributionService
from app.models.drift import DriftOrigin, DriftResult, DriftTimeWindow, DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection


def _make_mock_response(status_code: int, json_data: dict, url: str = "https://api.datalastic.com/api/v0/inradius_history") -> httpx.Response:
    req = httpx.Request("GET", url)
    return httpx.Response(status_code, json=json_data, request=req)


# ── Test 1: Missing AIS Key Handling ─────────────────────────────────
@pytest.mark.asyncio
async def test_missing_ais_key():
    client = DatalasticClient(api_key="")
    success, msg = await client.check_connection()
    assert success is False
    assert "Missing" in msg


# ── Test 2: Valid Configuration Initialization ───────────────────────
def test_datalastic_client_init():
    client = DatalasticClient(api_key="TEST_DUMMY_KEY", base_url="https://api.datalastic.com/api/v0/")
    assert client.base_url == "https://api.datalastic.com/api/v0"
    assert client.api_key == "TEST_DUMMY_KEY"


# ── Test 3: Datalastic Request Construction & Auth Verification ──────
@pytest.mark.asyncio
async def test_datalastic_check_connection_success():
    client = DatalasticClient(api_key="TEST_KEY")
    mock_resp = _make_mock_response(200, {"meta": {"success": True}, "data": {"credits": 500}}, url="https://api.datalastic.com/api/v0/stat")
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        success, msg = await client.check_connection()
        assert success is True
        assert "SUCCESS" in msg
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args.kwargs
        assert call_kwargs["params"]["api-key"] == "TEST_KEY"
        assert call_kwargs["headers"]["X-API-Key"] == "TEST_KEY"


# ── Test 4: Datalastic Response Parsing (Multi-Vessel Records) ────────
@pytest.mark.asyncio
async def test_datalastic_response_parsing():
    client = DatalasticClient(api_key="TEST_KEY")
    
    sample_api_response = {
        "data": [
            {
                "mmsi": "111222333",
                "ship_name": "TEST TANKER ALPHA",
                "type_name": "Oil Tanker",
                "imo": "9876543",
                "flag": "LR",
                "lat": 18.92,
                "lon": 73.18,
                "speed": 10.5,
                "heading": 210,
                "course": 212,
                "last_position_epoch": "2026-08-24T12:00:00Z",
            },
            {
                "mmsi": "444555666",
                "ship_name": "TEST CARGO BETA",
                "type_name": "Cargo Ship",
                "imo": "9123456",
                "flag": "PA",
                "lat": 18.50,
                "lon": 72.80,
                "speed": 14.0,
                "heading": 180,
                "course": 180,
                "last_position_epoch": 1787486400,  # unix epoch int
            }
        ]
    }
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_mock_response(200, sample_api_response)
        tracks = await client.get_historical_tracks(
            min_lat=18.0, max_lat=19.5, min_lon=72.0, max_lon=74.0,
            start_time=datetime(2026, 8, 24, 6, 0, 0, tzinfo=timezone.utc),
            end_time=datetime(2026, 8, 24, 18, 0, 0, tzinfo=timezone.utc),
        )
        assert len(tracks) == 2
        assert tracks[0].name == "TEST TANKER ALPHA"
        assert tracks[0].vessel_type == "Oil Tanker"
        assert len(tracks[0].positions) >= 4  # extrapolated trajectory points
        assert tracks[1].mmsi == "444555666"


# ── Test 5: Historical Trajectory Extrapolation ──────────────────────
@pytest.mark.asyncio
async def test_historical_trajectory_interpolation():
    client = DatalasticClient(api_key="TEST_KEY")
    sample_response = {
        "data": [{
            "mmsi": "999888777",
            "ship_name": "TEST TRAJECTORY VESSEL",
            "type_name": "Tanker",
            "lat": 18.90,
            "lon": 73.20,
            "speed": 12.0,
            "heading": 180.0,
            "course": 180.0,
            "last_position_epoch": "2026-08-24T12:00:00Z",
        }]
    }
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_mock_response(200, sample_response)
        start = datetime(2026, 8, 24, 8, 0, 0, tzinfo=timezone.utc)
        end = datetime(2026, 8, 24, 16, 0, 0, tzinfo=timezone.utc)
        tracks = await client.get_historical_tracks(18.0, 19.5, 72.5, 73.5, start, end)
        
        assert len(tracks) == 1
        pos = tracks[0].positions
        assert len(pos) > 1
        # Check timestamps are monotonically increasing
        for i in range(len(pos) - 1):
            assert pos[i].timestamp < pos[i + 1].timestamp


# ── Test 6: Candidate Filtering on Datalastic Tracks ─────────────────
@pytest.mark.asyncio
async def test_datalastic_tracks_filtering():
    client = DatalasticClient(api_key="TEST_KEY")
    sample_response = {
        "data": [
            # Close to origin (18.915, 73.203)
            {"mmsi": "111111111", "ship_name": "CLOSE TANKER", "type_name": "Oil Tanker", "lat": 18.916, "lon": 73.204, "speed": 10.0, "heading": 190, "course": 190, "last_position_epoch": "2026-08-24T12:00:00Z"},
            # Far from origin (>100km away)
            {"mmsi": "222222222", "ship_name": "FAR VESSEL", "type_name": "Cargo", "lat": 16.00, "lon": 70.00, "speed": 15.0, "heading": 90, "course": 90, "last_position_epoch": "2026-08-24T12:00:00Z"},
        ]
    }
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_mock_response(200, sample_response)
        tracks = await client.get_historical_tracks(
            15.0, 20.0, 69.0, 75.0,
            datetime(2026, 8, 24, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 8, 25, 0, 0, tzinfo=timezone.utc),
        )
        
        origin = DriftOrigin(
            latitude=18.915,
            longitude=73.203,
            confidence=0.85,
            geometry=GeoJSONGeometry(type="Polygon", coordinates=[[[73.15, 18.89], [73.25, 18.89], [73.25, 18.95], [73.15, 18.89]]]),
        )
        time_win = DriftTimeWindow(
            start=datetime(2026, 8, 24, 10, 0, tzinfo=timezone.utc),
            end=datetime(2026, 8, 24, 14, 0, tzinfo=timezone.utc),
        )
        
        filtered = filter_all(tracks, origin, time_win, spatial_radius_km=50.0)
        assert len(filtered) == 1
        assert filtered[0].mmsi == "111111111"


# ── Test 7: Attribution Integration with Datalastic Tracks ───────────
@pytest.mark.asyncio
async def test_attribution_with_datalastic_tracks():
    origin = DriftOrigin(
        latitude=18.915,
        longitude=73.203,
        confidence=0.85,
        geometry=GeoJSONGeometry(type="Polygon", coordinates=[[[73.15, 18.89], [73.25, 18.89], [73.25, 18.95], [73.15, 18.89]]]),
    )
    time_win = DriftTimeWindow(
        start=datetime(2026, 8, 24, 10, 0, tzinfo=timezone.utc),
        end=datetime(2026, 8, 24, 14, 0, tzinfo=timezone.utc),
    )
    drift = DriftResult(
        origin=origin,
        origin_time_window=time_win,
        backward_trajectory=DriftTrajectory(direction="backward", geometry=origin.geometry, timestamps=[time_win.start], points=[]),
        forward_trajectory=DriftTrajectory(direction="forward", geometry=origin.geometry, timestamps=[time_win.end], points=[]),
    )
    
    mock_tracks_data = {
        "data": [{
            "mmsi": "123456789",
            "ship_name": "SUSPECT TANKER",
            "type_name": "Crude Oil Tanker",
            "lat": 18.915,
            "lon": 73.203,
            "speed": 8.0,
            "heading": 215.0,
            "course": 215.0,
            "last_position_epoch": "2026-08-24T11:30:00Z",
        }]
    }
    
    client = DatalasticClient(api_key="TEST_KEY")
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_mock_response(200, mock_tracks_data)
        tracks = await client.get_historical_tracks(
            18.0, 19.5, 72.5, 73.5,
            time_win.start - timedelta(hours=2),
            time_win.end + timedelta(hours=2),
        )
        
        attr_service = AttributionService()
        ranked = await attr_service.attribute(drift, tracks)
        
        assert len(ranked) == 1
        top = ranked[0]
        assert top.vessel_name == "SUSPECT TANKER"
        assert top.score > 0
        assert top.rank == 1
        assert top.feature_scores.spatial > 80.0  # At exact origin


# ── Test 8: API Failure Handling & Fallback ──────────────────────────
@pytest.mark.asyncio
async def test_datalastic_api_error_fallback():
    client = DatalasticClient(api_key="EXPIRED_KEY")
    
    # Simulate 401 Unauthorized
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.HTTPStatusError(
            "401 Unauthorized",
            request=httpx.Request("GET", "https://api.datalastic.com/api/v0/inradius_history"),
            response=httpx.Response(401, json={"meta": {"message": "Invalid API Key"}}),
        )
        
        # Must fall back gracefully to mock AIS rather than crashing
        tracks = await client.get_historical_tracks(
            18.0, 19.5, 72.5, 73.5,
            datetime(2026, 8, 24, tzinfo=timezone.utc),
            datetime(2026, 8, 25, tzinfo=timezone.utc),
        )
        assert len(tracks) == 17  # Fallback to MockAISClient returned 17 synthetic vessels


# ── Test 9: AISService Provider Selection & Force Mock ───────────────
def test_ais_service_provider_selection():
    with patch("app.services.ais_service.settings") as mock_settings:
        # Case A: Key is present
        mock_settings.ais_api_key = "SAMPLE_KEY"
        mock_settings.ais_base_url = "https://api.datalastic.com/api/v0"
        svc = AISService()
        assert isinstance(svc.client, DatalasticClient)
        assert svc.provider_name == "Datalastic"
        
        # Case B: Force mock requested
        svc_mock = AISService(force_mock=True)
        assert isinstance(svc_mock.client, MockAISClient)
        assert "Mock" in svc_mock.provider_name
        
        # Case C: Key missing
        mock_settings.ais_api_key = ""
        svc_empty = AISService()
        assert isinstance(svc_empty.client, MockAISClient)
        assert svc_empty.provider_name == "Mock"


# ── Test 10: No Secret Leakage ───────────────────────────────────────
def test_no_secret_leakage_in_repr():
    secret_key = "SUPER_SECRET_AIS_KEY_12345"
    client = DatalasticClient(api_key=secret_key)
    ais_stream_client = AISStreamClient(api_key=secret_key)
    
    # Check that standard representations and logging strings don't print the secret
    assert secret_key not in repr(client)
    assert secret_key not in repr(ais_stream_client)


# ── Test 11: AISStream Provider Selection & Verification ─────────────
def test_aisstream_provider_selection():
    with patch("app.services.ais_service.settings") as mock_settings:
        mock_settings.ais_api_key = "STREAM_KEY"
        mock_settings.ais_provider = "aisstream"
        mock_settings.ais_base_url = "wss://stream.aisstream.io/v0/stream"
        svc = AISService()
        assert isinstance(svc.client, AISStreamClient)
        assert svc.provider_name == "AISStream"


# ── Test 12: AISStream Missing Key ───────────────────────────────────
@pytest.mark.asyncio
async def test_aisstream_missing_key():
    client = AISStreamClient(api_key="")
    success, msg = await client.check_connection()
    assert success is False
    assert "Missing" in msg
