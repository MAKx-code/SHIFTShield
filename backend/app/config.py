# ============================================================
# SHIFTShield 2.0 — Backend Configuration
# All settings loaded from environment variables
# ============================================================

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SHIFTShield 2.0 API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Demo mode — bypasses database, returns fixture data
    DEMO_MODE: bool = False

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # JWT validation (Supabase JWTs)
    SUPABASE_JWT_SECRET: Optional[str] = None

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://shiftshield.vercel.app",
    ]

    # Default workplace location (used for weather if no lat/lng provided)
    DEFAULT_LATITUDE: float = -33.8688
    DEFAULT_LONGITUDE: float = 151.2093

    # Open-Meteo
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
