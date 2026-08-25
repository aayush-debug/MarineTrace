"""
AIS trajectory analysis — interpolation, speed/heading changes, anomaly detection.
"""

from __future__ import annotations

from datetime import timedelta

import numpy as np

from app.models.vessel import VesselPosition, VesselTrack
from app.utils.geo import bearing, geodesic_distance_km


def interpolate_positions(
    positions: list[VesselPosition],
    interval_minutes: int = 10,
) -> list[VesselPosition]:
    """Interpolate vessel positions to regular time intervals."""
    if len(positions) < 2:
        return positions

    interpolated = [positions[0]]
    for i in range(1, len(positions)):
        p1 = positions[i - 1]
        p2 = positions[i]
        gap_minutes = (p2.timestamp - p1.timestamp).total_seconds() / 60

        if gap_minutes <= interval_minutes * 1.5:
            interpolated.append(p2)
            continue

        n_inserts = int(gap_minutes / interval_minutes)
        for j in range(1, n_inserts):
            frac = j / n_inserts
            interpolated.append(
                VesselPosition(
                    timestamp=p1.timestamp + timedelta(minutes=interval_minutes * j),
                    latitude=p1.latitude + (p2.latitude - p1.latitude) * frac,
                    longitude=p1.longitude + (p2.longitude - p1.longitude) * frac,
                    speed=(
                        p1.speed + (p2.speed - p1.speed) * frac
                        if p1.speed is not None and p2.speed is not None
                        else None
                    ),
                    heading=(
                        p1.heading  # simplified — not interpolating circular heading
                        if p1.heading is not None
                        else None
                    ),
                    course=p1.course,
                )
            )
        interpolated.append(p2)

    return interpolated


def compute_speed_changes(positions: list[VesselPosition]) -> list[float]:
    """Return absolute speed changes between consecutive positions (knots)."""
    changes = []
    for i in range(1, len(positions)):
        if positions[i].speed is not None and positions[i - 1].speed is not None:
            changes.append(abs(positions[i].speed - positions[i - 1].speed))
        else:
            changes.append(0.0)
    return changes


def compute_heading_changes(positions: list[VesselPosition]) -> list[float]:
    """Return absolute heading changes between consecutive positions (degrees 0–180)."""
    changes = []
    for i in range(1, len(positions)):
        if positions[i].heading is not None and positions[i - 1].heading is not None:
            diff = abs(positions[i].heading - positions[i - 1].heading)
            if diff > 180:
                diff = 360 - diff
            changes.append(diff)
        else:
            changes.append(0.0)
    return changes


def detect_stops(
    positions: list[VesselPosition],
    speed_threshold: float = 1.0,
    min_duration_minutes: float = 15,
) -> list[dict]:
    """
    Detect periods where the vessel was effectively stopped.

    Returns list of {start_time, end_time, duration_minutes, lat, lon}.
    """
    stops = []
    stop_start = None

    for i, pos in enumerate(positions):
        if pos.speed is not None and pos.speed < speed_threshold:
            if stop_start is None:
                stop_start = i
        else:
            if stop_start is not None:
                duration = (
                    positions[i - 1].timestamp - positions[stop_start].timestamp
                ).total_seconds() / 60
                if duration >= min_duration_minutes:
                    stops.append({
                        "start_time": positions[stop_start].timestamp,
                        "end_time": positions[i - 1].timestamp,
                        "duration_minutes": round(duration, 1),
                        "latitude": positions[stop_start].latitude,
                        "longitude": positions[stop_start].longitude,
                    })
                stop_start = None

    return stops


def compute_loitering_score(
    positions: list[VesselPosition],
    centre_lat: float,
    centre_lon: float,
    radius_km: float = 10.0,
) -> float:
    """
    Fraction of time the vessel spent within `radius_km` of a point.

    Returns 0.0 (never near) to 1.0 (always near).
    """
    if not positions:
        return 0.0

    near_count = sum(
        1 for p in positions
        if geodesic_distance_km(p.latitude, p.longitude, centre_lat, centre_lon) <= radius_km
    )
    return near_count / len(positions)


def mean_speed(positions: list[VesselPosition]) -> float:
    """Average speed in knots across all positions with speed data."""
    speeds = [p.speed for p in positions if p.speed is not None]
    return float(np.mean(speeds)) if speeds else 0.0


def speed_std(positions: list[VesselPosition]) -> float:
    """Standard deviation of speed in knots."""
    speeds = [p.speed for p in positions if p.speed is not None]
    return float(np.std(speeds)) if len(speeds) > 1 else 0.0
