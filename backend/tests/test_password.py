"""Tests du service de hachage des mots de passe."""

import pytest

from app.core.errors import ValidationError
from app.services.auth.password import hash_password, verify_password


def test_hash_password_returns_string() -> None:
    h = hash_password("motdepasse123")
    assert isinstance(h, str)
    assert len(h) > 50


def test_hash_password_too_short_raises() -> None:
    with pytest.raises(ValidationError):
        hash_password("abc")


def test_verify_password_correct() -> None:
    h = hash_password("motdepasse123")
    assert verify_password("motdepasse123", h) is True


def test_verify_password_incorrect() -> None:
    h = hash_password("motdepasse123")
    assert verify_password("mauvais", h) is False


def test_verify_password_empty_returns_false() -> None:
    h = hash_password("motdepasse123")
    assert verify_password("", h) is False


def test_two_hashes_different_salts() -> None:
    h1 = hash_password("motdepasse123")
    h2 = hash_password("motdepasse123")
    assert h1 != h2
    assert verify_password("motdepasse123", h1) is True
    assert verify_password("motdepasse123", h2) is True
