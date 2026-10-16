"""CRUD utilisateurs + gestion des credits."""
from uuid import uuid4
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.database import insert_row, select_one, update_row
from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.logging import get_logger
from app.services.auth.password import hash_password

logger = get_logger("auth.user")


def create_user(email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
    """Cree un nouvel utilisateur."""
    email = email.lower().strip()

    # Verifier si l email existe deja
    existing = select_one("profiles", {"email": email})
    if existing:
        raise ValidationError(message="Un compte existe deja avec cet email.")

    # Hacher le mot de passe
    password_hash = hash_password(password)

    # Inserer dans la DB
    user_data = {
        "id": str(uuid4()),
        "email": email,
        "full_name": full_name,
        "password_hash": password_hash,
        "credits": 1,
        "plan": "free",
        "is_free_tier": True,
        "email_verified": False,
        "preferred_locale": "fr",
    }

    try:
        user = insert_row("profiles", user_data)
        logger.info("user_created", email=email, user_id=user.get("id"))
        return user
    except Exception as e:
        logger.exception("user_creation_failed", email=email, error=str(e))
        raise ValidationError(message=f"Erreur creation utilisateur : {str(e)}")


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Recupere un utilisateur par email."""
    return select_one("profiles", {"email": email.lower().strip()})


def get_user_by_id(user_id: str) -> Dict[str, Any]:
    """Recupere un utilisateur par ID. Leve NotFoundError si absent."""
    user = select_one("profiles", {"id": user_id})
    if not user:
        raise NotFoundError(message=f"Utilisateur {user_id} introuvable.")
    return user


def update_user(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Met a jour un utilisateur."""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    user = update_row("profiles", {"id": user_id}, updates)
    if not user:
        raise NotFoundError(message=f"Utilisateur {user_id} introuvable.")
    return user


def add_credits(user_id: str, amount: int) -> Dict[str, Any]:
    """Ajoute des credits a un utilisateur."""
    if amount <= 0:
        raise ValidationError(message="Le montant de credits doit etre positif.")

    user = get_user_by_id(user_id)
    new_credits = user.get("credits", 0) + amount

    return update_user(user_id, {"credits": new_credits})


def consume_credit(user_id: str) -> Dict[str, Any]:
    """Decremente le quota d un utilisateur. Leve ForbiddenError si insuffisant."""
    user = get_user_by_id(user_id)
    credits = user.get("credits", 0)

    if credits <= 0:
        raise ForbiddenError(
            message="Quota epuise. Veuillez acheter des credits pour continuer.",
            details={"credits_remaining": 0},
        )

    return update_user(user_id, {"credits": credits - 1})


def mark_paid_tier(user_id: str) -> Dict[str, Any]:
    """Marque un utilisateur comme payant (retire le filigrane)."""
    return update_user(user_id, {"is_free_tier": False})
