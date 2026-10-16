"""
Service de relance : generation du brouillon + CRUD DB.

Le brouillon est genere via l orchestrateur IA (provider gratuit).
La relance est ensuite programmee en DB pour un envoi de rappel.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.core.database import insert_row, select_one, select_rows, update_row
from app.core.errors import NotFoundError, ValidationError
from app.core.logging import get_logger
from app.services.ai.orchestrator import get_orchestrator
from app.services.ai.prompts import get_relance_prompt
from app.services.auth.user_service import get_user_by_id
from app.services.language.locale_map import get_locale_conventions
from app.services.relance.schemas import RelanceSchedule, RelanceStatus

logger = get_logger("relance.service")


def _generer_brouillon_ia(
    nom_candidat: str,
    poste: str,
    entreprise: str,
    wait_days: int,
    language: str,
) -> Dict[str, str]:
    """Genere le brouillon de relance via l orchestrateur IA."""
    locale = get_locale_conventions(language)
    orchestrator = get_orchestrator()

    system_prompt, user_prompt = get_relance_prompt(
        nom_candidat=nom_candidat,
        poste=poste,
        entreprise=entreprise,
        wait_days=wait_days,
        locale=locale,
        output_language=language,
    )

    result = orchestrator.generate_json(system_prompt, user_prompt)
    return {
        "subject": result.get("subject", f"Relance concernant ma candidature au poste de {poste}"),
        "body": result.get("body", ""),
        "signature": result.get("signature", nom_candidat),
    }


def schedule_relance(payload: RelanceSchedule) -> Dict[str, Any]:
    """
    Programme une relance pour un utilisateur.

    1. Verifie que l utilisateur existe
    2. Genere le brouillon via IA
    3. Enregistre en DB
    """
    # 1. Verifier l utilisateur
    user = get_user_by_id(payload.user_id)
    nom_candidat = user.get("full_name") or user.get("email", "Candidat")

    # 2. Calculer la date programmee
    scheduled_date = date.today() + timedelta(days=payload.wait_days)

    # 3. Generer le brouillon via IA
    logger.info(
        "relance_generating_draft",
        user_id=payload.user_id,
        company=payload.company_name,
        job=payload.job_title,
        wait_days=payload.wait_days,
    )

    try:
        draft = _generer_brouillon_ia(
            nom_candidat=nom_candidat,
            poste=payload.job_title,
            entreprise=payload.company_name,
            wait_days=payload.wait_days,
            language=payload.language,
        )
    except Exception as e:
        logger.exception("relance_ia_generation_failed", error=str(e))
        raise ValidationError(
            message=f"Erreur generation du brouillon : {str(e)}",
            details={"step": "ia_generation"},
        )

    # 4. Fusionner subject + body pour le stockage
    email_draft = f"Objet : {draft['subject']}\n\n{draft['body']}\n\n{draft['signature']}"

    # 5. Enregistrer en DB
    relance_data = {
        "user_id": payload.user_id,
        "generation_id": payload.generation_id,
        "company_name": payload.company_name,
        "job_title": payload.job_title,
        "wait_days": payload.wait_days,
        "scheduled_date": scheduled_date.isoformat(),
        "email_draft": email_draft,
        "language": payload.language,
        "status": RelanceStatus.PENDING.value,
    }

    relance = insert_row("relances", relance_data)

    logger.info(
        "relance_scheduled",
        relance_id=relance.get("id"),
        user_id=payload.user_id,
        scheduled_date=scheduled_date.isoformat(),
    )

    return relance


def get_user_relances(
    user_id: str,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Retourne les relances d un utilisateur."""
    filters: Dict[str, Any] = {"user_id": user_id}
    if status:
        filters["status"] = status

    return select_rows(
        "relances",
        filters=filters,
        limit=limit,
        order_by="scheduled_date",
        descending=False,
    )


def cancel_relance(relance_id: str, user_id: str) -> Dict[str, Any]:
    """Annule une relance (verifie qu elle appartient bien a l utilisateur)."""
    relance = select_one("relances", {"id": relance_id})

    if not relance:
        raise NotFoundError(message=f"Relance {relance_id} introuvable.")

    if relance.get("user_id") != user_id:
        raise NotFoundError(message="Relance introuvable.")

    if relance.get("status") == RelanceStatus.SENT.value:
        raise ValidationError(message="Impossible d annuler une relance deja envoyee.")

    updated = update_row(
        "relances",
        {"id": relance_id},
        {"status": RelanceStatus.CANCELLED.value},
    )

    logger.info("relance_cancelled", relance_id=relance_id, user_id=user_id)
    return updated or relance


def mark_as_sent(relance_id: str, user_id: str) -> Dict[str, Any]:
    """Marque une relance comme envoyee par l utilisateur."""
    relance = select_one("relances", {"id": relance_id})

    if not relance:
        raise NotFoundError(message=f"Relance {relance_id} introuvable.")

    if relance.get("user_id") != user_id:
        raise NotFoundError(message="Relance introuvable.")

    updated = update_row(
        "relances",
        {"id": relance_id},
        {"status": RelanceStatus.SENT.value},
    )

    logger.info("relance_marked_sent", relance_id=relance_id)
    return updated or relance


def get_pending_relances_for_today() -> List[Dict[str, Any]]:
    """
    Retourne les relances qui doivent declencher un rappel aujourd hui.

    Utilise par le scheduler (cron quotidien).
    """
    today = date.today().isoformat()

    rows = select_rows(
        "relances",
        filters={
            "status": RelanceStatus.PENDING.value,
            "scheduled_date": today,
        },
        limit=1000,
    )

    logger.info("relances_due_today", count=len(rows), date=today)
    return rows


def mark_reminded(relance_id: str) -> Dict[str, Any]:
    """Marque une relance comme ayant recu son rappel."""
    now = datetime.now(timezone.utc).isoformat()

    updated = update_row(
        "relances",
        {"id": relance_id},
        {
            "status": RelanceStatus.REMINDED.value,
            "reminded_at": now,
        },
    )

    logger.info("relance_reminded", relance_id=relance_id)
    return updated or {}
