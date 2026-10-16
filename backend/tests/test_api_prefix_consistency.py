"""
Test de coherence des prefixes d'API.

Verifie que TOUTES les routes exposees par FastAPI (sauf exceptions)
utilisent le prefixe /api/.

Cela evite le bug classique : "/billing/plans" au lieu de "/api/billing/plans".
"""

import pytest
from fastapi.testclient import TestClient


# Routes qui NE DOIVENT PAS avoir le prefixe /api/
EXEMPT_PREFIXES = (
    "/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/webhooks/",  # webhooks providers ne sont pas sous /api/
)


@pytest.fixture(scope="module")
def app():
    from app.main import app as fastapi_app
    return fastapi_app


def test_all_routes_use_api_prefix(app):
    """Toutes les routes (hors exemptees) doivent commencer par /api/."""
    bad_routes = []

    for route in app.routes:
        path = getattr(route, "path", "")

        # Ignorer les routes internes FastAPI
        if not path.startswith("/"):
            continue

        # Ignorer les routes exemptees
        if any(path.startswith(prefix) for prefix in EXEMPT_PREFIXES):
            continue

        # Ignorer les routes d'erreur ou de debug
        if path.startswith("/favicon"):
            continue

        # Verifier le prefixe
        if not path.startswith("/api/"):
            bad_routes.append(path)

    assert not bad_routes, (
        f"Routes sans prefixe /api/ detectees : {bad_routes}. "
        f"Toutes les routes metier doivent etre sous /api/."
    )


def test_billing_routes_are_under_api(client: TestClient):
    """Les routes /api/billing/* doivent etre accessibles."""
    routes = [
        "/api/billing/plans",
        "/api/billing/providers",
    ]
    for route in routes:
        response = client.get(route)
        assert response.status_code == 200, (
            f"{route} a renvoye {response.status_code} au lieu de 200"
        )


def test_billing_without_api_prefix_returns_404(client: TestClient):
    """Les routes /billing/* (sans /api/) doivent renvoyer 404."""
    response = client.get("/billing/plans")
    assert response.status_code == 404, (
        "La route /billing/plans (sans /api/) ne doit PAS exister. "
        "Cela evite les confusions frontend/backend."
    )


def test_auth_routes_are_under_api(client: TestClient):
    """Les routes /api/auth/* doivent etre accessibles."""
    response = client.get("/api/auth/me")
    # Sans token -> 401 attendu
    assert response.status_code == 401


def test_generations_routes_are_under_api(client: TestClient):
    """Les routes /api/generations/* doivent etre accessibles."""
    response = client.get("/api/generations")
    assert response.status_code == 401  # sans token
