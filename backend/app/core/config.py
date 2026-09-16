"""
Grizon Agri — Application Configuration
Loads all environment variables via Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Central configuration loaded from .env file."""

    # --- App ---
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    SECRET_KEY: str = "change-me-in-production"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./grizon_agri.db"
    DATABASE_SYNC_URL: str = "sqlite:///./grizon_agri.db"
    POSTGRES_DATABASE_URL: str = "postgresql+asyncpg://grizon:grizon_agri_2026@localhost:5432/grizon_agri"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Sarvam AI (Voice) ---
    SARVAM_API_KEY: Optional[str] = None

    # --- LLM ---
    GROQ_API_KEY: Optional[str] = None

    # --- Satellite ---
    SENTINEL_HUB_CLIENT_ID: Optional[str] = None
    SENTINEL_HUB_CLIENT_SECRET: Optional[str] = None

    # --- Weather ---
    IMD_API_KEY: Optional[str] = None
    OWM_API_KEY: Optional[str] = None

    # --- Mandi ---
    UPAG_API_KEY: Optional[str] = None

    # --- WhatsApp ---
    WHATSAPP_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_ID: Optional[str] = None

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS comma-separated string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton settings instance
settings = Settings()
