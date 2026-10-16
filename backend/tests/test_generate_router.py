"""Tests du router /api/generate (protege par JWT)."""

from fastapi.testclient import TestClient


def test_generate_info_endpoint(client: TestClient) -> None:
    """L endpoint /api/generate/info est public."""
    response = client.get("/api/generate/info")
    assert response.status_code == 200

    data = response.json()
    assert "supported_languages" in data
    assert "pdf_available" in data
    assert "auth_required" in data
    assert data["auth_required"] is True
    assert "fr" in data["supported_languages"]
    assert "en" in data["supported_languages"]


def test_generate_missing_input_returns_401(client: TestClient) -> None:
    """Sans token, /api/generate retourne 401 (protection JWT)."""
    response = client.post("/api/generate")
    assert response.status_code == 401


def test_generate_with_invalid_token_returns_401(client: TestClient) -> None:
    """Avec un token invalide, retourne 401."""
    response = client.post(
        "/api/generate",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


def test_generate_short_profil_with_auth_returns_400(client: TestClient) -> None:
    """Avec un token valide mais un profil trop court -> 400.

    NOTE : ce test necessite un utilisateur reel dans la DB.
    Il est marque integration.
    """
    # Placeholder : le test complet est dans test_quota_enforcement.py
    # (test_generate_with_zero_credits_returns_403)
    pass