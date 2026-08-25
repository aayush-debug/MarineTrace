"""
Forward drift prediction — predict where the oil spill will go.

Given the current spill polygon, simulate forward to predict
the spill's future trajectory at +6h, +12h, +24h.
"""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillDetection


def run_forward_mock(
    spill: SpillDetection,
    forward_hours: int | None = None,
    timestep_minutes: int | None = None,
) -> DriftTrajectory:
    """
    Geometric mock forward drift — predicts future spill movement.

    Uses a simple current model to project the spill's path forward.
    """
    fh = forward_hours or settings.drift_forward_hours
    ts = timestep_minutes or settings.drift_timestep_minutes
    n_steps = int(fh * 60 / ts)

    logger.info("Mock forward drift: %dh, %d steps", fh, n_steps)

    obs_time = spill.observation_time or datetime(2026, 8, 25, 10, 30, 0)
    centroid = spill.centroid

    # Current pushes spill SW
    current_lon_per_step = -0.003
    current_lat_per_step = -0.002

    trajectory_points = [[centroid.longitude, centroid.latitude]]
    rng = np.random.default_rng(99)

    lon, lat = centroid.longitude, centroid.latitude
    for step in range(n_steps):
        lon += current_lon_per_step + rng.normal(0, 0.0005)
        lat += current_lat_per_step + rng.normal(0, 0.0003)
        trajectory_points.append([lon, lat])

    timestamps = [
        obs_time + timedelta(minutes=ts * i) for i in range(n_steps + 1)
    ]

    return DriftTrajectory(
        direction="forward",
        points=trajectory_points,
        timestamps=timestamps,
        geometry=GeoJSONGeometry(
            type="LineString",
            coordinates=trajectory_points,
        ),
    )
