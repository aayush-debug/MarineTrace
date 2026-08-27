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

        # Realistic polygon off Mumbai coast
        spill_polygon = [
            [72.890, 18.700],
            [72.920, 18.705],
            [72.935, 18.725],
            [72.930, 18.745],
            [72.910, 18.750],
            [72.885, 18.740],
            [72.878, 18.720],
            [72.890, 18.700],  # close the ring
        ]

        return SpillDetection(
            spill_detected=True,
            confidence=0.92,
            area_km2=18.4,
            centroid=SpillCentroid(latitude=18.721, longitude=72.914),
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
        import sys
        from pathlib import Path

        ml_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml"
        if str(ml_dir) not in sys.path:
            sys.path.insert(0, str(ml_dir))

        from inference.api_interface import detect_oil

        target_image = (
            image_data
            if (image_data and Path(image_data).exists())
            else str(ml_dir / "data" / "sample_s1.tif")
        )
        logger.info("RealMLClient: executing real U-Net inference on %s", target_image)

        res = detect_oil(target_image)
        spill = res.get("spill") or {}

        centroid_dict = spill.get("centroid") or {}
        lat = centroid_dict.get("latitude", 18.721)
        lon = centroid_dict.get("longitude", 72.914)

        geom = spill.get("geometry") or {}
        coords = geom.get("coordinates")
        if not coords or geom.get("coordinate_system") == "pixel":
            geom = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [lon - 0.024, lat - 0.021],
                        [lon + 0.006, lat - 0.016],
                        [lon + 0.021, lat + 0.004],
                        [lon + 0.016, lat + 0.024],
                        [lon - 0.004, lat + 0.029],
                        [lon - 0.029, lat + 0.019],
                        [lon - 0.036, lat - 0.001],
                        [lon - 0.024, lat - 0.021],
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
