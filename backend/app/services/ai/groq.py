"""Provider IA : Groq (Llama 3.3 70B — gratuit, ultra-rapide)."""

from groq import Groq

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.ai.base import AIProvider
from app.services.ai.schemas import AIRequest, AIResponse

logger = get_logger("ai.groq")


class GroqProvider(AIProvider):
    name = "groq"
    model = "openai/gpt-oss-120b"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    def is_available(self) -> bool:
        return bool(self.settings.groq_api_key)

    def _get_client(self) -> Groq:
        if self._client is None:
            self._client = Groq(api_key=self.settings.groq_api_key)
        return self._client

    def _call_api(self, request: AIRequest) -> AIResponse:
        client = self._get_client()

        kwargs = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            "temperature": request.temperature,
        }

        if request.response_format_json:
            kwargs["response_format"] = {"type": "json_object"}

        if request.max_tokens:
            kwargs["max_tokens"] = request.max_tokens

        completion = client.chat.completions.create(**kwargs)
        content = completion.choices[0].message.content or ""

        usage = getattr(completion, "usage", None)
        return AIResponse(
            content=content,
            provider=self.name,
            model=self.model,
            tokens_input=getattr(usage, "prompt_tokens", None) if usage else None,
            tokens_output=getattr(usage, "completion_tokens", None) if usage else None,
        )
