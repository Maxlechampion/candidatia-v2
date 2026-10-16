"""Tests du scheduler de relance."""

from app.services.relance.scheduler import run_daily_reminders


def test_scheduler_returns_report() -> None:
    """Le scheduler retourne un rapport."""
    report = run_daily_reminders()

    assert isinstance(report, dict)
    assert "date" in report
    assert "total" in report
    assert "sent" in report
    assert "failed" in report


def test_scheduler_report_types() -> None:
    """Les types du rapport sont corrects."""
    report = run_daily_reminders()

    assert isinstance(report["date"], str)
    assert isinstance(report["total"], int)
    assert isinstance(report["sent"], int)
    assert isinstance(report["failed"], int)


def test_scheduler_no_negative_counts() -> None:
    """Les compteurs ne sont jamais negatifs."""
    report = run_daily_reminders()

    assert report["total"] >= 0
    assert report["sent"] >= 0
    assert report["failed"] >= 0
    assert report["sent"] + report["failed"] <= report["total"]
