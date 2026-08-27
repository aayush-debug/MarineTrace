"""
Database models and repository abstraction layer for MarineTrace.
Designed so SQLite/JSON can be easily swapped for PostgreSQL + PostGIS.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any
import json
import sqlite3
from pathlib import Path

from app.models.investigation import InvestigationResponse


class InvestigationRepository(ABC):
    """Abstract interface for investigation persistence."""

    @abstractmethod
    async def save(self, investigation: InvestigationResponse) -> None:
        """Save or update an investigation record."""
        ...

    @abstractmethod
    async def get(self, investigation_id: str) -> InvestigationResponse | None:
        """Retrieve an investigation by its ID."""
        ...

    @abstractmethod
    async def list_recent(self, limit: int = 20) -> list[InvestigationResponse]:
        """List recently created investigations."""
        ...


class SQLiteInvestigationRepository(InvestigationRepository):
    """
    SQLite implementation of the InvestigationRepository.
    Stores the full investigation document as JSON with indexable columns
    (id, created_at, status, confidence, vessel_count).
    """

    def __init__(self, db_path: str | Path = "marinetrace.db"):
        self.db_path = str(db_path)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS investigations (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    observation_time TEXT NOT NULL,
                    status TEXT NOT NULL,
                    spill_confidence REAL,
                    spill_area_km2 REAL,
                    origin_lat REAL,
                    origin_lon REAL,
                    top_vessel_name TEXT,
                    top_vessel_score REAL,
                    data_json TEXT NOT NULL
                )
            """)
            conn.commit()

    async def save(self, investigation: InvestigationResponse) -> None:
        top_vessel = investigation.vessels[0] if investigation.vessels else None
        top_name = top_vessel.vessel_name if top_vessel else None
        top_score = top_vessel.score if top_vessel else None

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO investigations (
                    id, created_at, observation_time, status,
                    spill_confidence, spill_area_km2,
                    origin_lat, origin_lon,
                    top_vessel_name, top_vessel_score,
                    data_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    investigation.investigation_id,
                    investigation.created_at.isoformat(),
                    investigation.observation_time.isoformat(),
                    investigation.status.value if hasattr(investigation.status, 'value') else str(investigation.status),
                    investigation.spill.confidence,
                    investigation.spill.area_km2,
                    investigation.drift.origin.latitude if investigation.drift else None,
                    investigation.drift.origin.longitude if investigation.drift else None,
                    top_name,
                    top_score,
                    investigation.model_dump_json(),
                ),
            )
            conn.commit()

    async def get(self, investigation_id: str) -> InvestigationResponse | None:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT data_json FROM investigations WHERE id = ?",
                (investigation_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            data = json.loads(row[0])
            return InvestigationResponse.model_validate(data)

    async def list_recent(self, limit: int = 20) -> list[InvestigationResponse]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT data_json FROM investigations ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
            rows = cursor.fetchall()
            return [InvestigationResponse.model_validate(json.loads(r[0])) for r in rows]
