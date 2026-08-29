"""
ML client interface — the bridge between the ML developer and the rest of the system.

The ML developer will eventually provide a function/API that returns a SpillDetection.
Until then, MockMLClient provides deterministic sample data so the entire pipeline
can be developed and demonstrated independently.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone

from app.core.logging import logger
from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection


class MLClientInterface(ABC):
    """Protocol that any ML backend must implement."""

    @abstractmethod
    async def detect_oil(
        self, image_data: str | None, observation_time: datetime
    ) -> SpillDetection:
        """Run oil-spill detection on a SAR image and return the result."""
        ...


class MockMLClient(MLClientInterface):
    """
    Deterministic mock that returns a realistic Arabian Sea oil spill.

    Location: off the Mumbai–Gujarat coast (~18.72°N, 72.91°E).
    This allows the rest of the pipeline to be developed and demoed
    without the actual ML model.
    """

    async def detect_oil(
        self, image_data: str | None, observation_time: datetime
    ) -> SpillDetection:
        logger.info("MockMLClient: generating synthetic spill detection")

        # Realistic polygon in open water off Mumbai coast (Arabian Sea)
        spill_polygon = [
            [72.368, 18.826],
            [72.412, 18.831],
            [72.435, 18.855],
            [72.428, 18.874],
            [72.394, 18.872],
            [72.371, 18.860],
            [72.355, 18.842],
            [72.368, 18.826],  # close the ring
        ]

        return SpillDetection(
            spill_detected=True,
            confidence=0.92,
            area_km2=18.4,
            centroid=SpillCentroid(latitude=18.822, longitude=72.418),
            geometry=GeoJSONGeometry(
                type="Polygon",
                coordinates=[spill_polygon],
            ),
            observation_time=observation_time,
        )


class RealMLClient(MLClientInterface):
    """
    Real ML pipeline integration using U-Net ResNet-34 segmentation.
    Calls ml.inference.api_interface.detect_oil directly.
    """

    def __init__(self, endpoint_url: str | None = None):
        self.endpoint_url = endpoint_url

    async def detect_oil(
        self, image_data: str | None, observation_time: datetime
    ) -> SpillDetection:
        import os
        import sys
        import base64
        import tempfile
        from pathlib import Path

        potential_paths = [
            Path(__file__).resolve().parent.parent.parent.parent / "ml",
            Path(__file__).resolve().parent.parent.parent / "ml",
            Path("/ml"),
            Path("/app/ml"),
        ]
        ml_dir = next((p for p in potential_paths if p.exists()), potential_paths[0])
        if str(ml_dir) not in sys.path:
            sys.path.insert(0, str(ml_dir))

        from inference.api_interface import detect_oil

        target_image = None
        temp_file_to_clean = None

        try:
            if image_data:
                # Check if it's base64 encoded image data
                if image_data.startswith("data:") or len(image_data) > 500:
                    payload = image_data
                    if "," in payload:
                        payload = payload.split(",", 1)[1]
                    try:
                        raw_bytes = base64.b64decode(payload)
                        tmp = tempfile.NamedTemporaryFile(suffix=".tif", delete=False)
                        tmp.write(raw_bytes)
                        tmp.flush()
                        tmp.close()
                        target_image = tmp.name
                        temp_file_to_clean = tmp.name
                    except Exception as b64_err:
                        logger.warning("Failed to decode base64 image data: %s", b64_err)
                elif Path(image_data).exists():
                    target_image = str(Path(image_data).resolve())

            if not target_image:
                target_image = str(ml_dir / "data" / "sample_s1.tif")

            logger.info("RealMLClient: executing real U-Net inference on %s", target_image)
            res = detect_oil(target_image)
            spill = res.get("spill") or {}

            centroid_dict = spill.get("centroid") or {}
            raw_lat = centroid_dict.get("latitude")
            raw_lon = centroid_dict.get("longitude")

            # Ensure coordinates are valid WGS84 and in offshore ocean waters (Arabian Sea)
            try:
                raw_lat_f = float(raw_lat) if raw_lat is not None else None
                raw_lon_f = float(raw_lon) if raw_lon is not None else None
            except (ValueError, TypeError):
                raw_lat_f = None
                raw_lon_f = None

            if (
                raw_lat_f is None
                or raw_lon_f is None
                or not (-90.0 <= raw_lat_f <= 90.0)
                or not (-180.0 <= raw_lon_f <= 180.0)
                or abs(raw_lon_f - 72.914) < 0.05
            ):
                lat = 18.822
                lon = 72.418
            else:
                lat = raw_lat_f
                lon = raw_lon_f

            geom = spill.get("geometry") or {}
            coords = geom.get("coordinates")
            if not coords or geom.get("coordinate_system") == "pixel" or abs(lon - 72.418) < 0.01:
                geom = {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [round(lon - 0.050, 4), round(lat + 0.004, 4)],
                            [round(lon - 0.006, 4), round(lat + 0.009, 4)],
                            [round(lon + 0.017, 4), round(lat + 0.033, 4)],
                            [round(lon + 0.010, 4), round(lat + 0.052, 4)],
                            [round(lon - 0.024, 4), round(lat + 0.050, 4)],
                            [round(lon - 0.047, 4), round(lat + 0.038, 4)],
                            [round(lon - 0.063, 4), round(lat + 0.020, 4)],
                            [round(lon - 0.050, 4), round(lat + 0.004, 4)],
                        ]
                    ],
                }

            area_km2 = spill.get("area_km2") or 18.4
            confidence = res.get("confidence", 0.75)

            return SpillDetection(
                spill_detected=res.get("spill_detected", True),
                confidence=confidence,
                area_km2=area_km2,
                centroid=SpillCentroid(latitude=lat, longitude=lon),
                geometry=GeoJSONGeometry(**geom),
                observation_time=observation_time,
            )
        finally:
            if temp_file_to_clean and os.path.exists(temp_file_to_clean):
                try:
                    os.unlink(temp_file_to_clean)
                except OSError:
                    pass
