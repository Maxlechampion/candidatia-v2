"""Tests du router /api/auth."""

from fastapi.testclient import TestClient


def test_register_short_password_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_register_invalid_email_returns_422(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "motdepasse123"},
    )
    assert response.status_code == 422


def test_login_missing_fields_returns_422(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422


def test_login_unknown_user_returns_401(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "unknown@nowhere.com", "password": "anypassword123"},
    )
    assert response.status_code == 401


def test_me_without_token_returns_401(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_quota_without_token_returns_401(client: TestClient) -> None:
    response = client.get("/api/auth/me/quota")
    assert response.status_code == 401


def test_plans_is_public(client: TestClient) -> None:
    response = client.get("/api/quota/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) >= 4


def test_generations_requires_auth(client: TestClient) -> None:
    response = client.get("/api/generations")
    assert response.status_code == 401
