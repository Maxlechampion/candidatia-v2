"""Provider IA : Cohere (Command R — quota gratuit mensuel)."""

import cohere

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.ai.base import AIProvider
from app.services.ai.schemas import AIRequest, AIResponse

logger = get_logger("ai.cohere")


class CohereProvider(AIProvider):
    name = "cohere"
    model = "command-r-08-2024"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def is_available(self) -> bool:
        return bool(self.settings.cohere_api_key)

    def _get_client(self):
        if self._client is None:
            self._client = cohere.Client(api_key=self.settings.cohere_api_key)
        return self._client

    def _call_api(self, request: AIRequest) -> AIResponse:
        client = self._get_client()

        response = client.chat(
            model=self.model,
            message=request.user_prompt,
            preamble=request.system_prompt,
            temperature=request.temperature,
        )

        content = response.text or ""
        meta = getattr(response, "meta", None)
        tokens = getattr(meta, "tokens", None) if meta else None

        return AIResponse(
            content=content,
            provider=self.name,
            model=self.model,
            tokens_input=getattr(tokens, "input_tokens", None) if tokens else None,
            tokens_output=getattr(tokens, "output_tokens", None) if tokens else None,
        )
