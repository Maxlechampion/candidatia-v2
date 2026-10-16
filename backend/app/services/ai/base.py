"""
Interface abstraite de tout provider IA.

Chaque provider (Groq, Gemini, Mistral, Cohere) doit implementer cette interface.
Cela garantit que l orchestrateur peut basculer d un provider a l autre sans
connaitre les details d implementation.
"""

import time
from abc import ABC, abstractmethod

from app.core.errors import AIProviderError
from app.services.ai.schemas import AIRequest, AIResponse


class AIProvider(ABC):
    """Classe abstraite pour un provider IA."""

    name: str = "base"
    model: str = ""

    @abstractmethod
    def is_available(self) -> bool:
        """Retourne True si le provider est configure (cle API presente)."""
        ...

    @abstractmethod
    def _call_api(self, request: AIRequest) -> AIResponse:
        """Appel bas niveau a l API du provider."""
        ...

    def generate(self, request: AIRequest) -> AIResponse:
        """Point d entree public. Gere le timing et les erreurs."""
        if not self.is_available():
            raise AIProviderError(
                message=f"Provider {self.name} non configure (cle API manquante).",
                details={"provider": self.name},
            )

        start = time.perf_counter()
        try:
            response = self._call_api(request)
            response.latency_ms = int((time.perf_counter() - start) * 1000)
            return response
        except AIProviderError:
            raise
        except Exception as e:
            raise AIProviderError(
                message=f"Erreur provider {self.name}: {str(e)}",
                details={"provider": self.name, "error": str(e)},
            ) from e
