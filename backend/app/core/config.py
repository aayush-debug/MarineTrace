"""MarineTrace configuration — loads from .env with sensible defaults."""

from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # ── General ──────────────────────────────────────
    app_name: str = "MarineTrace"
    debug: bool = False
    log_level: str = "INFO"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    port: int | None = None  # Standard cloud container port (e.g. Render, Heroku)

    # ── Security & CORS ──────────────────────────────
    cors_origins: str = ""  # Comma-separated list of allowed origins (e.g. https://marinetrace.vercel.app)

    # ── ML Model ─────────────────────────────────────
    use_real_ml: bool = True
    ml_model_path: str = ""
    ml_device: str = ""  # Force specific device if set (e.g. "cpu", "cuda")
    ml_model_version: str = "v2"

    # ── AIS API ──────────────────────────────────────
    ais_api_key: str = ""
    ais_base_url: str = "wss://stream.aisstream.io/v0/stream"
    ais_provider: str = "aisstream"

    # ── Copernicus Marine ────────────────────────────
    copernicus_username: str = ""
    copernicus_password: str = ""
    copernicusmarine_service_username: str = ""
    copernicusmarine_service_password: str = ""

    # ── Database ─────────────────────────────────────
    database_url: str = "sqlite:///./marinetrace.db"

    # ── Drift Configuration ──────────────────────────
    drift_backward_hours: int = 24
    drift_forward_hours: int = 24
    drift_timestep_minutes: int = 15
    drift_num_particles: int = 500

    # ── Attribution Weights (must sum to 100) ────────
    weight_spatial: int = 30
    weight_temporal: int = 25
    weight_trajectory: int = 20
    weight_behaviour: int = 15
    weight_vessel_relevance: int = 10

    # ── Paths ────────────────────────────────────────
    demo_data_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent.parent.parent / "data" / "demo"
    )

    model_config = {
        "env_file": [
            str(Path(__file__).resolve().parents[3] / ".env"),
            ".env",
            "../.env",
        ],
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    @property
    def effective_port(self) -> int:
        """Resolve active port from PORT (Render/PaaS) or BACKEND_PORT, fallback 8000."""
        import os
        env_port = os.environ.get("PORT")
        if env_port:
            try:
                return int(env_port)
            except ValueError:
                pass
        if self.port:
            return self.port
        return self.backend_port

    @property
    def all_cors_origins(self) -> list[str]:
        """Combine default development origins with environment-configured origins."""
        import os
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
        raw_env = self.cors_origins or os.environ.get("CORS_ORIGINS", "")
        if raw_env:
            for item in raw_env.split(","):
                cleaned = item.strip().rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        return origins

    @property
    def effective_copernicus_user(self) -> str:
        """Resolve Copernicus username with CopernicusMarine service alias fallback."""
        return (
            self.copernicusmarine_service_username
            or self.copernicus_username
            or ""
        )

    @property
    def effective_copernicus_pass(self) -> str:
        """Resolve Copernicus password with CopernicusMarine service alias fallback."""
        return (
            self.copernicusmarine_service_password
            or self.copernicus_password
            or ""
        )

    def get_db_path(self) -> Path:
        """Resolve SQLite path from database_url, ensuring directory exists."""
        url = (self.database_url or "").strip()
        if not url:
            url = "sqlite:///./marinetrace.db"

        if url.startswith("sqlite:///"):
            raw_path = url[10:]
        elif url.startswith("sqlite://"):
            raw_path = url[9:]
        else:
            raw_path = url

        raw_path = raw_path.strip() or "marinetrace.db"
        p = Path(raw_path)
        if p.name == "" or p.name == ".":
            p = p / "marinetrace.db"

        if not p.is_absolute():
            backend_dir = Path(__file__).resolve().parent.parent.parent
            workspace_dir = backend_dir.parent
            # Prefer workspace root marinetrace.db if present
            if (workspace_dir / p).exists():
                resolved = (workspace_dir / p).resolve()
            elif (backend_dir / p).exists():
                resolved = (backend_dir / p).resolve()
            else:
                resolved = (workspace_dir / p).resolve()
        else:
            resolved = p.resolve()

        if resolved.is_dir():
            resolved = resolved / "marinetrace.db"

        resolved.parent.mkdir(parents=True, exist_ok=True)
        return resolved

    @property
    def attribution_weights(self) -> dict[str, float]:
        """Return normalised attribution weights as fractions."""
        total = (
            self.weight_spatial
            + self.weight_temporal
            + self.weight_trajectory
            + self.weight_behaviour
            + self.weight_vessel_relevance
        )
        return {
            "spatial": self.weight_spatial / total,
            "temporal": self.weight_temporal / total,
            "trajectory": self.weight_trajectory / total,
            "behaviour": self.weight_behaviour / total,
            "vessel_relevance": self.weight_vessel_relevance / total,
        }


# Singleton — import this everywhere
settings = Settings()
