"""Provider IA : Google Gemini (Flash — gratuit)."""

import google.generativeai as genai

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.ai.base import AIProvider
from app.services.ai.schemas import AIRequest, AIResponse

logger = get_logger("ai.gemini")


class GeminiProvider(AIProvider):
    name = "gemini"
    model = "gemini-1.5-flash"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._configured = False

    def is_available(self) -> bool:
        return bool(self.settings.gemini_api_key)

    def _configure(self) -> None:
        if not self._configured:
            genai.configure(api_key=self.settings.gemini_api_key)
            self._configured = True

    def _call_api(self, request: AIRequest) -> AIResponse:
        self._configure()

        generation_config = {
            "temperature": request.temperature,
        }
        if request.response_format_json:
            generation_config["response_mime_type"] = "application/json"
        if request.max_tokens:
            generation_config["max_output_tokens"] = request.max_tokens

        model = genai.GenerativeModel(
            model_name=self.model,
            system_instruction=request.system_prompt,
            generation_config=generation_config,
        )

        response = model.generate_content(request.user_prompt)
        content = response.text or ""

        usage = getattr(response, "usage_metadata", None)
        return AIResponse(
            content=content,
            provider=self.name,
            model=self.model,
            tokens_input=getattr(usage, "prompt_token_count", None) if usage else None,
            tokens_output=getattr(usage, "candidates_token_count", None) if usage else None,
        )
