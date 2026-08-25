"""SlickTrace configuration — loads from .env with sensible defaults."""

from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # ── General ──────────────────────────────────────
    app_name: str = "SlickTrace"
    debug: bool = False
    log_level: str = "INFO"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # ── AIS API ──────────────────────────────────────
    ais_api_key: str = ""
    ais_base_url: str = "https://api.datalastic.com/api/v0"

    # ── Copernicus Marine ────────────────────────────
    copernicus_username: str = ""
    copernicus_password: str = ""

    # ── Database ─────────────────────────────────────
    database_url: str = "sqlite:///./slicktrace.db"

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
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
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
