"""
AIS 3-stage filtering pipeline.

Stage 1 — Spatial: vessels within radius of origin zone
Stage 2 — Temporal: vessels present during spill-origin time window
Stage 3 — Trajectory: vessel track intersects/approaches origin zone
"""

from __future__ import annotations

from datetime import datetime

from app.core.logging import logger
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.vessel import VesselTrack
from app.utils.geo import geodesic_distance_km, point_to_polygon_distance_km


def spatial_filter(
    tracks: list[VesselTrack],
    origin: DriftOrigin,
    radius_km: float = 25.0,
) -> list[VesselTrack]:
    """
    Stage 1: retain vessels that have at least one position within
    `radius_km` of the drift origin.
    """
    filtered = []
    for track in tracks:
        for pos in track.positions:
            dist = geodesic_distance_km(
                pos.latitude, pos.longitude,
                origin.latitude, origin.longitude,
            )
            if dist <= radius_km:
                filtered.append(track)
                break

    logger.info(
        "Spatial filter: %d → %d vessels (radius=%.0f km)",
        len(tracks), len(filtered), radius_km,
    )
    return filtered


def temporal_filter(
    tracks: list[VesselTrack],
    time_window: DriftTimeWindow,
    buffer_hours: float = 2.0,
) -> list[VesselTrack]:
    """
    Stage 2: retain vessels that have at least one position within
    the spill-origin time window (± buffer).
    """
    from datetime import timedelta

    win_start = time_window.start - timedelta(hours=buffer_hours)
    win_end = time_window.end + timedelta(hours=buffer_hours)

    filtered = []
    for track in tracks:
        for pos in track.positions:
            if win_start <= pos.timestamp <= win_end:
                filtered.append(track)
                break

    logger.info(
        "Temporal filter: %d → %d vessels (window: %s to %s)",
        len(tracks), len(filtered),
        win_start.isoformat(), win_end.isoformat(),
    )
    return filtered


def trajectory_filter(
    tracks: list[VesselTrack],
    origin: DriftOrigin,
    max_distance_km: float = 15.0,
) -> list[VesselTrack]:
    """
    Stage 3: retain vessels whose trajectory passes within
    `max_distance_km` of the origin zone.

    Uses the minimum distance from any trajectory segment to the origin.
    """
    filtered = []
    for track in tracks:
        if len(track.positions) < 2:
            # Single-point tracks pass if they passed spatial filter
            filtered.append(track)
            continue

        min_dist = float("inf")
        for pos in track.positions:
            dist = geodesic_distance_km(
                pos.latitude, pos.longitude,
                origin.latitude, origin.longitude,
            )
            min_dist = min(min_dist, dist)

        if min_dist <= max_distance_km:
            filtered.append(track)

    logger.info(
        "Trajectory filter: %d → %d vessels (max_dist=%.0f km)",
        len(tracks), len(filtered), max_distance_km,
    )
    return filtered


def filter_all(
    tracks: list[VesselTrack],
    origin: DriftOrigin,
    time_window: DriftTimeWindow,
    spatial_radius_km: float = 50.0,
    temporal_buffer_hours: float = 2.0,
    trajectory_max_km: float = 30.0,
) -> list[VesselTrack]:
    """Run the complete 3-stage filtering pipeline."""
    logger.info("Starting 3-stage AIS filtering on %d vessels", len(tracks))

    result = spatial_filter(tracks, origin, spatial_radius_km)
    result = temporal_filter(result, time_window, temporal_buffer_hours)
    result = trajectory_filter(result, origin, trajectory_max_km)

    logger.info("Filtering complete: %d → %d candidates", len(tracks), len(result))
    return result
