const fs = require('fs');
const path = require('path');

const BASE = __dirname;

// Helper : écrire un fichier (crée les dossiers si nécessaire)
function writeFile(relativePath, content) {
  const fullPath = path.join(BASE, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`  ✅ ${relativePath}`);
}

// Helper : lire un fichier (retourne null si inexistant)
function readFile(relativePath) {
  const fullPath = path.join(BASE, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

console.log('🔧 Correction automatique du module paiement...\n');

// ============================================================
// 1. BACKEND - schemas.py
// ============================================================
console.log('📝 1. backend/app/services/payment/schemas.py');
writeFile('backend/app/services/payment/schemas.py', `"""Schemas Pydantic pour le module paiement."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PaymentProviderName(str, Enum):
    """Noms des providers de paiement supportes."""
    FEDAPAY = "fedapay"
    FLUTTERWAVE = "flutterwave"
    RAENEST = "raenest"


class PaymentStatus(str, Enum):
    """Statuts possibles d un paiement."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentIntent(BaseModel):
    """Intention de paiement (creation d une session)."""
    user_id: str
    amount: float = Field(..., gt=0)
    currency: str = "XOF"
    plan_code: str
    credits_to_add: int = Field(..., ge=0)
    description: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    locale: str = "fr"
    metadata: Dict[str, Any] = {}


class PaymentResult(BaseModel):
    """Resultat d une creation de session de paiement."""
    provider: PaymentProviderName
    provider_transaction_id: str
    checkout_url: str
    status: PaymentStatus
    amount: float
    currency: str
    raw_response: Optional[Dict[str, Any]] = None


class WebhookPayload(BaseModel):
    """Payload normalise d un webhook provider."""
    provider: PaymentProviderName
    provider_transaction_id: str
    status: PaymentStatus
    amount: Optional[float] = None
    currency: Optional[str] = None
    metadata: Dict[str, Any] = {}
    raw: Optional[Dict[str, Any]] = None


class PaymentRecord(BaseModel):
    """Enregistrement de paiement en DB."""
    id: Optional[str] = None
    user_id: str
    provider: str
    provider_transaction_id: str
    amount: float
    currency: str
    credits_added: int = 0
    plan_purchased: Optional[str] = None
    status: str = "pending"
    metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None


class PlanInfo(BaseModel):
    """Informations d un plan tarifaire."""
    code: str
    name: str
    price_eur: float
    credits: int
    description: str = ""
`);

// ============================================================
// 2. BACKEND - base.py
// ============================================================
console.log('📝 2. backend/app/services/payment/base.py');
writeFile('backend/app/services/payment/base.py', `"""Interface abstraite de tout provider de paiement."""
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
`);

// ============================================================
// 3. BACKEND - fedapay.py (CORRECTION CRITIQUE)
// ============================================================
console.log('📝 3. backend/app/services/payment/fedapay.py');
writeFile('backend/app/services/payment/fedapay.py', `"""Provider de paiement : FedaPay (Mobile Money + Carte - Benin)."""
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

        # CORRECTION 1 : locale dans callback_url (corrige le 404)
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
                # CORRECTION 2 : phone_number SUPPRIME pour forcer l'ecran de choix
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
                        details={"status": response.status_code, "body": response.text[:500]},
                    )

                data = response.json()

                transaction: Dict[str, Any] = {}
                if isinstance(data.get("v1/transaction"), dict):
                    transaction = data["v1/transaction"]
                elif isinstance(data.get("v1"), dict) and isinstance(data["v1"].get("transaction"), dict):
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

                logger.info("fedapay_transaction_created", transaction_id=transaction_id)

                token_url = f"{self._api_url()}/transactions/{transaction_id}/token"
                token_response = client.post(token_url, headers=self._headers())

                if token_response.status_code not in (200, 201):
                    logger.error("fedapay_token_failed", status=token_response.status_code)
                    raise PaymentError(message="FedaPay n a pas genere le lien.")

                token_data = token_response.json()
                token = token_data.get("token")
                checkout_url = token_data.get("url")

                if not token:
                    raise PaymentError(message="Token manquant.")
                if not checkout_url:
                    raise PaymentError(message="URL manquante.")

                logger.info("fedapay_checkout_ready", transaction_id=transaction_id)

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
                    raise PaymentError(message=f"Impossible de recuperer ({response.status_code}).")

                data = response.json()
                transaction = data.get("v1/transaction") or data.get("transaction") or data

                return {
                    "id": str(transaction.get("id", "")),
                    "status": transaction.get("status", "").lower(),
                    "amount": float(transaction.get("amount", 0)),
                    "currency": transaction.get("currency", {}).get("iso", "XOF") if isinstance(transaction.get("currency"), dict) else "XOF",
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
        currency = currency_obj.get("iso", "XOF") if isinstance(currency_obj, dict) else "XOF"

        return WebhookPayload(
            provider=PaymentProviderName.FEDAPAY,
            provider_transaction_id=transaction_id,
            status=status,
            amount=float(entity.get("amount", 0)),
            currency=currency,
            metadata=entity.get("metadata", {}) or {},
            raw=payload_data,
        )
`);

// ============================================================
// 4. BACKEND - orchestrator.py
// ============================================================
console.log('📝 4. backend/app/services/payment/orchestrator.py');
writeFile('backend/app/services/payment/orchestrator.py', `"""
Orchestrateur paiement.
Route automatiquement vers le bon provider selon le canal choisi.
Selectionne aussi le bon plan tarifaire.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.database import insert_row, select_rows, update_row
from app.core.errors import NotFoundError, PaymentError, ValidationError
from app.core.logging import get_logger
from app.services.auth.user_service import add_credits
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
        """
        Cree une session de paiement.
        Retourne un dict avec :
          - payment_id : ID en DB
          - checkout_url : URL/Adresse pour payer
          - provider : nom du provider
          - amount : montant
          - currency : devise
        """
        # 1. Verifier le plan
        plan = get_plan(plan_code)
        if not plan:
            raise NotFoundError(message=f"Plan inconnu : {plan_code}")

        # 2. Verifier le provider
        provider = self.get_provider(provider_name)
        if not provider.is_available():
            raise PaymentError(
                message=f"Provider {provider_name} non disponible actuellement.",
                details={"provider": provider_name},
            )

        # 3. Calculer le montant
        amount = get_price_for_provider(plan_code, provider_name)
        currency = get_currency_for_provider(provider_name)

        # 4. Creer l intention de paiement
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

        # 5. Appeler le provider
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

        # 6. Enregistrer en DB
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
        """
        Traite un webhook provider.
        - Verifie la signature
        - Met a jour le paiement en DB
        - Ajoute les credits si succes
        """
        provider = self.get_provider(provider_name)

        # 1. Verifier la signature et extraire le payload
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

        # 2. Trouver le paiement en DB
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

        # 3. Idempotence : ne rien faire si deja traite
        if current_status == "success":
            logger.info("webhook_already_processed", payment_id=payment.get("id"))
            return {"status": "already_processed", "payment_id": payment.get("id")}

        # 4. Mettre a jour le statut
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

        # 5. Si succes, ajouter les credits
        if payload.status == PaymentStatus.SUCCESS:
            try:
                user_id = payment["user_id"]
                credits = payment.get("credits_added", 0)
                if credits > 0:
                    add_credits(user_id, credits)
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
        # 1. Trouver le paiement en DB
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

        # 2. Idempotence
        if current_status == "success":
            logger.info("payment_already_verified", payment_id=payment["id"])
            return {
                "status": "already_processed",
                "payment_id": payment["id"],
                "current_status": current_status,
                "new_status": current_status,
            }

        # 3. Verifier aupres du provider
        provider = self.get_provider(payment["provider"])
        real_status = provider.get_transaction_status(transaction_id)

        logger.info(
            "payment_verified",
            payment_id=payment["id"],
            provider=payment["provider"],
            real_status=real_status.get("status"),
        )

        # 4. Mapper le statut FedaPay -> statut interne
        status_map = {
            "approved": "success",
            "transferred": "success",
            "declined": "failed",
            "canceled": "cancelled",
            "refunded": "refunded",
            "pending": "pending",
        }
        new_status = status_map.get(real_status.get("status", "").lower(), "pending")

        # 5. Mettre a jour le paiement
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

        # 6. Si succes, crediter l utilisateur
        if new_status == "success":
            credits = payment.get("credits_added", 0)
            if credits > 0:
                add_credits(payment["user_id"], credits)
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


# ============================================================
# Singleton
# ============================================================
_orchestrator: Optional[PaymentOrchestrator] = None


def get_payment_orchestrator() -> PaymentOrchestrator:
    """Retourne l instance unique de l orchestrateur."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PaymentOrchestrator()
    return _orchestrator
`);

// ============================================================
// 5. BACKEND - plans.py
// ============================================================
console.log('📝 5. backend/app/services/payment/plans.py');
writeFile('backend/app/services/payment/plans.py', `"""
Definition des plans tarifaires CandidatIA.
"""
from typing import Any, Dict, List, Optional


PLANS: Dict[str, Dict[str, Any]] = {
    "essentiel": {
        "code": "essentiel",
        "name": "Essentiel",
        "credits": 50,
        "price_eur": 7.50,
        "description": "Ideal pour debuter : 50 credits pour decouvrir CandidatIA.",
        "features": [
            "50 credits IA",
            "Correction de CV",
            "Simulation d'entretien",
            "Support email",
        ],
        "highlight": False,
    },
    "pro": {
        "code": "pro",
        "name": "Pro",
        "credits": 150,
        "price_eur": 18.00,
        "description": "Le plus populaire : 150 credits pour une recherche active.",
        "features": [
            "150 credits IA",
            "Tout Essentiel +",
            "Lettres de motivation",
            "Optimisation LinkedIn",
            "Support prioritaire",
        ],
        "highlight": True,
    },
    "carriere": {
        "code": "carriere",
        "name": "Carriere",
        "credits": 400,
        "price_eur": 38.00,
        "description": "Pour les candidats ambitieux : 400 credits + coaching.",
        "features": [
            "400 credits IA",
            "Tout Pro +",
            "Coaching carriere 1-to-1",
            "Acces illimite aux modeles",
            "Support VIP",
        ],
        "highlight": False,
    },
}


PROVIDER_PRICES: Dict[str, Dict[str, float]] = {
    "fedapay": {
        "essentiel": 5000,
        "pro": 12000,
        "carriere": 25000,
    },
    "flutterwave": {
        "essentiel": 5000,
        "pro": 12000,
        "carriere": 25000,
    },
    "raenest": {
        "essentiel": 8.00,
        "pro": 19.50,
        "carriere": 41.00,
    },
}


PROVIDER_CURRENCY: Dict[str, str] = {
    "fedapay": "XOF",
    "flutterwave": "XOF",
    "raenest": "USD",
}


def list_plans() -> List[Dict[str, Any]]:
    """Retourne la liste de tous les plans."""
    return list(PLANS.values())


def get_plan(code: str) -> Optional[Dict[str, Any]]:
    """Retourne un plan par son code, ou None."""
    return PLANS.get(code.lower())


def get_price_for_provider(plan_code: str, provider_name: str) -> float:
    """Retourne le prix d un plan pour un provider donne."""
    plan_code = plan_code.lower()
    provider_name = provider_name.lower()

    if plan_code not in PLANS:
        raise ValueError(f"Plan inconnu : {plan_code}")
    if provider_name not in PROVIDER_PRICES:
        raise ValueError(f"Provider inconnu : {provider_name}")

    price = PROVIDER_PRICES[provider_name].get(plan_code)
    if price is None:
        raise ValueError(
            f"Prix non defini pour plan={plan_code} provider={provider_name}"
        )
    return float(price)


def get_currency_for_provider(provider_name: str) -> str:
    """Retourne la devise utilisee par un provider."""
    provider_name = provider_name.lower()
    currency = PROVIDER_CURRENCY.get(provider_name)
    if not currency:
        raise ValueError(f"Devise inconnue pour provider : {provider_name}")
    return currency


def format_price(amount: float, currency: str) -> str:
    """Formate un prix pour affichage."""
    currency = currency.upper()
    if currency == "XOF":
        return f"{int(amount):,}".replace(",", " ") + " FCFA"
    if currency == "USD":
        return f"$\{amount:.2f}"
    if currency == "EUR":
        return f"{amount:.2f} €"
    return f"{amount:.2f} {currency}"
`);

// ============================================================
// 6. FRONTEND - PaymentMethods.tsx (corrige les espaces)
// ============================================================
console.log('📝 6. frontend/components/billing/PaymentMethods.tsx');
writeFile('frontend/components/billing/PaymentMethods.tsx', `"use client";

import { cn } from "@/lib/utils";

export interface PaymentMethod {
  id: string;
  provider: string;
  label: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mobile_money",
    provider: "fedapay",
    label: "Mobile Money",
    description: "MTN MoMo, Moov, Celtiis (Benin)",
  },
  {
    id: "card",
    provider: "fedapay",
    label: "Carte bancaire",
    description: "Visa, Mastercard",
  },
  {
    id: "crypto",
    provider: "raenest",
    label: "Crypto (USDT/USDC)",
    description: "Paiement en stablecoins",
  },
];

export function PaymentMethods({
  availableProviders,
  selectedMethodId,
  onSelect,
}: {
  availableProviders: string[];
  selectedMethodId: string;
  onSelect: (method: PaymentMethod) => void;
}) {
  return (
    <div className="space-y-3">
      {PAYMENT_METHODS.map((method) => {
        const isAvailable = availableProviders.includes(method.provider);
        const isSelected = selectedMethodId === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(method)}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition flex items-center gap-3",
              !isAvailable
                ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                : isSelected
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 hover:border-primary-300 bg-white"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                isSelected ? "border-primary-500" : "border-slate-300"
              )}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-700">{method.label}</p>
              <p className="text-xs text-slate-500">{method.description}</p>
            </div>
            {!isAvailable && (
              <span className="text-xs text-slate-400">Indisponible</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
`);

// ============================================================
// 7. FRONTEND - Root Layout (corrige "Missing required html tags")
// ============================================================
console.log(' 7. frontend/app/layout.tsx');
writeFile('frontend/app/layout.tsx', `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`);

// ============================================================
// 8. FRONTEND - billing/return/page.tsx
// ============================================================
console.log(' 8. frontend/app/[locale]/billing/return/page.tsx');
writeFile('frontend/app/[locale]/billing/return/page.tsx', `"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Loader2, Clock, ArrowRight, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyStatus = "loading" | "success" | "failed" | "pending" | "error";

interface VerifyResponse {
  status: "verified" | "already_processed" | "pending";
  payment_id: string;
  new_status: "success" | "failed" | "pending" | "cancelled" | "refunded";
  real_status?: string;
}

function BillingReturnContent() {
  const t = useTranslations("billing");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // FedaPay renvoie ?id=XXX, on accepte aussi ?reference=XXX
  const reference = searchParams.get("reference") || searchParams.get("id");

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setError("Reference de transaction manquante.");
      return;
    }

    let isCancelled = false;

    const verifyPayment = async () => {
      try {
        setStatus("loading");
        const { data } = await api.get<VerifyResponse>("/billing/verify", {
          params: { reference },
        });

        if (isCancelled) return;

        setPaymentId(data.payment_id);

        if (data.new_status === "success") {
          setStatus("success");
        } else if (data.new_status === "failed" || data.new_status === "cancelled") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch (err: any) {
        if (isCancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Erreur de verification.";
        setError(msg);
        setStatus("error");
      }
    };

    verifyPayment();

    return () => {
      isCancelled = true;
    };
  }, [reference]);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    router.push(\`/\${params.locale}/dashboard/billing\`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verification du paiement...</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Nous confirmons votre transaction aupres de FedaPay.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-emerald-700">Paiement confirme !</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre compte a ete credite. Merci pour votre achat.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Paiement echoue</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre transaction n'a pas pu etre validee. Aucun debit n'a ete effectue.
              </p>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl text-amber-700">Paiement en cours</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Votre paiement est en cours de traitement.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Erreur de verification</CardTitle>
              <p className="text-sm text-red-600 mt-2">
                {error || "Impossible de verifier votre paiement."}
              </p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {reference && (
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Reference</p>
              <p className="font-mono text-sm text-slate-700 break-all">{reference}</p>
            </div>
          )}

          {paymentId && (
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">ID Paiement</p>
              <p className="font-mono text-xs text-slate-700 break-all">{paymentId}</p>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-sm text-emerald-800 font-medium">
                Vos credits ont ete ajoutes a votre compte !
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {status === "success" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Acceder au dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {status === "failed" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Retour a la facturation
              </Button>
            )}

            {status === "pending" && (
              <Button onClick={handleBackToDashboard} className="w-full bg-primary-600 hover:bg-primary-700">
                Acceder au dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {status === "error" && (
              <>
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reessayer
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard} className="w-full">
                  Retour a la facturation
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <BillingReturnContent />
    </Suspense>
  );
}
`);

// ============================================================
// RAPPORT FINAL
// ============================================================
console.log('\n✨ Tous les fichiers ont ete corriges !\n');
console.log('📋 Prochaines etapes :');
console.log('   1. Vider le cache Python :');
console.log('      Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force');
console.log('   2. Redemarrer le backend :');
console.log('      cd backend && uvicorn app.main:app --reload');
console.log('   3. Redemarrer le frontend :');
console.log('      cd frontend && npm run dev');
console.log('   4. Tester avec un NOUVEL email pour contourner le cache FedaPay');
console.log('\n Les corrections appliquees :');
console.log('   - schemas.py : ajoute "locale: str = fr" dans PaymentIntent');
console.log('   - fedapay.py : supprime phone_number + ajoute locale dans callback_url');
console.log('   - orchestrator.py : ajoute locale dans create_checkout');
console.log('   - base.py : ajoute get_transaction_status()');
console.log('   - plans.py : cree avec les 3 plans (Essentiel, Pro, Carriere)');
console.log('   - PaymentMethods.tsx : supprime les espaces dans les strings');
console.log('   - app/layout.tsx : cree le root layout minimal');
console.log('   - billing/return/page.tsx : cree la page de retour de paiement');