# ============================================================
# SHIFTShield 2.0 — Weather Router
# GET /api/weather/current
#
# Delegates to services/weather.py which handles:
#   1. Open-Meteo live fetch (no API key)
#   2. In-memory cache (10 min TTL)
#   3. Supabase cached reading (on live failure)
#   4. Demo fallback fixture (last resort / DEMO_MODE)
# ============================================================

from fastapi import APIRouter, Query
from typing import Optional
from app.config import settings
from app.services.weather import fetch_weather, get_cache_status
from app.demo_fixtures import get_demo_state

router = APIRouter()


@router.get("/weather/current", summary="Get current weather conditions")
async def get_current_weather(
    lat: Optional[float] = Query(default=None, description="Latitude (default: site location)"),
    lng: Optional[float] = Query(default=None, description="Longitude (default: site location)"),
):
    """
    Returns current weather conditions from Open-Meteo (free, no API key).

    Data source labelling:
    - `source: "open_meteo"` — live data from Open-Meteo API
    - `source: "cached"` — last successful reading from database (live API failed)
    - `source: "demo_fallback"` — built-in demonstration data (no live service available)

    NOTE: This endpoint provides standard meteorological data.
    It does NOT measure WBGT (Wet Bulb Globe Temperature).
    All risk assessments derived from this data are clearly labelled
    as "Estimated Heat Exposure Concern".
    """
    # In DEMO_MODE, pass scenario overrides
    demo_override = None
    if settings.DEMO_MODE:
        state = get_demo_state()
        weather = state.get("weather", {})
        demo_override = {
            k: weather.get(k)
            for k in ("temperature_c", "humidity_pct", "wind_speed_ms", "solar_radiation", "weather_code", "weather_description")
            if weather.get(k) is not None
        }

    result = await fetch_weather(
        latitude=lat,
        longitude=lng,
        demo_override=demo_override if demo_override else None,
    )
    return result


@router.get("/weather/cache-status", summary="Weather cache diagnostics")
async def weather_cache_status():
    """Return current weather cache metadata. Useful for diagnostics."""
    return get_cache_status()
