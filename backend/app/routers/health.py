"""Router de sante — utilise par Render.com et le monitoring."""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.services.ai.orchestrator import get_orchestrator

router = APIRouter(tags=["health"])


@router.get("/health", summary="Verification de sante")
async def health() -> dict:
    """Retourne l etat de sante de l API + providers IA disponibles."""
    settings = get_settings()
    try:
        providers = get_orchestrator().available_providers()
    except Exception:
        providers = []

    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": "0.1.0",
        "ai_providers_available": providers,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "message": "CandidatIA API",
        "docs": "/docs",
        "health": "/health",
    }
