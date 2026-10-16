"""Tests du router /api/relance."""

from fastapi.testclient import TestClient


def test_schedule_requires_auth(client: TestClient) -> None:
    """L endpoint /schedule requiert un JWT."""
    response = client.post(
        "/api/relance/schedule",
        json={"company_name": "Test", "job_title": "Dev", "wait_days": 7},
    )
    assert response.status_code == 401


def test_pending_requires_auth(client: TestClient) -> None:
    """L endpoint /pending requiert un JWT."""
    response = client.get("/api/relance/pending")
    assert response.status_code == 401


def test_list_requires_auth(client: TestClient) -> None:
    """L endpoint /api/relance requiert un JWT."""
    response = client.get("/api/relance")
    assert response.status_code == 401


def test_cancel_requires_auth(client: TestClient) -> None:
    """L endpoint /{id}/cancel requiert un JWT."""
    response = client.post("/api/relance/test-id/cancel")
    assert response.status_code == 401


def test_mark_sent_requires_auth(client: TestClient) -> None:
    """L endpoint /{id}/mark-sent requiert un JWT."""
    response = client.post("/api/relance/test-id/mark-sent")
    assert response.status_code == 401
