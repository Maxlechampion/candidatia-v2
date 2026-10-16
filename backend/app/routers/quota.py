"""Router /api/quota — Informations sur les plans et quotas."""

from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.services.auth.quota_service import PLAN_QUOTAS, get_quota_info

router = APIRouter(prefix="/api/quota", tags=["quota"])


@router.get("/plans", summary="Liste des plans disponibles (public)")
async def list_plans() -> Dict[str, Any]:
    """Retourne la liste des plans avec leurs tarifs."""
    return {
        "plans": [
            {
                "code": code,
                "name": info["name"],
                "monthly_credits": info.get("monthly_credits", 0),
                "total_credits": info.get("total_credits", 0),
                "price_eur": info.get("price_eur", 0),
            }
            for code, info in PLAN_QUOTAS.items()
        ]
    }


@router.get("/me", summary="Mon quota actuel")
async def my_quota(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Retourne le quota de l utilisateur connecte."""
    return get_quota_info(user["id"])
