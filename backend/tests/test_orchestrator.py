"""Tests de l orchestrateur IA (avec providers mockes)."""

from unittest.mock import patch

import pytest

from app.core.errors import AIProviderError
from app.services.ai.schemas import AIResponse


@pytest.fixture
def orchestrator():
    with patch("app.services.ai.groq.GroqProvider.is_available", return_value=True), \
         patch("app.services.ai.gemini.GeminiProvider.is_available", return_value=False), \
         patch("app.services.ai.mistral.MistralProvider.is_available", return_value=False), \
         patch("app.services.ai.cohere.CohereProvider.is_available", return_value=False):
        from app.services.ai.orchestrator import AIOrchestrator
        return AIOrchestrator()


def test_orchestrator_returns_parsed_json(orchestrator) -> None:
    fake_response = AIResponse(
        content='{"result": "ok"}',
        provider="groq",
        model="llama-3.3-70b",
        latency_ms=100,
    )
    with patch.object(
        orchestrator._providers["groq"], "generate", return_value=fake_response
    ):
        result = orchestrator.generate_json("sys", "user", use_cache=False)
        assert result == {"result": "ok"}


def test_orchestrator_falls_back_on_failure(orchestrator) -> None:
    with patch("app.services.ai.gemini.GeminiProvider.is_available", return_value=True):
        orchestrator._providers["gemini"].is_available = lambda: True

        def groq_fail(_req):
            raise AIProviderError("groq down")

        fake_response = AIResponse(
            content='{"result": "from gemini"}',
            provider="gemini",
            model="gemini-1.5-flash",
            latency_ms=200,
        )

        with patch.object(
            orchestrator._providers["groq"], "generate", side_effect=groq_fail
        ), patch.object(
            orchestrator._providers["gemini"], "generate", return_value=fake_response
        ):
            result = orchestrator.generate_json("sys", "user", use_cache=False)
            assert result == {"result": "from gemini"}


def test_orchestrator_raises_if_all_fail(orchestrator) -> None:
    def always_fail(_req):
        raise AIProviderError("fail")

    with patch.object(
        orchestrator._providers["groq"], "generate", side_effect=always_fail
    ):
        with pytest.raises(AIProviderError):
            orchestrator.generate_json("sys", "user", use_cache=False)
