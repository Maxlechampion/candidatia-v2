"""Provider de paiement : FedaPay (Mobile Money + Carte - Benin)."""

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

logger = get_logger("payment.fedapay")


FEDAPAY_API_URL_SANDBOX = "https://sandbox-api.fedapay.com/v1"
FEDAPAY_API_URL_LIVE = "https://api.fedapay.com/v1"


class FedaPayProvider(PaymentProvider):
    """Provider FedaPay : Mobile Money + Carte bancaire (Benin)."""

    name = "fedapay"

    def __init__(self) -> None:
        self.settings = get_settings()

    def is_available(self) -> bool:
        return bool(self.settings.fedapay_secret_key)

    def _api_url(self) -> str:
        if self.settings.fedapay_env == "live":
            return FEDAPAY_API_URL_LIVE
        return FEDAPAY_API_URL_SANDBOX

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.fedapay_secret_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    # ================================================================
    # CHECKOUT
    # ================================================================

    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:
        """
        Cree une transaction FedaPay et retourne l URL officielle
        de paiement. Le client pourra choisir le moyen de paiement
        (Mobile Money + Carte bancaire) sur la page FedaPay.
        """
        url = f"{self._api_url()}/transactions"

        customer_name = (intent.customer_name or "Client").strip()
        name_parts = customer_name.split(maxsplit=1)
        firstname = name_parts[0] if name_parts else "Client"
        lastname = name_parts[1] if len(name_parts) > 1 else "Client"

        # Callback avec locale dans l URL (evite 404)
        callback_url = f"{self.settings.frontend_url}/{intent.locale}/billing/return"

        payload = {
            "description": intent.description or f"Achat plan {intent.plan_code}",
            "amount": int(intent.amount),
            "currency": {"iso": intent.currency or "XOF"},
            "callback_url": callback_url,
            "customer": {
                "email": intent.customer_email or f"{intent.user_id}@candidatia.com",
                "firstname": firstname,
                "lastname": lastname,
                # phone_number intentionnellement omis pour forcer l ecran de choix
            },
            "metadata": {
                **intent.metadata,
                "user_id": intent.user_id,
                "plan_code": intent.plan_code,
                "credits_to_add": intent.credits_to_add,
            },
        }

        logger.info(
            "fedapay_create_transaction",
            amount=intent.amount,
            currency=intent.currency,
            plan=intent.plan_code,
            env=self.settings.fedapay_env,
        )

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=self._headers(), json=payload)

                if response.status_code not in (200, 201):
                    logger.error(
                        "fedapay_create_failed",
                        status=response.status_code,
                        body=response.text[:1000],
                    )
                    raise PaymentError(
                        message=f"FedaPay a refuse la creation ({response.status_code}).",
                        details={
                            "status": response.status_code,
                            "body": response.text[:500],
                        },
                    )

                data = response.json()

                transaction: Dict[str, Any] = {}
                if isinstance(data.get("v1/transaction"), dict):
                    transaction = data["v1/transaction"]
                elif isinstance(data.get("v1"), dict) and isinstance(
                    data["v1"].get("transaction"), dict
                ):
                    transaction = data["v1"]["transaction"]
                elif isinstance(data.get("transaction"), dict):
                    transaction = data["transaction"]
                else:
                    transaction = data

                transaction_id = str(transaction.get("id", ""))
                if not transaction_id:
                    logger.error("fedapay_missing_transaction_id", response=data)
                    raise PaymentError(
                        message="FedaPay n a pas retourne d identifiant.",
                        details={"response": data},
                    )

                logger.info(
                    "fedapay_transaction_created",
                    transaction_id=transaction_id,
                )

                # Generation du token de paiement
                token_url = f"{self._api_url()}/transactions/{transaction_id}/token"
                token_response = client.post(token_url, headers=self._headers())

                if token_response.status_code not in (200, 201):
                    logger.error(
                        "fedapay_token_failed",
                        status=token_response.status_code,
                    )
                    raise PaymentError(message="FedaPay n a pas genere le lien.")

                token_data = token_response.json()
                token = token_data.get("token")
                checkout_url = token_data.get("url")

                if not token:
                    raise PaymentError(message="Token manquant.")
                if not checkout_url:
                    raise PaymentError(message="URL manquante.")

                logger.info(
                    "fedapay_checkout_ready",
                    transaction_id=transaction_id,
                )

                return PaymentResult(
                    provider=PaymentProviderName.FEDAPAY,
                    provider_transaction_id=transaction_id,
                    checkout_url=checkout_url,
                    status=PaymentStatus.PENDING,
                    amount=intent.amount,
                    currency=intent.currency,
                    raw_response={
                        "transaction": transaction,
                        "token_response": {"url": checkout_url},
                    },
                )

        except httpx.HTTPError as e:
            logger.exception("fedapay_http_error", error=str(e))
            raise PaymentError(message=f"Erreur reseau FedaPay : {str(e)}") from e

    # ================================================================
    # VERIFICATION STATUT
    # ================================================================

    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Recupere le statut reel d une transaction FedaPay."""
        url = f"{self._api_url()}/transactions/{transaction_id}"
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(url, headers=self._headers())
                if response.status_code != 200:
                    raise PaymentError(
                        message=f"Impossible de recuperer ({response.status_code})."
                    )

                data = response.json()
                transaction = (
                    data.get("v1/transaction") or data.get("transaction") or data
                )

                currency_obj = transaction.get("currency")
                currency = (
                    currency_obj.get("iso", "XOF")
                    if isinstance(currency_obj, dict)
                    else "XOF"
                )

                return {
                    "id": str(transaction.get("id", "")),
                    "status": transaction.get("status", "").lower(),
                    "amount": float(transaction.get("amount", 0)),
                    "currency": currency,
                    "metadata": transaction.get("metadata", {}) or {},
                    "raw": transaction,
                }
        except httpx.HTTPError as e:
            raise PaymentError(message=f"Erreur reseau FedaPay : {str(e)}") from e

    # ================================================================
    # WEBHOOK VERIFICATION
    # ================================================================

    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:
        """Verifie la signature d un webhook FedaPay."""
        signature_header = None
        for key, value in headers.items():
            if key.lower() == "x-fedapay-signature":
                signature_header = value
                break

        if not signature_header:
            raise PaymentError(message="Signature webhook manquante.")

        if self.settings.fedapay_webhook_secret:
            try:
                parsed: Dict[str, str] = {}
                for part in signature_header.split(","):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        parsed[k.strip()] = v.strip()

                timestamp = parsed.get("t")
                signature = parsed.get("s")

                if timestamp and signature:
                    payload_to_sign = f"{timestamp}.".encode("utf-8") + body
                    expected = hmac.new(
                        self.settings.fedapay_webhook_secret.encode("utf-8"),
                        payload_to_sign,
                        hashlib.sha256,
                    ).hexdigest()
                    if not hmac.compare_digest(signature, expected):
                        raise PaymentError(message="Signature invalide.")
                elif signature:
                    expected = hmac.new(
                        self.settings.fedapay_webhook_secret.encode("utf-8"),
                        body,
                        hashlib.sha256,
                    ).hexdigest()
                    if not hmac.compare_digest(signature, expected):
                        raise PaymentError(message="Signature invalide.")
                else:
                    expected = hmac.new(
                        self.settings.fedapay_webhook_secret.encode("utf-8"),
                        body,
                        hashlib.sha256,
                    ).hexdigest()
                    if not hmac.compare_digest(signature_header, expected):
                        raise PaymentError(message="Signature invalide.")
            except PaymentError:
                raise
            except Exception as e:
                raise PaymentError(message=f"Erreur signature : {str(e)}") from e

        try:
            payload_data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as e:
            raise PaymentError(message=f"Webhook invalide : {str(e)}") from e

        entity = payload_data.get("entity", {})
        transaction_id = str(entity.get("id", ""))
        status_raw = entity.get("status", "").lower()

        status_map = {
            "approved": PaymentStatus.SUCCESS,
            "transferred": PaymentStatus.SUCCESS,
            "pending": PaymentStatus.PENDING,
            "declined": PaymentStatus.FAILED,
            "canceled": PaymentStatus.CANCELLED,
            "refunded": PaymentStatus.REFUNDED,
        }
        status = status_map.get(status_raw, PaymentStatus.PENDING)

        currency_obj = entity.get("currency")
        currency = (
            currency_obj.get("iso", "XOF")
            if isinstance(currency_obj, dict)
            else "XOF"
        )

        return WebhookPayload(
            provider=PaymentProviderName.FEDAPAY,
            provider_transaction_id=transaction_id,
            status=status,
            amount=float(entity.get("amount", 0)),
            currency=currency,
            metadata=entity.get("metadata", {}) or {},
            raw=payload_data,
        )