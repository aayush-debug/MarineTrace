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
    Placeholder for the real ML integration.

    The ML developer should expose either:
      - A local function: detect_oil(image_path) → dict
      - A remote endpoint: POST /detect → SpillDetection JSON

    Replace the body of detect_oil() with the actual call
    once the ML model is ready.
    """

    def __init__(self, endpoint_url: str | None = None):
        self.endpoint_url = endpoint_url

    async def detect_oil(
        self, image_data: str | None, observation_time: datetime
    ) -> SpillDetection:
        if self.endpoint_url:
            # Future: POST to the ML service
            # response = await httpx.AsyncClient().post(
            #     self.endpoint_url,
            #     json={"image": image_data, "observation_time": observation_time.isoformat()},
            # )
            # return SpillDetection(**response.json())
            raise NotImplementedError("Real ML endpoint not yet integrated")

        raise NotImplementedError(
            "RealMLClient requires either a local function or endpoint_url. "
            "Use MockMLClient for development."
        )
