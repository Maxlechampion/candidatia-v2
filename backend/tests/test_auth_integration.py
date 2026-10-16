"""
Tests d integration du flux auth complet.

Ces tests utilisent un vrai utilisateur temporaire dans Supabase.
Ils sont marques "integration" et peuvent etre exclus avec :
  pytest -m "not integration"
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.database import delete_row


@pytest.fixture
def test_email():
    """Email unique pour chaque test (evite les collisions)."""
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    yield email
    # Cleanup
    try:
        delete_row("profiles", {"email": email})
    except Exception:
        pass


@pytest.mark.integration
def test_full_register_login_flow(client: TestClient, test_email: str) -> None:
    """Test complet : register -> login -> me."""

    # 1. Register
    register_resp = client.post(
        "/api/auth/register",
        json={
            "email": test_email,
            "password": "MotDePasse123!",
            "full_name": "Test Integration",
        },
    )
    assert register_resp.status_code == 200, register_resp.text
    data = register_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email
    assert data["user"]["credits"] == 1
    assert data["user"]["plan"] == "free"

    token = data["access_token"]

    # 2. Me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == test_email
    assert me_data["credits"] == 1

    # 3. Login
    login_resp = client.post(
        "/api/auth/login",
        json={"email": test_email, "password": "MotDePasse123!"},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == test_email


@pytest.mark.integration
def test_register_duplicate_email_fails(client: TestClient, test_email: str) -> None:
    """Deux inscriptions avec le meme email -> 400."""

    # 1ere inscription
    r1 = client.post(
        "/api/auth/register",
        json={"email": test_email, "password": "MotDePasse123!"},
    )
    assert r1.status_code == 200

    # 2eme inscription -> 400
    r2 = client.post(
        "/api/auth/register",
        json={"email": test_email, "password": "AutreMotDePasse456!"},
    )
    assert r2.status_code == 400


@pytest.mark.integration
def test_login_wrong_password_returns_401(client: TestClient, test_email: str) -> None:
    """Login avec mauvais mot de passe -> 401."""

    # Inscription
    client.post(
        "/api/auth/register",
        json={"email": test_email, "password": "MotDePasse123!"},
    )

    # Login mauvais mot de passe
    r = client.post(
        "/api/auth/login",
        json={"email": test_email, "password": "MauvaisMotDePasse"},
    )
    assert r.status_code == 401


@pytest.mark.integration
def test_me_quota_after_register(client: TestClient, test_email: str) -> None:
    """Apres inscription, le quota doit etre de 1 credit."""

    reg = client.post(
        "/api/auth/register",
        json={"email": test_email, "password": "MotDePasse123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    quota = client.get("/api/auth/me/quota", headers=headers)
    assert quota.status_code == 200
    data = quota.json()
    assert data["credits_remaining"] == 1
    assert data["plan"] == "free"
    assert data["plan_name"] == "Decouverte"


@pytest.mark.integration
def test_plans_endpoint_returns_4_plans(client: TestClient) -> None:
    """L endpoint /api/quota/plans retourne 4 plans."""

    r = client.get("/api/quota/plans")
    assert r.status_code == 200
    data = r.json()
    assert len(data["plans"]) == 4

    plans_by_code = {p["code"]: p for p in data["plans"]}
    assert "free" in plans_by_code
    assert "essentiel" in plans_by_code
    assert "pro" in plans_by_code
    assert "carriere" in plans_by_code

    assert plans_by_code["free"]["price_eur"] == 0
    assert plans_by_code["pro"]["price_eur"] == 14.99
