# ============================================================
# SHIFTShield 2.0 — Database Client (Supabase)
# Service-role key used here — NEVER expose to frontend
# ============================================================

from typing import Optional
from app.config import settings

_client: Optional[object] = None


def get_supabase_client():
    """
    Returns the Supabase client (service-role, for backend use only).
    Returns None in DEMO_MODE or when credentials are absent.
    """
    global _client

    if settings.DEMO_MODE:
        return None

    if _client is not None:
        return _client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None

    try:
        from supabase import create_client, Client
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        return _client
    except Exception as e:
        print(f"[WARNING] Could not initialise Supabase client: {e}")
        return None
