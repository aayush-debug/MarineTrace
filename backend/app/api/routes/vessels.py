"""Vessel search routes."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query

from app.models.vessel import VesselTrack
from ais.client import MockAISClient

router = APIRouter(prefix="/vessels", tags=["vessels"])

_ais_client = MockAISClient()


@router.get("/search", response_model=list[VesselTrack])
async def search_vessels(
    min_lat: float = Query(..., ge=-90, le=90),
    max_lat: float = Query(..., ge=-90, le=90),
    min_lon: float = Query(..., ge=-180, le=180),
    max_lon: float = Query(..., ge=-180, le=180),
    start_time: datetime = Query(...),
    end_time: datetime = Query(...),
):
    """Search AIS vessels within a bounding box and time range."""
    tracks = await _ais_client.get_historical_tracks(
        min_lat, max_lat, min_lon, max_lon, start_time, end_time,
    )
    return tracks


@router.get("/{mmsi}", response_model=VesselTrack | None)
async def get_vessel(mmsi: str):
    """Get vessel details by MMSI (from last search results)."""
    # In production, this would query the database
    # For now, search through mock data
    from datetime import timezone

    tracks = await _ais_client.get_historical_tracks(
        17.0, 20.0, 71.0, 74.0,
        datetime(2026, 8, 24, tzinfo=timezone.utc),
        datetime(2026, 8, 26, tzinfo=timezone.utc),
    )
    for t in tracks:
        if t.mmsi == mmsi:
            return t
    return None
