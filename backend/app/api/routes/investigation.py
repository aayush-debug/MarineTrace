"""
Investigation routes — the main pipeline endpoints.

POST /investigate        — Run full ML → Drift → AIS → Attribution pipeline
POST /demo/investigation — Pre-cached demo (works offline)
GET  /investigation/{id} — Retrieve past investigation
"""

from __future__ import annotations

import base64
import os
import re
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.core.security import is_safe_path
from app.models.investigation import (
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
)
from app.models.spill import SpillSummary
from app.services.ais_service import AISService
from app.services.attribution_service import AttributionService
from app.services.drift_service import DriftService
from app.services.ml_client import MockMLClient, RealMLClient
from app.db.repository import SQLiteInvestigationRepository

router = APIRouter(tags=["investigation"])

# Service singletons
_mock_ml_client = MockMLClient()
_real_ml_client = RealMLClient()
_drift_service = DriftService()
_ais_service = AISService()
_attribution_service = AttributionService()

# Database repository
_repo = SQLiteInvestigationRepository()

MAX_IMAGE_BASE64_BYTES = 50 * 1024 * 1024  # 50 MB
SAFE_ID_REGEX = re.compile(r"^[A-Za-z0-9\-_]{1,64}$")


class DetectSpillRequest(BaseModel):
    image: str | None = Field(None, description="Path to GeoTIFF or base64 encoded string")
    threshold: float = Field(0.35, ge=0.01, le=0.99, description="Confidence threshold (0.01-0.99)")


@router.post("/detect")
async def detect_spill(request: DetectSpillRequest):
    """
    Direct ML SAR image oil spill detection.
    Accepts JSON with:
      - image: path to SAR GeoTIFF or base64 encoded data (optional, falls back to sample_s1.tif)
      - threshold: detection confidence threshold (float, optional)
    """
    repo_root = Path(__file__).resolve().parents[4]
    if not (repo_root / "ml").exists():
        repo_root = Path(__file__).resolve().parents[3]
    ml_dir = repo_root / "ml"
    if str(ml_dir) not in sys.path:
        sys.path.insert(0, str(ml_dir))

    image_data = request.image
    threshold = request.threshold

    target_image = None
    temp_file = None
    try:
        if image_data:
            if image_data.startswith("data:") or len(image_data) > 500:
                payload = image_data.split(",", 1)[1] if "," in image_data else image_data
                if len(payload) > MAX_IMAGE_BASE64_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Uploaded image exceeds the maximum allowed size of 50 MB.",
                    )
                raw_bytes = base64.b64decode(payload)
                tmp = tempfile.NamedTemporaryFile(suffix=".tif", delete=False)
                tmp.write(raw_bytes)
                tmp.flush()
                tmp.close()
                target_image = tmp.name
                temp_file = tmp.name
            else:
                # Path verification: ensure path is within repository project directories
                candidate_path = Path(image_data).resolve()
                if not is_safe_path(repo_root, candidate_path) or not candidate_path.exists():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid image path specified. Path must exist within the project directory.",
                    )
                target_image = str(candidate_path)

        if not target_image:
            target_image = str(ml_dir / "data" / "sample_s1.tif")

        from inference.api_interface import detect_oil
        return detect_oil(target_image, threshold=threshold)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Detection error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the SAR raster detection.",
        )
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except OSError:
                pass


@router.post("/investigate", response_model=InvestigationResponse)
async def investigate(
    request: InvestigationRequest,
    force_mock_ais: bool = False,
):
    """
    Run a full investigation pipeline.

    ML Detection → Drift Simulation → AIS Reconstruction → Attribution Scoring

    Returns the complete investigation response that the frontend
    can render directly.
    """
    start = time.time()
    inv_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    logger.info("━" * 60)
    logger.info("INVESTIGATION %s STARTED", inv_id)

    try:
        # ── Step 1: ML Oil Detection ─────────────────────
        if request.custom_spill:
            spill = request.custom_spill
            logger.info(
                "[1/4] Using specified spill detection at (%.4f, %.4f) — area: %.1f km²",
                spill.centroid.latitude if spill.centroid else 0.0,
                spill.centroid.longitude if spill.centroid else 0.0,
                spill.area_km2,
            )
        else:
            logger.info("[1/4] Running oil-spill detection...")
            ml_client = _real_ml_client if settings.use_real_ml else _mock_ml_client
            spill = await ml_client.detect_oil(
                image_data=request.image,
                observation_time=request.observation_time,
            )

        if not spill.spill_detected:
            logger.info("No spill detected — investigation complete")
            return InvestigationResponse(
                investigation_id=inv_id,
                status=InvestigationStatus.COMPLETE,
                observation_time=request.observation_time,
                spill=SpillSummary(
                    detected=False, confidence=spill.confidence, area_km2=0,
                ),
                drift=None,
                vessels=[],
                pipeline_duration_seconds=round(time.time() - start, 2),
            )

        logger.info(
            "  Oil spill detected — confidence: %.0f%%, area: %.1f km²",
            spill.confidence * 100, spill.area_km2,
        )

        # ── Step 2: Drift Simulation ─────────────────────
        logger.info("[2/4] Running drift simulation...")
        drift = await _drift_service.run_full(
            spill,
            backward_hours=request.backward_hours,
            forward_hours=request.forward_hours,
        )
        logger.info(
            "  Origin estimated at (%.4f, %.4f) — confidence: %.0f%%",
            drift.origin.latitude, drift.origin.longitude,
            drift.origin.confidence * 100,
        )

        # ── Step 3: AIS Reconstruction ───────────────────
        logger.info("[3/4] Reconstructing AIS traffic...")
        ais_service = AISService(force_mock=force_mock_ais)
        all_tracks, filtered = await ais_service.get_candidate_vessels(drift)
        logger.info(
            "  %d vessels found, %d candidates after filtering",
            len(all_tracks), len(filtered),
        )

        # ── Step 4: Attribution ──────────────────────────
        logger.info("[4/4] Running attribution scoring...")
        attributions = await _attribution_service.attribute(drift, filtered)

        for attr in attributions[:3]:
            logger.info(
                "  #%d %s — score: %.0f/100 (%s)",
                attr.rank, attr.vessel_name, attr.score,
                attr.investigative_priority,
            )

        elapsed = round(time.time() - start, 2)
        logger.info("INVESTIGATION %s COMPLETE in %.1fs", inv_id, elapsed)
        logger.info("━" * 60)

        response = InvestigationResponse(
            investigation_id=inv_id,
            status=InvestigationStatus.COMPLETE,
            observation_time=request.observation_time,
            spill=SpillSummary(
                detected=True,
                confidence=spill.confidence,
                area_km2=spill.area_km2,
                geometry=spill.geometry,
            ),
            drift=drift,
            vessels=attributions,
            pipeline_duration_seconds=elapsed,
        )

        # Store in database
        await _repo.save(response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Investigation %s FAILED: %s", inv_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the investigation pipeline.",
        )


@router.post("/demo/investigation", response_model=InvestigationResponse)
async def demo_investigation():
    """
    Run a pre-cached demo investigation.

    Uses the Arabian Sea scenario with synthetic data.
    Works even if all external APIs are unavailable.
    """
    logger.info("Running DEMO investigation...")

    # Use a fixed observation time for the demo
    obs_time = datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)

    request = InvestigationRequest(
        image=None,
        observation_time=obs_time,
    )

    # Run through the same pipeline with mock services for deterministic demo
    response = await investigate(request, force_mock_ais=True)
    response.is_demo = True
    response.investigation_id = "DEMO-001"
    await _repo.save(response)
    return response


@router.get("/investigations", response_model=list[InvestigationResponse])
async def list_investigations(limit: int = Query(20, ge=1, le=100)):
    """List recent investigations (bounded 1-100)."""
    return await _repo.list_recent(limit=limit)


@router.get("/investigation/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str):
    """Retrieve a previously run investigation."""
    if not SAFE_ID_REGEX.match(investigation_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid investigation ID format.",
        )

    inv = await _repo.get(investigation_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return inv
