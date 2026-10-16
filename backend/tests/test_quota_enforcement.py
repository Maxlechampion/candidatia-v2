"""
Tests du respect des quotas.

Marques integration car ils modifient la DB.
"""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.database import delete_row, update_row


@pytest.fixture
def user_with_zero_credits(client: TestClient):
    """Cree un utilisateur avec 0 credit pour tester le blocage."""
    email = f"quota-{uuid.uuid4().hex[:8]}@example.com"

    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": "MotDePasse123!"},
    )
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    user_id = reg.json()["user"]["id"]

    # Mettre les credits a 0
    update_row("profiles", {"id": user_id}, {"credits": 0})

    yield {"email": email, "token": token, "user_id": user_id}

    # Cleanup
    try:
        delete_row("profiles", {"email": email})
    except Exception:
        pass


@pytest.mark.integration
def test_generate_with_zero_credits_returns_403(client: TestClient, user_with_zero_credits) -> None:
    """Avec 0 credit, /api/generate doit retourner 403."""
    headers = {"Authorization": f"Bearer {user_with_zero_credits['token']}"}

    resp = client.post(
        "/api/generate",
        headers=headers,
        data={
            "texte_profil": "Profil de test. " * 10,
            "texte_offre": "Offre de test. " * 10,
        },
    )
    assert resp.status_code == 403
    data = resp.json()
    assert data["error_code"] == "FORBIDDEN"
    assert "Quota" in data["message"] or "quota" in data["message"].lower()


@pytest.mark.integration
def test_generations_stats_endpoint(client: TestClient) -> None:
    """L endpoint /api/generations/stats fonctionne."""
    email = f"stats-{uuid.uuid4().hex[:8]}@example.com"

    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": "MotDePasse123!"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    try:
        resp = client.get("/api/generations/stats", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_generations" in data
        assert "average_score" in data
        assert "credits_remaining" in data
        assert data["total_generations"] == 0
    finally:
        try:
            delete_row("profiles", {"email": email})
        except Exception:
            pass
