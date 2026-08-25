"""
OpenDrift runner — wrapper around the OpenDrift library.

This module handles the actual OpenDrift simulation.  If OpenDrift is not
installed, it raises ImportError; the drift_service layer catches that
and falls back to the geometric mock.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.core.logging import logger

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
    Run an OpenDrift particle simulation.

    Parameters
    ----------
    seed_lon, seed_lat : lists of seed coordinates
    seed_time : observation time (seed time)
    duration_hours : how many hours to simulate
    timestep_minutes : integration timestep (negative internally if backward)
    backward : if True, run the simulation backwards in time
    reader_files : optional list of NetCDF files for ocean/wind data

    Returns
    -------
    dict with keys:
        - lons: np.ndarray (n_particles × n_steps)
        - lats: np.ndarray
        - times: list[datetime]
        - status: list of particle statuses
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

    # Add readers if provided
    if reader_files:
        for rf in reader_files:
            reader = reader_netCDF_CF_generic.Reader(rf)
            o.add_reader(reader)
    else:
        # Use OpenDrift's built-in fallback (constant currents / no data)
        o.set_config("environment:fallback:x_sea_water_velocity", 0.1)
        o.set_config("environment:fallback:y_sea_water_velocity", 0.05)
        o.set_config("environment:fallback:x_wind", 3.0)
        o.set_config("environment:fallback:y_wind", 1.5)

    # Seed particles
    o.seed_elements(
        lon=seed_lon,
        lat=seed_lat,
        time=seed_time,
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

    # Extract results
    lons = o.history["lon"]
    lats = o.history["lat"]
    times = [seed_time + timedelta(seconds=float(t)) for t in o.history["time"]]

    return {
        "lons": lons,
        "lats": lats,
        "times": times,
    }
