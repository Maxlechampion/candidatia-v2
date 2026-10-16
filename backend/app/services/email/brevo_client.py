"""Client HTTP pour l API Brevo (ex-Sendinblue)."""

from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.logging import get_logger

logger = get_logger("email.brevo")


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailError(AppError):
    status_code = 502
    error_code = "EMAIL_ERROR"
    message = "Erreur lors de l envoi de l email."


class BrevoClient:
    """Client HTTP pour Brevo."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def is_available(self) -> bool:
        """Verifie si Brevo est configure."""
        return bool(self.settings.brevo_api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "api-key": self.settings.brevo_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def send(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Envoie un email via Brevo."""
        if not self.is_available():
            logger.warning("brevo_not_configured")
            raise EmailError(
                message="Brevo n est pas configure (BREVO_API_KEY manquant).",
                details={"to": to_email},
            )

        payload: Dict[str, Any] = {
            "sender": {
                "email": self.settings.brevo_sender_email,
                "name": self.settings.brevo_sender_name,
            },
            "to": [{"email": to_email, "name": to_name}],
            "subject": subject,
            "htmlContent": html_content,
        }

        if text_content:
            payload["textContent"] = text_content

        if tags:
            payload["tags"] = tags

        logger.info(
            "brevo_send_attempt",
            to=to_email,
            subject=subject[:60],
        )

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(
                    BREVO_API_URL,
                    headers=self._headers(),
                    json=payload,
                )

                if response.status_code not in (200, 201, 202):
                    logger.error(
                        "brevo_send_failed",
                        status=response.status_code,
                        body=response.text[:500],
                    )
                    raise EmailError(
                        message=f"Brevo a refuse l envoi ({response.status_code}).",
                        details={
                            "status": response.status_code,
                            "body": response.text[:200],
                        },
                    )

                result = response.json() if response.text else {}
                logger.info("brevo_send_success", to=to_email, message_id=result.get("messageId"))
                return result

        except httpx.HTTPError as e:
            logger.exception("brevo_http_error", error=str(e))
            raise EmailError(
                message=f"Erreur reseau Brevo : {str(e)}",
                details={"error": str(e)},
            ) from e


# Singleton
_brevo_client: Optional[BrevoClient] = None


def get_brevo_client() -> BrevoClient:
    global _brevo_client
    if _brevo_client is None:
        _brevo_client = BrevoClient()
    return _brevo_client
