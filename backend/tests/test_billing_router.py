"""Tests du router /api/billing."""

from fastapi.testclient import TestClient


def test_plans_endpoint_public(client: TestClient) -> None:
    """L endpoint /api/billing/plans est public."""
    response = client.get("/api/billing/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) == 3

    codes = {p["code"] for p in data["plans"]}
    assert codes == {"essentiel", "pro", "carriere"}


def test_providers_endpoint_public(client: TestClient) -> None:
    """L endpoint /api/billing/providers est public."""
    response = client.get("/api/billing/providers")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert isinstance(data["providers"], list)


def test_checkout_requires_auth(client: TestClient) -> None:
    """L endpoint /api/billing/checkout requiert un JWT."""
    response = client.post(
        "/api/billing/checkout",
        json={"plan_code": "essentiel", "provider": "fedapay"},
    )
    assert response.status_code == 401


def test_payments_requires_auth(client: TestClient) -> None:
    """L endpoint /api/billing/payments requiert un JWT."""
    response = client.get("/api/billing/payments")
    assert response.status_code == 401


def test_webhook_fedapay_no_signature_returns_400(client: TestClient) -> None:
    """Un webhook sans signature retourne 400."""
    response = client.post(
        "/webhooks/fedapay",
        json={"name": "transaction.approved", "entity": {"id": 123}},
    )
    assert response.status_code == 400


def test_webhook_flutterwave_no_signature_returns_400(client: TestClient) -> None:
    """Un webhook sans signature retourne 400."""
    response = client.post(
        "/webhooks/flutterwave",
        json={"event": "charge.completed", "data": {"tx_ref": "abc"}},
    )
    assert response.status_code == 400
