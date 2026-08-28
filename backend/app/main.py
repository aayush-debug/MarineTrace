"""MarineTrace — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware injecting standard HTTP security headers:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Referrer-Policy: strict-origin-when-cross-origin
    - X-XSS-Protection: 1; mode=block
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    logger.info("🛢️  MarineTrace starting — %s", settings.app_name)
    logger.info("   Debug: %s | Log level: %s", settings.debug, settings.log_level)
    yield
    logger.info("🛢️  MarineTrace shutting down")


app = FastAPI(
    title="MarineTrace",
    description="Intelligent Maritime Oil-Spill Investigation System",
    version="0.1.0",
    lifespan=lifespan,
)

# ── Security Headers ────────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)

# ── CORS — allow the React frontend ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount route modules ─────────────────────────────
from app.api.routes.health import router as health_router               # noqa: E402
from app.api.routes.investigation import router as investigation_router  # noqa: E402
from app.api.routes.drift import router as drift_router                  # noqa: E402
from app.api.routes.vessels import router as vessels_router              # noqa: E402
from app.api.routes.spcsft import router as spcsft_router                # noqa: E402
from app.api.routes.auth import router as auth_router                    # noqa: E402
from app.api.routes.sar import router as sar_router                      # noqa: E402

app.include_router(health_router)
app.include_router(investigation_router)
app.include_router(drift_router)
app.include_router(vessels_router)
app.include_router(spcsft_router)
app.include_router(auth_router)
app.include_router(sar_router)
