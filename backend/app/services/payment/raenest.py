"""
Provider de paiement : Raenest (USDT / USDC).

Raenest permet de recevoir des stablecoins (USDT TRC20/ERC20, USDC)
et de les convertir en USD puis les retirer vers un compte bancaire au Benin.

Flux typique :
1. On cree une "payment request" via l API Raenest
2. On recoit une adresse crypto unique pour ce paiement
3. Le client envoie les USDT/USDC
4. Raenest detecte le paiement et notifie via webhook
5. On credite le compte utilisateur
"""

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

logger = get_logger("payment.raenest")


RAENEST_API_URL = "https://api.raenest.com/v1"

# Taux de conversion approximatifs (a remplacer par une API live en production)
# 1 USD = 600 XOF (approximatif)
USD_TO_XOF = 600.0


class RaenestProvider(PaymentProvider):
    name = "raenest"

    def __init__(self) -> None:
        self.settings = get_settings()

    def is_available(self) -> bool:
        return bool(self.settings.raenest_api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.raenest_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _convert_xof_to_usd(self, amount_xof: float) -> float:
        """Convertit un montant XOF en USD (approximatif)."""
        return round(amount_xof / USD_TO_XOF, 2)

    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:
        """
        Cree une demande de paiement Raenest.

        Retourne une adresse crypto unique dans checkout_url
        (l utilisateur doit y envoyer les USDT/USDC).
        """
        url = f"{RAENEST_API_URL}/payment-requests"

        # Convertir le montant en USD si necessaire
        amount_usd = intent.amount
        if intent.currency == "XOF":
            amount_usd = self._convert_xof_to_usd(intent.amount)

        # Generer une reference unique
        import uuid
        reference = f"candidatia-{intent.user_id[:8]}-{uuid.uuid4().hex[:12]}"

        payload = {
            "reference": reference,
            "amount": amount_usd,
            "currency": "USD",
            "crypto_currency": "USDT",  # ou USDC
            "network": "TRC20",  # Tron, faible cout de transaction
            "description": intent.description or f"Achat plan {intent.plan_code}",
            "customer": {
                "email": intent.customer_email or f"{intent.user_id}@candidatia.com",
                "name": intent.customer_name or "Client CandidatIA",
            },
            "metadata": {
                **intent.metadata,
                "user_id": intent.user_id,
                "plan_code": intent.plan_code,
                "credits_to_add": intent.credits_to_add,
                "original_amount_xof": intent.amount if intent.currency == "XOF" else None,
                "original_currency": intent.currency,
            },
            "callback_url": f"{self.settings.frontend_url}/billing/return",
        }

        logger.info(
            "raenest_create_payment",
            reference=reference,
            amount_usd=amount_usd,
            plan=intent.plan_code,
        )

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(url, headers=self._headers(), json=payload)

                if response.status_code not in (200, 201):
                    logger.error(
                        "raenest_create_failed",
                        status=response.status_code,
                        body=response.text[:500],
                    )
                    raise PaymentError(
                        message=f"Raenest a refuse la demande ({response.status_code}).",
                        details={"status": response.status_code, "body": response.text[:200]},
                    )

                data = response.json()
                payment_data = data.get("data", data)

                crypto_address = payment_data.get("crypto_address") or payment_data.get("address")
                payment_reference = payment_data.get("reference", reference)

                if not crypto_address:
                    raise PaymentError(message="Raenest n a pas retourne d adresse crypto.")

                logger.info(
                    "raenest_payment_created",
                    reference=payment_reference,
                    crypto_address=crypto_address[:20] + "...",
                )

                return PaymentResult(
                    provider=PaymentProviderName.RAENEST,
                    provider_transaction_id=payment_reference,
                    checkout_url=crypto_address,
                    status=PaymentStatus.PENDING,
                    amount=intent.amount,
                    currency=intent.currency,
                    raw_response=data,
                )

        except httpx.HTTPError as e:
            logger.exception("raenest_http_error", error=str(e))
            raise PaymentError(
                message=f"Erreur reseau Raenest : {str(e)}",
                details={"error": str(e)},
            ) from e

    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:
        """Verifie la signature d un webhook Raenest."""
        signature = (
            headers.get("x-raenest-signature")
            or headers.get("X-Raenest-Signature")
            or headers.get("x-signature")
        )

        if not signature:
            raise PaymentError(message="Signature webhook Raenest manquante.")

        if self.settings.raenest_webhook_secret:
            expected = hmac.new(
                self.settings.raenest_webhook_secret.encode("utf-8"),
                body,
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(signature, expected):
                logger.warning("raenest_webhook_bad_signature")
                raise PaymentError(message="Signature webhook Raenest invalide.")

        try:
            payload_data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise PaymentError(message=f"Webhook Raenest invalide : {str(e)}") from e

        event = payload_data.get("event", "")
        data = payload_data.get("data", payload_data)

        reference = data.get("reference", "")
        status_raw = data.get("status", "").lower()

        status_map = {
            "completed": PaymentStatus.SUCCESS,
            "confirmed": PaymentStatus.SUCCESS,
            "success": PaymentStatus.SUCCESS,
            "pending": PaymentStatus.PENDING,
            "processing": PaymentStatus.PENDING,
            "failed": PaymentStatus.FAILED,
            "expired": PaymentStatus.CANCELLED,
        }
        status = status_map.get(status_raw, PaymentStatus.PENDING)

        logger.info(
            "raenest_webhook_received",
            event=event,
            reference=reference,
            status=status.value,
        )

        return WebhookPayload(
            provider=PaymentProviderName.RAENEST,
            provider_transaction_id=reference,
            status=status,
            amount=float(data.get("amount", 0)),
            currency="USD",
            metadata=data.get("metadata", {}) or {},
            raw=payload_data,
        )

    def get_payment_status(self, reference: str) -> Dict[str, Any]:
        """Verifie l etat d un paiement Raenest (methode active)."""
        url = f"{RAENEST_API_URL}/payment-requests/{reference}"

        try:
            with httpx.Client(timeout=30) as client:
                response = client.get(url, headers=self._headers())
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.exception("raenest_status_failed", error=str(e))
            raise PaymentError(
                message=f"Erreur verification Raenest : {str(e)}",
                details={"error": str(e)},
            ) from e
