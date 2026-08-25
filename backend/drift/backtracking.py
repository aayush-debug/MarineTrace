"""
Backward drift simulation — trace an observed oil spill back to its origin.

Given a detected spill polygon and observation time, this module:
1. Seeds particles across the spill area
2. Runs the simulation backwards through time
3. Computes an origin probability zone from final particle positions
4. Returns the estimated origin, time window, and backward trajectory
"""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
from shapely.geometry import Polygon

from app.core.config import settings
from app.core.logging import logger
from app.models.drift import DriftOrigin, DriftResult, DriftTimeWindow, DriftTrajectory
from app.models.spill import GeoJSONGeometry, SpillDetection
from app.utils.geo import centroid_of_points, polygon_from_points, make_linestring_geojson


def _seed_points_in_polygon(
    polygon_coords: list[list[float]], n_particles: int
) -> tuple[list[float], list[float]]:
    """Generate n random seed points inside a polygon."""
    poly = Polygon(polygon_coords)
    min_lon, min_lat, max_lon, max_lat = poly.bounds

    lons, lats = [], []
    rng = np.random.default_rng(42)  # deterministic for reproducibility

    attempts = 0
    while len(lons) < n_particles and attempts < n_particles * 20:
        lon = rng.uniform(min_lon, max_lon)
        lat = rng.uniform(min_lat, max_lat)
        from shapely.geometry import Point

        if poly.contains(Point(lon, lat)):
            lons.append(float(lon))
            lats.append(float(lat))
        attempts += 1

    # If not enough points inside polygon, fill with centroid jitter
    while len(lons) < n_particles:
        c = poly.centroid
        lons.append(float(c.x + rng.normal(0, 0.005)))
        lats.append(float(c.y + rng.normal(0, 0.005)))

    return lons, lats


def run_backward_mock(
    spill: SpillDetection,
    backward_hours: int | None = None,
    timestep_minutes: int | None = None,
) -> DriftResult:
    """
    Geometric mock backward drift — used when OpenDrift is not installed.

    Simulates a simple current-driven displacement to generate a plausible
    backward trajectory and origin zone.  Good enough for demo/development.
    """
    bh = backward_hours or settings.drift_backward_hours
    ts = timestep_minutes or settings.drift_timestep_minutes
    n_steps = int(bh * 60 / ts)

    logger.info("Mock backward drift: %dh, %d steps", bh, n_steps)

    obs_time = spill.observation_time or datetime(2026, 8, 25, 10, 30, 0)
    centroid = spill.centroid

    # Simulated current: ~0.5 knot SW current → spill came from NE
    # So backward tracking moves NE (negative of current direction)
    current_lon_per_step = -0.003   # degrees per step (westward current)
    current_lat_per_step = -0.002   # degrees per step (southward current)

    # Generate backward trajectory from centroid
    trajectory_points = [[centroid.longitude, centroid.latitude]]
    rng = np.random.default_rng(42)

    lon, lat = centroid.longitude, centroid.latitude
    all_final_points = []

    n_particles = 50  # lightweight for mock
    # Generate multiple particle tracks for probability zone
    for p in range(n_particles):
        p_lon, p_lat = centroid.longitude, centroid.latitude
        for step in range(n_steps):
            # Reverse the current + random diffusion
            p_lon -= current_lon_per_step + rng.normal(0, 0.002)
            p_lat -= current_lat_per_step + rng.normal(0, 0.001)
        all_final_points.append((p_lon, p_lat))

    # Main trajectory (ensemble mean path)
    for step in range(n_steps):
        lon -= current_lon_per_step
        lat -= current_lat_per_step
        # Add slight curve
        lon += rng.normal(0, 0.0005)
        lat += rng.normal(0, 0.0003)
        trajectory_points.append([lon, lat])

    timestamps = [
        obs_time - timedelta(minutes=ts * i) for i in range(n_steps + 1)
    ]

    # Origin = centroid of final particle positions
    origin_lon, origin_lat = centroid_of_points(all_final_points)
    origin_zone = polygon_from_points(all_final_points, buffer_deg=0.02)

    return DriftResult(
        origin=DriftOrigin(
            latitude=origin_lat,
            longitude=origin_lon,
            confidence=0.84,
            geometry=GeoJSONGeometry(
                type=origin_zone["type"],
                coordinates=origin_zone["coordinates"],
            ),
        ),
        origin_time_window=DriftTimeWindow(
            start=obs_time - timedelta(hours=bh),
            end=obs_time - timedelta(hours=max(bh - 6, 0)),
        ),
        backward_trajectory=DriftTrajectory(
            direction="backward",
            points=trajectory_points,
            timestamps=timestamps,
            geometry=GeoJSONGeometry(
                type="LineString",
                coordinates=trajectory_points,
            ),
        ),
    )
