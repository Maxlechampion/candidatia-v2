"""Tests du service email."""

from app.services.email.brevo_client import BrevoClient, get_brevo_client
from app.services.email.templates import (
    base_template,
    relance_reminder_template,
    welcome_template,
)


def test_brevo_client_instantiation() -> None:
    """Le client Brevo peut etre instancie."""
    client = BrevoClient()
    assert client is not None


def test_brevo_client_singleton() -> None:
    """Deux appels retournent la meme instance."""
    c1 = get_brevo_client()
    c2 = get_brevo_client()
    assert c1 is c2


def test_brevo_is_available_returns_bool() -> None:
    """is_available retourne un booleen."""
    client = BrevoClient()
    result = client.is_available()
    assert isinstance(result, bool)


def test_base_template_contains_html() -> None:
    """Le template de base contient du HTML valide."""
    html = base_template("<p>Test</p>")
    assert "<!DOCTYPE html>" in html
    assert "<p>Test</p>" in html
    assert "CandidatIA" in html


def test_relance_reminder_template() -> None:
    """Le template de relance contient les infos du poste."""
    html = relance_reminder_template(
        user_name="Jean Dupont",
        company_name="TechCorp",
        job_title="Dev Python",
        scheduled_date="2026-10-15",
        email_draft="Bonjour,\n\nJe me permets de...",
    )
    assert "Jean Dupont" in html
    assert "TechCorp" in html
    assert "Dev Python" in html
    assert "2026-10-15" in html


def test_welcome_template() -> None:
    """Le template de bienvenue contient le nom."""
    html = welcome_template("Marie Martin")
    assert "Marie Martin" in html
    assert "Bienvenue" in html
    assert "CandidatIA" in html
