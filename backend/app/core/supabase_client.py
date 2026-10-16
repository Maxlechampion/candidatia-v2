"""
Client Supabase (singleton).

Fournit deux clients :
  - get_supabase_admin() : client avec service_role (acces total, cote serveur)
  - get_supabase_public() : client avec anon key (acces restreint, RLS)
"""

from typing import Optional

from supabase import Client, create_client

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("core.supabase")

_admin_client: Optional[Client] = None
_public_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """Retourne le client Supabase avec service_role (acces total)."""
    global _admin_client
    if _admin_client is None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError(
                "SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant dans .env"
            )
        _admin_client = create_client(settings.supabase_url, settings.supabase_service_key)
        logger.info("supabase_admin_client_created")
    return _admin_client


def get_supabase_public() -> Client:
    """Retourne le client Supabase avec anon key (RLS applique)."""
    global _public_client
    if _public_client is None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise RuntimeError(
                "SUPABASE_URL ou SUPABASE_ANON_KEY manquant dans .env"
            )
        _public_client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("supabase_public_client_created")
    return _public_client


def reset_clients() -> None:
    """Reinitialise les clients (utile pour les tests)."""
    global _admin_client, _public_client
    _admin_client = None
    _public_client = None
