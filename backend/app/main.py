"""MarineTrace — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger


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

# ── CORS — allow the React frontend ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount route modules ─────────────────────────────
from app.api.routes.health import router as health_router               # noqa: E402
from app.api.routes.investigation import router as investigation_router  # noqa: E402
from app.api.routes.drift import router as drift_router                  # noqa: E402
from app.api.routes.vessels import router as vessels_router              # noqa: E402

app.include_router(health_router)
app.include_router(investigation_router)
app.include_router(drift_router)
app.include_router(vessels_router)
