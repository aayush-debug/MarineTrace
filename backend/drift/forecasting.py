"""
Forward drift prediction — predict where the oil spill will go.

Given the current spill polygon, simulate forward to predict
the spill's future trajectory at +6h, +12h, +24h.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillDetection


def run_forward_opendrift(
    spill: SpillDetection,
    forward_hours: int | None = None,
    timestep_minutes: int | None = None,
    nc_file: str | None = None,
) -> DriftTrajectory:
    """
    Real OpenDrift forward simulation driven by Copernicus ocean currents.
    """
    from drift.opendrift_runner import run_simulation

    fh = forward_hours or settings.drift_forward_hours
    ts = timestep_minutes or settings.drift_timestep_minutes
    obs_time = spill.observation_time or datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)
    centroid = spill.centroid

    n_particles = 20
    rng = np.random.default_rng(99)
    seed_lons = [float(centroid.longitude + rng.normal(0, 0.005)) for _ in range(n_particles)]
    seed_lats = [float(centroid.latitude + rng.normal(0, 0.005)) for _ in range(n_particles)]

    reader_files = [nc_file] if nc_file else None

    sim_res = run_simulation(
        seed_lon=seed_lons,
        seed_lat=seed_lats,
        seed_time=obs_time,
        duration_hours=fh,
        timestep_minutes=ts,
        backward=False,
        reader_files=reader_files,
    )

    trajectory_points = sim_res["trajectory_points"]
    timestamps = sim_res["times"]

    return DriftTrajectory(
        direction="forward",
        points=trajectory_points,
        timestamps=timestamps,
        geometry=GeoJSONGeometry(
            type="LineString",
            coordinates=trajectory_points,
        ),
        drift_model="opendrift_copernicus",
        forcing=sim_res.get("forcing", "Copernicus Marine"),
    )


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

    obs_time = spill.observation_time or datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)
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
        drift_model="geometric_fallback",
        forcing="Geometric Fallback",
    )

