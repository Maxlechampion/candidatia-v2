"""
Orchestrateur paiement.
Route automatiquement vers le bon provider selon le canal choisi.
Selectionne aussi le bon plan tarifaire.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.database import insert_row, select_rows, update_row
from app.core.errors import NotFoundError, PaymentError, ValidationError
from app.core.logging import get_logger
from app.services.auth.user_service import add_credits, mark_paid_tier
from app.services.payment.base import PaymentProvider
from app.services.payment.fedapay import FedaPayProvider
from app.services.payment.flutterwave import FlutterwaveProvider
from app.services.payment.plans import (
    get_currency_for_provider,
    get_plan,
    get_price_for_provider,
)
from app.services.payment.raenest import RaenestProvider
from app.services.payment.schemas import (
    PaymentIntent,
    PaymentProviderName,
    PaymentResult,
    PaymentStatus,
    WebhookPayload,
)

logger = get_logger("payment.orchestrator")


class PaymentOrchestrator:
    """Orchestrateur principal."""

    def __init__(self) -> None:
        self._providers: Dict[str, PaymentProvider] = {
            "fedapay": FedaPayProvider(),
            "flutterwave": FlutterwaveProvider(),
            "raenest": RaenestProvider(),
        }

    def get_provider(self, name: str) -> PaymentProvider:
        """Retourne un provider par son nom."""
        provider = self._providers.get(name.lower())
        if not provider:
            raise ValidationError(message=f"Provider de paiement inconnu : {name}")
        return provider

    def available_providers(self) -> List[str]:
        """Retourne les providers disponibles (configures)."""
        return [name for name, p in self._providers.items() if p.is_available()]

    def create_checkout(
        self,
        user_id: str,
        user_email: str,
        plan_code: str,
        provider_name: str,
        customer_name: Optional[str] = None,
        locale: str = "fr",
    ) -> Dict[str, Any]:
        """Cree une session de paiement."""
        plan = get_plan(plan_code)
        if not plan:
            raise NotFoundError(message=f"Plan inconnu : {plan_code}")

        provider = self.get_provider(provider_name)
        if not provider.is_available():
            raise PaymentError(
                message=f"Provider {provider_name} non disponible actuellement.",
                details={"provider": provider_name},
            )

        amount = get_price_for_provider(plan_code, provider_name)
        currency = get_currency_for_provider(provider_name)

        intent = PaymentIntent(
            user_id=user_id,
            amount=amount,
            currency=currency,
            plan_code=plan_code,
            credits_to_add=plan["credits"],
            description=f"Achat plan {plan['name']}",
            customer_email=user_email,
            customer_name=customer_name,
            locale=locale,
            metadata={"plan_name": plan["name"]},
        )

        try:
            result: PaymentResult = provider.safe_checkout(intent)
        except PaymentError:
            raise
        except Exception as e:
            logger.exception("checkout_failed", provider=provider_name, error=str(e))
            raise PaymentError(
                message=f"Erreur creation checkout : {str(e)}",
                details={"provider": provider_name},
            ) from e

        payment_record = insert_row(
            "payments",
            {
                "user_id": user_id,
                "provider": provider_name,
                "provider_transaction_id": result.provider_transaction_id,
                "amount": amount,
                "currency": currency,
                "credits_added": plan["credits"],
                "plan_purchased": plan_code,
                "status": "pending",
                "metadata": {
                    "checkout_url": result.checkout_url,
                    "plan_name": plan["name"],
                },
            },
        )

        logger.info(
            "checkout_created",
            user_id=user_id,
            provider=provider_name,
            plan=plan_code,
            amount=amount,
            payment_id=payment_record.get("id"),
        )

        return {
            "payment_id": payment_record.get("id"),
            "checkout_url": result.checkout_url,
            "provider": provider_name,
            "provider_transaction_id": result.provider_transaction_id,
            "amount": amount,
            "currency": currency,
            "plan_code": plan_code,
            "plan_name": plan["name"],
            "credits_to_add": plan["credits"],
        }

    def handle_webhook(
        self,
        provider_name: str,
        headers: Dict[str, str],
        body: bytes,
    ) -> Dict[str, Any]:
        """Traite un webhook provider."""
        provider = self.get_provider(provider_name)

        try:
            payload: WebhookPayload = provider.verify_webhook(headers, body)
        except PaymentError:
            raise
        except Exception as e:
            logger.exception("webhook_verify_failed", provider=provider_name, error=str(e))
            raise PaymentError(message=f"Webhook invalide : {str(e)}") from e

        logger.info(
            "webhook_received",
            provider=provider_name,
            transaction_id=payload.provider_transaction_id,
            status=payload.status.value,
        )

        payments = select_rows(
            "payments",
            filters={"provider_transaction_id": payload.provider_transaction_id},
            limit=1,
        )
        if not payments:
            logger.warning(
                "webhook_payment_not_found",
                provider=provider_name,
                transaction_id=payload.provider_transaction_id,
            )
            raise NotFoundError(message="Paiement introuvable.")

        payment = payments[0]
        current_status = payment.get("status", "pending")

        if current_status == "success":
            logger.info("webhook_already_processed", payment_id=payment.get("id"))
            return {"status": "already_processed", "payment_id": payment.get("id")}

        new_status = payload.status.value
        update_row(
            "payments",
            {"id": payment["id"]},
            {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **(payment.get("metadata") or {}),
                    "webhook_received_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        )

        if payload.status == PaymentStatus.SUCCESS:
            try:
                user_id = payment["user_id"]
                credits = payment.get("credits_added", 0)
                if credits > 0:
                    add_credits(user_id, credits)
                    try:
                        mark_paid_tier(user_id)
                    except Exception as _e:
                        logger.warning("mark_paid_tier_failed", error=str(_e))
                    logger.info(
                        "credits_added",
                        user_id=user_id,
                        credits=credits,
                        payment_id=payment["id"],
                    )
            except Exception as e:
                logger.exception(
                    "credits_add_failed",
                    payment_id=payment["id"],
                    error=str(e),
                )

        return {
            "status": "processed",
            "payment_id": payment["id"],
            "new_status": new_status,
        }

    def list_user_payments(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Retourne l historique des paiements d un utilisateur."""
        return select_rows(
            "payments",
            filters={"user_id": user_id},
            limit=limit,
            order_by="created_at",
            descending=True,
        )

    def verify_payment(self, transaction_id: str, user_id: str) -> Dict[str, Any]:
        """
        Verifie le statut reel d une transaction aupres du provider
        et credite l utilisateur si approuve.
        """
        payments = select_rows(
            "payments",
            filters={"provider_transaction_id": transaction_id},
            limit=1,
        )
        if not payments:
            raise NotFoundError(message="Paiement introuvable.")

        payment = payments[0]

        if payment["user_id"] != user_id:
            raise ValidationError(
                message="Ce paiement n appartient pas a cet utilisateur."
            )

        current_status = payment.get("status", "pending")

        if current_status == "success":
            logger.info("payment_already_verified", payment_id=payment["id"])
            return {
                "status": "already_processed",
                "payment_id": payment["id"],
                "current_status": current_status,
                "new_status": current_status,
            }

        provider = self.get_provider(payment["provider"])
        real_status = provider.get_transaction_status(transaction_id)

        logger.info(
            "payment_verified",
            payment_id=payment["id"],
            provider=payment["provider"],
            real_status=real_status.get("status"),
        )

        status_map = {
            "approved": "success",
            "transferred": "success",
            "declined": "failed",
            "canceled": "cancelled",
            "refunded": "refunded",
            "pending": "pending",
        }
        new_status = status_map.get(real_status.get("status", "").lower(), "pending")

        update_row(
            "payments",
            {"id": payment["id"]},
            {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **(payment.get("metadata") or {}),
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                    "real_status": real_status.get("status"),
                },
            },
        )

        if new_status == "success":
            credits = payment.get("credits_added", 0)
            if credits > 0:
                add_credits(payment["user_id"], credits)
                try:
                    mark_paid_tier(payment["user_id"])
                except Exception as _e:
                    logger.warning("mark_paid_tier_failed", error=str(_e))
                logger.info(
                    "credits_added",
                    user_id=payment["user_id"],
                    credits=credits,
                    payment_id=payment["id"],
                )

        return {
            "status": "verified",
            "payment_id": payment["id"],
            "new_status": new_status,
            "real_status": real_status.get("status"),
        }


# Singleton
_orchestrator: Optional[PaymentOrchestrator] = None


def get_payment_orchestrator() -> PaymentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PaymentOrchestrator()
    return _orchestrator
