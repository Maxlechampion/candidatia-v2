"""
Dependencies FastAPI pour l authentification.

Fournit :
  - get_current_user : extrait et valide le JWT depuis l en-tete Authorization
  - get_current_user_optional : idem mais retourne None si pas de token
"""

from typing import Any, Dict, Optional

from fastapi import Depends, Header

from app.core.errors import UnauthorizedError
from app.core.logging import get_logger
from app.services.auth.jwt_service import decode_access_token
from app.services.auth.user_service import get_user_by_id

logger = get_logger("core.security")


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Extrait le token Bearer de l en-tete Authorization."""
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Dependency : recupere l utilisateur courant depuis le JWT.

    Usage :
        @router.get("/protected")
        async def route(user = Depends(get_current_user)):
            return {"user_id": user["id"]}
    """
    token = _extract_bearer_token(authorization)
    if not token:
        raise UnauthorizedError(message="Token d authentification manquant.")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(message="Token invalide (pas d ID utilisateur).")

    try:
        user = get_user_by_id(user_id)
    except Exception as e:
        logger.warning("user_lookup_failed", user_id=user_id, error=str(e))
        raise UnauthorizedError(message="Utilisateur introuvable.")

    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """Dependency : idem mais retourne None si pas de token valide."""
    token = _extract_bearer_token(authorization)
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return get_user_by_id(user_id)
    except Exception:
        return None
