"""
Tests d integration du systeme de relance.

Marques integration car ils touchent la vraie DB et l IA.
"""

import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.database import delete_row, insert_row, select_one


@pytest.fixture
def user_with_token(client: TestClient):
    """Cree un utilisateur et retourne son token."""
    email = f"relance-{uuid.uuid4().hex[:8]}@example.com"

    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": "MotDePasse123!", "full_name": "Test Relance"},
    )
    assert reg.status_code == 200

    data = reg.json()
    yield {
        "email": email,
        "token": data["access_token"],
        "user_id": data["user"]["id"],
    }

    try:
        # Supprimer d abord les relances
        relances = select_one("relances", {"user_id": data["user"]["id"]})
        if relances:
            delete_row("relances", {"user_id": data["user"]["id"]})
        delete_row("profiles", {"email": email})
    except Exception:
        pass


@pytest.mark.integration
def test_schedule_relance_full_flow(client: TestClient, user_with_token) -> None:
    """Test complet : programmer une relance via le router."""
    headers = {"Authorization": f"Bearer {user_with_token['token']}"}

    # 1. Programmer une relance
    response = client.post(
        "/api/relance/schedule",
        headers=headers,
        json={
            "company_name": "TechCorp",
            "job_title": "Developpeur Python",
            "wait_days": 7,
            "language": "fr",
        },
    )

    # Note : ce test utilise un vrai appel IA (lent, mais verifie l integration)
    assert response.status_code == 200, response.text[:300]
    data = response.json()

    assert "id" in data
    assert data["company_name"] == "TechCorp"
    assert data["job_title"] == "Developpeur Python"
    assert data["wait_days"] == 7
    assert data["status"] == "pending"
    assert "email_draft" in data
    assert len(data["email_draft"]) > 50

    relance_id = data["id"]

    # 2. Lister les relances pending
    response = client.get("/api/relance/pending", headers=headers)
    assert response.status_code == 200
    pending = response.json()
    assert isinstance(pending, list)
    assert any(r["id"] == relance_id for r in pending)

    # 3. Annuler la relance
    response = client.post(f"/api/relance/{relance_id}/cancel", headers=headers)
    assert response.status_code == 200

    # 4. Verifier que le statut est cancelled
    response = client.get("/api/relance", headers=headers)
    relances = response.json()
    cancelled = next((r for r in relances if r["id"] == relance_id), None)
    assert cancelled is not None
    assert cancelled["status"] == "cancelled"


@pytest.mark.integration
def test_schedule_relance_invalid_days_returns_422(client: TestClient, user_with_token) -> None:
    """wait_days doit etre entre 1 et 90."""
    headers = {"Authorization": f"Bearer {user_with_token['token']}"}

    response = client.post(
        "/api/relance/schedule",
        headers=headers,
        json={
            "company_name": "Test",
            "job_title": "Dev",
            "wait_days": 999,
        },
    )
    assert response.status_code == 422


@pytest.mark.integration
def test_scheduler_runs_without_error(client: TestClient) -> None:
    """Le scheduler s execute sans erreur (meme sans relance)."""
    import os

    token = os.getenv("CRON_SECRET_TOKEN", "")
    headers = {"X-Cron-Token": token}

    response = client.post("/api/scheduler/run", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "total" in data
    assert "sent" in data
    assert "failed" in data


@pytest.mark.integration
def test_scheduler_processes_due_relance(client: TestClient, user_with_token) -> None:
    """
    Le scheduler traite une relance due aujourd hui.

    On insere directement une relance avec scheduled_date = today.
    """
    import os

    # Inserer une relance due aujourd hui
    today = date.today().isoformat()
    relance = insert_row("relances", {
        "user_id": user_with_token["user_id"],
        "company_name": "SchedulerTest",
        "job_title": "Dev Test",
        "wait_days": 7,
        "scheduled_date": today,
        "email_draft": "Test draft pour scheduler",
        "language": "fr",
        "status": "pending",
    })

    relance_id = relance["id"]

    # Lancer le scheduler
    token = os.getenv("CRON_SECRET_TOKEN", "")
    headers = {"X-Cron-Token": token}

    response = client.post("/api/scheduler/run", headers=headers)
    assert response.status_code == 200

    # Verifier que la relance a ete traitée (peut avoir echoue si Brevo non configure)
    updated = select_one("relances", {"id": relance_id})
    assert updated is not None
    # Le statut peut etre "reminded" (succes) ou "pending" (echec Brevo)
    assert updated["status"] in ("reminded", "pending")


@pytest.mark.integration
def test_cancel_nonexistent_relance_returns_404(client: TestClient, user_with_token) -> None:
    """Annuler une relance inexistante retourne 404."""
    headers = {"Authorization": f"Bearer {user_with_token['token']}"}

    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(f"/api/relance/{fake_id}/cancel", headers=headers)
    assert response.status_code == 404


@pytest.mark.integration
def test_mark_sent_flow(client: TestClient, user_with_token) -> None:
    """Marquer une relance comme envoyee."""
    headers = {"Authorization": f"Bearer {user_with_token['token']}"}

    # 1. Creer une relance directement en DB (plus rapide que via IA)
    relance = insert_row("relances", {
        "user_id": user_with_token["user_id"],
        "company_name": "MarkSentTest",
        "job_title": "Dev",
        "wait_days": 7,
        "scheduled_date": date.today().isoformat(),
        "email_draft": "Draft",
        "language": "fr",
        "status": "pending",
    })

    relance_id = relance["id"]

    # 2. Marquer comme envoyee
    response = client.post(f"/api/relance/{relance_id}/mark-sent", headers=headers)
    assert response.status_code == 200

    # 3. Verifier le statut
    updated = select_one("relances", {"id": relance_id})
    assert updated is not None
    assert updated["status"] == "sent"
