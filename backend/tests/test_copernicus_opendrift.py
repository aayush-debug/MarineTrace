"""
Unit and integration tests for Copernicus Marine ocean current data fetching,
OpenDrift hydrodynamic simulation, and graceful fallback handling.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.drift import DriftResult, DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection
from app.services.copernicus_service import CopernicusService
from app.services.drift_service import DriftService
from drift.backtracking import run_backward_mock, run_backward_opendrift
from drift.forecasting import run_forward_mock, run_forward_opendrift
from drift.opendrift_runner import OPENDRIFT_AVAILABLE, run_simulation


@pytest.fixture
def sample_nc_file() -> str | None:
    """Path to real or test NetCDF Copernicus dataset."""
    base_dir = Path(__file__).resolve().parent.parent
    cop_dir = base_dir / "data" / "copernicus"
    nc_files = list(cop_dir.glob("*.nc"))
    if nc_files:
        return str(nc_files[0].resolve())
    root_nc = list(base_dir.parent.glob("*.nc"))
    if root_nc:
        return str(root_nc[0].resolve())
    return None


@pytest.fixture
def sample_spill() -> SpillDetection:
    """Sample spill in the Mumbai offshore corridor."""
    return SpillDetection(
        spill_detected=True,
        confidence=0.92,
        area_km2=18.4,
        centroid=SpillCentroid(latitude=18.5, longitude=72.5),
        geometry=GeoJSONGeometry(
            type="Polygon",
            coordinates=[
                [[72.48, 18.48], [72.52, 18.49], [72.51, 18.52], [72.48, 18.48]]
            ],
        ),
        observation_time=datetime(2026, 8, 25, 12, 0, 0, tzinfo=timezone.utc),
    )


# ── Test 1: Copernicus Service Cache & Retrieval ─────────────────────
@pytest.mark.asyncio
async def test_copernicus_service_cache_retrieval(sample_nc_file):
    service = CopernicusService()
    start_t = datetime(2026, 8, 25, 0, 0, 0, tzinfo=timezone.utc)
    end_t = datetime(2026, 8, 25, 23, 59, 59, tzinfo=timezone.utc)

    nc_path = await service.get_ocean_currents(
        min_lat=18.0, max_lat=19.0, min_lon=72.0, max_lon=73.0,
        start_time=start_t, end_time=end_t,
    )
    assert nc_path is not None
    assert os.path.exists(nc_path)
    assert nc_path.endswith(".nc")


# ── Test 2: Copernicus Service Error Handling Fallback ──────────────
@pytest.mark.asyncio
async def test_copernicus_service_error_handling(tmp_path):
    empty_service = CopernicusService(cache_dir=tmp_path / "empty_cache")
    
    with patch("copernicusmarine.subset", side_effect=RuntimeError("Copernicus API rate limit")):
        nc_path = await empty_service.get_ocean_currents(
            min_lat=0.0, max_lat=1.0, min_lon=0.0, max_lon=1.0,
            start_time=datetime.now(timezone.utc), end_time=datetime.now(timezone.utc),
        )
        assert nc_path is None  # Graceful failure without crashing


# ── Test 3: OpenDrift Simulation with Copernicus Reader ──────────────
def test_opendrift_simulation_with_copernicus_nc(sample_nc_file):
    if not OPENDRIFT_AVAILABLE or not sample_nc_file:
        pytest.skip("OpenDrift or NetCDF not available in test environment")

    seed_time = datetime(2026, 8, 25, 12, 0, 0, tzinfo=timezone.utc)
    res = run_simulation(
        seed_lon=[72.5],
        seed_lat=[18.5],
        seed_time=seed_time,
        duration_hours=2,
        timestep_minutes=15,
        backward=True,
        reader_files=[sample_nc_file],
    )

    assert "trajectory_points" in res
    assert len(res["trajectory_points"]) > 0
    assert res["model"] == "OpenDrift"
    assert res["forcing"] == "Copernicus Marine"
    assert len(res["times"]) > 0


# ── Test 4: OpenDrift Backward Simulation Result ─────────────────────
def test_opendrift_backward_drift_result(sample_spill, sample_nc_file):
    if not OPENDRIFT_AVAILABLE:
        pytest.skip("OpenDrift not installed")

    result = run_backward_opendrift(
        sample_spill, backward_hours=6, nc_file=sample_nc_file,
    )

    assert isinstance(result, DriftResult)
    assert result.drift_model == "opendrift_copernicus"
    assert result.forcing == "Copernicus Marine" if sample_nc_file else "OpenDrift Fallback"
    assert result.origin.latitude != 0
    assert result.origin.longitude != 0
    assert result.origin.confidence > 0.5
    assert len(result.backward_trajectory.points) > 1
    assert result.origin_time_window.start < result.origin_time_window.end


# ── Test 5: OpenDrift Forward Simulation Trajectory ──────────────────
def test_opendrift_forward_drift_trajectory(sample_spill, sample_nc_file):
    if not OPENDRIFT_AVAILABLE:
        pytest.skip("OpenDrift not installed")

    traj = run_forward_opendrift(
        sample_spill, forward_hours=6, nc_file=sample_nc_file,
    )

    assert isinstance(traj, DriftTrajectory)
    assert traj.direction == "forward"
    assert traj.drift_model == "opendrift_copernicus"
    assert len(traj.points) > 1


# ── Test 6: DriftService Full Pipeline with Copernicus + OpenDrift ───
@pytest.mark.asyncio
async def test_drift_service_full_pipeline(sample_spill):
    drift_service = DriftService()
    result = await drift_service.run_full(sample_spill, backward_hours=6, forward_hours=6)

    assert result.origin is not None
    assert result.backward_trajectory is not None
    assert result.forward_trajectory is not None
    assert result.drift_model in ("opendrift_copernicus", "geometric_fallback")
    assert result.forcing in ("Copernicus Marine", "OpenDrift Fallback", "Geometric Fallback")


# ── Test 7: DriftService Fallback when OpenDrift Fails ───────────────
@pytest.mark.asyncio
async def test_drift_service_fallback_on_error(sample_spill):
    drift_service = DriftService()
    
    with patch("app.services.drift_service.run_backward_opendrift", side_effect=Exception("OpenDrift crashed")):
        result = await drift_service.run_backward(sample_spill, backward_hours=6)
        assert result is not None
        assert result.drift_model == "geometric_fallback"
        assert result.forcing == "Geometric Fallback"



# ── Test 8: POST /drift/backward Endpoint ────────────────────────────
@pytest.mark.asyncio
async def test_api_drift_backward_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "centroid_lat": 18.5,
            "centroid_lon": 72.5,
            "observation_time": "2026-08-25T12:00:00Z",
            "hours": 6,
        }
        res = await ac.post("/drift/backward", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "origin" in data
        assert "backward_trajectory" in data
        assert "drift_model" in data
        assert "forcing" in data


# ── Test 9: POST /drift/forward Endpoint ─────────────────────────────
@pytest.mark.asyncio
async def test_api_drift_forward_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "centroid_lat": 18.5,
            "centroid_lon": 72.5,
            "observation_time": "2026-08-25T12:00:00Z",
            "hours": 6,
        }
        res = await ac.post("/drift/forward", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["direction"] == "forward"
        assert len(data["points"]) > 0
        assert "drift_model" in data


# ── Test 10: POST /investigate with Real Drift Integration ───────────
@pytest.mark.asyncio
async def test_api_investigate_with_real_drift():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "observation_time": "2026-08-25T12:00:00Z",
            "backward_hours": 6,
            "forward_hours": 6,
        }
        res = await ac.post("/investigate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "COMPLETE"
        assert data["spill"]["detected"] is True
        assert data["drift"] is not None
        assert "drift_model" in data["drift"]
        assert len(data["vessels"]) > 0
