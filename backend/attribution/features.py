"""
Attribution feature extraction — the five scoring dimensions.

Each function returns a score 0–100 for a single vessel against
the drift origin and time window.
"""

from __future__ import annotations

import math
from datetime import datetime

import numpy as np

from app.core.logging import logger
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.vessel import VesselPosition, VesselTrack
from app.utils.geo import geodesic_distance_km
from ais.trajectory import (
    compute_heading_changes,
    compute_speed_changes,
    detect_stops,
    compute_loitering_score,
    mean_speed,
    speed_std,
)


# ── 1. Spatial Score (30%) ───────────────────────────────────────────

def spatial_score(
    track: VesselTrack,
    origin: DriftOrigin,
    decay_km: float = 10.0,
) -> tuple[float, dict]:
    """
    Score based on minimum distance between vessel trajectory and origin.

    Uses exponential decay: score = 100 * exp(-dist / decay_km).
    Closer → higher score.

    Returns (score, metadata_dict).
    """
    if not track.positions:
        return 0.0, {"min_distance_km": None}

    min_dist = float("inf")
    closest_pos = None

    for pos in track.positions:
        dist = geodesic_distance_km(
            pos.latitude, pos.longitude,
            origin.latitude, origin.longitude,
        )
        if dist < min_dist:
            min_dist = dist
            closest_pos = pos

    score = 100.0 * math.exp(-min_dist / decay_km)
    score = min(max(score, 0.0), 100.0)

    return score, {
        "min_distance_km": round(min_dist, 2),
        "closest_time": closest_pos.timestamp.isoformat() if closest_pos else None,
    }


# ── 2. Temporal Score (25%) ──────────────────────────────────────────

def temporal_score(
    track: VesselTrack,
    time_window: DriftTimeWindow,
    decay_hours: float = 3.0,
) -> tuple[float, dict]:
    """
    Score based on how well the vessel's presence aligns with the
    estimated spill-origin time window.

    Vessel inside the window → high score.
    Gaussian decay for vessels outside the window.

    Returns (score, metadata_dict).
    """
    if not track.positions:
        return 0.0, {"time_overlap": False}

    win_start = time_window.start
    win_end = time_window.end

    # Find positions within the window
    inside = [
        p for p in track.positions
        if win_start <= p.timestamp <= win_end
    ]

    if inside:
        # Perfect overlap → score based on fraction of time inside window
        total_positions = len(track.positions)
        overlap_fraction = len(inside) / total_positions
        score = 70 + 30 * overlap_fraction  # 70–100
        return min(score, 100.0), {
            "time_overlap": True,
            "positions_in_window": len(inside),
            "overlap_fraction": round(overlap_fraction, 3),
        }

    # No overlap — score based on closest approach in time
    min_hours = float("inf")
    for pos in track.positions:
        hours_to_start = abs((pos.timestamp - win_start).total_seconds()) / 3600
        hours_to_end = abs((pos.timestamp - win_end).total_seconds()) / 3600
        min_hours = min(min_hours, hours_to_start, hours_to_end)

    # Gaussian decay
    score = 100.0 * math.exp(-0.5 * (min_hours / decay_hours) ** 2)
    score = min(max(score, 0.0), 100.0)

    return score, {
        "time_overlap": False,
        "closest_hours": round(min_hours, 2),
    }


# ── 3. Trajectory Score (20%) ───────────────────────────────────────

def trajectory_score(
    track: VesselTrack,
    origin: DriftOrigin,
) -> tuple[float, dict]:
    """
    Score based on how well the AIS trajectory approaches/intersects
    the origin zone.

    Considers:
    - Minimum distance of trajectory to origin
    - Whether trajectory passes through origin zone
    - Time spent near origin

    Returns (score, metadata_dict).
    """
    if len(track.positions) < 2:
        return 0.0, {"trajectory_approach": False}

    # Compute distances at each point
    distances = []
    for pos in track.positions:
        dist = geodesic_distance_km(
            pos.latitude, pos.longitude,
            origin.latitude, origin.longitude,
        )
        distances.append(dist)

    min_dist = min(distances)
    mean_dist = float(np.mean(distances))

    # Check if trajectory passes through origin zone (< 2km)
    passes_through = min_dist < 2.0

    # Loitering near origin
    loiter = compute_loitering_score(
        track.positions,
        origin.latitude,
        origin.longitude,
        radius_km=10.0,
    )

    # Composite trajectory score
    # 40% from min distance, 30% from loitering, 30% from pass-through
    dist_score = 100.0 * math.exp(-min_dist / 8.0)
    loiter_score = loiter * 100
    pass_score = 100.0 if passes_through else 0.0

    score = 0.4 * dist_score + 0.3 * loiter_score + 0.3 * pass_score
    score = min(max(score, 0.0), 100.0)

    return score, {
        "trajectory_approach": passes_through,
        "min_distance_km": round(min_dist, 2),
        "mean_distance_km": round(mean_dist, 2),
        "loitering_fraction": round(loiter, 3),
    }


# ── 4. Behaviour Anomaly Score (15%) ────────────────────────────────

def behaviour_score(
    track: VesselTrack,
    origin: DriftOrigin,
) -> tuple[float, dict]:
    """
    Score based on behavioural anomalies that may indicate suspicious activity.

    Features:
    - Speed deviation (unexpected slowing/stopping)
    - Heading changes (erratic navigation)
    - Stops near origin
    - Loitering duration

    Does NOT claim anomaly proves illegal activity — it is only an
    investigative signal.

    Returns (score, metadata_dict).
    """
    if len(track.positions) < 3:
        return 0.0, {"anomalies_detected": 0}

    anomaly_signals = []
    anomaly_score = 0.0

    # Speed analysis
    avg_speed = mean_speed(track.positions)
    std_speed = speed_std(track.positions)
    speed_changes = compute_speed_changes(track.positions)
    max_speed_change = max(speed_changes) if speed_changes else 0

    # Large speed deviation
    if std_speed > 3.0 and avg_speed > 2.0:
        speed_anomaly = min(std_speed / avg_speed * 50, 30)
        anomaly_score += speed_anomaly
        anomaly_signals.append(
            f"Significant speed deviation detected (σ={std_speed:.1f} kn, "
            f"mean={avg_speed:.1f} kn)"
        )

    # Sudden speed change
    if max_speed_change > 5.0:
        anomaly_score += min(max_speed_change * 3, 25)
        anomaly_signals.append(
            f"Sudden speed change of {max_speed_change:.1f} knots detected"
        )

    # Heading analysis
    heading_changes = compute_heading_changes(track.positions)
    max_heading_change = max(heading_changes) if heading_changes else 0
    mean_heading_change = float(np.mean(heading_changes)) if heading_changes else 0

    if mean_heading_change > 15:
        anomaly_score += min(mean_heading_change, 20)
        anomaly_signals.append(
            f"Erratic heading changes (mean Δ={mean_heading_change:.1f}°)"
        )

    # Stops near origin
    stops = detect_stops(track.positions, speed_threshold=1.0, min_duration_minutes=10)
    origin_stops = [
        s for s in stops
        if geodesic_distance_km(
            s["latitude"], s["longitude"],
            origin.latitude, origin.longitude,
        ) < 15.0
    ]
    if origin_stops:
        total_stop_minutes = sum(s["duration_minutes"] for s in origin_stops)
        anomaly_score += min(total_stop_minutes / 2, 25)
        anomaly_signals.append(
            f"Stopped near origin zone for {total_stop_minutes:.0f} minutes"
        )

    score = min(max(anomaly_score, 0.0), 100.0)

    return score, {
        "anomalies_detected": len(anomaly_signals),
        "signals": anomaly_signals,
        "avg_speed_kn": round(avg_speed, 1),
        "speed_std_kn": round(std_speed, 1),
        "max_heading_change": round(max_heading_change, 1),
        "stops_near_origin": len(origin_stops),
    }


# ── 5. Vessel Relevance Score (10%) ─────────────────────────────────

# Vessel type → relevance score (0–100)
# Only a weak contextual feature — never sufficient on its own
VESSEL_TYPE_RELEVANCE = {
    "Oil Tanker": 95,
    "Chemical Tanker": 90,
    "Product Tanker": 88,
    "Crude Oil Tanker": 95,
    "LPG Tanker": 70,
    "LNG Tanker": 65,
    "Cargo Ship": 50,
    "General Cargo": 50,
    "Bulk Carrier": 45,
    "Container Ship": 40,
    "Ro-Ro Cargo": 35,
    "Passenger Ship": 20,
    "Fishing Vessel": 25,
    "Tug": 30,
    "Yacht": 15,
    "Sailing Vessel": 10,
    "Pleasure Craft": 10,
}


def vessel_relevance_score(track: VesselTrack) -> tuple[float, dict]:
    """
    Score based on vessel type — higher for vessels that commonly
    carry oil or chemicals.

    Weight is only 10%, so this can never dominate the attribution.

    Returns (score, metadata_dict).
    """
    vtype = track.vessel_type or "Unknown"

    # Try exact match, then partial match
    score = VESSEL_TYPE_RELEVANCE.get(vtype, None)
    if score is None:
        # Partial match
        vtype_lower = vtype.lower()
        for key, val in VESSEL_TYPE_RELEVANCE.items():
            if key.lower() in vtype_lower or vtype_lower in key.lower():
                score = val
                break
        if score is None:
            score = 30  # Unknown type → moderate default

    return float(score), {
        "vessel_type": vtype,
        "relevance_category": (
            "high" if score >= 70 else "moderate" if score >= 40 else "low"
        ),
    }
