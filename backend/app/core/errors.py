"""Exceptions typees de l application."""

from typing import Any, Dict, Optional


class AppError(Exception):
    """Exception de base de l application."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "Une erreur interne est survenue."

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.message = message or self.message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }


# ---------- 4xx ----------
class ValidationError(AppError):
    status_code = 400
    error_code = "VALIDATION_ERROR"
    message = "Les donnees fournies sont invalides."


class UnauthorizedError(AppError):
    status_code = 401
    error_code = "UNAUTHORIZED"
    message = "Authentification requise."


class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"
    message = "Acces refuse."


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"
    message = "Ressource introuvable."


class QuotaExceededError(AppError):
    status_code = 402
    error_code = "QUOTA_EXCEEDED"
    message = "Quota de generations depasse. Veuillez passer a un plan superieur."


class RateLimitError(AppError):
    status_code = 429
    error_code = "RATE_LIMIT"
    message = "Trop de requetes. Veuillez reessayer dans quelques instants."


# ---------- 5xx ----------
class IngestionError(AppError):
    status_code = 422
    error_code = "INGESTION_ERROR"
    message = "Impossible d extraire le contenu du fichier fourni."


class AIProviderError(AppError):
    status_code = 502
    error_code = "AI_PROVIDER_ERROR"
    message = "Le service IA est temporairement indisponible."


class GenerationError(AppError):
    status_code = 500
    error_code = "GENERATION_ERROR"
    message = "Erreur lors de la generation du document."


class PaymentError(AppError):
    status_code = 502
    error_code = "PAYMENT_ERROR"
    message = "Erreur lors du traitement du paiement."


class StorageError(AppError):
    status_code = 500
    error_code = "STORAGE_ERROR"
    message = "Erreur de stockage du document."
