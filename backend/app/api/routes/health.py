"""Health check route."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/ping")
async def ping():
    """Health check — returns {"status": "ok"}."""
    return {"status": "ok"}
