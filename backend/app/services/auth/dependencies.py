"""
Dependencies FastAPI pour l'authentification.
Fournit get_current_user() pour les endpoints proteges.
"""
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import UnauthorizedError
from app.core.logging import get_logger
from app.services.auth.jwt_service import decode_access_token, extract_user_id
from app.services.auth.user_service import get_user_by_id

logger = get_logger("auth.dependencies")

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """
    Extrait et valide le token JWT de l'en-tete Authorization.
    Retourne les donnees utilisateur completes (id, email, credits, plan, etc.).
    Leve HTTPException 401 si le token est invalide ou expire.
    """
    token = credentials.credentials

    try:
        # 1. Extraire l'ID utilisateur du token
        user_id = extract_user_id(token)

        # 2. Recuperer l'utilisateur complet depuis la DB
        user = get_user_by_id(user_id)

        logger.debug(
            "user_authenticated",
            user_id=user.get("id"),
            email=user.get("email"),
        )

        return user

    except UnauthorizedError as e:
        logger.warning("authentication_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.exception("authentication_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification echouee.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[Dict[str, Any]]:
    """
    Version optionnelle de get_current_user.
    Retourne None si pas de token (pour les endpoints publics).
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None