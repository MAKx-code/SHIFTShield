# ============================================================
# SHIFTShield 2.0 — Unit Tests: Weather Service
#
# Tests the weather service fallback chain and data labelling.
# Uses mock HTTP responses — no real API calls.
# ============================================================

import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, AsyncMock, MagicMock
from app.services.weather import (
    fetch_weather, _build_demo_response, _fetch_open_meteo,
    get_cache_status, _DEMO_FALLBACK_BASE
)
from app.models.schemas import WeatherCurrentResponse


# ============================================================
# Demo fallback tests (DEMO_MODE=True)
# ============================================================

def test_demo_mode_returns_demo_fallback():
    """In DEMO_MODE, should return demo fallback without HTTP call."""
    with patch("app.services.weather.settings") as mock_settings:
        mock_settings.DEMO_MODE = True
        mock_settings.DEFAULT_LATITUDE = -33.8688
        mock_settings.DEFAULT_LONGITUDE = 151.2093
        mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

        result = asyncio.run(fetch_weather())
        assert result.source == "demo_fallback", f"Expected demo_fallback, got {result.source}"


def test_demo_mode_with_override():
    """Demo override should modify temperature in response."""
    with patch("app.services.weather.settings") as mock_settings:
        mock_settings.DEMO_MODE = True
        mock_settings.DEFAULT_LATITUDE = -33.8688
        mock_settings.DEFAULT_LONGITUDE = 151.2093

        result = asyncio.run(fetch_weather(demo_override={"temperature_c": 38.0}))
        assert result.temperature_c == 38.0, f"Expected 38.0, got {result.temperature_c}"
        assert result.source == "demo_fallback"


def test_demo_fallback_has_warning():
    """Demo fallback should include a warning label."""
    result = _build_demo_response()
    assert result.warning is not None
    assert "demonstration" in result.warning.lower() or "demo" in result.warning.lower()


def test_demo_fallback_has_hourly_forecast():
    """Demo fallback should include 24-hour forecast."""
    result = _build_demo_response()
    assert result.hourly_forecast is not None
    assert len(result.hourly_forecast) == 24


# ============================================================
# Open-Meteo parsing tests
# ============================================================

_MOCK_OPEN_METEO_RESPONSE = {
    "current": {
        "temperature_2m": 34.2,
        "relative_humidity_2m": 68,
        "wind_speed_10m": 3.1,
        "shortwave_radiation": 780.0,
        "weather_code": 0,
        "time": "2026-11-05T10:00",
    },
    "hourly": {
        "time": [f"2026-11-05T{str(h).zfill(2)}:00" for h in range(24)],
        "temperature_2m": [20.0 + i * 0.5 for i in range(24)],
        "relative_humidity_2m": [65.0 - i * 0.3 for i in range(24)],
    },
}


def test_open_meteo_parsing():
    """Test that Open-Meteo response is correctly parsed."""
    mock_response = MagicMock()
    mock_response.json.return_value = _MOCK_OPEN_METEO_RESPONSE
    mock_response.raise_for_status = MagicMock()

    async def mock_get(*args, **kwargs):
        return mock_response

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = mock_get

    with patch("httpx.AsyncClient", return_value=mock_client):
        with patch("app.services.weather.settings") as mock_settings:
            mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
            result = asyncio.run(_fetch_open_meteo(-33.8688, 151.2093))

    assert result["temperature_c"] == 34.2
    assert result["humidity_pct"] == 68.0
    assert result["wind_speed_ms"] == 3.1
    assert result["solar_radiation"] == 780.0
    assert result["weather_code"] == 0
    assert result["weather_description"] == "Clear sky"
    assert result["source"] == "open_meteo"
    assert len(result["hourly_forecast"]) == 24


def test_open_meteo_hourly_forecast_structure():
    """Each hourly forecast point should have time, temperature_c, humidity_pct."""
    mock_response = MagicMock()
    mock_response.json.return_value = _MOCK_OPEN_METEO_RESPONSE
    mock_response.raise_for_status = MagicMock()

    async def mock_get(*args, **kwargs):
        return mock_response

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = mock_get

    with patch("httpx.AsyncClient", return_value=mock_client):
        with patch("app.services.weather.settings") as mock_settings:
            mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
            result = asyncio.run(_fetch_open_meteo(-33.8688, 151.2093))

    for point in result["hourly_forecast"]:
        assert "time" in point
        assert "temperature_c" in point
        assert "humidity_pct" in point


# ============================================================
# Network failure fallback tests
# ============================================================

def test_network_failure_falls_back_to_demo():
    """On network error with no cache/DB, should return demo fallback."""
    import httpx

    async def broken_get(*args, **kwargs):
        raise httpx.ConnectError("Connection refused")

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = broken_get

    with patch("httpx.AsyncClient", return_value=mock_client):
        with patch("app.services.weather.settings") as mock_settings:
            mock_settings.DEMO_MODE = False
            mock_settings.DEFAULT_LATITUDE = -33.8688
            mock_settings.DEFAULT_LONGITUDE = 151.2093
            mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
        with patch("app.services.weather._weather_cache", None):
            with patch("app.services.weather._cache_timestamp", None):
                with patch("app.services.weather._fetch_cached_reading", AsyncMock(return_value=None)):
                    result = asyncio.run(fetch_weather())

    assert result.source == "demo_fallback"
    assert result.warning is not None
    assert "unavailable" in result.warning.lower()


def test_network_failure_with_cache_uses_cache():
    """On network error with a cached reading available, should use cached data."""
    import httpx

    async def broken_get(*args, **kwargs):
        raise httpx.ConnectError("Connection refused")

    cached_data = {
        "temperature_c": 30.0,
        "humidity_pct": 60.0,
        "wind_speed_ms": 2.5,
        "solar_radiation": 600.0,
        "weather_code": 1,
        "weather_description": "Mainly clear",
        "recorded_at": "2026-11-05T09:00:00Z",
        "warning": None,
        "hourly_forecast": None,
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = broken_get

    with patch("httpx.AsyncClient", return_value=mock_client):
        with patch("app.services.weather.settings") as mock_settings:
            mock_settings.DEMO_MODE = False
            mock_settings.DEFAULT_LATITUDE = -33.8688
            mock_settings.DEFAULT_LONGITUDE = 151.2093
            mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
        with patch("app.services.weather._weather_cache", None):
            with patch("app.services.weather._cache_timestamp", None):
                with patch("app.services.weather._fetch_cached_reading", AsyncMock(return_value=cached_data)):
                    result = asyncio.run(fetch_weather())

    assert result.source == "cached"
    assert result.temperature_c == 30.0
    assert "unavailable" in result.warning.lower()


# ============================================================
# Source label tests
# ============================================================

def test_live_response_labels_source_open_meteo():
    """Successful live fetch should label source as 'open_meteo'."""
    mock_response = MagicMock()
    mock_response.json.return_value = _MOCK_OPEN_METEO_RESPONSE
    mock_response.raise_for_status = MagicMock()

    async def mock_get(*args, **kwargs):
        return mock_response

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.get = mock_get

    with patch("httpx.AsyncClient", return_value=mock_client):
        with patch("app.services.weather.settings") as mock_settings:
            mock_settings.DEMO_MODE = False
            mock_settings.DEFAULT_LATITUDE = -33.8688
            mock_settings.DEFAULT_LONGITUDE = 151.2093
            mock_settings.OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
        with patch("app.services.weather._weather_cache", None):
            with patch("app.services.weather._cache_timestamp", None):
                with patch("app.services.weather._persist_reading_async", MagicMock()):
                    result = asyncio.run(fetch_weather())

    assert result.source == "open_meteo"
    assert result.warning is None


def test_response_has_required_fields():
    """Weather response must have all required fields."""
    result = _build_demo_response()
    assert result.temperature_c is not None
    assert result.humidity_pct is not None
    assert result.wind_speed_ms is not None
    assert result.source in ("open_meteo", "cached", "demo_fallback", "manual", "sensor")
    assert result.recorded_at is not None


# ============================================================
# Run all tests (when executed directly)
# ============================================================

if __name__ == "__main__":
    import traceback
    test_fns = [
        (name, fn) for name, fn in globals().items()
        if name.startswith("test_") and callable(fn)
    ]
    passed = 0
    failed = 0
    for name, fn in test_fns:
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {name}: {traceback.format_exc()}")
            failed += 1

    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {len(test_fns)} tests")
    if failed > 0:
        exit(1)
