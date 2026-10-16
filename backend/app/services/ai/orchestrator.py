"""
Orchestrateur IA multi-provider.

Fonctionnement :
1. Recoit une requete normalisee.
2. Verifie le cache.
3. Essaie les providers dans l ordre de priorite (configurable).
4. Si un provider echoue, passe au suivant automatiquement.
5. Applique un circuit breaker : apres N echecs, met le provider en pause.
6. Ecrit la reponse en cache avant de la retourner.
"""

import time
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.errors import AIProviderError
from app.core.logging import get_logger
from app.services.ai.base import AIProvider
from app.services.ai.cache import get_cache
from app.services.ai.cohere import CohereProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.groq import GroqProvider
from app.services.ai.json_repair import parse_json_safely
from app.services.ai.mistral import MistralProvider
from app.services.ai.schemas import AIRequest, AIResponse

logger = get_logger("ai.orchestrator")


class CircuitBreaker:
    """Circuit breaker par provider."""

    def __init__(self, threshold: int, cooldown_seconds: int) -> None:
        self.threshold = threshold
        self.cooldown_seconds = cooldown_seconds
        self._failures: Dict[str, int] = {}
        self._open_until: Dict[str, float] = {}

    def is_open(self, provider_name: str) -> bool:
        """Retourne True si le provider est en pause."""
        until = self._open_until.get(provider_name, 0)
        if until and time.time() < until:
            return True
        if until and time.time() >= until:
            self._open_until.pop(provider_name, None)
            self._failures.pop(provider_name, None)
        return False

    def record_success(self, provider_name: str) -> None:
        self._failures[provider_name] = 0

    def record_failure(self, provider_name: str) -> None:
        self._failures[provider_name] = self._failures.get(provider_name, 0) + 1
        if self._failures[provider_name] >= self.threshold:
            self._open_until[provider_name] = time.time() + self.cooldown_seconds
            logger.warning(
                "circuit_breaker_open",
                provider=provider_name,
                cooldown=self.cooldown_seconds,
            )


class AIOrchestrator:
    """Orchestrateur principal."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.cache = get_cache()
        self.breaker = CircuitBreaker(
            threshold=self.settings.ai_circuit_breaker_threshold,
            cooldown_seconds=self.settings.ai_circuit_breaker_cooldown,
        )
        self._providers: Dict[str, AIProvider] = {
            "groq": GroqProvider(),
            "gemini": GeminiProvider(),
            "mistral": MistralProvider(),
            "cohere": CohereProvider(),
        }

    def _ordered_providers(self) -> List[AIProvider]:
        """Retourne les providers dans l ordre configure, disponibles et non en pause."""
        ordered: List[AIProvider] = []
        for name in self.settings.ai_providers_list:
            provider = self._providers.get(name)
            if not provider:
                continue
            if not provider.is_available():
                logger.debug("provider_unavailable", provider=name)
                continue
            if self.breaker.is_open(name):
                logger.info("provider_skipped_breaker", provider=name)
                continue
            ordered.append(provider)
        return ordered

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        use_cache: bool = True,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Genere une reponse JSON en essayant les providers en cascade."""
        # 1. Cache
        cache_key = self.cache.make_key(system_prompt, user_prompt)
        if use_cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached

        # 2. Providers
        request = AIRequest(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format_json=True,
        )

        providers = self._ordered_providers()
        if not providers:
            raise AIProviderError(
                message="Aucun provider IA disponible (verifiez les cles API).",
                details={"providers_tried": self.settings.ai_providers_list},
            )

        last_error: Optional[Exception] = None
        for provider in providers:
            try:
                logger.info("provider_attempt", provider=provider.name)
                response: AIResponse = provider.generate(request)
                parsed = parse_json_safely(response.content)

                self.breaker.record_success(provider.name)
                logger.info(
                    "provider_success",
                    provider=provider.name,
                    latency_ms=response.latency_ms,
                )

                if use_cache:
                    self.cache.set(cache_key, parsed)

                return parsed

            except Exception as e:
                last_error = e
                self.breaker.record_failure(provider.name)
                logger.warning(
                    "provider_failed",
                    provider=provider.name,
                    error=str(e),
                )
                continue

        raise AIProviderError(
            message="Tous les providers IA ont echoue.",
            details={"last_error": str(last_error) if last_error else "unknown"},
        )

    def available_providers(self) -> List[str]:
        """Liste les noms des providers disponibles et non en pause."""
        return [p.name for p in self._ordered_providers()]


# Singleton
_orchestrator: Optional[AIOrchestrator] = None


def get_orchestrator() -> AIOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AIOrchestrator()
    return _orchestrator
