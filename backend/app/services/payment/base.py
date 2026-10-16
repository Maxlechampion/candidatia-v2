"""Interface abstraite de tout provider de paiement."""
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.core.errors import PaymentError
from app.services.payment.schemas import (
    PaymentIntent,
    PaymentResult,
    WebhookPayload,
)


class PaymentProvider(ABC):
    """Classe abstraite pour un provider de paiement."""

    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Retourne True si le provider est configure (cles API presentes)."""
        ...

    @abstractmethod
    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:
        """Cree une session de paiement et retourne l URL de checkout."""
        ...

    @abstractmethod
    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:
        """Verifie la signature d un webhook et retourne le payload normalise."""
        ...

    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Recupere le statut reel d une transaction aupres du provider.
        Utilise par l endpoint /verify apres retour utilisateur.
        Par defaut, leve NotImplementedError (a surcharger).
        """
        raise NotImplementedError(
            f"{self.name} ne supporte pas la verification de statut."
        )

    def safe_checkout(self, intent: PaymentIntent) -> PaymentResult:
        """Point d entree public pour create_checkout avec gestion d erreurs."""
        if not self.is_available():
            raise PaymentError(
                message=f"Provider {self.name} non configure.",
                details={"provider": self.name},
            )
        try:
            return self.create_checkout(intent)
        except PaymentError:
            raise
        except Exception as e:
            raise PaymentError(
                message=f"Erreur {self.name}: {str(e)}",
                details={"provider": self.name, "error": str(e)},
            ) from e
