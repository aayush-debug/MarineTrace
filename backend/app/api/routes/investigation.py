"""
Investigation routes — the main pipeline endpoints.

POST /investigate        — Run full ML → Drift → AIS → Attribution pipeline
POST /demo/investigation — Pre-cached demo (works offline)
GET  /investigation/{id} — Retrieve past investigation
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

import os
import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.core.logging import logger
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


@router.post("/detect")
async def detect_spill(request: dict):
    """
    Direct ML SAR image oil spill detection.
    Accepts JSON with:
      - image: path to SAR GeoTIFF or base64 encoded data (optional, falls back to sample_s1.tif)
      - threshold: detection confidence threshold (float, optional)
    """
    ml_dir = Path(__file__).resolve().parents[4] / "ml"
    if str(ml_dir) not in sys.path:
        sys.path.insert(0, str(ml_dir))

    from inference.api_interface import detect_oil

    image_data = request.get("image")
    threshold = request.get("threshold", 0.35)

    target_image = None
    temp_file = None
    try:
        if image_data:
            if image_data.startswith("data:") or len(image_data) > 500:
                import base64
                import tempfile
                payload = image_data.split(",", 1)[1] if "," in image_data else image_data
                raw_bytes = base64.b64decode(payload)
                tmp = tempfile.NamedTemporaryFile(suffix=".tif", delete=False)
                tmp.write(raw_bytes)
                tmp.flush()
                tmp.close()
                target_image = tmp.name
                temp_file = tmp.name
            elif Path(image_data).exists():
                target_image = str(Path(image_data).resolve())

        if not target_image:
            target_image = str(ml_dir / "data" / "sample_s1.tif")

        return detect_oil(target_image, threshold=threshold)
    except Exception as e:
        logger.error("Detection error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
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

    except Exception as e:
        logger.error("Investigation %s FAILED: %s", inv_id, e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
async def list_investigations(limit: int = 20):
    """List recent investigations."""
    return await _repo.list_recent(limit=limit)


@router.get("/investigation/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str):
    """Retrieve a previously run investigation."""
    inv = await _repo.get(investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv
