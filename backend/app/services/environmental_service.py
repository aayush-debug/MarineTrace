"""
Environmental data service — ocean currents and wind.

Provides a pluggable interface so data providers can be swapped.
Mock provider is used for development; Copernicus Marine for production.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from app.core.logging import logger


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

    Requires COPERNICUS_USERNAME and COPERNICUS_PASSWORD in .env.
    """

    def __init__(self, username: str = "", password: str = ""):
        self.username = username
        self.password = password

    async def get_ocean_currents(
        self,
        bbox: tuple[float, float, float, float],
        start_time: datetime,
        end_time: datetime,
    ) -> dict[str, Any]:
        try:
            import copernicusmarine

            ds = copernicusmarine.open_dataset(
                dataset_id="cmems_mod_glo_phy_my_0.083deg_P1D-m",
                variables=["uo", "vo"],
                minimum_latitude=bbox[0],
                minimum_longitude=bbox[1],
                maximum_latitude=bbox[2],
                maximum_longitude=bbox[3],
                start_datetime=start_time.isoformat(),
                end_datetime=end_time.isoformat(),
                username=self.username,
                password=self.password,
            )
            return {
                "provider": "copernicus",
                "dataset": ds,
                "variables": ["uo", "vo"],
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
        self.provider = provider or MockEnvironmentalProvider()

    async def get_ocean_currents(self, bbox, start_time, end_time):
        return await self.provider.get_ocean_currents(bbox, start_time, end_time)

    async def get_wind_data(self, bbox, start_time, end_time):
        return await self.provider.get_wind_data(bbox, start_time, end_time)
