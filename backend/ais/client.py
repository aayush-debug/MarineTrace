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

    # Pre-defined vessels for the demo scenario in Arabian Sea shipping corridors
    MOCK_VESSELS = [
        # ── Strong candidates (near drift origin zone ~72.38°E, 18.95°N) ──
        {
            "mmsi": "419001234",
            "name": "MV Ocean Star",
            "vessel_type": "Oil Tanker",
            "flag": "PA",
            "base_lon": 72.18,
            "base_lat": 19.12,
            "speed_kn": 12.5,
            "heading": 155,
            "anomaly": True,  # will show speed deviation
        },
        {
            "mmsi": "538006789",
            "name": "MT Blue Horizon",
            "vessel_type": "Chemical Tanker",
            "flag": "MH",
            "base_lon": 72.28,
            "base_lat": 19.18,
            "speed_kn": 11.0,
            "heading": 170,
            "anomaly": False,
        },
        {
            "mmsi": "356001111",
            "name": "MV Pacific Trader",
            "vessel_type": "Cargo Ship",
            "flag": "LR",
            "base_lon": 72.05,
            "base_lat": 19.22,
            "speed_kn": 13.5,
            "heading": 205,
            "anomaly": False,
        },
        # ── Moderate candidates ──
        {
            "mmsi": "477002222",
            "name": "MT Arabian Sun",
            "vessel_type": "Oil Tanker",
            "flag": "HK",
            "base_lon": 72.35,
            "base_lat": 19.05,
            "speed_kn": 11.5,
            "heading": 180,
            "anomaly": False,
        },
        {
            "mmsi": "636003333",
            "name": "MV Coastal Express",
            "vessel_type": "Container Ship",
            "flag": "LR",
            "base_lon": 72.48,
            "base_lat": 18.90,
            "speed_kn": 14.5,
            "heading": 245,
            "anomaly": False,
        },
        {
            "mmsi": "412004444",
            "name": "MV Gujarat Pearl",
            "vessel_type": "Bulk Carrier",
            "flag": "IN",
            "base_lon": 71.90,
            "base_lat": 19.35,
            "speed_kn": 10.0,
            "heading": 195,
            "anomaly": False,
        },
        {
            "mmsi": "249005555",
            "name": "FV Silver Catch",
            "vessel_type": "Fishing Vessel",
            "flag": "MT",
            "base_lon": 72.42,
            "base_lat": 18.82,
            "speed_kn": 5.0,
            "heading": 215,
            "anomaly": False,
        },
        # ── Far away vessels (should be filtered out) ──
        {
            "mmsi": "311006666",
            "name": "MV Atlantic Voyager",
            "vessel_type": "Container Ship",
            "flag": "BS",
            "base_lon": 71.50,
            "base_lat": 19.10,
            "speed_kn": 17.0,
            "heading": 255,
            "anomaly": False,
        },
        {
            "mmsi": "353007777",
            "name": "MT Global Spirit",
            "vessel_type": "Oil Tanker",
            "flag": "PA",
            "base_lon": 72.10,
            "base_lat": 18.35,
            "speed_kn": 12.5,
            "heading": 220,
            "anomaly": False,
        },
        {
            "mmsi": "710008888",
            "name": "MV Southern Cross",
            "vessel_type": "Bulk Carrier",
            "flag": "BR",
            "base_lon": 71.70,
            "base_lat": 19.30,
            "speed_kn": 11.5,
            "heading": 180,
            "anomaly": False,
        },
        {
            "mmsi": "440009999",
            "name": "MV Korea Star",
            "vessel_type": "Container Ship",
            "flag": "KR",
            "base_lon": 71.30,
            "base_lat": 18.80,
            "speed_kn": 16.0,
            "heading": 245,
            "anomaly": False,
        },
        {
            "mmsi": "304010101",
            "name": "FV Deep Fisher",
            "vessel_type": "Fishing Vessel",
            "flag": "AG",
            "base_lon": 72.20,
            "base_lat": 18.55,
            "speed_kn": 4.5,
            "heading": 230,
            "anomaly": False,
        },
        {
            "mmsi": "258011011",
            "name": "MV Nordic Wind",
            "vessel_type": "Cargo Ship",
            "flag": "NO",
            "base_lon": 71.80,
            "base_lat": 19.25,
            "speed_kn": 12.0,
            "heading": 185,
            "anomaly": False,
        },
        {
            "mmsi": "215012012",
            "name": "MT Mediterranean",
            "vessel_type": "Chemical Tanker",
            "flag": "MT",
            "base_lon": 71.95,
            "base_lat": 18.45,
            "speed_kn": 10.5,
            "heading": 250,
            "anomaly": False,
        },
        {
            "mmsi": "566013013",
            "name": "MV Singapore Star",
            "vessel_type": "Container Ship",
            "flag": "SG",
            "base_lon": 72.30,
            "base_lat": 18.95,
            "speed_kn": 16.0,
            "heading": 165,
            "anomaly": False,
        },
        {
            "mmsi": "372014014",
            "name": "MV Panama Express",
            "vessel_type": "Bulk Carrier",
            "flag": "PA",
            "base_lon": 72.15,
            "base_lat": 18.75,
            "speed_kn": 11.0,
            "heading": 235,
            "anomaly": False,
        },
        {
            "mmsi": "416015015",
            "name": "FV Mumbai Fisher",
            "vessel_type": "Fishing Vessel",
            "flag": "IN",
            "base_lon": 72.52,
            "base_lat": 18.85,
            "speed_kn": 4.0,
            "heading": 210,
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
        """Generate a realistic multi-point AIS track for a vessel staying strictly in ocean waters."""
        positions = []
        interval_minutes = 30  # AIS report interval
        total_minutes = (end_time - start_time).total_seconds() / 60
        n_points = max(int(total_minutes / interval_minutes), 2)

        lon = float(vessel["base_lon"])
        lat = float(vessel["base_lat"])
        speed = float(vessel["speed_kn"])
        heading = float(vessel["heading"])

        for i in range(n_points):
            t = start_time + timedelta(minutes=interval_minutes * i)

            # ── Maritime Land Avoidance Safety Constraints ──
            # 1. Eastern coast clamp (Maharashtra mainland): keep in open sea (lon <= 72.70)
            if lon > 72.68:
                heading = 240.0 + float(rng.normal(0, 3))
                lon = 72.68

            # 2. Northern clamp (Gujarat Saurashtra Peninsula): keep south of 19.80°N
            if lat > 19.80:
                heading = 190.0 + float(rng.normal(0, 3))
                lat = 19.80

            # Simulate movement (speed in knots → degrees per interval)
            speed_deg_per_min = (speed * 1.852 / 111.0) / 60  # rough conversion
            heading_rad = np.radians(heading)

            lon += speed_deg_per_min * np.sin(heading_rad) * interval_minutes
            lat += speed_deg_per_min * np.cos(heading_rad) * interval_minutes

            # Post-step safety enforcement
            if lon > 72.70:
                lon = 72.70 - abs(float(rng.normal(0, 0.005)))
            if lat > 19.85:
                lat = 19.85 - abs(float(rng.normal(0, 0.005)))

            # Add minor GPS jitter
            lon += float(rng.normal(0, 0.0005))
            lat += float(rng.normal(0, 0.0005))

            current_speed = speed

            # If anomaly vessel, introduce a speed drop in the middle of track
            if vessel.get("anomaly") and 0.3 < (i / n_points) < 0.5:
                current_speed = speed * 0.22  # dramatic speed reduction
                heading += float(rng.normal(0, 8))  # course alteration

            heading += float(rng.normal(0, 1.5))  # slight heading variation

            positions.append(
                VesselPosition(
                    timestamp=t,
                    latitude=round(lat, 6),
                    longitude=round(lon, 6),
                    speed=round(current_speed + float(rng.normal(0, 0.2)), 1),
                    heading=round(heading % 360, 1),
                    course=round((heading + float(rng.normal(0, 2)) ) % 360, 1),
                )
            )

        return positions


class DatalasticClient(AISClientInterface):
    """
    Real AIS data provider using the Datalastic API.

    Endpoints used:
    - /inradius_history — historical vessel traffic in a circular area
    - /inradius — real-time vessel traffic in a circular area
    - /vessel_history — historical data for a specific vessel
    - /stat — API status / quota check

    Requires AIS_API_KEY in .env.
    """

    def __init__(self, api_key: str, base_url: str = "https://api.datalastic.com/api/v0"):
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")

    async def check_connection(self) -> tuple[bool, str]:
        """
        Verify connectivity and API key validity against Datalastic API.
        Returns (success: bool, message: str) without revealing secrets.
        """
        import httpx

        if not self.api_key:
            return False, "AIS API authentication: FAILED (Missing API key)"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.base_url}/stat",
                    params={"api-key": self.api_key},
                    headers={"X-API-Key": self.api_key},
                )
                if resp.status_code == 200:
                    return True, "AIS API authentication: SUCCESS"
                elif resp.status_code in (401, 403):
                    return False, "AIS API authentication: FAILED (Invalid or expired API Key)"
                else:
                    return False, f"AIS API authentication: FAILED (HTTP {resp.status_code})"
        except Exception as e:
            return False, f"AIS API authentication: FAILED (Connection error: {type(e).__name__})"

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
        from app.utils.geo import geodesic_distance_km
        radius_km = geodesic_distance_km(min_lat, min_lon, max_lat, max_lon) / 2

        logger.info(
            "DatalasticClient: fetching AIS history at (%.3f, %.3f) r=%.0fkm [%s to %s]",
            centre_lat,
            centre_lon,
            radius_km,
            start_time.strftime("%Y-%m-%d %H:%M"),
            end_time.strftime("%Y-%m-%d %H:%M"),
        )

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                # Try inradius_history first
                resp = await client.get(
                    f"{self.base_url}/inradius_history",
                    params={
                        "api-key": self.api_key,
                        "lat": round(centre_lat, 4),
                        "lon": round(centre_lon, 4),
                        "radius": int(min(radius_km, 100)),
                        "from": start_time.strftime("%Y-%m-%d"),
                        "to": end_time.strftime("%Y-%m-%d"),
                    },
                    headers={"X-API-Key": self.api_key},
                )

                # Fallback to standard inradius if inradius_history is not enabled on plan
                if resp.status_code in (404, 400):
                    logger.info("Datalastic /inradius_history returned %d, trying /inradius", resp.status_code)
                    resp = await client.get(
                        f"{self.base_url}/inradius",
                        params={
                            "api-key": self.api_key,
                            "lat": round(centre_lat, 4),
                            "lon": round(centre_lon, 4),
                            "radius": int(min(radius_km, 100)),
                        },
                        headers={"X-API-Key": self.api_key},
                    )

                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            logger.warning("Datalastic API call failed (%s: %s) — falling back to mock AIS data", type(e).__name__, str(e)[:100])
            mock = MockAISClient()
            return await mock.get_historical_tracks(
                min_lat, max_lat, min_lon, max_lon, start_time, end_time,
            )

        # Parse Datalastic response records
        raw_vessels = data.get("data") or data.get("vessels") or []
        if isinstance(raw_vessels, dict):
            raw_vessels = [raw_vessels]

        # Group records by MMSI to build trajectories
        vessel_groups: dict[str, dict] = {}
        for v in raw_vessels:
            if not isinstance(v, dict):
                continue
            mmsi = str(v.get("mmsi") or v.get("uuid") or "")
            if not mmsi:
                continue

            if mmsi not in vessel_groups:
                vessel_groups[mmsi] = {
                    "mmsi": mmsi,
                    "name": v.get("ship_name") or v.get("name") or f"Vessel-{mmsi[-4:]}",
                    "vessel_type": v.get("type_name") or v.get("type") or "Unknown",
                    "imo": str(v.get("imo") or ""),
                    "flag": v.get("flag") or v.get("country_code"),
                    "points": [],
                }

            # Parse timestamp
            raw_ts = v.get("last_position_epoch") or v.get("timestamp") or v.get("time") or v.get("updated_at")
            pos_time = start_time
            if isinstance(raw_ts, (int, float)):
                try:
                    pos_time = datetime.fromtimestamp(raw_ts, tz=timezone.utc)
                except Exception:
                    pos_time = start_time
            elif isinstance(raw_ts, str):
                try:
                    pos_time = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
                except Exception:
                    pos_time = start_time

            lat = v.get("lat") or v.get("latitude")
            lon = v.get("lon") or v.get("longitude")
            if lat is not None and lon is not None:
                try:
                    speed_val = float(v.get("speed") or v.get("sog") or 0.0)
                    heading_val = float(v.get("heading") or v.get("cog") or 0.0)
                    course_val = float(v.get("course") or v.get("cog") or heading_val)
                    vessel_groups[mmsi]["points"].append(
                        VesselPosition(
                            timestamp=pos_time,
                            latitude=float(lat),
                            longitude=float(lon),
                            speed=speed_val,
                            heading=heading_val,
                            course=course_val,
                        )
                    )
                except (ValueError, TypeError):
                    continue

        tracks: list[VesselTrack] = []
        for mmsi, g in vessel_groups.items():
            pts = sorted(g["points"], key=lambda p: p.timestamp)

            # If only a single point was returned, extrapolate realistic historical track
            # across the search time window using reported speed and heading
            if len(pts) == 1:
                p = pts[0]
                total_hours = max((end_time - start_time).total_seconds() / 3600, 1.0)
                num_steps = max(int(total_hours * 2), 4)  # every 30 mins
                dt_step = (end_time - start_time) / num_steps
                speed_mps = p.speed * 0.514444
                heading_rad = np.radians(p.course)
                dlat_per_sec = (speed_mps * np.cos(heading_rad)) / 111320.0
                dlon_per_sec = (speed_mps * np.sin(heading_rad)) / (111320.0 * np.cos(np.radians(p.latitude)))

                extrapolated: list[VesselPosition] = []
                for step_i in range(num_steps + 1):
                    t_i = start_time + step_i * dt_step
                    delta_sec = (t_i - p.timestamp).total_seconds()
                    lat_i = p.latitude + dlat_per_sec * delta_sec
                    lon_i = p.longitude + dlon_per_sec * delta_sec
                    extrapolated.append(
                        VesselPosition(
                            timestamp=t_i,
                            latitude=round(lat_i, 5),
                            longitude=round(lon_i, 5),
                            speed=p.speed,
                            heading=p.heading,
                            course=p.course,
                        )
                    )
                pts = extrapolated

            tracks.append(
                VesselTrack(
                    mmsi=g["mmsi"],
                    name=g["name"],
                    vessel_type=g["vessel_type"],
                    imo=g["imo"],
                    flag=g["flag"],
                    positions=pts,
                )
            )

        logger.info("DatalasticClient: successfully extracted %d vessels", len(tracks))
        return tracks


class AISStreamClient(AISClientInterface):
    """
    Live real-time AIS data provider using the free AISStream.io WebSocket API.
    Stream URL: wss://stream.aisstream.io/v0/stream

    Requires AIS_API_KEY in .env.
    """

    def __init__(self, api_key: str, base_url: str = "wss://stream.aisstream.io/v0/stream"):
        self.api_key = api_key.strip()
        self.base_url = base_url.strip() or "wss://stream.aisstream.io/v0/stream"

    async def check_connection(self) -> tuple[bool, str]:
        """
        Verify connectivity and API key validity against AISStream.io WebSocket.
        Returns (success: bool, message: str) without revealing secrets.
        """
        import asyncio
        import json
        import websockets

        if not self.api_key:
            return False, "AIS API authentication: FAILED (Missing API key)"

        try:
            async with websockets.connect(self.base_url, close_timeout=5) as ws:
                sub = {
                    "APIKey": self.api_key,
                    "BoundingBoxes": [[[-90, -180], [90, 180]]],
                }
                await ws.send(json.dumps(sub))
                # Wait for subscription confirmation
                msg_str = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(msg_str)
                msg_type = data.get("MessageType")
                if msg_type in ("SubscriptionConfirmation", "PositionReport", "ShipStaticData"):
                    return True, "AIS API authentication: SUCCESS (AISStream.io Live Feed Active)"
                return True, f"AIS API authentication: SUCCESS ({msg_type})"
        except Exception as e:
            return False, f"AIS API authentication: FAILED ({type(e).__name__}: {str(e)[:80]})"

    async def get_historical_tracks(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        start_time: datetime,
        end_time: datetime,
        listen_seconds: float = 3.0,
    ) -> list[VesselTrack]:
        import asyncio
        import json
        import websockets

        logger.info(
            "AISStreamClient: streaming live AIS in [%.2f–%.2f, %.2f–%.2f] for %.1fs",
            min_lat, max_lat, min_lon, max_lon, listen_seconds,
        )

        vessel_groups: dict[str, dict] = {}
        try:
            async with websockets.connect(self.base_url, close_timeout=5) as ws:
                sub = {
                    "APIKey": self.api_key,
                    "BoundingBoxes": [[[min_lat, min_lon], [max_lat, max_lon]]],
                    "FilterMessageTypes": ["PositionReport", "ShipStaticData", "StandardSearchAndRescuePositionReport"],
                }
                await ws.send(json.dumps(sub))

                start_gather = asyncio.get_event_loop().time()
                while asyncio.get_event_loop().time() - start_gather < listen_seconds:
                    try:
                        msg_str = await asyncio.wait_for(ws.recv(), timeout=1.5)
                        msg = json.loads(msg_str)
                        if msg.get("MessageType") == "SubscriptionConfirmation":
                            continue

                        meta = msg.get("MetaData", {})
                        mmsi = str(meta.get("MMSI") or "")
                        if not mmsi:
                            continue

                        lat = meta.get("latitude")
                        lon = meta.get("longitude")
                        if lat is None or lon is None:
                            continue

                        raw_name = meta.get("ShipName", "").strip() or f"Vessel-{mmsi[-4:]}"
                        time_str = meta.get("time_utc")
                        pos_time = datetime.now(timezone.utc)
                        if time_str:
                            try:
                                pos_time = datetime.fromisoformat(time_str.split(".")[0] + "+00:00")
                            except Exception:
                                pass

                        # Extract speed & heading from inner message payload
                        pos_rep = msg.get("Message", {}).get("PositionReport", {})
                        speed_kn = float(pos_rep.get("Sog") or 0.0)
                        heading = float(pos_rep.get("TrueHeading") or pos_rep.get("Cog") or 0.0)
                        course = float(pos_rep.get("Cog") or heading)

                        if mmsi not in vessel_groups:
                            vessel_groups[mmsi] = {
                                "mmsi": mmsi,
                                "name": raw_name,
                                "vessel_type": "Commercial Vessel",
                                "imo": str(meta.get("IMO", "")),
                                "flag": meta.get("country_code", None),
                                "points": [],
                            }

                        vessel_groups[mmsi]["points"].append(
                            VesselPosition(
                                timestamp=pos_time,
                                latitude=float(lat),
                                longitude=float(lon),
                                speed=speed_kn,
                                heading=heading,
                                course=course,
                            )
                        )
                    except asyncio.TimeoutError:
                        break
        except Exception as e:
            logger.warning("AISStream connection failed: %s — falling back to mock", e)
            mock = MockAISClient()
            return await mock.get_historical_tracks(min_lat, max_lat, min_lon, max_lon, start_time, end_time)

        if not vessel_groups:
            logger.info("AISStream: no live vessels captured in bounding box during sample window, generating synthetic local traffic")
            mock = MockAISClient()
            return await mock.get_historical_tracks(min_lat, max_lat, min_lon, max_lon, start_time, end_time)

        # Build vessel tracks and interpolate past positions over the observation window
        tracks: list[VesselTrack] = []
        for mmsi, g in vessel_groups.items():
            pts = sorted(g["points"], key=lambda p: p.timestamp)
            if len(pts) == 1:
                p = pts[0]
                total_hours = max((end_time - start_time).total_seconds() / 3600, 1.0)
                num_steps = max(int(total_hours * 2), 4)
                dt_step = (end_time - start_time) / num_steps
                speed_mps = max(p.speed, 5.0) * 0.514444
                heading_rad = np.radians(p.course)
                dlat_per_sec = (speed_mps * np.cos(heading_rad)) / 111320.0
                dlon_per_sec = (speed_mps * np.sin(heading_rad)) / (111320.0 * np.cos(np.radians(p.latitude)))

                extrapolated: list[VesselPosition] = []
                for step_i in range(num_steps + 1):
                    t_i = start_time + step_i * dt_step
                    delta_sec = (t_i - p.timestamp).total_seconds()
                    lat_i = p.latitude + dlat_per_sec * delta_sec
                    lon_i = p.longitude + dlon_per_sec * delta_sec
                    extrapolated.append(
                        VesselPosition(
                            timestamp=t_i,
                            latitude=round(lat_i, 5),
                            longitude=round(lon_i, 5),
                            speed=p.speed,
                            heading=p.heading,
                            course=p.course,
                        )
                    )
                pts = extrapolated

            tracks.append(
                VesselTrack(
                    mmsi=g["mmsi"],
                    name=g["name"],
                    vessel_type=g["vessel_type"],
                    imo=g["imo"],
                    flag=g["flag"],
                    positions=pts,
                )
            )

        logger.info("AISStreamClient: captured and reconstructed %d vessels", len(tracks))
        return tracks
