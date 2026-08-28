"""Vessel search routes."""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import settings
from app.models.vessel import VesselTrack
from ais.client import (
    AISClientInterface,
    AISStreamClient,
    DatalasticClient,
    MockAISClient,
)

router = APIRouter(prefix="/vessels", tags=["vessels"])
SAFE_MMSI_REGEX = re.compile(r"^[A-Za-z0-9\-_]{3,20}$")
MAX_SEARCH_WINDOW_DAYS = 14


def _get_ais_client() -> AISClientInterface:
    if settings.ais_api_key and settings.ais_api_key.strip():
        prov = (settings.ais_provider or "").lower()
        url = (settings.ais_base_url or "").lower()
        if prov == "datalastic" or "datalastic" in url:
            return DatalasticClient(
                api_key=settings.ais_api_key.strip(),
                base_url=settings.ais_base_url,
            )
        return AISStreamClient(
            api_key=settings.ais_api_key.strip(),
            base_url=settings.ais_base_url if "stream.aisstream.io" in url else "wss://stream.aisstream.io/v0/stream",
        )
    return MockAISClient()


@router.get("/status")
async def get_ais_status():
    """
    Check AIS provider configuration and API connectivity.
    Never exposes API keys.
    """
    client = _get_ais_client()
    provider_name = type(client).__name__
    is_configured = bool(settings.ais_api_key and settings.ais_api_key.strip())

    auth_status = "N/A (Mock)"
    if hasattr(client, "check_connection"):
        ok, msg = await client.check_connection()
        auth_status = msg
    elif not is_configured:
        auth_status = "Missing AIS_API_KEY (Using MockAISClient fallback)"

    return {
        "provider": provider_name,
        "is_configured": is_configured,
        "base_url": settings.ais_base_url if is_configured else None,
        "auth_status": auth_status,
    }


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
    if min_lat > max_lat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_lat must be less than or equal to max_lat.",
        )
    if min_lon > max_lon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_lon must be less than or equal to max_lon.",
        )
    if start_time > end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be before or equal to end_time.",
        )
    if (end_time - start_time) > timedelta(days=MAX_SEARCH_WINDOW_DAYS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time window exceeds the maximum allowed duration of {MAX_SEARCH_WINDOW_DAYS} days.",
        )

    client = _get_ais_client()
    tracks = await client.get_historical_tracks(
        min_lat, max_lat, min_lon, max_lon, start_time, end_time,
    )
    return tracks


@router.get("/{mmsi}", response_model=VesselTrack | None)
async def get_vessel(mmsi: str):
    """Get vessel details by MMSI (from search results)."""
    from datetime import timezone

    if not SAFE_MMSI_REGEX.match(mmsi):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MMSI identifier format.",
        )

    client = _get_ais_client()
    tracks = await client.get_historical_tracks(
        17.0, 20.0, 71.0, 74.0,
        datetime(2026, 8, 24, tzinfo=timezone.utc),
        datetime(2026, 8, 26, tzinfo=timezone.utc),
    )
    for t in tracks:
        if t.mmsi == mmsi:
            return t
    return None
