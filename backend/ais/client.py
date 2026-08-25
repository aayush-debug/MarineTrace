"""
AIS client — provider-agnostic interface for vessel tracking data.

MockAISClient returns realistic synthetic vessels around the Arabian Sea
demo area.  DatalasticClient connects to the real Datalastic API.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

import numpy as np

from app.core.logging import logger
from app.models.spill import GeoJSONGeometry
from app.models.vessel import VesselPosition, VesselTrack


class AISClientInterface(ABC):
    """Protocol for AIS data providers."""

    @abstractmethod
    async def get_historical_tracks(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime,
        end_time: datetime,
    ) -> list[VesselTrack]:
        """Retrieve historical vessel tracks within a bounding box and time range."""
        ...


class MockAISClient(AISClientInterface):
    """
    Returns 17 synthetic vessels around the Arabian Sea demo region.

    Vessel set includes:
    - 3 vessels very close to origin (strong candidates)
    - 4 vessels moderately close (weak candidates)
    - 10 vessels far away (should be filtered out)

    Trajectories are realistic multi-point tracks with varying speeds,
    headings, and types.
    """

    # Pre-defined vessels for the demo scenario
    MOCK_VESSELS = [
        # ── Strong candidates (near drift origin zone ~73.20°E, 18.91°N) ──
        {
            "mmsi": "419001234",
            "name": "MV Ocean Star",
            "vessel_type": "Oil Tanker",
            "flag": "PA",
            "base_lon": 73.18,
            "base_lat": 18.92,
            "speed_kn": 8.5,
            "heading": 215,
            "anomaly": True,  # will show speed deviation
        },
        {
            "mmsi": "538006789",
            "name": "MT Blue Horizon",
            "vessel_type": "Chemical Tanker",
            "flag": "MH",
            "base_lon": 73.22,
            "base_lat": 18.88,
            "speed_kn": 11.0,
            "heading": 190,
            "anomaly": False,
        },
        {
            "mmsi": "356001111",
            "name": "MV Pacific Trader",
            "vessel_type": "Cargo Ship",
            "flag": "LR",
            "base_lon": 73.15,
            "base_lat": 18.95,
            "speed_kn": 10.5,
            "heading": 250,
            "anomaly": False,
        },
        # ── Moderate candidates ──
        {
            "mmsi": "477002222",
            "name": "MT Arabian Sun",
            "vessel_type": "Oil Tanker",
            "flag": "HK",
            "base_lon": 73.10,
            "base_lat": 18.98,
            "speed_kn": 12.0,
            "heading": 180,
            "anomaly": False,
        },
        {
            "mmsi": "636003333",
            "name": "MV Coastal Express",
            "vessel_type": "Container Ship",
            "flag": "LR",
            "base_lon": 72.90,
            "base_lat": 18.78,
            "speed_kn": 14.0,
            "heading": 270,
            "anomaly": False,
        },
        {
            "mmsi": "412004444",
            "name": "MV Gujarat Pearl",
            "vessel_type": "Bulk Carrier",
            "flag": "IN",
            "base_lon": 72.70,
            "base_lat": 18.95,
            "speed_kn": 9.0,
            "heading": 200,
            "anomaly": False,
        },
        {
            "mmsi": "249005555",
            "name": "FV Silver Catch",
            "vessel_type": "Fishing Vessel",
            "flag": "MT",
            "base_lon": 72.88,
            "base_lat": 18.80,
            "speed_kn": 5.0,
            "heading": 160,
            "anomaly": False,
        },
        # ── Far away vessels (should be filtered out) ──
        {
            "mmsi": "311006666",
            "name": "MV Atlantic Voyager",
            "vessel_type": "Container Ship",
            "flag": "BS",
            "base_lon": 73.20,
            "base_lat": 19.30,
            "speed_kn": 18.0,
            "heading": 90,
            "anomaly": False,
        },
        {
            "mmsi": "353007777",
            "name": "MT Global Spirit",
            "vessel_type": "Oil Tanker",
            "flag": "PA",
            "base_lon": 72.40,
            "base_lat": 18.40,
            "speed_kn": 13.0,
            "heading": 0,
            "anomaly": False,
        },
        {
            "mmsi": "710008888",
            "name": "MV Southern Cross",
            "vessel_type": "Bulk Carrier",
            "flag": "BR",
            "base_lon": 73.50,
            "base_lat": 19.50,
            "speed_kn": 11.0,
            "heading": 135,
            "anomaly": False,
        },
        {
            "mmsi": "440009999",
            "name": "MV Korea Star",
            "vessel_type": "Container Ship",
            "flag": "KR",
            "base_lon": 73.10,
            "base_lat": 19.20,
            "speed_kn": 16.0,
            "heading": 45,
            "anomaly": False,
        },
        {
            "mmsi": "304010101",
            "name": "FV Deep Fisher",
            "vessel_type": "Fishing Vessel",
            "flag": "AG",
            "base_lon": 72.50,
            "base_lat": 18.50,
            "speed_kn": 4.0,
            "heading": 300,
            "anomaly": False,
        },
        {
            "mmsi": "258011011",
            "name": "MV Nordic Wind",
            "vessel_type": "Cargo Ship",
            "flag": "NO",
            "base_lon": 73.30,
            "base_lat": 19.40,
            "speed_kn": 12.0,
            "heading": 180,
            "anomaly": False,
        },
        {
            "mmsi": "215012012",
            "name": "MT Mediterranean",
            "vessel_type": "Chemical Tanker",
            "flag": "MT",
            "base_lon": 72.30,
            "base_lat": 18.30,
            "speed_kn": 10.0,
            "heading": 270,
            "anomaly": False,
        },
        {
            "mmsi": "566013013",
            "name": "MV Singapore Star",
            "vessel_type": "Container Ship",
            "flag": "SG",
            "base_lon": 73.40,
            "base_lat": 19.10,
            "speed_kn": 17.0,
            "heading": 120,
            "anomaly": False,
        },
        {
            "mmsi": "372014014",
            "name": "MV Panama Express",
            "vessel_type": "Bulk Carrier",
            "flag": "PA",
            "base_lon": 72.60,
            "base_lat": 18.60,
            "speed_kn": 10.5,
            "heading": 330,
            "anomaly": False,
        },
        {
            "mmsi": "416015015",
            "name": "FV Mumbai Fisher",
            "vessel_type": "Fishing Vessel",
            "flag": "IN",
            "base_lon": 72.95,
            "base_lat": 19.00,
            "speed_kn": 3.5,
            "heading": 200,
            "anomaly": False,
        },
    ]

    async def get_historical_tracks(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime,
        end_time: datetime,
    ) -> list[VesselTrack]:
        logger.info(
            "MockAISClient: generating %d synthetic vessels in bbox "
            "[%.2f–%.2f, %.2f–%.2f]",
            len(self.MOCK_VESSELS), min_lat, max_lat, min_lon, max_lon,
        )

        tracks = []
        rng = np.random.default_rng(42)

        for v in self.MOCK_VESSELS:
            positions = self._generate_track(
                v, start_time, end_time, rng,
            )
            coords = [[p.longitude, p.latitude] for p in positions]

            tracks.append(
                VesselTrack(
                    mmsi=v["mmsi"],
                    name=v["name"],
                    vessel_type=v["vessel_type"],
                    flag=v["flag"],
                    positions=positions,
                    trajectory=GeoJSONGeometry(
                        type="LineString",
                        coordinates=coords,
                    ) if len(coords) >= 2 else None,
                )
            )

        return tracks

    def _generate_track(
        self,
        vessel: dict,
        start_time: datetime,
        end_time: datetime,
        rng: np.random.Generator,
    ) -> list[VesselPosition]:
        """Generate a realistic multi-point AIS track for a vessel."""
        positions = []
        interval_minutes = 30  # AIS report interval
        total_minutes = (end_time - start_time).total_seconds() / 60
        n_points = max(int(total_minutes / interval_minutes), 2)

        lon = vessel["base_lon"]
        lat = vessel["base_lat"]
        speed = vessel["speed_kn"]
        heading = vessel["heading"]

        for i in range(n_points):
            t = start_time + timedelta(minutes=interval_minutes * i)

            # Simulate movement (speed in knots → degrees per interval)
            speed_deg_per_min = (speed * 1.852 / 111.0) / 60  # rough conversion
            heading_rad = np.radians(heading)

            lon += speed_deg_per_min * np.sin(heading_rad) * interval_minutes
            lat += speed_deg_per_min * np.cos(heading_rad) * interval_minutes

            # Add noise
            lon += rng.normal(0, 0.001)
            lat += rng.normal(0, 0.001)

            current_speed = speed

            # If anomaly vessel, introduce a speed drop in the middle of track
            if vessel.get("anomaly") and 0.3 < (i / n_points) < 0.5:
                current_speed = speed * 0.2  # dramatic speed reduction
                heading += rng.normal(0, 15)  # erratic heading

            heading += rng.normal(0, 2)  # slight heading variation

            positions.append(
                VesselPosition(
                    timestamp=t,
                    latitude=round(lat, 6),
                    longitude=round(lon, 6),
                    speed=round(current_speed + rng.normal(0, 0.3), 1),
                    heading=round(heading % 360, 1),
                    course=round((heading + rng.normal(0, 3)) % 360, 1),
                )
            )

        return positions


class DatalasticClient(AISClientInterface):
    """
    Real AIS data provider using the Datalastic API.

    Endpoints used:
    - /inradius_history — historical vessel traffic in a circular area
    - /vessel_history — historical data for a specific vessel

    Requires AIS_API_KEY in .env.
    """

    def __init__(self, api_key: str, base_url: str = "https://api.datalastic.com/api/v0"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    async def get_historical_tracks(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime,
        end_time: datetime,
    ) -> list[VesselTrack]:
        import httpx

        # Use centre of bbox as the search point
        centre_lat = (min_lat + max_lat) / 2
        centre_lon = (min_lon + max_lon) / 2
        # Approximate radius from bbox diagonal
        from app.utils.geo import geodesic_distance_km
        radius_km = geodesic_distance_km(min_lat, min_lon, max_lat, max_lon) / 2

        logger.info(
            "DatalasticClient: fetching AIS history at (%.3f, %.3f) r=%.0fkm",
            centre_lat, centre_lon, radius_km,
        )

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{self.base_url}/inradius_history",
                    params={
                        "api-key": self.api_key,
                        "lat": centre_lat,
                        "lon": centre_lon,
                        "radius": min(radius_km, 100),  # API may cap radius
                        "from": start_time.strftime("%Y-%m-%d"),
                        "to": end_time.strftime("%Y-%m-%d"),
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            logger.error("Datalastic API call failed: %s — falling back to mock", e)
            mock = MockAISClient()
            return await mock.get_historical_tracks(
                min_lat, max_lat, min_lon, max_lon, start_time, end_time,
            )

        # Parse Datalastic response into our VesselTrack model
        tracks = []
        vessels = data.get("data", [])
        for v in vessels:
            positions = []
            # Datalastic returns a single last-known position per vessel
            # For full tracks, we'd need to call /vessel_history per vessel
            if v.get("lat") and v.get("lon"):
                positions.append(
                    VesselPosition(
                        timestamp=datetime.fromisoformat(
                            v.get("last_position_epoch", start_time.isoformat())
                        ) if isinstance(v.get("last_position_epoch"), str)
                        else start_time,
                        latitude=float(v["lat"]),
                        longitude=float(v["lon"]),
                        speed=float(v.get("speed", 0)),
                        heading=float(v.get("heading", 0)),
                        course=float(v.get("course", 0)),
                    )
                )

            tracks.append(
                VesselTrack(
                    mmsi=str(v.get("mmsi", "")),
                    name=v.get("ship_name", "Unknown"),
                    vessel_type=v.get("type_name", "Unknown"),
                    imo=str(v.get("imo", "")),
                    flag=v.get("flag", None),
                    positions=positions,
                )
            )

        logger.info("DatalasticClient: found %d vessels", len(tracks))
        return tracks
