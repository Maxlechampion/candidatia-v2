"""Creation et verification des tokens JWT."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.core.logging import get_logger

logger = get_logger("auth.jwt")


def create_access_token(
    user_id: str,
    email: str,
    expires_minutes: Optional[int] = None,
) -> str:
    """Cree un JWT signe pour un utilisateur."""
    settings = get_settings()
    expire_minutes = expires_minutes or settings.jwt_expiration_minutes

    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
    }

    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode et verifie un JWT. Leve UnauthorizedError si invalide."""
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        logger.warning("jwt_decode_failed", error=str(e))
        raise UnauthorizedError(message="Token invalide ou expire.") from e


def extract_user_id(token: str) -> str:
    """Extrait l ID utilisateur d un JWT."""
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(message="Token ne contient pas d ID utilisateur.")
    return user_id
