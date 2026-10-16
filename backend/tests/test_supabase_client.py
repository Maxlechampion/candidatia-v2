"""Tests du client Supabase et des helpers DB."""

from app.core.supabase_client import get_supabase_admin, get_supabase_public


def test_admin_client_creation() -> None:
    """Le client admin doit pouvoir etre cree."""
    client = get_supabase_admin()
    assert client is not None


def test_admin_client_singleton() -> None:
    """Deux appels retournent la meme instance."""
    c1 = get_supabase_admin()
    c2 = get_supabase_admin()
    assert c1 is c2


def test_public_client_creation() -> None:
    """Le client public doit pouvoir etre cree."""
    client = get_supabase_public()
    assert client is not None


def test_public_client_singleton() -> None:
    """Deux appels retournent la meme instance."""
    c1 = get_supabase_public()
    c2 = get_supabase_public()
    assert c1 is c2
