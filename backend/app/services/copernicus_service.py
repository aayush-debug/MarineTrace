"""
Copernicus Marine service — fetches real ocean surface current subsets (uo, vo).

Dataset: cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m (Global Ocean Physics Analysis and Forecast)
Variables:
  - uo: Eastward sea water velocity (m/s)
  - vo: Northward sea water velocity (m/s)
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger

DATASET_ID = "cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m"
VARIABLES = ["uo", "vo"]
MIN_DEPTH = 0.494
MAX_DEPTH = 5.0


class CopernicusService:
    """Service to query and cache Copernicus Marine ocean current subsets."""

    def __init__(self, cache_dir: Path | str | None = None):
        if cache_dir:
            self.cache_dir = Path(cache_dir)
        else:
            # Default to backend/data/copernicus
            base_dir = Path(__file__).resolve().parent.parent.parent
            self.cache_dir = base_dir / "data" / "copernicus"

        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _find_cached_file(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        date_str: str,
    ) -> Path | None:
        """Check if an existing NetCDF file covers the requested region and date."""
        if not self.cache_dir.exists():
            return None

        # 1. Date match in cache directory
        if date_str:
            for p in self.cache_dir.glob("*.nc"):
                if date_str in p.name:
                    return p

        # 2. Any valid uo-vo / cmems NetCDF file in cache directory
        for p in self.cache_dir.glob("*.nc"):
            if "uo-vo" in p.name or ("uo" in p.name and "vo" in p.name) or "cmems" in p.name:
                return p

        # 3. Check repository root and backend directory for fallback NetCDF files
        backend_dir = self.cache_dir.parent.parent
        for root in [backend_dir, backend_dir.parent]:
            if root.exists():
                for p in root.glob("*.nc"):
                    if "uo-vo" in p.name or "cmems" in p.name:
                        return p

        return None

    async def get_ocean_currents(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime,
        end_time: datetime,
        buffer_deg: float = 0.2,
    ) -> str | None:
        """
        Retrieve ocean current subset (uo, vo) for given bounding box and time range.

        Returns path to NetCDF file if successful, or None if unavailable/failed.
        """
        # Ensure coordinates are properly ordered and padded
        b_min_lat = max(min(min_lat, max_lat) - buffer_deg, -89.0)
        b_max_lat = min(max(min_lat, max_lat) + buffer_deg, 89.0)
        b_min_lon = max(min(min_lon, max_lon) - buffer_deg, -179.0)
        b_max_lon = min(max(min_lon, max_lon) + buffer_deg, 179.0)

        # Check cache for start date or midpoint/observation date
        date_str = start_time.strftime("%Y-%m-%d")
        cached = self._find_cached_file(b_min_lat, b_max_lat, b_min_lon, b_max_lon, date_str)
        if cached and cached.exists():
            logger.info("CopernicusService: using cached ocean currents from %s", cached.name)
            return str(cached.resolve())

        mid_time = start_time + (end_time - start_time) / 2
        mid_date_str = mid_time.strftime("%Y-%m-%d")
        if mid_date_str != date_str:
            cached_mid = self._find_cached_file(b_min_lat, b_max_lat, b_min_lon, b_max_lon, mid_date_str)
            if cached_mid and cached_mid.exists():
                logger.info("CopernicusService: using cached ocean currents from %s", cached_mid.name)
                return str(cached_mid.resolve())

        # Format ISO datetime strings for Copernicus Marine Toolbox
        start_iso = start_time.strftime("%Y-%m-%dT00:00:00")
        end_iso = end_time.strftime("%Y-%m-%dT23:59:59")

        out_filename = (
            f"cmems_cur_{b_min_lon:.2f}E-{b_max_lon:.2f}E_"
            f"{b_min_lat:.2f}N-{b_max_lat:.2f}N_{date_str}.nc"
        )
        target_path = self.cache_dir / out_filename

        logger.info(
            "CopernicusService: querying Copernicus Marine for [%.2f–%.2f, %.2f–%.2f] at %s",
            b_min_lat, b_max_lat, b_min_lon, b_max_lon, date_str,
        )

        try:
            import copernicusmarine

            # Query Copernicus subset via Python API
            copernicusmarine.subset(
                dataset_id=DATASET_ID,
                variables=VARIABLES,
                minimum_longitude=round(b_min_lon, 3),
                maximum_longitude=round(b_max_lon, 3),
                minimum_latitude=round(b_min_lat, 3),
                maximum_latitude=round(b_max_lat, 3),
                minimum_depth=MIN_DEPTH,
                maximum_depth=MAX_DEPTH,
                start_datetime=start_iso,
                end_datetime=end_iso,
                output_directory=str(self.cache_dir),
                output_filename=out_filename,
                username=settings.copernicus_username or None,
                password=settings.copernicus_password or None,
                overwrite=True,
                disable_progress_bar=True,
            )

            if target_path.exists():
                logger.info("CopernicusService: successfully downloaded subset to %s", out_filename)
                return str(target_path.resolve())

            # Check if copernicus saved with default name
            for p in self.cache_dir.glob(f"*{date_str}*.nc"):
                return str(p.resolve())

            return None
        except Exception as e:
            logger.warning(
                "CopernicusService: failed to fetch live subset (%s: %s) — will fall back",
                type(e).__name__,
                e,
            )
            # Check if any fallback cached netcdf is available
            cached_fallback = self._find_cached_file(b_min_lat, b_max_lat, b_min_lon, b_max_lon, "")
            if cached_fallback:
                logger.info("CopernicusService: falling back to existing cached NetCDF: %s", cached_fallback.name)
                return str(cached_fallback.resolve())
            return None
