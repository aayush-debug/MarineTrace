"""
Environmental data service — ocean currents and wind.

Provides a pluggable interface so data providers can be swapped.
Mock provider is used for development; Copernicus Marine for production.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from app.core.config import settings
from app.core.logging import logger

DATASET_ID = "cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m"
VARIABLES = ["uo", "vo"]
MIN_DEPTH = 0.494
MAX_DEPTH = 5.0


class EnvironmentalProvider(ABC):
    """Interface for environmental data providers."""

    @abstractmethod
    async def get_ocean_currents(
        self,
        bbox: tuple[float, float, float, float],  # (min_lat, min_lon, max_lat, max_lon)
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        """Retrieve ocean current data for a bounding box and time range."""
        ...

    @abstractmethod
    async def get_wind_data(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        """Retrieve wind data for a bounding box and time range."""
        ...


class MockEnvironmentalProvider(EnvironmentalProvider):
    """
    Returns synthetic current/wind fields for development.

    Simulates a SW-flowing Arabian Sea current with moderate winds.
    """

    async def get_ocean_currents(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        logger.info("MockEnvironmentalProvider: generating synthetic ocean currents")
        return {
            "provider": "mock",
            "bbox": bbox,
            "u_velocity_ms": -0.15,   # eastward component (negative = westward)
            "v_velocity_ms": -0.10,   # northward component (negative = southward)
            "description": "Synthetic SW Arabian Sea current ~0.18 m/s",
        }

    async def get_wind_data(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        logger.info("MockEnvironmentalProvider: generating synthetic wind data")
        return {
            "provider": "mock",
            "bbox": bbox,
            "u_wind_ms": 3.0,
            "v_wind_ms": 1.5,
            "description": "Synthetic NE monsoon wind ~3.4 m/s",
        }


class CopernicusProvider(EnvironmentalProvider):
    """
    Copernicus Marine Service data provider.

    Uses the copernicusmarine Python package to fetch global ocean
    physics data (currents: uo, vo) and atmospheric data.

    Reads credentials from settings or constructor parameters.
    """

    def __init__(self, username: str = "", password: str = ""):
        self.username = username or settings.copernicus_username
        self.password = password or settings.copernicus_password

    async def get_ocean_currents(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        try:
            import copernicusmarine

            ds = copernicusmarine.open_dataset(
                dataset_id=DATASET_ID,
                variables=VARIABLES,
                minimum_latitude=bbox[0],
                minimum_longitude=bbox[1],
                maximum_latitude=bbox[2],
                maximum_longitude=bbox[3],
                minimum_depth=MIN_DEPTH,
                maximum_depth=MAX_DEPTH,
                start_datetime=start_time.isoformat(),
                end_datetime=end_time.isoformat(),
                username=self.username or None,
                password=self.password or None,
            )
            return {
                "provider": "copernicus",
                "dataset": ds,
                "variables": VARIABLES,
            }
        except Exception as e:
            logger.error("Copernicus data fetch failed: %s", e)
            # Fall back to mock
            mock = MockEnvironmentalProvider()
            return await mock.get_ocean_currents(bbox, start_time, end_time)

    async def get_wind_data(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        logger.warning("Copernicus wind data not yet integrated — using mock")
        mock = MockEnvironmentalProvider()
        return await mock.get_wind_data(bbox, start_time, end_time)


class EnvironmentalService:
    """Facade for environmental data — selects provider based on config."""

    def __init__(self, provider: EnvironmentalProvider | None = None):
        if provider is not None:
            self.provider = provider
        elif settings.copernicus_username and settings.copernicus_password:
            self.provider = CopernicusProvider(
                username=settings.copernicus_username,
                password=settings.copernicus_password,
            )
        else:
            self.provider = MockEnvironmentalProvider()

    async def get_ocean_currents(self, bbox, start_time, end_time):
        return await self.provider.get_ocean_currents(bbox, start_time, end_time)

    async def get_wind_data(self, bbox, start_time, end_time):
        return await self.provider.get_wind_data(bbox, start_time, end_time)
