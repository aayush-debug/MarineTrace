#!/usr/bin/env python3
"""
SlickTrace Demo Runner — runs the full investigation pipeline from CLI.

This is the "definition of done" script.  When this runs successfully,
the backend is complete.

Usage:
    cd backend
    python ../run_demo.py
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from datetime import datetime, timezone


BANNER = """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🛢️  S L I C K T R A C E                                    ║
║   Intelligent Maritime Oil-Spill Investigation System        ║
║                                                              ║
║   ⚠️  SYNTHETIC / REPLAYABLE INVESTIGATION SCENARIO          ║
║   This demo uses simulated data for demonstration purposes.  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""

DISCLAIMER = """
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  DISCLAIMER                                              │
│  This analysis provides POTENTIAL VESSEL ATTRIBUTION for     │
│  investigative priority only. It does NOT constitute a       │
│  definitive determination of responsibility.                 │
└──────────────────────────────────────────────────────────────┘
"""


async def run_demo():
    from app.services.ml_client import MockMLClient
    from app.services.drift_service import DriftService
    from app.services.ais_service import AISService
    from app.services.attribution_service import AttributionService

    print(BANNER)

    obs_time = datetime(2026, 8, 25, 10, 30, 0, tzinfo=timezone.utc)

    # ── Step 1: ML Detection ─────────────────────────
    print("─" * 60)
    print("[1] Oil spill detection")
    print("─" * 60)

    ml = MockMLClient()
    spill = await ml.detect_oil(None, obs_time)

    print(f"    Spill detected:  ✅ YES")
    print(f"    Confidence:      {spill.confidence*100:.0f}%")
    print(f"    Area:            {spill.area_km2:.1f} km²")
    print(f"    Centroid:        {spill.centroid.latitude:.3f}°N, {spill.centroid.longitude:.3f}°E")
    print()

    # ── Step 2: Drift Simulation ─────────────────────
    print("─" * 60)
    print("[2] Running backward drift simulation...")
    print("─" * 60)

    drift_service = DriftService()
    drift = await drift_service.run_full(spill)

    print(f"    Origin estimate: {drift.origin.latitude:.3f}°N, {drift.origin.longitude:.3f}°E")
    print(f"    Origin confidence: {drift.origin.confidence*100:.0f}%")
    print(f"    Time window:     {drift.origin_time_window.start.strftime('%H:%M')} – "
          f"{drift.origin_time_window.end.strftime('%H:%M')} UTC")
    print(f"    Backward points: {len(drift.backward_trajectory.points)}")
    if drift.forward_trajectory:
        print(f"    Forward points:  {len(drift.forward_trajectory.points)}")
    print()

    # ── Step 3: AIS Reconstruction ───────────────────
    print("─" * 60)
    print("[3] Reconstructing AIS traffic...")
    print("─" * 60)

    ais_service = AISService()
    all_tracks, filtered = await ais_service.get_candidate_vessels(drift)

    print(f"    Total vessels found:    {len(all_tracks)}")
    print(f"    After spatial filter:   → filtering...")
    print(f"    After temporal filter:  → filtering...")
    print(f"    After trajectory filter: {len(filtered)} candidates remain")
    print()

    # ── Step 4: Attribution ──────────────────────────
    print("─" * 60)
    print("[4] Attribution scoring...")
    print("─" * 60)

    attr_service = AttributionService()
    attributions = await attr_service.attribute(drift, filtered)

    medals = ["🥇", "🥈", "🥉"]
    for attr in attributions[:5]:
        medal = medals[attr.rank - 1] if attr.rank <= 3 else "  "
        priority_color = {
            "HIGH": "🔴",
            "MEDIUM": "🟡",
            "LOW": "🟢",
        }.get(attr.investigative_priority, "⚪")

        print(f"    {medal} #{attr.rank}  {attr.vessel_name:<25s}  "
              f"{attr.score:5.1f}/100  {priority_color} {attr.investigative_priority}")

        # Feature breakdown
        fs = attr.feature_scores
        print(f"         Spatial: {fs.spatial:5.1f}  Temporal: {fs.temporal:5.1f}  "
              f"Trajectory: {fs.trajectory:5.1f}  Behaviour: {fs.behaviour:5.1f}  "
              f"Relevance: {fs.vessel_relevance:5.1f}")

        # Reasons
        for reason in attr.reasons[:3]:
            print(f"         • {reason}")
        print()

    print(DISCLAIMER)

    # ── Summary ──────────────────────────────────────
    print("═" * 60)
    print("INVESTIGATION COMPLETE")
    print("═" * 60)
    print(f"  Investigation ID:   DEMO-001")
    print(f"  Spill confidence:   {spill.confidence*100:.0f}%")
    print(f"  Spill area:         {spill.area_km2:.1f} km²")
    print(f"  Origin confidence:  {drift.origin.confidence*100:.0f}%")
    print(f"  Vessels analysed:   {len(all_tracks)}")
    print(f"  Candidates:         {len(filtered)}")
    print(f"  Top suspect:        {attributions[0].vessel_name if attributions else 'N/A'} "
          f"({attributions[0].score:.0f}/100)" if attributions else "")
    print("═" * 60)


if __name__ == "__main__":
    asyncio.run(run_demo())
