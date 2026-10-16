"""Router /api/generations — Historique des packs generes."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.database import select_rows
from app.core.logging import get_logger
from app.core.security import get_current_user

logger = get_logger("router.generations")
router = APIRouter(prefix="/api/generations", tags=["generations"])


@router.get("", summary="Liste des generations de l utilisateur")
async def list_my_generations(
    user: Dict[str, Any] = Depends(get_current_user),
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Retourne l historique des packs generes par l utilisateur."""
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit doit etre entre 1 et 100.")

    try:
        rows = select_rows(
            "generations",
            filters={"user_id": user["id"]},
            limit=limit,
            order_by="created_at",
            descending=True,
        )

        # On ne retourne que les champs utiles au frontend
        result = []
        for row in rows:
            result.append({
                "id": row.get("id"),
                "output_language": row.get("output_language", "fr"),
                "score_matching": row.get("score_matching"),
                "status": row.get("status", "completed"),
                "created_at": row.get("created_at"),
                "zip_path": row.get("zip_path"),
                "has_documents": bool(
                    row.get("cv_path") or row.get("lettre_path") or row.get("guide_path")
                ),
            })

        return result
    except Exception as e:
        logger.exception("list_generations_failed", user_id=user["id"], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lecture historique.")


@router.get("/stats", summary="Statistiques de l utilisateur")
async def my_stats(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Retourne les statistiques de l utilisateur."""
    try:
        rows = select_rows("generations", filters={"user_id": user["id"]})

        # On ne compte que les generations terminees
        valid = [r for r in rows if r.get("status") == "completed"]

        total = len(valid)
        scores = [r.get("score_matching") for r in valid if r.get("score_matching")]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        return {
            "total_generations": total,
            "average_score": avg_score,
            "credits_remaining": user.get("credits", 0),
            "plan": user.get("plan", "free"),
        }
    except Exception as e:
        logger.exception("stats_failed", user_id=user["id"], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur calcul statistiques.")
