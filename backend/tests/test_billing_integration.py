"""
Tests d integration du flux de paiement.

Ces tests verifient le flux complet :
  register -> checkout -> verification

Ils necessitent un provider configure (FEDAPAY_SECRET_KEY).
Si aucun provider n est configure, ils sont skippes.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.database import delete_row
from app.services.payment.orchestrator import get_payment_orchestrator


@pytest.fixture
def user_authenticated(client: TestClient):
    """Cree un utilisateur et retourne son token JWT."""
    email = f"pay-{uuid.uuid4().hex[:8]}@example.com"

    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": "MotDePasse123!"},
    )
    assert reg.status_code == 200

    data = reg.json()
    yield {
        "email": email,
        "token": data["access_token"],
        "user_id": data["user"]["id"],
    }

    # Cleanup
    try:
        delete_row("profiles", {"email": email})
    except Exception:
        pass


@pytest.mark.integration
def test_billing_plans_endpoint_full(client: TestClient) -> None:
    """Verifie le contenu detaille des 3 plans."""
    response = client.get("/api/billing/plans")
    assert response.status_code == 200

    plans = response.json()["plans"]
    assert len(plans) == 3

    essentiel = next(p for p in plans if p["code"] == "essentiel")
    assert essentiel["credits"] == 5
    assert essentiel["price_xof"] > 0
    assert essentiel["price_eur"] > 0
    assert essentiel["price_usd"] > 0
    assert len(essentiel["features"]) > 0

    pro = next(p for p in plans if p["code"] == "pro")
    assert pro["credits"] == 30
    assert pro["price_eur"] > essentiel["price_eur"]

    carriere = next(p for p in plans if p["code"] == "carriere")
    assert carriere["price_eur"] > pro["price_eur"]


@pytest.mark.integration
def test_billing_providers_endpoint(client: TestClient) -> None:
    """Verifie que les providers sont listes correctement."""
    response = client.get("/api/billing/providers")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert isinstance(data["providers"], list)


@pytest.mark.integration
def test_billing_payments_history_empty(client: TestClient, user_authenticated) -> None:
    """Un nouvel utilisateur n a aucun paiement."""
    headers = {"Authorization": f"Bearer {user_authenticated['token']}"}

    response = client.get("/api/billing/payments", headers=headers)
    assert response.status_code == 200

    payments = response.json()
    assert isinstance(payments, list)
    assert len(payments) == 0


@pytest.mark.integration
def test_billing_checkout_unknown_plan_returns_400(client: TestClient, user_authenticated) -> None:
    """Un plan inconnu retourne 400."""
    headers = {"Authorization": f"Bearer {user_authenticated['token']}"}

    response = client.post(
        "/api/billing/checkout",
        headers=headers,
        json={"plan_code": "inexistant", "provider": "fedapay"},
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_billing_checkout_unknown_provider_returns_400(client: TestClient, user_authenticated) -> None:
    """Un provider inconnu retourne 400."""
    headers = {"Authorization": f"Bearer {user_authenticated['token']}"}

    response = client.post(
        "/api/billing/checkout",
        headers=headers,
        json={"plan_code": "essentiel", "provider": "inexistant"},
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_webhook_invalid_signature_rejected(client: TestClient) -> None:
    """Un webhook avec une signature invalide est rejete."""
    response = client.post(
        "/webhooks/fedapay",
        headers={"x-fedapay-signature": "invalide_signature"},
        json={"name": "transaction.approved", "entity": {"id": 12345}},
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_payment_orchestrator_available_providers() -> None:
    """L orchestrateur retourne une liste de providers disponibles."""
    orchestrator = get_payment_orchestrator()
    providers = orchestrator.available_providers()
    assert isinstance(providers, list)
