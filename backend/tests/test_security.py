"""
MarineTrace Comprehensive Automated Security Test Suite.

Covers:
1. Authentication, token tampering, and RBAC enforcement
2. SSRF prevention against loopback, private networks, and cloud metadata
3. Path traversal attacks on SAR raster and detection endpoints
4. Input validation and resource exhaustion limits (DoS prevention)
5. SQL injection safety & investigation ID sanitization
6. HTTP security headers injection
7. Secret masking and no credential leakage
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token, is_safe_external_url

client = TestClient(app)


# ── 1. Authentication & RBAC Tests ──────────────────────────────────

def test_unauthenticated_request_rejected():
    """Accessing protected /api/auth/me without authorization header should return 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_tampered_token_rejected():
    """A forged or tampered JWT token should be rejected with 401."""
    # Create valid token then tamper with signature
    token = create_access_token({"sub": "usr-001", "role": "Commander", "email": "test@marinetrace.org"})
    tampered = token[:-5] + "XXXXX"
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered}"})
    assert res.status_code == 401


def test_valid_token_accepted():
    """A cryptographically signed token should grant access to /api/auth/me."""
    token = create_access_token({
        "sub": "usr_commander_01",
        "email": "commander@marinetrace.org",
        "role": "Coast Guard Commander",
    })
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "commander@marinetrace.org"


def test_rbac_analyst_cannot_delete_logs():
    """An Analyst token should be forbidden (403) from clearing audit logs."""
    token = create_access_token({
        "sub": "usr_analyst_02",
        "email": "analyst@marinetrace.org",
        "role": "Senior Oceanographer",
    })
    res = client.delete("/api/auth/logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "Operation not permitted" in res.json()["detail"]


def test_rbac_commander_can_delete_logs():
    """A Commander token should be permitted to clear audit logs."""
    token = create_access_token({
        "sub": "usr_commander_01",
        "email": "commander@marinetrace.org",
        "role": "Coast Guard Commander",
    })
    res = client.delete("/api/auth/logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "cleared"


# ── 2. SSRF Prevention Tests ────────────────────────────────────────

def test_ssrf_validator_blocks_internal_addresses():
    """Ensure SSRF validator rejects private IPs, loopback, and cloud metadata."""
    assert not is_safe_external_url("http://127.0.0.1:8000/admin")
    assert not is_safe_external_url("http://localhost:5000")
    assert not is_safe_external_url("http://169.254.169.254/latest/meta-data")
    assert not is_safe_external_url("http://10.0.0.1/private")
    assert not is_safe_external_url("http://192.168.1.1/router")
    assert not is_safe_external_url("http://172.16.0.1/")
    assert not is_safe_external_url("ftp://example.com/file")  # Disallowed scheme

    # Legitimate external URLs must be allowed
    assert is_safe_external_url("https://api.spcsft.com/v1")
    assert is_safe_external_url("https://api.datalastic.com/api/v0")
    assert is_safe_external_url("wss://stream.aisstream.io/v0/stream")


def test_ssrf_endpoint_protection():
    """Sending an internal IP to /spcsft/test-key must return 400 Bad Request."""
    res = client.post("/spcsft/test-key", json={
        "api_key": "test_key",
        "base_url": "http://169.254.169.254/latest/meta-data",
    })
    assert res.status_code == 400
    assert "disallowed" in res.json()["detail"].lower()


# ── 3. Path Traversal Tests ─────────────────────────────────────────

def test_path_traversal_blocked_in_detect():
    """Sending an arbitrary system path to /detect must return 400 Bad Request."""
    res = client.post("/detect", json={"image": "/etc/passwd"})
    assert res.status_code == 400
    assert "Invalid image path" in res.json()["detail"]


def test_path_traversal_blocked_in_sar_raster():
    """Sending path traversal in channel parameter must return 400 Bad Request."""
    res = client.get("/sar/scenes/S1A_01/raster?channel=../../../../etc/passwd")
    assert res.status_code == 400
    assert "Invalid channel" in res.json()["detail"]


def test_path_traversal_blocked_in_sar_mask():
    """Sending path traversal in mask type parameter must return 400 Bad Request."""
    res = client.get("/sar/scenes/S1A_01/mask?type=../../../../etc/shadow")
    assert res.status_code == 400
    assert "Invalid mask type" in res.json()["detail"]


# ── 4. Input Validation & DoS Prevention Tests ───────────────────────

def test_oversized_simulation_hours_rejected():
    """Requests with excessive drift simulation hours must be rejected with 422."""
    obs_time = datetime.now(timezone.utc).isoformat()

    # /investigate backward_hours = 9999
    res = client.post("/investigate", json={
        "observation_time": obs_time,
        "backward_hours": 9999,
    })
    assert res.status_code == 422

    # /drift/backward hours = 50000
    res = client.post("/drift/backward", json={
        "centroid_lat": 18.8,
        "centroid_lon": 72.4,
        "observation_time": obs_time,
        "hours": 50000,
    })
    assert res.status_code == 422


def test_negative_simulation_hours_rejected():
    """Requests with negative drift simulation hours must be rejected with 422."""
    obs_time = datetime.now(timezone.utc).isoformat()
    res = client.post("/drift/backward", json={
        "centroid_lat": 18.8,
        "centroid_lon": 72.4,
        "observation_time": obs_time,
        "hours": -10,
    })
    assert res.status_code == 422


def test_vessel_search_inverted_coordinates_rejected():
    """Vessel search with min_lat > max_lat must return 400 Bad Request."""
    now = datetime.now(timezone.utc)
    res = client.get(
        "/vessels/search",
        params={
            "min_lat": 25.0,
            "max_lat": 15.0,
            "min_lon": 70.0,
            "max_lon": 75.0,
            "start_time": (now - timedelta(hours=6)).isoformat(),
            "end_time": now.isoformat(),
        },
    )
    assert res.status_code == 400
    assert "min_lat must be less than or equal to max_lat" in res.json()["detail"]


def test_vessel_search_excessive_time_window_rejected():
    """Vessel search exceeding 14 days must return 400 Bad Request."""
    now = datetime.now(timezone.utc)
    res = client.get(
        "/vessels/search",
        params={
            "min_lat": 15.0,
            "max_lat": 20.0,
            "min_lon": 70.0,
            "max_lon": 75.0,
            "start_time": (now - timedelta(days=30)).isoformat(),
            "end_time": now.isoformat(),
        },
    )
    assert res.status_code == 400
    assert "exceeds the maximum allowed duration" in res.json()["detail"]


def test_invalid_mmsi_format_rejected():
    """Requesting an invalid MMSI format must return 400 Bad Request."""
    res = client.get("/vessels/INVALID@MMSI!")
    assert res.status_code == 400
    assert "Invalid MMSI" in res.json()["detail"]


def test_sql_injection_in_investigation_id_rejected():
    """SQL injection payload in investigation_id must return 400 Bad Request."""
    res = client.get("/investigation/INC-01'; DROP TABLE investigations; --")
    assert res.status_code == 400
    assert "Invalid investigation ID format" in res.json()["detail"]


# ── 5. Security Headers Tests ───────────────────────────────────────

def test_security_headers_present():
    """All responses must contain standard defensive HTTP security headers."""
    res = client.get("/ping")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"


# ── 6. Secret Masking Tests ─────────────────────────────────────────

def test_ais_status_never_exposes_raw_secret():
    """The /vessels/status endpoint must not leak raw API keys."""
    res = client.get("/vessels/status")
    assert res.status_code == 200
    data = res.json()
    assert "api_key" not in data
    assert "secret" not in data
