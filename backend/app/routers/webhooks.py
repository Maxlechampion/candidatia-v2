"""
Endpoints webhooks pour les providers de paiement.
Ces endpoints sont appeles par les providers (FedaPay, Flutterwave, Raenest)
pour notifier le backend du statut d un paiement.

IMPORTANT :
  - Pas d authentification JWT (appels serveur-a-serveur)
  - Verification de signature dans chaque handler
  - Retour rapide (200 OK) pour eviter les retries
  - Toute erreur doit etre loggee mais ne pas bloquer le retour 200
"""
from typing import Any, Dict

from fastapi import APIRouter, Header, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from app.core.errors import PaymentError
from app.core.logging import get_logger
from app.services.payment.orchestrator import get_payment_orchestrator

logger = get_logger("routers.webhooks")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# ============================================================
# Helpers
# ============================================================
async def _read_body(request: Request) -> bytes:
    """Lit le body brut de la requete (necessaire pour la signature)."""
    return await request.body()


def _extract_headers(request: Request) -> Dict[str, str]:
    """Extrait tous les headers sous forme de dict."""
    return {k.lower(): v for k, v in request.headers.items()}


# ============================================================
# FEDAPAY
# ============================================================
@router.post("/fedapay")
async def fedapay_webhook(request: Request) -> Response:
    """
    Webhook FedaPay.
    FedaPay envoie un POST avec :
      - Header: X-FedaPay-Signature (t=...,s=... ou signature brute)
      - Body JSON: { "name": "transaction.*", "entity": {...} }
    """
    body = await _read_body(request)
    headers = _extract_headers(request)

    logger.info(
        "fedapay_webhook_received",
        content_length=len(body),
        has_signature="x-fedapay-signature" in headers,
    )

    orchestrator = get_payment_orchestrator()

    try:
        result = orchestrator.handle_webhook(
            provider_name="fedapay",
            headers=headers,
            body=body,
        )
        logger.info(
            "fedapay_webhook_processed",
            payment_id=result.get("payment_id"),
            status=result.get("status"),
        )
        # FedaPay attend un 200 avec un corps minimal
        return JSONResponse(
            content={"status": "ok", "message": "Webhook processed"},
            status_code=200,
        )
    except PaymentError as e:
        logger.warning(
            "fedapay_webhook_payment_error",
            error=str(e),
            details=e.details if hasattr(e, "details") else None,
        )
        # On retourne quand meme 200 pour eviter les retries,
        # mais on log l erreur
        status_code = 200 if "invalide" in str(e).lower() else 400
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status_code,
        )
    except Exception as e:
        logger.exception("fedapay_webhook_unexpected_error", error=str(e))
        # Erreur inattendue : 500 pour que FedaPay retry
        return JSONResponse(
            content={"status": "error", "message": "Internal error"},
            status_code=500,
        )


# ============================================================
# FLUTTERWAVE (reserve pour plus tard)
# ============================================================
@router.post("/flutterwave")
async def flutterwave_webhook(request: Request) -> Response:
    """Webhook Flutterwave (non utilise au Benin pour l instant)."""
    body = await _read_body(request)
    headers = _extract_headers(request)

    logger.info(
        "flutterwave_webhook_received",
        content_length=len(body),
    )

    orchestrator = get_payment_orchestrator()

    try:
        result = orchestrator.handle_webhook(
            provider_name="flutterwave",
            headers=headers,
            body=body,
        )
        return JSONResponse(
            content={"status": "ok"},
            status_code=200,
        )
    except PaymentError as e:
        logger.warning("flutterwave_webhook_error", error=str(e))
        status_code = 200 if "invalide" in str(e).lower() else 400
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status_code,
        )
    except Exception as e:
        logger.exception("flutterwave_webhook_unexpected_error", error=str(e))
        return JSONResponse(
            content={"status": "error"},
            status_code=500,
        )


# ============================================================
# RAENEST (crypto USDT/USDC)
# ============================================================
@router.post("/raenest")
async def raenest_webhook(request: Request) -> Response:
    """Webhook Raenest (paiement crypto)."""
    body = await _read_body(request)
    headers = _extract_headers(request)

    logger.info(
        "raenest_webhook_received",
        content_length=len(body),
    )

    orchestrator = get_payment_orchestrator()

    try:
        result = orchestrator.handle_webhook(
            provider_name="raenest",
            headers=headers,
            body=body,
        )
        return JSONResponse(
            content={"status": "ok"},
            status_code=200,
        )
    except PaymentError as e:
        logger.warning("raenest_webhook_error", error=str(e))
        status_code = 200 if "invalide" in str(e).lower() else 400
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status_code,
        )
    except Exception as e:
        logger.exception("raenest_webhook_unexpected_error", error=str(e))
        return JSONResponse(
            content={"status": "error"},
            status_code=500,
        )


# ============================================================
# ENDPOINT DE TEST (debug uniquement)
# ============================================================
@router.get("/fedapay/test")
async def fedapay_webhook_test() -> Dict[str, Any]:
    """
    Endpoint de diagnostic pour verifier que le webhook FedaPay
    est bien accessible depuis l exterieur.
    A DESACTIVER EN PRODUCTION.
    """
    from app.core.config import get_settings

    settings = get_settings()
    return {
        "status": "ok",
        "message": "Webhook FedaPay endpoint is reachable",
        "environment": settings.fedapay_env,
        "has_secret_key": bool(settings.fedapay_secret_key),
        "has_webhook_secret": bool(settings.fedapay_webhook_secret),
        "frontend_url": settings.frontend_url,
    }