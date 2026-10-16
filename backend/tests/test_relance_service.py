"""Tests du service de relance."""

from app.services.relance.schemas import RelanceSchedule, RelanceStatus


def test_relance_status_values() -> None:
    """Verifie les valeurs de l enum de statut."""
    assert RelanceStatus.PENDING.value == "pending"
    assert RelanceStatus.REMINDED.value == "reminded"
    assert RelanceStatus.SENT.value == "sent"
    assert RelanceStatus.CANCELLED.value == "cancelled"


def test_relance_schedule_valid() -> None:
    """Payload valide."""
    schedule = RelanceSchedule(
        user_id="user-123",
        company_name="TechCorp",
        job_title="Dev Python",
        wait_days=7,
    )
    assert schedule.wait_days == 7
    assert schedule.language == "fr"


def test_relance_schedule_invalid_days() -> None:
    """wait_days doit etre entre 1 et 90."""
    import pytest

    with pytest.raises(Exception):
        RelanceSchedule(
            user_id="user-123",
            company_name="TechCorp",
            job_title="Dev",
            wait_days=0,
        )

    with pytest.raises(Exception):
        RelanceSchedule(
            user_id="user-123",
            company_name="TechCorp",
            job_title="Dev",
            wait_days=100,
        )


def test_relance_module_imports() -> None:
    """Verifie que le module s importe correctement."""
    from app.services.relance import service
    assert hasattr(service, "schedule_relance")
    assert hasattr(service, "get_user_relances")
    assert hasattr(service, "cancel_relance")
    assert hasattr(service, "mark_as_sent")
    assert hasattr(service, "get_pending_relances_for_today")
    assert hasattr(service, "mark_reminded")
