"""Provider de paiement : Flutterwave (cartes internationales)."""

import hashlib
import hmac
import json
from typing import Any, Dict

import httpx

from app.core.config import get_settings
from app.core.errors import PaymentError
from app.core.logging import get_logger
from app.services.payment.base import PaymentProvider
from app.services.payment.schemas import (
    PaymentIntent,
    PaymentProviderName,
    PaymentResult,
    PaymentStatus,
    WebhookPayload,
)

logger = get_logger("payment.flutterwave")


FLUTTERWAVE_API_URL = "https://api.flutterwave.com/v3"


class FlutterwaveProvider(PaymentProvider):
    name = "flutterwave"

    def __init__(self) -> None:
        self.settings = get_settings()

    def is_available(self) -> bool:
        return bool(self.settings.flutterwave_secret_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.flutterwave_secret_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:
        """Cree un paiement Flutterwave et retourne l URL de checkout."""
        url = f"{FLUTTERWAVE_API_URL}/payments"

        # Flutterwave exige un tx_ref unique
        import uuid
        tx_ref = f"candidatia-{intent.user_id[:8]}-{uuid.uuid4().hex[:12]}"

        # Flutterwave attend un montant en devise (XOF supporte)
        # Note : Flutterwave ne supporte PAS XOF pour les cartes internationales
        # On convertit en USD/EUR selon le cas
        supported_currency = intent.currency
        amount = intent.amount

        if intent.currency == "XOF":
            # Conversion XOF -> EUR (taux approximatif 1 EUR = 655.957 XOF)
            # Pour la production, utiliser une API de change
            amount = round(intent.amount / 655.957, 2)
            supported_currency = "EUR"

        payload = {
            "tx_ref": tx_ref,
            "amount": amount,
            "currency": supported_currency,
            "redirect_url": f"{self.settings.frontend_url}/billing/return",
            "payment_options": "card",
            "customer": {
                "email": intent.customer_email or f"{intent.user_id}@candidatia.com",
                "name": intent.customer_name or "Client CandidatIA",
            },
            "customizations": {
                "title": "CandidatIA",
                "description": intent.description or f"Achat plan {intent.plan_code}",
                "logo": f"{self.settings.frontend_url}/logo.png",
            },
            "meta": {
                **intent.metadata,
                "user_id": intent.user_id,
                "plan_code": intent.plan_code,
                "credits_to_add": intent.credits_to_add,
                "original_amount_xof": intent.amount,
                "original_currency": intent.currency,
            },
        }

        logger.info(
            "flutterwave_create_payment",
            tx_ref=tx_ref,
            amount=amount,
            currency=supported_currency,
            plan=intent.plan_code,
        )

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(url, headers=self._headers(), json=payload)

                if response.status_code not in (200, 201):
                    logger.error(
                        "flutterwave_create_failed",
                        status=response.status_code,
                        body=response.text[:500],
                    )
                    raise PaymentError(
                        message=f"Flutterwave a refuse le paiement ({response.status_code}).",
                        details={"status": response.status_code, "body": response.text[:200]},
                    )

                data = response.json()
                if data.get("status") != "success":
                    raise PaymentError(
                        message=f"Flutterwave erreur : {data.get('message', 'inconnue')}",
                        details={"response": data},
                    )

                payment_data = data.get("data", {})
                checkout_url = payment_data.get("link", "")

                if not checkout_url:
                    raise PaymentError(message="Flutterwave n a pas retourne de lien de paiement.")

                logger.info(
                    "flutterwave_payment_created",
                    tx_ref=tx_ref,
                    checkout_url=checkout_url[:60],
                )

                return PaymentResult(
                    provider=PaymentProviderName.FLUTTERWAVE,
                    provider_transaction_id=tx_ref,
                    checkout_url=checkout_url,
                    status=PaymentStatus.PENDING,
                    amount=intent.amount,
                    currency=intent.currency,
                    raw_response=data,
                )

        except httpx.HTTPError as e:
            logger.exception("flutterwave_http_error", error=str(e))
            raise PaymentError(
                message=f"Erreur reseau Flutterwave : {str(e)}",
                details={"error": str(e)},
            ) from e

    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:
        """Verifie la signature d un webhook Flutterwave."""
        signature = headers.get("verif-hash") or headers.get("Verif-Hash")

        if not signature:
            raise PaymentError(message="Signature webhook Flutterwave manquante.")

        # Flutterwave utilise un secret partage (pas un HMAC)
        if self.settings.flutterwave_webhook_secret:
            if not hmac.compare_digest(
                signature, self.settings.flutterwave_webhook_secret
            ):
                logger.warning("flutterwave_webhook_bad_signature")
                raise PaymentError(message="Signature webhook Flutterwave invalide.")

        try:
            payload_data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise PaymentError(message=f"Webhook Flutterwave invalide : {str(e)}") from e

        event = payload_data.get("event", "")
        data = payload_data.get("data", {})

        transaction_id = data.get("tx_ref", "")
        status_raw = data.get("status", "").lower()

        status_map = {
            "successful": PaymentStatus.SUCCESS,
            "completed": PaymentStatus.SUCCESS,
            "pending": PaymentStatus.PENDING,
            "failed": PaymentStatus.FAILED,
            "cancelled": PaymentStatus.CANCELLED,
        }
        status = status_map.get(status_raw, PaymentStatus.PENDING)

        logger.info(
            "flutterwave_webhook_received",
            event=event,
            tx_ref=transaction_id,
            status=status.value,
        )

        return WebhookPayload(
            provider=PaymentProviderName.FLUTTERWAVE,
            provider_transaction_id=transaction_id,
            status=status,
            amount=float(data.get("amount", 0)),
            currency=data.get("currency", "EUR"),
            metadata=data.get("meta", {}) or {},
            raw=payload_data,
        )

    def verify_transaction(self, transaction_id: int) -> Dict[str, Any]:
        """Verifie une transaction aupres de Flutterwave (methode active)."""
        url = f"{FLUTTERWAVE_API_URL}/transactions/{transaction_id}/verify"

        try:
            with httpx.Client(timeout=30) as client:
                response = client.get(url, headers=self._headers())
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.exception("flutterwave_verify_failed", error=str(e))
            raise PaymentError(
                message=f"Erreur verification Flutterwave : {str(e)}",
                details={"error": str(e)},
            ) from e
