"""Router /api/auth — Inscription, connexion, profil utilisateur."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.logging import get_logger
from app.core.security import get_current_user
from app.services.auth.jwt_service import create_access_token
from app.services.auth.password import verify_password
from app.services.auth.quota_service import get_quota_info
from app.services.auth.user_service import create_user, get_user_by_email

logger = get_logger("router.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    """Payload d inscription."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    preferred_locale: str = "fr"


class LoginRequest(BaseModel):
    """Payload de connexion."""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Reponse d authentification."""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    """Retire les champs sensibles avant de retourner un user au client."""
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "credits": user.get("credits", 0),
        "plan": user.get("plan", "free"),
        "email_verified": user.get("email_verified", False),
        "preferred_locale": user.get("preferred_locale", "fr"),
        "created_at": user.get("created_at"),
    }


@router.post("/register", response_model=AuthResponse, summary="Inscription")
async def register(payload: RegisterRequest) -> AuthResponse:
    """Cree un compte utilisateur et retourne un JWT."""
    logger.info("register_attempt", email=payload.email)

    try:
        user = create_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
    except Exception as e:
        logger.warning("register_failed", email=payload.email, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token(user_id=user["id"], email=user["email"])

    logger.info("register_success", email=payload.email, user_id=user["id"])

    return AuthResponse(
        access_token=token,
        user=_public_user(user),
    )


@router.post("/login", response_model=AuthResponse, summary="Connexion")
async def login(payload: LoginRequest) -> AuthResponse:
    """Authentifie un utilisateur et retourne un JWT."""
    logger.info("login_attempt", email=payload.email)

    user = get_user_by_email(payload.email)
    if not user:
        logger.warning("login_failed_user_not_found", email=payload.email)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    password_hash = user.get("password_hash", "")
    if not password_hash or not verify_password(payload.password, password_hash):
        logger.warning("login_failed_bad_password", email=payload.email)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    token = create_access_token(user_id=user["id"], email=user["email"])

    logger.info("login_success", email=payload.email, user_id=user["id"])

    return AuthResponse(
        access_token=token,
        user=_public_user(user),
    )


@router.get("/me", summary="Profil de l utilisateur courant")
async def me(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Retourne le profil de l utilisateur authentifie."""
    return _public_user(user)


@router.get("/me/quota", summary="Quota de l utilisateur courant")
async def my_quota(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Retourne les informations de quota de l utilisateur."""
    return get_quota_info(user["id"])
