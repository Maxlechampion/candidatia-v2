"""Tests de protection de /api/generate par JWT."""

from fastapi.testclient import TestClient


def test_generate_without_token_returns_401(client: TestClient) -> None:
    """Sans token, /api/generate retourne 401."""
    response = client.post("/api/generate")
    assert response.status_code == 401


def test_generate_with_invalid_token_returns_401(client: TestClient) -> None:
    """Avec un token invalide, retourne 401."""
    response = client.post(
        "/api/generate",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


def test_generate_info_is_public(client: TestClient) -> None:
    """L endpoint /info reste public."""
    response = client.get("/api/generate/info")
    assert response.status_code == 200
    data = response.json()
    assert data["auth_required"] is True
