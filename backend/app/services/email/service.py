"""Service email de haut niveau."""

from typing import Any, Dict, Optional

from app.core.logging import get_logger
from app.services.email.brevo_client import EmailError, get_brevo_client
from app.services.email.templates import (
    relance_reminder_template,
    welcome_template,
)

logger = get_logger("email.service")


def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    tags: Optional[list] = None,
) -> Dict[str, Any]:
    """Envoie un email (wrapper haut niveau)."""
    client = get_brevo_client()
    return client.send(
        to_email=to_email,
        to_name=to_name,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        tags=tags,
    )


def send_relance_reminder(
    to_email: str,
    user_name: str,
    company_name: str,
    job_title: str,
    scheduled_date: str,
    email_draft: str,
) -> Dict[str, Any]:
    """Envoie un rappel de relance."""
    html = relance_reminder_template(
        user_name=user_name,
        company_name=company_name,
        job_title=job_title,
        scheduled_date=scheduled_date,
        email_draft=email_draft,
    )

    subject = f"Relance : {job_title} chez {company_name}"

    logger.info(
        "relance_reminder_sending",
        to=to_email,
        company=company_name,
        job=job_title,
    )

    return send_email(
        to_email=to_email,
        to_name=user_name,
        subject=subject,
        html_content=html,
        tags=["relance", "reminder"],
    )


def send_welcome_email(to_email: str, user_name: str) -> Dict[str, Any]:
    """Envoie un email de bienvenue."""
    html = welcome_template(user_name=user_name)

    logger.info("welcome_email_sending", to=to_email)

    return send_email(
        to_email=to_email,
        to_name=user_name,
        subject="Bienvenue sur CandidatIA",
        html_content=html,
        tags=["welcome"],
    )
