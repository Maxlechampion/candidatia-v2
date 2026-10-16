"""
Scheduler de rappels de relance.

Fonctionne en mode "pull" : un cron job externe (Render Cron, GitHub Actions,
ou un simple appel HTTP quotidien) appelle l endpoint /api/scheduler/run.

A chaque execution :
  1. Recupere les relances qui doivent declencher un rappel aujourd hui
  2. Pour chaque relance, envoie un email de rappel a l utilisateur
  3. Marque la relance comme "reminded"
"""

from datetime import date
from typing import Any, Dict, List

from app.core.logging import get_logger
from app.services.auth.user_service import get_user_by_id
from app.services.email.service import send_relance_reminder
from app.services.relance.service import (
    get_pending_relances_for_today,
    mark_reminded,
)

logger = get_logger("relance.scheduler")


def run_daily_reminders() -> Dict[str, Any]:
    """
    Execute la tache quotidienne d envoi de rappels.

    Retourne un rapport :
      - date : date d execution
      - total : nombre de relances traitees
      - sent : nombre de rappels envoyes
      - failed : nombre d echecs
      - details : liste des resultats individuels
    """
    today = date.today().isoformat()
    logger.info("scheduler_run_started", date=today)

    # 1. Recuperer les relances du jour
    try:
        relances = get_pending_relances_for_today()
    except Exception as e:
        logger.exception("scheduler_fetch_failed", error=str(e))
        return {
            "date": today,
            "total": 0,
            "sent": 0,
            "failed": 0,
            "error": str(e),
        }

    if not relances:
        logger.info("scheduler_no_relances_today", date=today)
        return {
            "date": today,
            "total": 0,
            "sent": 0,
            "failed": 0,
            "details": [],
        }

    logger.info("scheduler_relances_found", count=len(relances))

    # 2. Pour chaque relance, envoyer le rappel
    sent = 0
    failed = 0
    details: List[Dict[str, Any]] = []

    for relance in relances:
        relance_id = relance.get("id")
        user_id = relance.get("user_id")
        company = relance.get("company_name", "?")
        job = relance.get("job_title", "?")
        scheduled_date = relance.get("scheduled_date", today)
        email_draft = relance.get("email_draft", "")

        try:
            # Recuperer l utilisateur
            user = get_user_by_id(user_id)
            user_email = user.get("email")
            user_name = user.get("full_name") or user_email

            if not user_email:
                raise ValueError(f"Pas d email pour l utilisateur {user_id}")

            # Envoyer le rappel
            send_relance_reminder(
                to_email=user_email,
                user_name=user_name,
                company_name=company,
                job_title=job,
                scheduled_date=str(scheduled_date),
                email_draft=email_draft,
            )

            # Marquer comme "reminded"
            mark_reminded(relance_id)

            sent += 1
            details.append({
                "relance_id": relance_id,
                "user_email": user_email,
                "status": "sent",
            })

            logger.info(
                "relance_reminder_sent",
                relance_id=relance_id,
                user_email=user_email,
            )

        except Exception as e:
            failed += 1
            details.append({
                "relance_id": relance_id,
                "status": "failed",
                "error": str(e),
            })
            logger.exception(
                "relance_reminder_failed",
                relance_id=relance_id,
                error=str(e),
            )

    report = {
        "date": today,
        "total": len(relances),
        "sent": sent,
        "failed": failed,
        "details": details,
    }

    logger.info(
        "scheduler_run_completed",
        date=today,
        total=len(relances),
        sent=sent,
        failed=failed,
    )

    return report
