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

    # ── ML Model ─────────────────────────────────────
    use_real_ml: bool = True
    ml_model_path: str = ""

    # ── AIS API ──────────────────────────────────────
    ais_api_key: str = ""
    ais_base_url: str = "wss://stream.aisstream.io/v0/stream"
    ais_provider: str = "aisstream"

    # ── Copernicus Marine ────────────────────────────
    copernicus_username: str = ""
    copernicus_password: str = ""

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
