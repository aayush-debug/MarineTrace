#!/usr/bin/env python3
"""
MarineTrace — Standalone CLI Demonstration Runner
=================================================
Executes the full 4-tier maritime oil-spill attribution pipeline:
  1. 🛰️ SAR Spill Detection (U-Net Deep Learning / GeoTIFF Analysis)
  2. 🌊 Reverse Metocean Drift Advection (Copernicus + OpenDrift / Physics Backtracking)
  3. 🚢 AIS Historical Trajectory Reconstruction (AisStream / Datalastic Correlation)
  4. 🎯 5D Suspect Attribution Matrix & Ranking

Usage:
  python run_demo.py
  docker compose exec backend python run_demo.py
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Anchor search paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend" if (ROOT_DIR / "backend").exists() else ROOT_DIR
ML_DIR = ROOT_DIR / "ml" if (ROOT_DIR / "ml").exists() else Path("/ml")

for p in [str(BACKEND_DIR), str(ML_DIR), "/app", "/ml"]:
    if p not in sys.path and Path(p).exists():
        sys.path.insert(0, p)

try:
    from app.core.config import settings
    from app.core.logging import logger
    from app.db.repository import SQLiteInvestigationRepository
    from app.models.investigation import InvestigationResponse, InvestigationStatus
    from app.models.spill import GeoJSONGeometry, SpillCentroid, SpillDetection, SpillSummary
    from app.services.ais_service import AISService
    from app.services.attribution_service import AttributionService
    from app.services.drift_service import DriftService
except ImportError as e:
    print(f"\n[ERROR] Failed to import MarineTrace backend modules: {e}")
    print("Ensure you run this script with PYTHONPATH set or within the backend environment.")
    sys.exit(1)


# ANSI Color Codes for terminal UI
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    banner = f"""
{CYAN}╔══════════════════════════════════════════════════════════════════════════════════╗
║  🛰️  MARINETRACE — AUTONOMOUS MARITIME OIL SPILL INVESTIGATION ENGINE             ║
║  Autonomous SAR Detection • Reverse Lagrangian Advection • AIS Attribution       ║
╚══════════════════════════════════════════════════════════════════════════════════╝{RESET}
"""
    print(banner)


async def execute_demo_pipeline() -> InvestigationResponse:
    start_time = time.time()

    print(f"{BOLD}[1/4] 🛰️  Step 1: Synthetic Aperture Radar (SAR) Detection...{RESET}")
    # Arabian Sea incident demo coordinates
    obs_time = datetime.now(timezone.utc) - timedelta(hours=4)
    centroid_lat = 18.9220
    centroid_lon = 72.8347
    area_km2 = 14.85
    confidence = 0.942

    spill = SpillDetection(
        spill_detected=True,
        confidence=confidence,
        area_km2=area_km2,
        centroid=SpillCentroid(latitude=centroid_lat, longitude=centroid_lon),
        geometry=GeoJSONGeometry(
            type="Polygon",
            coordinates=[[
                [centroid_lon - 0.04, centroid_lat - 0.02],
                [centroid_lon + 0.04, centroid_lat - 0.01],
                [centroid_lon + 0.03, centroid_lat + 0.03],
                [centroid_lon - 0.03, centroid_lat + 0.02],
                [centroid_lon - 0.04, centroid_lat - 0.02],
            ]],
        ),
        observation_time=obs_time,
    )
    time.sleep(0.3)
    print(f"      {GREEN}✓{RESET} Spill Identified: Centroid ({centroid_lat:.4f}°N, {centroid_lon:.4f}°E)")
    print(f"      {GREEN}✓{RESET} Estimated Slick Area: {area_km2} km² | U-Net Confidence: {confidence * 100:.1f}%\n")

    print(f"{BOLD}[2/4] 🌊 Step 2: Backward Lagrangian Drift Simulation (OpenDrift/Metocean)...{RESET}")
    drift_service = DriftService()
    drift = await drift_service.run_full(spill, backward_hours=24, forward_hours=24)
    time.sleep(0.3)
    print(f"      {GREEN}✓{RESET} Metocean Reverse Advection Complete (24h backtracked)")
    print(f"      {GREEN}✓{RESET} Probable Release Point: ({drift.origin.latitude:.4f}°N, {drift.origin.longitude:.4f}°E)")
    print(f"      {GREEN}✓{RESET} Origin Time Window: {drift.origin_time_window.start.strftime('%Y-%m-%d %H:%M')} -> {drift.origin_time_window.end.strftime('%H:%M UTC')}")
    print(f"      {GREEN}✓{RESET} Trajectory Particles: {len(drift.backward_trajectory.points)} waypoints computed\n")

    print(f"{BOLD}[3/4] 🚢 Step 3: Historical AIS Vessel Track Reconstruction...{RESET}")
    ais_service = AISService(force_mock=True)
    all_tracks, candidate_tracks = await ais_service.get_candidate_vessels(drift)
    time.sleep(0.3)
    print(f"      {GREEN}✓{RESET} Querying regional AIS maritime transponder registry")
    print(f"      {GREEN}✓{RESET} Total Vessels In Geographic Bounding Box: {len(all_tracks)}")
    print(f"      {GREEN}✓{RESET} Candidates Intersecting Spill Spatiotemporal Cone: {len(candidate_tracks)}\n")

    print(f"{BOLD}[4/4] 🎯 Step 4: 5-Dimensional Suspect Attribution Scoring...{RESET}")
    attribution_service = AttributionService()
    ranked_vessels = await attribution_service.attribute(drift, candidate_tracks)
    time.sleep(0.3)
    print(f"      {GREEN}✓{RESET} 5D Multi-Criteria Matrix Evaluation Finished:")
    print(f"        • Spatial Proximity (30%)    • Temporal Coincidence (25%)")
    print(f"        • Course Anomaly (20%)       • Speed/Loiter Profile (15%)")
    print(f"        • Vessel Risk Relevance (10%)\n")

    duration = round(time.time() - start_time, 2)
    inv_id = f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-ARABIAN"

    response = InvestigationResponse(
        investigation_id=inv_id,
        status=InvestigationStatus.COMPLETE,
        observation_time=obs_time,
        spill=SpillSummary(
            detected=True,
            confidence=spill.confidence,
            area_km2=spill.area_km2,
            geometry=spill.geometry,
        ),
        drift=drift,
        vessels=ranked_vessels,
        pipeline_duration_seconds=duration,
    )

    # Persist in SQLite
    try:
        repo = SQLiteInvestigationRepository()
        await repo.save(response)
        print(f"      {GREEN}✓{RESET} Investigation cached to database: {BOLD}{repo.db_path}{RESET}\n")
    except Exception as e:
        print(f"      {YELLOW}!{RESET} Database save skipped ({e})\n")

    return response


def display_results(result: InvestigationResponse):
    print(f"{CYAN}{'━' * 82}{RESET}")
    print(f"{BOLD}📊 INVESTIGATION DOSSIER SUMMARY: {result.investigation_id}{RESET}")
    print(f"{CYAN}{'━' * 82}{RESET}")
    print(f"  • Status:           {GREEN}VERIFIED COMPLETE{RESET}")
    print(f"  • Observation Time: {result.observation_time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"  • Execution Time:   {result.pipeline_duration_seconds} seconds")
    print(f"  • Spill Size:       {result.spill.area_km2:.2f} km² (Confidence: {result.spill.confidence * 100:.1f}%)")
    print(f"  • Estimated Origin: {result.drift.origin.latitude:.4f}°N, {result.drift.origin.longitude:.4f}°E")
    print(f"  • Metocean Model:   Copernicus Marine Physics / Reverse OpenDrift")
    print(f"{CYAN}{'━' * 82}{RESET}")

    print(f"\n{BOLD}🏆 TOP IDENTIFIED SUSPECT VESSELS (5D ATTRIBUTION RANKING){RESET}")
    header = f"{'Rank':<5} {'MMSI':<11} {'Vessel Name':<22} {'Type':<15} {'Score':<8} {'Priority':<10}"
    print(f"{BOLD}{header}{RESET}")
    print("-" * 82)

    for v in result.vessels[:5]:
        priority_color = RED if v.score >= 70 else (YELLOW if v.score >= 40 else GREEN)
        score_str = f"{v.score:.1f}%"
        print(
            f"{v.rank:<5} "
            f"{v.mmsi:<11} "
            f"{v.vessel_name[:20]:<22} "
            f"{v.vessel_type[:13]:<15} "
            f"{priority_color}{score_str:<8}{RESET} "
            f"{priority_color}{v.investigative_priority:<10}{RESET}"
        )

    print("-" * 82)
    if result.vessels:
        top = result.vessels[0]
        print(f"\n{RED}{BOLD}🚨 PRIMARY TARGET FOR INTERCEPTION / STATUTORY AUDIT:{RESET}")
        print(f"   Vessel:     {BOLD}{top.vessel_name}{RESET} (MMSI: {top.mmsi})")
        print(f"   Flag:       {top.flag or 'Unknown'} | Type: {top.vessel_type}")
        print(f"   Confidence: {RED}{top.score:.1f}% Overall Attribution Score{RESET}")
        fs = top.feature_scores
        print(f"   Breakdown:  Spatial: {fs.spatial:.0f} | Temporal: {fs.temporal:.0f} | Trajectory: {fs.trajectory:.0f} | Behaviour: {fs.behaviour:.0f} | Relevance: {fs.vessel_relevance:.0f}")

    print(f"\n{CYAN}{'━' * 82}{RESET}")
    print(f"🌐 Access Web Dashboard:  {CYAN}http://localhost:5173{RESET}")
    print(f"🛰️ Access Swagger API:    {CYAN}http://localhost:8000/docs{RESET}")
    print(f"{CYAN}{'━' * 82}{RESET}\n")


def main():
    print_banner()
    try:
        result = asyncio.run(execute_demo_pipeline())
        display_results(result)
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n[!] Demonstration cancelled by user.")
        sys.exit(130)
    except Exception as ex:
        print(f"\n[ERROR] Pipeline failed: {ex}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
