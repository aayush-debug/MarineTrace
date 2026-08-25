"""Integration tests for FastAPI endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_ping_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/ping")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_demo_investigation_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/demo/investigation")
        assert res.status_code == 200
        data = res.json()
        assert data["investigation_id"] == "DEMO-001"
        assert data["status"] == "COMPLETE"
        assert data["spill"]["detected"] is True
        assert len(data["vessels"]) > 0
        assert data["vessels"][0]["rank"] == 1


@pytest.mark.asyncio
async def test_drift_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/drift/backward", json={
            "centroid_lat": 18.72,
            "centroid_lon": 72.91,
            "observation_time": "2026-08-25T10:30:00Z",
            "hours": 12
        })
        assert res.status_code == 200
        assert "origin" in res.json()
