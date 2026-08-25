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
    )


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
