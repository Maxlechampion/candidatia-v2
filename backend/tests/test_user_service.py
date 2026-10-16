"""Tests du service utilisateur."""

from app.services.auth.user_service import add_credits, consume_credit


# Note : les tests d integration DB complete sont dans test_user_service_integration.py
# Ces tests verifient uniquement la logique metier.


def test_module_imports() -> None:
    """Verifie que le module s importe correctement."""
    from app.services.auth import user_service
    assert hasattr(user_service, "create_user")
    assert hasattr(user_service, "get_user_by_email")
    assert hasattr(user_service, "get_user_by_id")
    assert hasattr(user_service, "update_user")
    assert hasattr(user_service, "add_credits")
    assert hasattr(user_service, "consume_credit")
