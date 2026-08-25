"""Time-related utilities — parsing, windows, formatting."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone


def parse_iso(s: str) -> datetime:
    """Parse an ISO 8601 string into a timezone-aware datetime (UTC)."""
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


def time_window(
    center: datetime,
    hours_before: float = 12,
    hours_after: float = 0,
) -> tuple[datetime, datetime]:
    """Return a (start, end) window around a centre time."""
    start = center - timedelta(hours=hours_before)
    end = center + timedelta(hours=hours_after)
    return (start, end)


def hours_between(t1: datetime, t2: datetime) -> float:
    """Return absolute hours between two datetimes."""
    return abs((t2 - t1).total_seconds()) / 3600.0


def format_duration(seconds: float) -> str:
    """Format a duration in seconds as a human-readable string."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes = seconds / 60
    if minutes < 60:
        return f"{minutes:.1f}m"
    hours = minutes / 60
    return f"{hours:.1f}h"
