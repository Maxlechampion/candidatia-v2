"""Router /api/relance — Programmation et gestion des relances."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.core.security import get_current_user
from app.services.relance.schemas import RelanceSchedule
from app.services.relance.service import (
    cancel_relance,
    get_user_relances,
    mark_as_sent,
    schedule_relance,
)

logger = get_logger("router.relance")
router = APIRouter(prefix="/api/relance", tags=["relance"])


class ScheduleRequest(BaseModel):
    """Payload de programmation d une relance."""
    company_name: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)
    wait_days: int = Field(7, ge=1, le=90)
    language: str = "fr"
    generation_id: Optional[str] = None


@router.post("/schedule", summary="Programmer une relance")
async def create_schedule(
    payload: ScheduleRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Programme une relance :
    1. Genere le brouillon d email via IA
    2. Enregistre la relance avec la date programmee
    3. Retourne le brouillon et la date
    """
    logger.info(
        "schedule_relance_endpoint",
        user_id=user["id"],
        company=payload.company_name,
        wait_days=payload.wait_days,
    )

    schedule = RelanceSchedule(
        user_id=user["id"],
        generation_id=payload.generation_id,
        company_name=payload.company_name,
        job_title=payload.job_title,
        wait_days=payload.wait_days,
        language=payload.language,
    )

    try:
        relance = schedule_relance(schedule)
    except Exception as e:
        logger.exception("schedule_relance_failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    return relance


@router.get("/pending", summary="Relances en attente")
async def list_pending(
    user: Dict[str, Any] = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retourne les relances en attente de l utilisateur."""
    return get_user_relances(user["id"], status="pending")


@router.get("", summary="Toutes les relances de l utilisateur")
async def list_all(
    user: Dict[str, Any] = Depends(get_current_user),
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Retourne toutes les relances de l utilisateur (tous statuts)."""
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="Limit doit etre entre 1 et 200.")

    return get_user_relances(user["id"], limit=limit)


@router.post("/{relance_id}/cancel", summary="Annuler une relance")
async def cancel(
    relance_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Annule une relance programmee."""
    try:
        return cancel_relance(relance_id, user["id"])
    except Exception as e:
        logger.warning("cancel_relance_failed", relance_id=relance_id, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{relance_id}/mark-sent", summary="Marquer comme envoyee")
async def mark_sent(
    relance_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Marque une relance comme envoyee par l utilisateur."""
    try:
        return mark_as_sent(relance_id, user["id"])
    except Exception as e:
        logger.warning("mark_sent_failed", relance_id=relance_id, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
