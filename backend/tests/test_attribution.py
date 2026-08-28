"""Tests for attribution feature scoring, weighted composite, and ranking."""

import pytest
from datetime import datetime, timezone
from app.models.drift import DriftOrigin, DriftTimeWindow
from app.models.spill import GeoJSONGeometry
from app.models.vessel import VesselPosition, VesselTrack
from attribution.features import (
    behaviour_score,
    spatial_score,
    temporal_score,
    trajectory_score,
    vessel_relevance_score,
)
from attribution.ranking import rank_vessels


def test_attribution_scoring_and_ranking():
    origin = DriftOrigin(
        latitude=18.915,
        longitude=72.250,
        confidence=0.84,
        geometry=GeoJSONGeometry(type="Polygon", coordinates=[[[72.20, 18.89], [72.30, 18.89], [72.30, 18.95], [72.20, 18.89]]]),
    )
    time_win = DriftTimeWindow(
        start=datetime(2026, 8, 24, 10, 30, 0, tzinfo=timezone.utc),
        end=datetime(2026, 8, 24, 16, 30, 0, tzinfo=timezone.utc),
    )

    # Tanker near origin (Arabian Sea)
    near_vessel = VesselTrack(
        mmsi="111111111",
        name="Near Tanker",
        vessel_type="Oil Tanker",
        positions=[
            VesselPosition(timestamp=datetime(2026, 8, 24, 12, 0, 0, tzinfo=timezone.utc), latitude=18.916, longitude=72.251, speed=2.0, heading=200),
            VesselPosition(timestamp=datetime(2026, 8, 24, 12, 30, 0, tzinfo=timezone.utc), latitude=18.917, longitude=72.252, speed=10.0, heading=200),
        ],
    )

    # Cargo ship far from origin
    far_vessel = VesselTrack(
        mmsi="222222222",
        name="Far Cargo",
        vessel_type="Cargo Ship",
        positions=[
            VesselPosition(timestamp=datetime(2026, 8, 24, 12, 0, 0, tzinfo=timezone.utc), latitude=18.50, longitude=71.50, speed=12.0, heading=180),
        ],
    )

    ranked = rank_vessels([far_vessel, near_vessel], origin, time_win)

    assert len(ranked) == 2
    assert ranked[0].vessel_name == "Near Tanker"
    assert ranked[0].rank == 1
    assert ranked[0].score > ranked[1].score
    assert len(ranked[0].reasons) > 0
    assert ranked[0].feature_scores.spatial > ranked[1].feature_scores.spatial
