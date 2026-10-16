"""Tests du service JWT."""

import pytest

from app.core.errors import UnauthorizedError
from app.services.auth.jwt_service import (
    create_access_token,
    decode_access_token,
    extract_user_id,
)


def test_create_access_token() -> None:
    token = create_access_token("user-123", "test@example.com")
    assert isinstance(token, str)
    assert len(token) > 50


def test_decode_access_token() -> None:
    token = create_access_token("user-123", "test@example.com")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["email"] == "test@example.com"
    assert "exp" in payload
    assert "iat" in payload


def test_extract_user_id() -> None:
    token = create_access_token("user-xyz", "a@b.com")
    assert extract_user_id(token) == "user-xyz"


def test_decode_invalid_token_raises() -> None:
    with pytest.raises(UnauthorizedError):
        decode_access_token("invalid.token.here")


def test_decode_expired_token_raises() -> None:
    token = create_access_token("user-123", "a@b.com", expires_minutes=-1)
    with pytest.raises(UnauthorizedError):
        decode_access_token(token)
