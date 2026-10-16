"""Tests des dependencies de securite."""

from app.core.security import _extract_bearer_token


def test_extract_bearer_valid() -> None:
    assert _extract_bearer_token("Bearer abc123") == "abc123"


def test_extract_bearer_case_insensitive() -> None:
    assert _extract_bearer_token("bearer xyz") == "xyz"
    assert _extract_bearer_token("BEARER xyz") == "xyz"


def test_extract_bearer_missing() -> None:
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("") is None


def test_extract_bearer_invalid_format() -> None:
    assert _extract_bearer_token("abc123") is None
    assert _extract_bearer_token("Basic xyz") is None
    assert _extract_bearer_token("Bearer abc extra") is None
