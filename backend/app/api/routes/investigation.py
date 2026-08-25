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

from fastapi import APIRouter, HTTPException

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
from app.services.ml_client import MockMLClient

from app.db.repository import SQLiteInvestigationRepository

router = APIRouter(tags=["investigation"])

# Service singletons
_ml_client = MockMLClient()
_drift_service = DriftService()
_ais_service = AISService()
_attribution_service = AttributionService()

# Database repository
_repo = SQLiteInvestigationRepository()


@router.post("/investigate", response_model=InvestigationResponse)
async def investigate(request: InvestigationRequest):
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
        spill = await _ml_client.detect_oil(
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
        all_tracks, filtered = await _ais_service.get_candidate_vessels(drift)
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

    # Run through the same pipeline with mock services
    response = await investigate(request)
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
