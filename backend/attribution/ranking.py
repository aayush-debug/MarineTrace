"""
Attribution ranking — sort scored vessels and assign ranks.
"""

from __future__ import annotations

from app.core.logging import logger
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.vessel import VesselAttribution, VesselTrack
from attribution.scoring import score_vessel


def rank_vessels(
    tracks: list[VesselTrack],
    origin: DriftOrigin,
    time_window: DriftTimeWindow,
) -> list[VesselAttribution]:
    """
    Score all candidate vessels and return them ranked by composite score.

    Returns a list sorted descending by score, with rank 1 = highest.
    """
    logger.info("Attribution: scoring %d candidate vessels", len(tracks))

    attributions = []
    for track in tracks:
        attr = score_vessel(track, origin, time_window)
        attributions.append(attr)

    # Sort descending by score
    attributions.sort(key=lambda a: a.score, reverse=True)

    # Assign ranks
    for i, attr in enumerate(attributions):
        attr.rank = i + 1

    logger.info(
        "Attribution complete: top vessel = %s (score=%.1f)",
        attributions[0].vessel_name if attributions else "N/A",
        attributions[0].score if attributions else 0,
    )

    return attributions
