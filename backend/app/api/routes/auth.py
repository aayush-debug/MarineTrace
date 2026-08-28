"""
Authentication & Docker Telemetry API Router.
Mounted under /api/auth
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Header
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_USER = {
    "id": "usr-001",
    "email": "sarah.chen@coastguard.gov",
    "full_name": "Commander Sarah Chen",
    "role": "Lead Environmental Response Officer",
    "agency": "Indian Coast Guard / DG Shipping",
    "clearance": "Top Secret / Maritime Operations",
    "avatar_url": None,
    "last_login": datetime.now(timezone.utc).isoformat(),
    "created_at": "2026-01-15T08:00:00Z",
}

LOGIN_LOGS = [
    {
        "id": "log-001",
        "user_id": "usr-001",
        "user_name": "Commander Sarah Chen",
        "email": "sarah.chen@coastguard.gov",
        "ip_address": "127.0.0.1 (Docker Bridge)",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MarineTrace Console",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "SUCCESS",
        "location": "Mumbai MRCC (HQ)",
    }
]


class LoginCredentials(BaseModel):
    email: str
    password: str


class RegisterData(BaseModel):
    email: str
    password: str
    full_name: str
    agency: Optional[str] = "Maritime Agency"
    role: Optional[str] = "Analyst"


@router.post("/login")
async def login(creds: LoginCredentials):
    return {
        "access_token": f"mt_jwt_{creds.email.split('@')[0]}",
        "token_type": "bearer",
        "user": {
            **DEFAULT_USER,
            "email": creds.email,
            "full_name": creds.email.split("@")[0].replace(".", " ").title(),
        },
    }


@router.post("/register")
async def register(data: RegisterData):
    return {
        "access_token": "mt_jwt_registered_user",
        "token_type": "bearer",
        "user": {
            **DEFAULT_USER,
            "email": data.email,
            "full_name": data.full_name,
            "agency": data.agency or "Maritime Agency",
            "role": data.role or "Analyst",
        },
    }


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    return DEFAULT_USER


@router.get("/docker-telemetry")
async def get_docker_telemetry():
    return {
        "container_status": "RUNNING",
        "container_id": "marinetrace-backend-prod",
        "image": "marinetrace:v2.4-arm64",
        "uptime_seconds": 3600,
        "total_logins_recorded": len(LOGIN_LOGS),
        "last_login_ip": "127.0.0.1 (Localhost / Docker Bridge)",
        "last_login_user": DEFAULT_USER["full_name"],
        "active_sessions": 1,
        "bridge_network": "bridge0",
    }


@router.get("/logs")
async def get_logs(limit: int = 50):
    return LOGIN_LOGS[:limit]


@router.delete("/logs")
async def clear_logs():
    LOGIN_LOGS.clear()
    return {"status": "cleared", "count": 0}


@router.get("/users")
async def get_operators():
    return [DEFAULT_USER]


@router.post("/logout")
async def logout():
    return {"status": "logged_out", "ip": "127.0.0.1"}
