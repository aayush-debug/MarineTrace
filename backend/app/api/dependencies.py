"""FastAPI dependency injection — service singletons and config access."""

from functools import lru_cache

from app.core.config import Settings


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
