# ============================================================
# SHIFTShield 2.0 — Weather Service
#
# Three-tier data strategy:
#   1. Live  → Open-Meteo API (no key required)
#   2. Cached → Last environmental_reading from Supabase
#   3. Demo fallback → Built-in labelled fixture data
#
# IMPORTANT: Open-Meteo returns standard meteorological data.
# It does NOT measure Wet Bulb Globe Temperature (WBGT).
# All risk assessments derived from this data are clearly
# labelled as "Estimated Heat Exposure Concern".
# ============================================================

import httpx
import math
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings
from app.models.schemas import WeatherCurrentResponse, HourlyForecastPoint, WEATHER_CODE_DESCRIPTIONS

# ---- Demo fallback fixture ----------------------------------

_DEMO_FALLBACK_BASE = {
    "temperature_c": 34.2,
    "humidity_pct": 68.0,
    "wind_speed_ms": 3.1,
    "solar_radiation": 780.0,
    "weather_code": 0,
    "weather_description": "Clear sky",
    "source": "demo_fallback",
    "warning": "No live weather data available. Displaying labelled demonstration values — not from a live weather service.",
}

# In-memory cache: last successful Open-Meteo response
_weather_cache: Optional[dict] = None
_cache_timestamp: Optional[datetime] = None
_CACHE_TTL_MINUTES = 10  # Cache live readings for 10 minutes


def _build_demo_hourly(base_temp: float = 28.0, base_humidity: float = 60.0) -> list[HourlyForecastPoint]:
    """Generate a realistic 24-hour sinusoidal forecast for demo/fallback."""
    now = datetime.utcnow()
    return [
        HourlyForecastPoint(
            time=(now + timedelta(hours=i)).strftime("%Y-%m-%dT%H:00:00Z"),
            temperature_c=round(base_temp + math.sin((i - 6) * math.pi / 12) * 8, 1),
            humidity_pct=round(base_humidity + math.cos(i * math.pi / 12) * 10, 1),
        )
        for i in range(24)
    ]


def _build_demo_response(overrides: Optional[dict] = None) -> WeatherCurrentResponse:
    """Build a labelled demo fallback response."""
    base = dict(_DEMO_FALLBACK_BASE)
    if overrides:
        base.update(overrides)
    base_temp = base.get("temperature_c", 28.0)
    base_humidity = base.get("humidity_pct", 60.0)
    return WeatherCurrentResponse(
        **base,
        recorded_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        hourly_forecast=_build_demo_hourly(base_temp, base_humidity),
    )


async def fetch_weather(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    demo_override: Optional[dict] = None,
) -> WeatherCurrentResponse:
    """
    Fetch current weather and 24-hour forecast.

    Priority:
    1. DEMO_MODE → return labelled fixture (no HTTP call)
    2. In-memory cache (if < 10 min old)
    3. Live Open-Meteo call
    4. Supabase cached reading (fallback on live failure)
    5. Built-in demo fallback (last resort)
    """
    # ---- Demo mode: skip all live calls ----
    if settings.DEMO_MODE:
        return _build_demo_response(demo_override)

    lat = latitude or settings.DEFAULT_LATITUDE
    lng = longitude or settings.DEFAULT_LONGITUDE

    # ---- Memory cache check ----
    global _weather_cache, _cache_timestamp
    if (
        _weather_cache is not None
        and _cache_timestamp is not None
        and (datetime.utcnow() - _cache_timestamp).total_seconds() < _CACHE_TTL_MINUTES * 60
    ):
        return WeatherCurrentResponse(**_weather_cache)

    # ---- Live Open-Meteo call ----
    try:
        live_data = await _fetch_open_meteo(lat, lng)
        # Update memory cache
        _weather_cache = live_data
        _cache_timestamp = datetime.utcnow()
        # Persist to Supabase (best-effort, non-blocking)
        _persist_reading_async(live_data)
        return WeatherCurrentResponse(**live_data)

    except Exception as exc:
        warning_msg = f"Live weather unavailable ({type(exc).__name__}). Using last cached reading."

        # ---- Supabase cached reading ----
        cached = await _fetch_cached_reading()
        if cached:
            cached_copy = {k: v for k, v in cached.items() if k not in ("source", "warning")}
            return WeatherCurrentResponse(
                **cached_copy,
                source="cached",
                warning=warning_msg,
            )

        # ---- Last resort: demo fallback ----
        return _build_demo_response({
            "warning": "Live weather unavailable and no cached reading found. Displaying labelled demonstration values.",
        })


async def _fetch_open_meteo(lat: float, lng: float) -> dict:
    """
    Fetch from Open-Meteo API.
    No API key required for the free forecast endpoint.
    """
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "shortwave_radiation",
            "weather_code",
        ],
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
        ],
        "forecast_days": 1,
        "timezone": "auto",
        "wind_speed_unit": "ms",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.OPEN_METEO_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    current = data.get("current", {})
    hourly = data.get("hourly", {})

    # Extract current values
    temperature_c = float(current.get("temperature_2m", 0))
    humidity_pct = float(current.get("relative_humidity_2m", 0))
    wind_speed_ms = float(current.get("wind_speed_10m", 0))
    solar_radiation = float(current.get("shortwave_radiation", 0))
    weather_code = int(current.get("weather_code", 0))
    recorded_at = current.get("time", datetime.utcnow().strftime("%Y-%m-%dT%H:%M"))

    # Parse hourly forecast (next 24 points)
    times = hourly.get("time", [])[:24]
    temps = hourly.get("temperature_2m", [])[:24]
    humids = hourly.get("relative_humidity_2m", [])[:24]

    hourly_forecast = [
        {
            "time": t + ":00Z" if not t.endswith("Z") else t,
            "temperature_c": round(float(temps[i]), 1) if i < len(temps) else temperature_c,
            "humidity_pct": round(float(humids[i]), 1) if i < len(humids) else humidity_pct,
        }
        for i, t in enumerate(times)
    ]

    weather_description = WEATHER_CODE_DESCRIPTIONS.get(weather_code, f"Code {weather_code}")

    return {
        "temperature_c": round(temperature_c, 1),
        "humidity_pct": round(humidity_pct, 1),
        "wind_speed_ms": round(wind_speed_ms, 2),
        "solar_radiation": round(solar_radiation, 1),
        "weather_code": weather_code,
        "weather_description": weather_description,
        "source": "open_meteo",
        "recorded_at": recorded_at if "Z" in recorded_at else recorded_at + "Z",
        "warning": None,
        "hourly_forecast": hourly_forecast,
    }


async def _fetch_cached_reading() -> Optional[dict]:
    """
    Fetch the most recent environmental_reading from Supabase.
    Returns None if database unavailable or no reading exists.
    """
    from app.database import get_supabase_client
    client = get_supabase_client()
    if not client:
        return None

    try:
        result = (
            client.table("environmental_readings")
            .select("*")
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            row = result.data[0]
            return {
                "temperature_c": row["temperature_c"],
                "humidity_pct": row["humidity_pct"],
                "wind_speed_ms": row.get("wind_speed_ms", 0.0),
                "solar_radiation": row.get("solar_radiation", 0.0),
                "weather_code": row.get("weather_code", 0),
                "weather_description": WEATHER_CODE_DESCRIPTIONS.get(row.get("weather_code", 0), "Unknown"),
                "recorded_at": row["recorded_at"],
                "warning": None,
                "hourly_forecast": None,
            }
    except Exception:
        pass
    return None


def _persist_reading_async(data: dict) -> None:
    """
    Best-effort persist of a weather reading to Supabase.
    Uses a background task pattern — failures are silently logged.
    """
    from app.database import get_supabase_client
    client = get_supabase_client()
    if not client:
        return

    try:
        client.table("environmental_readings").insert({
            "workplace_id": "00000000-0000-0000-0001-000000000001",
            "source": "open_meteo",
            "temperature_c": data["temperature_c"],
            "humidity_pct": data["humidity_pct"],
            "wind_speed_ms": data.get("wind_speed_ms", 0),
            "solar_radiation": data.get("solar_radiation", 0),
            "weather_code": data.get("weather_code", 0),
            "recorded_at": data.get("recorded_at", datetime.utcnow().isoformat() + "Z"),
        }).execute()
    except Exception as exc:
        # Non-fatal — caching is best-effort
        print(f"[INFO] Weather persist skipped: {exc}")


def get_cache_status() -> dict:
    """Return current cache metadata for diagnostics."""
    return {
        "has_cache": _weather_cache is not None,
        "cache_age_seconds": (
            int((datetime.utcnow() - _cache_timestamp).total_seconds())
            if _cache_timestamp else None
        ),
        "cache_ttl_seconds": _CACHE_TTL_MINUTES * 60,
    }
