"""FastAPI dependency injection — service singletons, config access, and authentication/RBAC."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Callable, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings
from app.core.security import verify_access_token

security_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    authorization: Optional[str] = Header(None),
) -> Optional[dict[str, Any]]:
    """Retrieve authenticated user claims if a valid token is provided; otherwise None."""
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization:
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        return None

    return verify_access_token(token)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    authorization: Optional[str] = Header(None),
) -> dict[str, Any]:
    """Require a valid authentication token. Raises 401 if invalid or missing."""
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization:
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = verify_access_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired or is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return claims


def require_roles(allowed_roles: list[str]) -> Callable:
    """FastAPI dependency enforcing Role-Based Access Control (RBAC)."""
    async def role_checker(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = user.get("role", "")
        # Check if user has one of the allowed roles
        normalized_allowed = [r.lower() for r in allowed_roles]
        if not any(a in user_role.lower() for a in normalized_allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{user_role}'. Required roles: {allowed_roles}",
            )
        return user
    return role_checker
