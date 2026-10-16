"""Hachage et verification des mots de passe (bcrypt)."""

import bcrypt

from app.core.errors import ValidationError


def hash_password(password: str) -> str:
    """Hache un mot de passe en bcrypt."""
    if not password or len(password) < 8:
        raise ValidationError(message="Le mot de passe doit faire au moins 8 caracteres.")

    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verifie qu un mot de passe correspond a son hash."""
    if not password or not hashed:
        return False

    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False
