"""Health check route."""

from fastapi import APIRouter, Response

router = APIRouter(tags=["health"])


@router.head("/ping")
async def ping_head():
    """HEAD request for uptime monitoring."""
    return Response(status_code=200)


@router.get("/ping")
async def ping():
    """Health check — returns {"status": "ok"}."""
    return {"status": "ok"}
