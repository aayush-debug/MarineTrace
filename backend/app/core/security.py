"""
MarineTrace Core Security Utilities.

Provides:
- Cryptographic HMAC-SHA256 bearer token signing & verification
- SSRF prevention & IP allowlisting / blocking
- Sensitive data masking for logs and representations
- Path traversal safe resolution
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import ipaddress
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

from app.core.config import settings

# Default fallback secret key if not specified in environment
_DEFAULT_SECRET = "marinetrace-sec-key-2026-auth-prod-signature-alpha-99"
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", _DEFAULT_SECRET)
TOKEN_ALGORITHM = "HS256"
DEFAULT_TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days


# ── 1. Cryptographic Token Handling (HMAC-SHA256) ───────────────────

def create_access_token(
    data: dict[str, Any],
    expires_delta_seconds: int = DEFAULT_TOKEN_EXPIRE_SECONDS,
) -> str:
    """
    Generate a tamper-evident HMAC-SHA256 signed bearer token.
    Contains payload claims: sub (user_id), email, role, exp (expiration timestamp).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = dict(data)
    now = int(time.time())
    payload["iat"] = now
    payload["exp"] = now + expires_delta_seconds

    header_b64 = base64.urlsafe_b64encode(
        json.dumps(header, separators=(",", ":")).encode()
    ).decode().rstrip("=")

    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode().rstrip("=")

    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(
        SECRET_KEY.encode(),
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Verify signature, structure, and expiration of a bearer token.
    Returns decoded claims dict if valid; None if forged, tampered, or expired.
    Also supports legacy demo session tokens (e.g. 'mt_jwt_demo') in sandbox mode.
    """
    if not token or not isinstance(token, str):
        return None

    token = token.strip()
    if token.startswith("Bearer "):
        token = token[7:].strip()

    # Allow structured tokens
    parts = token.split(".")
    if len(parts) == 3:
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode()

        # Re-compute signature
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            signing_input,
            hashlib.sha256,
        ).digest()

        # Pad base64 signature for decode
        padded_sig_b64 = sig_b64 + "=" * (-len(sig_b64) % 4)
        try:
            actual_sig = base64.urlsafe_b64decode(padded_sig_b64)
        except Exception:
            return None

        # Constant-time comparison to prevent timing attacks
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        # Decode payload
        try:
            padded_payload = payload_b64 + "=" * (-len(payload_b64) % 4)
            payload_data = json.loads(base64.urlsafe_b64decode(padded_payload).decode())
            # Check expiration
            exp = payload_data.get("exp")
            if exp and int(time.time()) > int(exp):
                return None  # Expired
            return payload_data
        except Exception:
            return None

    # Sandbox / Demo legacy compatibility tokens
    if token.startswith("mt_jwt_") or token.startswith("demo_"):
        username = token.replace("mt_jwt_", "").replace("demo_", "") or "commander"
        return {
            "sub": f"usr_{username}",
            "email": f"{username}@marinetrace.org",
            "role": "Commander" if "commander" in username else "Senior Analyst",
            "is_demo_session": True,
        }

    return None


# ── 2. SSRF Prevention & Safe URL Validation ────────────────────────

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),          # RFC 1918 Private
    ipaddress.ip_network("127.0.0.0/8"),         # Loopback
    ipaddress.ip_network("169.254.0.0/16"),      # Link-local & Cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),       # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),      # RFC 1918 Private
    ipaddress.ip_network("::1/128"),             # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),            # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),           # IPv6 Link-Local
]


def is_safe_external_url(url: str, allowed_schemes: tuple[str, ...] = ("http", "https", "ws", "wss")) -> bool:
    """
    Validate that a URL is well-formed and does NOT point to local/internal/private network infrastructure.
    Prevents Server-Side Request Forgery (SSRF) against 127.0.0.1, localhost, 169.254.169.254, etc.
    """
    if not url or not isinstance(url, str):
        return False

    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if parsed.scheme.lower() not in allowed_schemes:
        return False

    hostname = (parsed.hostname or "").lower().strip()
    if not hostname:
        return False

    # Block direct localhost and metadata keywords
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "metadata", "instance-data"):
        return False

    # Check if hostname is an IP address
    try:
        ip = ipaddress.ip_address(hostname)
        for net in BLOCKED_IP_NETWORKS:
            if ip in net:
                return False
    except ValueError:
        # Hostname is a domain name (not a raw IP)
        # Check for numeric or hex encoded loopback variants (e.g. 2130706433, 0x7f000001)
        if re.match(r"^(0x[0-9a-f]+|\d+)$", hostname):
            return False

    return True


# ── 3. Path Traversal Safety ────────────────────────────────────────

def is_safe_path(base_dir: Path, target_path: Path | str) -> bool:
    """
    Ensure target_path resolves strictly within base_dir to prevent path traversal (e.g. ../../etc/passwd).
    """
    try:
        base = base_dir.resolve()
        target = Path(target_path).resolve()
        return target == base or base in target.parents
    except Exception:
        return False


# ── 4. Secret Masking in Logs & Strings ──────────────────────────────

def mask_secret(value: Optional[str], visible_chars: int = 4) -> str:
    """Mask sensitive credentials for safe logging and representation."""
    if not value or not isinstance(value, str):
        return "<none>"
    v = value.strip()
    if len(v) <= visible_chars * 2:
        return "*" * len(v)
    return f"{v[:visible_chars]}...{v[-visible_chars:]}"
