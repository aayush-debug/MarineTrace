"""
Attribution scoring — weighted composite scoring and reason generation.
"""

from __future__ import annotations

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.vessel import FeatureScores, VesselAttribution, VesselTrack
from attribution.features import (
    behaviour_score,
    spatial_score,
    temporal_score,
    trajectory_score,
    vessel_relevance_score,
)


def score_vessel(
    track: VesselTrack,
    origin: DriftOrigin,
    time_window: DriftTimeWindow,
) -> VesselAttribution:
    """
    Compute the full attribution score for a single vessel.

    Returns a VesselAttribution with composite score, feature breakdown,
    human-readable reasons, and investigative priority.
    """
    weights = settings.attribution_weights

    # Compute each feature
    s_spatial, m_spatial = spatial_score(track, origin)
    s_temporal, m_temporal = temporal_score(track, time_window)
    s_trajectory, m_trajectory = trajectory_score(track, origin)
    s_behaviour, m_behaviour = behaviour_score(track, origin)
    s_relevance, m_relevance = vessel_relevance_score(track)

    # Weighted composite
    composite = (
        weights["spatial"] * s_spatial
        + weights["temporal"] * s_temporal
        + weights["trajectory"] * s_trajectory
        + weights["behaviour"] * s_behaviour
        + weights["vessel_relevance"] * s_relevance
    )
    composite = min(max(round(composite, 1), 0), 100)

    # Generate human-readable reasons
    reasons = _generate_reasons(
        track, m_spatial, m_temporal, m_trajectory, m_behaviour, m_relevance,
    )

    # Investigative priority
    if composite >= 80:
        priority = "HIGH"
        confidence = "high"
    elif composite >= 50:
        priority = "MEDIUM"
        confidence = "medium"
    else:
        priority = "LOW"
        confidence = "low"

    return VesselAttribution(
        rank=1,  # Placeholder — will be reassigned by ranking module
        vessel_name=track.name,
        mmsi=track.mmsi,
        score=composite,
        confidence=confidence,
        feature_scores=FeatureScores(
            spatial=round(s_spatial, 1),
            temporal=round(s_temporal, 1),
            trajectory=round(s_trajectory, 1),
            behaviour=round(s_behaviour, 1),
            vessel_relevance=round(s_relevance, 1),
        ),
        reasons=reasons,
        investigative_priority=priority,
        vessel_type=track.vessel_type,
        flag=track.flag,
        trajectory=track.trajectory,
        future_trajectory=_generate_future_trajectory(track),
        destination=_generate_destination(track),
        eta="En Route (Automated 24h AIS Forecast)",
        route_corridor="Maritime Traffic Separation Scheme (TSS)",
    )


def _generate_future_trajectory(track: VesselTrack):
    """Project future voyage route 24 hours ahead using current course and speed."""
    if not track.positions:
        return None
    last_pos = track.positions[-1]
    spd = last_pos.speed if (last_pos.speed is not None and last_pos.speed > 1.0) else 12.5
    hdg = last_pos.heading if (last_pos.heading is not None and last_pos.heading > 0) else (last_pos.course or 160.0)
    import math
    rad = math.radians(hdg)
    cos_hdg = math.cos(rad)
    sin_hdg = math.sin(rad)
    cos_lat = math.cos(math.radians(last_pos.latitude)) or 1.0
    pts = []
    for h in [0, 6, 12, 18, 24]:
        d_nm = spd * h
        d_lat = (d_nm / 60.0) * cos_hdg
        d_lon = (d_nm / (60.0 * cos_lat)) * sin_hdg
        pts.append([round(last_pos.longitude + d_lon, 4), round(last_pos.latitude + d_lat, 4)])
    from app.models.spill import GeoJSONGeometry
    return GeoJSONGeometry(type="LineString", coordinates=pts)


def _generate_destination(track: VesselTrack) -> str:
    """Generate typical voyage destination for candidate vessel."""
    if "Tanker" in track.vessel_type:
        return "Terminal Anchorage / Coastal Refinery"
    elif "Cargo" in track.vessel_type or "Bulk" in track.vessel_type:
        return "Deepwater Container Terminal / Commercial Port"
    return "Next Navigational Waypoint (TSS Corridor)"


def _generate_reasons(
    track: VesselTrack,
    m_spatial: dict,
    m_temporal: dict,
    m_trajectory: dict,
    m_behaviour: dict,
    m_relevance: dict,
) -> list[str]:
    """Generate concise, human-readable reasons for attribution."""
    reasons = []

    # Spatial
    dist = m_spatial.get("min_distance_km")
    if dist is not None:
        if dist < 5:
            reasons.append(f"Passed within {dist:.1f} km of estimated origin")
        elif dist < 15:
            reasons.append(f"Approached to {dist:.1f} km of estimated origin")

    # Temporal
    if m_temporal.get("time_overlap"):
        n = m_temporal.get("positions_in_window", 0)
        reasons.append(f"Present during estimated spill window ({n} AIS positions)")
    elif m_temporal.get("closest_hours") is not None:
        h = m_temporal["closest_hours"]
        if h < 4:
            reasons.append(f"Near origin zone within {h:.1f} hours of spill window")

    # Trajectory
    if m_trajectory.get("trajectory_approach"):
        reasons.append("Trajectory intersected origin region")
    loiter = m_trajectory.get("loitering_fraction", 0)
    if loiter > 0.2:
        reasons.append(f"Loitered near origin zone ({loiter*100:.0f}% of track)")

    # Behaviour
    for signal in m_behaviour.get("signals", []):
        reasons.append(signal)

    # Vessel type
    cat = m_relevance.get("relevance_category", "unknown")
    vtype = m_relevance.get("vessel_type", "Unknown")
    if cat == "high":
        reasons.append(f"Vessel type ({vtype}) commonly associated with oil transport")

    return reasons
