"""Router billing : plans, providers, checkout, historique, verification."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.errors import NotFoundError, PaymentError, ValidationError
from app.core.logging import get_logger
from app.core.security import get_current_user  # ← CORRIGÉ
from app.services.payment.orchestrator import get_payment_orchestrator
from app.services.payment.plans import list_plans

logger = get_logger("routers.billing")

router = APIRouter(prefix="/api/billing", tags=["billing"])  # ← CORRIGÉ


# ============================================================
# Schemas
# ============================================================

class CheckoutRequest(BaseModel):
    plan_code: str
    provider: str
    customer_name: Optional[str] = None
    locale: str = "fr"


class CheckoutResponse(BaseModel):
    payment_id: str
    checkout_url: str
    provider: str
    provider_transaction_id: str
    amount: float
    currency: str
    plan_code: str
    plan_name: str
    credits_to_add: int


class VerifyResponse(BaseModel):
    status: str
    payment_id: str
    new_status: str
    real_status: Optional[str] = None


# ============================================================
# GET /api/billing/plans
# ============================================================

@router.get("/plans")
async def get_plans() -> Dict[str, Any]:
    """Liste tous les plans tarifaires disponibles."""
    plans = list_plans()
    return {"plans": plans}


# ============================================================
# GET /api/billing/providers
# ============================================================

@router.get("/providers")
async def get_providers() -> Dict[str, Any]:
    """Liste les providers de paiement disponibles."""
    orchestrator = get_payment_orchestrator()
    providers = orchestrator.available_providers()
    return {"providers": providers}


# ============================================================
# POST /api/billing/checkout
# ============================================================

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> CheckoutResponse:
    """Cree une session de paiement."""
    orchestrator = get_payment_orchestrator()

    try:
        result = orchestrator.create_checkout(
            user_id=user["id"],
            user_email=user.get("email", ""),
            plan_code=body.plan_code,
            provider_name=body.provider,
            customer_name=body.customer_name or user.get("full_name"),
            locale=body.locale,
        )
    except (PaymentError, NotFoundError, ValidationError):
        raise

    logger.info(
        "checkout_endpoint",
        user_id=user["id"],
        plan=body.plan_code,
        provider=body.provider,
        payment_id=result.get("payment_id"),
    )

    return CheckoutResponse(**result)


# ============================================================
# GET /api/billing/payments
# ============================================================

@router.get("/payments")
async def list_payments(
    limit: int = Query(20, ge=1, le=100),
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Historique des paiements de l'utilisateur connecte."""
    orchestrator = get_payment_orchestrator()
    payments = orchestrator.list_user_payments(user_id=user["id"], limit=limit)
    return {"payments": payments, "count": len(payments)}


# ============================================================
# GET /api/billing/verify
# ============================================================

@router.get("/verify", response_model=VerifyResponse)
async def verify_payment(
    reference: str = Query(..., description="Reference/ID de transaction FedaPay"),
    user: Dict[str, Any] = Depends(get_current_user),
) -> VerifyResponse:
    """
    Verifie le statut reel d'un paiement aupres du provider (FedaPay).
    Appele par la page /billing/return apres le retour utilisateur.
    """
    if not reference or not reference.strip():
        raise ValidationError(message="Reference de transaction manquante.")

    orchestrator = get_payment_orchestrator()

    try:
        result = orchestrator.verify_payment(
            transaction_id=reference.strip(),
            user_id=user["id"],
        )
    except (PaymentError, NotFoundError, ValidationError) as e:
        logger.warning(
            "verify_payment_failed",
            user_id=user["id"],
            reference=reference,
            error=str(e),
        )
        raise

    logger.info(
        "verify_payment_success",
        user_id=user["id"],
        reference=reference,
        new_status=result.get("new_status"),
    )

    return VerifyResponse(
        status=result.get("status", "verified"),
        payment_id=result.get("payment_id", ""),
        new_status=result.get("new_status", "pending"),
        real_status=result.get("real_status"),
    )