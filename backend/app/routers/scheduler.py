"""Router /api/scheduler — Endpoints pour les taches planifiees."""

import os
from typing import Any, Dict

from fastapi import APIRouter, Header, HTTPException

from app.core.logging import get_logger
from app.services.relance.scheduler import run_daily_reminders

logger = get_logger("router.scheduler")
router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


def _verify_cron_token(token: str) -> None:
    """
    Verifie le token cron.

    Ce token protege les endpoints de scheduler pour eviter
    que n importe qui puisse les declencher.
    """
    expected = os.getenv("CRON_SECRET_TOKEN", "")

    if not expected:
        logger.warning("cron_token_not_configured")
        # En dev, on accepte si pas de token configure
        if os.getenv("APP_ENV") == "production":
            raise HTTPException(
                status_code=500,
                detail="CRON_SECRET_TOKEN non configure en production.",
            )
        return

    if token != expected:
        logger.warning("cron_token_invalid")
        raise HTTPException(status_code=401, detail="Token cron invalide.")


@router.post("/run", summary="Executer les taches planifiees")
async def run_scheduler(
    authorization: str = Header("", alias="X-Cron-Token"),
) -> Dict[str, Any]:
    """
    Execute les taches planifiees quotidiennes.

    Appele par un cron externe (Render Cron, GitHub Actions, cron-job.org).
    Envoie les rappels de relance du jour.
    """
    _verify_cron_token(authorization)

    logger.info("scheduler_endpoint_called")
    report = run_daily_reminders()

    return {
        "status": "ok",
        **report,
    }


@router.get("/health", summary="Health check du scheduler")
async def scheduler_health() -> Dict[str, Any]:
    """Verifie que le scheduler est pret."""
    from datetime import date

    return {
        "status": "ok",
        "service": "scheduler",
        "date": date.today().isoformat(),
    }
