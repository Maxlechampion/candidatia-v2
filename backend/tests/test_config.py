"""Tests de la configuration."""

import pytest

from app.core.config import Settings


def test_settings_loads_with_minimal_env() -> None:
    settings = Settings(secret_key="a" * 32)  # type: ignore[call-arg]
    assert settings.app_name == "CandidatIA"
    assert settings.is_development is True
    assert settings.is_production is False


def test_ai_providers_list_parsing() -> None:
    settings = Settings(
        secret_key="a" * 32,
        ai_provider_order="groq, gemini , mistral",
    )  # type: ignore[call-arg]
    assert settings.ai_providers_list == ["groq", "gemini", "mistral"]


def test_secret_key_too_short_raises() -> None:
    with pytest.raises(Exception):
        Settings(secret_key="short")  # type: ignore[call-arg]
