"""
OpenDrift runner — wrapper around the OpenDrift library.

This module handles the actual OpenDrift simulation.  If OpenDrift is not
installed, it raises ImportError; the drift_service layer catches that
and falls back to the geometric mock.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.logging import logger

import pandas as pd
import numpy as np

try:
    from opendrift.models.oceandrift import OceanDrift
    from opendrift.readers import reader_netCDF_CF_generic

    OPENDRIFT_AVAILABLE = True
except ImportError:
    OPENDRIFT_AVAILABLE = False
    logger.warning("OpenDrift not installed — drift simulations will use geometric mock")


def run_simulation(
    seed_lon: list[float],
    seed_lat: list[float],
    seed_time: datetime,
    duration_hours: float = 24,
    timestep_minutes: float = 15,
    backward: bool = False,
    reader_files: list[str] | None = None,
) -> dict[str, Any]:
    """
    Run an OpenDrift particle simulation driven by ocean currents.

    Parameters
    ----------
    seed_lon, seed_lat : lists of seed coordinates
    seed_time : observation time (seed time)
    duration_hours : how many hours to simulate
    timestep_minutes : integration timestep (negative internally if backward)
    backward : if True, run the simulation backwards in time
    reader_files : optional list of NetCDF files for Copernicus ocean current data
    """
    if not OPENDRIFT_AVAILABLE:
        raise ImportError("OpenDrift is not installed")

    logger.info(
        "OpenDrift simulation: %d particles, %s%.0fh, Δt=%dmin",
        len(seed_lon),
        "backward " if backward else "forward ",
        duration_hours,
        timestep_minutes,
    )

    o = OceanDrift(loglevel=30)  # 30 = WARNING to reduce OpenDrift verbosity

    # Add Copernicus ocean current reader if provided
    has_forcing = False
    if reader_files:
        for rf in reader_files:
            try:
                reader = reader_netCDF_CF_generic.Reader(rf)
                reader.always_valid = True
                o.add_reader(reader)
                has_forcing = True
            except Exception as e:
                logger.warning("OpenDrift reader failed for %s: %s", rf, e)

    # Set safety fallback values for unforced variables or boundary elements
    o.set_config("environment:fallback:x_sea_water_velocity", 0.05)
    o.set_config("environment:fallback:y_sea_water_velocity", -0.15)
    o.set_config("environment:fallback:x_wind", 2.5)
    o.set_config("environment:fallback:y_wind", -1.0)

    # Make seed_time timezone-naive to prevent datetime comparison conflicts with NetCDF
    if seed_time.tzinfo is not None:
        naive_seed_time = seed_time.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        naive_seed_time = seed_time

    # Seed particles
    o.seed_elements(
        lon=seed_lon,
        lat=seed_lat,
        time=naive_seed_time,
        number=len(seed_lon),
    )

    # Time step direction
    ts = timedelta(minutes=timestep_minutes)
    if backward:
        ts = timedelta(minutes=-timestep_minutes)

    o.run(
        duration=timedelta(hours=duration_hours),
        time_step=ts,
    )

    # Extract results from OpenDrift result Dataset
    res = o.result
    lons = res["lon"].values  # (n_particles, n_times)
    lats = res["lat"].values  # (n_particles, n_times)
    raw_times = res["time"].values

    times = [
        pd.to_datetime(t).to_pydatetime().replace(tzinfo=timezone.utc)
        for t in raw_times
    ]

    # Calculate mean trajectory path across particles
    mean_lons = np.nanmean(lons, axis=0)
    mean_lats = np.nanmean(lats, axis=0)
    trajectory_points = [
        [round(float(lo), 5), round(float(la), 5)]
        for lo, la in zip(mean_lons, mean_lats)
    ]

    # Final particle locations (e.g. for probability zone)
    final_lons = [float(x) for x in lons[:, -1] if not np.isnan(x)]
    final_lats = [float(y) for y in lats[:, -1] if not np.isnan(y)]

    return {
        "lons": lons,
        "lats": lats,
        "times": times,
        "trajectory_points": trajectory_points,
        "final_points": list(zip(final_lons, final_lats)),
        "forcing": "Copernicus Marine" if has_forcing else "OpenDrift Fallback",
        "model": "OpenDrift",
    }

