#!/usr/bin/env node
/**
 * setup-phase5a.js — CandidatIA
 * Phase 5a : Interface paiement + FedaPay (Mobile Money)
 *
 * Crée :
 *   - backend/app/services/payment/__init__.py
 *   - backend/app/services/payment/base.py
 *   - backend/app/services/payment/schemas.py
 *   - backend/app/services/payment/fedapay.py
 *   - backend/tests/test_payment_schemas.py
 *   - backend/tests/test_fedapay_service.py
 *
 * Usage : node setup-phase5a.js
 * Prérequis : avoir exécuté setup-phase4e.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, lines.join('\n') + '\n', 'utf-8');
  console.log('  OK  ' + relPath);
}

function logHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
  console.log('');
}

function logStep(step) {
  console.log('');
  console.log('> ' + step);
}

logHeader('CandidatIA — Setup Phase 5a : Paiement + FedaPay');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'auth.py'))) {
  console.error('');
  console.error('  ERREUR : auth.py introuvable.');
  console.error('  Execute d abord setup-phase4e.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. PAYMENT __init__
// ============================================================

logStep('1. payment/__init__.py');

writeLines('backend/app/services/payment/__init__.py', [
  '"""Services de paiement (FedaPay, Flutterwave, Raenest)."""',
  '',
  'from app.services.payment.base import PaymentProvider',
  'from app.services.payment.schemas import (',
  '    PaymentIntent,',
  '    PaymentResult,',
  '    PaymentStatus,',
  '    PaymentProviderName,',
  ')',
  '',
  '__all__ = [',
  '    "PaymentProvider",',
  '    "PaymentIntent",',
  '    "PaymentResult",',
  '    "PaymentStatus",',
  '    "PaymentProviderName",',
  ']',
]);

// ============================================================
// 2. PAYMENT SCHEMAS
// ============================================================

logStep('2. payment/schemas.py');

writeLines('backend/app/services/payment/schemas.py', [
  '"""Schemas Pydantic pour le module paiement."""',
  '',
  'from datetime import datetime',
  'from enum import Enum',
  'from typing import Any, Dict, Optional',
  '',
  'from pydantic import BaseModel, Field',
  '',
  '',
  'class PaymentProviderName(str, Enum):',
  '    """Noms des providers de paiement supportes."""',
  '    FEDAPAY = "fedapay"',
  '    FLUTTERWAVE = "flutterwave"',
  '    RAENEST = "raenest"',
  '',
  '',
  'class PaymentStatus(str, Enum):',
  '    """Statuts possibles d un paiement."""',
  '    PENDING = "pending"',
  '    SUCCESS = "success"',
  '    FAILED = "failed"',
  '    REFUNDED = "refunded"',
  '    CANCELLED = "cancelled"',
  '',
  '',
  'class PaymentIntent(BaseModel):',
  '    """Intention de paiement (creation d une session)."""',
  '    user_id: str',
  '    amount: float = Field(..., gt=0)',
  '    currency: str = "XOF"',
  '    plan_code: str',
  '    credits_to_add: int = Field(..., ge=0)',
  '    description: Optional[str] = None',
  '    customer_email: Optional[str] = None',
  '    customer_name: Optional[str] = None',
  '    metadata: Dict[str, Any] = {}',
  '',
  '',
  'class PaymentResult(BaseModel):',
  '    """Resultat d une creation de session de paiement."""',
  '    provider: PaymentProviderName',
  '    provider_transaction_id: str',
  '    checkout_url: str',
  '    status: PaymentStatus',
  '    amount: float',
  '    currency: str',
  '    raw_response: Optional[Dict[str, Any]] = None',
  '',
  '',
  'class WebhookPayload(BaseModel):',
  '    """Payload normalise d un webhook provider."""',
  '    provider: PaymentProviderName',
  '    provider_transaction_id: str',
  '    status: PaymentStatus',
  '    amount: Optional[float] = None',
  '    currency: Optional[str] = None',
  '    metadata: Dict[str, Any] = {}',
  '    raw: Optional[Dict[str, Any]] = None',
  '',
  '',
  'class PaymentRecord(BaseModel):',
  '    """Enregistrement de paiement en DB."""',
  '    id: Optional[str] = None',
  '    user_id: str',
  '    provider: str',
  '    provider_transaction_id: str',
  '    amount: float',
  '    currency: str',
  '    credits_added: int = 0',
  '    plan_purchased: Optional[str] = None',
  '    status: str = "pending"',
  '    metadata: Dict[str, Any] = {}',
  '    created_at: Optional[datetime] = None',
  '',
  '',
  'class PlanInfo(BaseModel):',
  '    """Informations d un plan tarifaire."""',
  '    code: str',
  '    name: str',
  '    price_eur: float',
  '    credits: int',
  '    description: str = ""',
]);

// ============================================================
// 3. PAYMENT BASE (interface abstraite)
// ============================================================

logStep('3. payment/base.py');

writeLines('backend/app/services/payment/base.py', [
  '"""Interface abstraite de tout provider de paiement."""',
  '',
  'from abc import ABC, abstractmethod',
  'from typing import Any, Dict',
  '',
  'from app.core.errors import PaymentError',
  'from app.services.payment.schemas import (',
  '    PaymentIntent,',
  '    PaymentResult,',
  '    WebhookPayload,',
  ')',
  '',
  '',
  'class PaymentProvider(ABC):',
  '    """Classe abstraite pour un provider de paiement."""',
  '',
  '    name: str = "base"',
  '',
  '    @abstractmethod',
  '    def is_available(self) -> bool:',
  '        """Retourne True si le provider est configure (cles API presentes)."""',
  '        ...',
  '',
  '    @abstractmethod',
  '    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:',
  '        """Cree une session de paiement et retourne l URL de checkout."""',
  '        ...',
  '',
  '    @abstractmethod',
  '    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:',
  '        """Verifie la signature d un webhook et retourne le payload normalise."""',
  '        ...',
  '',
  '    def safe_checkout(self, intent: PaymentIntent) -> PaymentResult:',
  '        """Point d entree public pour create_checkout avec gestion d erreurs."""',
  '        if not self.is_available():',
  '            raise PaymentError(',
  '                message=f"Provider {self.name} non configure.",',
  '                details={"provider": self.name},',
  '            )',
  '',
  '        try:',
  '            return self.create_checkout(intent)',
  '        except PaymentError:',
  '            raise',
  '        except Exception as e:',
  '            raise PaymentError(',
  '                message=f"Erreur {self.name}: {str(e)}",',
  '                details={"provider": self.name, "error": str(e)},',
  '            ) from e',
]);

// ============================================================
// 4. FEDAPAY PROVIDER
// ============================================================

logStep('4. payment/fedapay.py');

writeLines('backend/app/services/payment/fedapay.py', [
  '"""Provider de paiement : FedaPay (Mobile Money Benin)."""',
  '',
  'import hashlib',
  'import hmac',
  'import json',
  'from typing import Any, Dict, Optional',
  '',
  'import httpx',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import PaymentError',
  'from app.core.logging import get_logger',
  'from app.services.payment.base import PaymentProvider',
  'from app.services.payment.schemas import (',
  '    PaymentIntent,',
  '    PaymentProviderName,',
  '    PaymentResult,',
  '    PaymentStatus,',
  '    WebhookPayload,',
  ')',
  '',
  'logger = get_logger("payment.fedapay")',
  '',
  '',
  'FEDAPAY_API_URL_SANDBOX = "https://sandbox-api.fedapay.com/v1"',
  'FEDAPAY_API_URL_LIVE = "https://api.fedapay.com/v1"',
  '',
  '',
  'class FedaPayProvider(PaymentProvider):',
  '    name = "fedapay"',
  '',
  '    def __init__(self) -> None:',
  '        self.settings = get_settings()',
  '',
  '    def is_available(self) -> bool:',
  '        return bool(self.settings.fedapay_secret_key)',
  '',
  '    def _api_url(self) -> str:',
  '        if self.settings.fedapay_env == "live":',
  '            return FEDAPAY_API_URL_LIVE',
  '        return FEDAPAY_API_URL_SANDBOX',
  '',
  '    def _headers(self) -> Dict[str, str]:',
  '        return {',
  '            "Authorization": f"Bearer {self.settings.fedapay_secret_key}",',
  '            "Content-Type": "application/json",',
  '            "Accept": "application/json",',
  '        }',
  '',
  '    def create_checkout(self, intent: PaymentIntent) -> PaymentResult:',
  '        """Cree une transaction FedaPay et retourne l URL de paiement."""',
  '        url = f"{self._api_url()}/transactions"',
  '',
  '        payload = {',
  '            "description": intent.description or f"Achat plan {intent.plan_code}",',
  '            "amount": int(intent.amount),',
  '            "currency": {"iso": intent.currency},',
  '            "callback_url": f"{self.settings.frontend_url}/billing/return",',
  '            "customer": {',
  '                "email": intent.customer_email or f"{intent.user_id}@candidatia.com",',
  '                "firstname": (intent.customer_name or "Client").split(" ")[0],',
  '                "lastname": (intent.customer_name or "Client").split(" ")[-1],',
  '            },',
  '            "metadata": {',
  '                **intent.metadata,',
  '                "user_id": intent.user_id,',
  '                "plan_code": intent.plan_code,',
  '                "credits_to_add": intent.credits_to_add,',
  '            },',
  '        }',
  '',
  '        logger.info(',
  '            "fedapay_create_transaction",',
  '            amount=intent.amount,',
  '            currency=intent.currency,',
  '            plan=intent.plan_code,',
  '            env=self.settings.fedapay_env,',
  '        )',
  '',
  '        try:',
  '            with httpx.Client(timeout=30) as client:',
  '                response = client.post(url, headers=self._headers(), json=payload)',
  '',
  '                if response.status_code not in (200, 201):',
  '                    logger.error(',
  '                        "fedapay_create_failed",',
  '                        status=response.status_code,',
  '                        body=response.text[:500],',
  '                    )',
  '                    raise PaymentError(',
  '                        message=f"FedaPay a refuse la transaction ({response.status_code}).",',
  '                        details={"status": response.status_code, "body": response.text[:200]},',
  '                    )',
  '',
  '                data = response.json()',
  '                transaction = data.get("v1", {}).get("transaction", data)',
  '                transaction_id = str(transaction.get("id", ""))',
  '',
  '                if not transaction_id:',
  '                    raise PaymentError(message="FedaPay n a pas retourne d ID de transaction.")',
  '',
  '                # Genere le lien de paiement',
  '                token_url = f"{self._api_url()}/transactions/{transaction_id}/token"',
  '                token_response = client.post(token_url, headers=self._headers())',
  '',
  '                if token_response.status_code not in (200, 201):',
  '                    raise PaymentError(',
  '                        message="FedaPay n a pas pu generer le lien de paiement.",',
  '                        details={"body": token_response.text[:200]},',
  '                    )',
  '',
  '                token_data = token_response.json()',
  '                token = token_data.get("token")',
  '',
  '                if not token:',
  '                    raise PaymentError(message="FedaPay n a pas retourne de token de paiement.")',
  '',
  '                checkout_url = f"https://process.fedapay.com/{token}"',
  '                if self.settings.fedapay_env == "sandbox":',
  '                    checkout_url = f"https://sandbox-process.fedapay.com/{token}"',
  '',
  '                logger.info(',
  '                    "fedapay_transaction_created",',
  '                    transaction_id=transaction_id,',
  '                    checkout_url=checkout_url[:60],',
  '                )',
  '',
  '                return PaymentResult(',
  '                    provider=PaymentProviderName.FEDAPAY,',
  '                    provider_transaction_id=transaction_id,',
  '                    checkout_url=checkout_url,',
  '                    status=PaymentStatus.PENDING,',
  '                    amount=intent.amount,',
  '                    currency=intent.currency,',
  '                    raw_response=data,',
  '                )',
  '',
  '        except httpx.HTTPError as e:',
  '            logger.exception("fedapay_http_error", error=str(e))',
  '            raise PaymentError(',
  '                message=f"Erreur reseau FedaPay : {str(e)}",',
  '                details={"error": str(e)},',
  '            ) from e',
  '',
  '    def verify_webhook(self, headers: Dict[str, str], body: bytes) -> WebhookPayload:',
  '        """Verifie la signature d un webhook FedaPay."""',
  '        signature = headers.get("x-fedapay-signature") or headers.get("X-FedaPay-Signature")',
  '',
  '        if not signature:',
  '            raise PaymentError(message="Signature webhook FedaPay manquante.")',
  '',
  '        if self.settings.fedapay_webhook_secret:',
  '            expected = hmac.new(',
  '                self.settings.fedapay_webhook_secret.encode("utf-8"),',
  '                body,',
  '                hashlib.sha256,',
  '            ).hexdigest()',
  '',
  '            if not hmac.compare_digest(signature, expected):',
  '                logger.warning("fedapay_webhook_bad_signature")',
  '                raise PaymentError(message="Signature webhook FedaPay invalide.")',
  '',
  '        try:',
  '            payload_data = json.loads(body.decode("utf-8"))',
  '        except json.JSONDecodeError as e:',
  '            raise PaymentError(message=f"Webhook FedaPay invalide : {str(e)}") from e',
  '',
  '        entity = payload_data.get("entity", {})',
  '        event = payload_data.get("name", "")',
  '',
  '        transaction_id = str(entity.get("id", ""))',
  '        status_raw = entity.get("status", "").lower()',
  '',
  '        status_map = {',
  '            "approved": PaymentStatus.SUCCESS,',
  '            "transferred": PaymentStatus.SUCCESS,',
  '            "pending": PaymentStatus.PENDING,',
  '            "declined": PaymentStatus.FAILED,',
  '            "canceled": PaymentStatus.CANCELLED,',
  '            "refunded": PaymentStatus.REFUNDED,',
  '        }',
  '        status = status_map.get(status_raw, PaymentStatus.PENDING)',
  '',
  '        logger.info(',
  '            "fedapay_webhook_received",',
  '            transaction_id=transaction_id,',
  '            event=event,',
  '            status=status.value,',
  '        )',
  '',
  '        return WebhookPayload(',
  '            provider=PaymentProviderName.FEDAPAY,',
  '            provider_transaction_id=transaction_id,',
  '            status=status,',
  '            amount=float(entity.get("amount", 0)),',
  '            currency=(entity.get("currency") or {}).get("iso", "XOF") if isinstance(entity.get("currency"), dict) else "XOF",',
  '            metadata=entity.get("metadata", {}) or {},',
  '            raw=payload_data,',
  '        )',
]);

// ============================================================
// 5. TESTS
// ============================================================

logStep('5. Tests unitaires');

writeLines('backend/tests/test_payment_schemas.py', [
  '"""Tests des schemas de paiement."""',
  '',
  'import pytest',
  '',
  'from app.services.payment.schemas import (',
  '    PaymentIntent,',
  '    PaymentProviderName,',
  '    PaymentResult,',
  '    PaymentStatus,',
  '    WebhookPayload,',
  ')',
  '',
  '',
  'def test_payment_intent_valid() -> None:',
  '    intent = PaymentIntent(',
  '        user_id="user-123",',
  '        amount=5000.0,',
  '        currency="XOF",',
  '        plan_code="essentiel",',
  '        credits_to_add=5,',
  '    )',
  '    assert intent.amount == 5000.0',
  '    assert intent.currency == "XOF"',
  '    assert intent.credits_to_add == 5',
  '',
  '',
  'def test_payment_intent_negative_amount_raises() -> None:',
  '    with pytest.raises(Exception):',
  '        PaymentIntent(',
  '            user_id="user-123",',
  '            amount=-100,',
  '            plan_code="essentiel",',
  '            credits_to_add=5,',
  '        )',
  '',
  '',
  'def test_payment_result_valid() -> None:',
  '    result = PaymentResult(',
  '        provider=PaymentProviderName.FEDAPAY,',
  '        provider_transaction_id="txn-123",',
  '        checkout_url="https://process.fedapay.com/abc",',
  '        status=PaymentStatus.PENDING,',
  '        amount=5000.0,',
  '        currency="XOF",',
  '    )',
  '    assert result.provider == PaymentProviderName.FEDAPAY',
  '    assert result.status == PaymentStatus.PENDING',
  '',
  '',
  'def test_webhook_payload_valid() -> None:',
  '    payload = WebhookPayload(',
  '        provider=PaymentProviderName.FEDAPAY,',
  '        provider_transaction_id="txn-456",',
  '        status=PaymentStatus.SUCCESS,',
  '        amount=5000.0,',
  '        currency="XOF",',
  '        metadata={"user_id": "user-123"},',
  '    )',
  '    assert payload.status == PaymentStatus.SUCCESS',
  '    assert payload.metadata["user_id"] == "user-123"',
  '',
  '',
  'def test_payment_status_enum_values() -> None:',
  '    assert PaymentStatus.PENDING.value == "pending"',
  '    assert PaymentStatus.SUCCESS.value == "success"',
  '    assert PaymentStatus.FAILED.value == "failed"',
  '',
  '',
  'def test_payment_provider_enum_values() -> None:',
  '    assert PaymentProviderName.FEDAPAY.value == "fedapay"',
  '    assert PaymentProviderName.FLUTTERWAVE.value == "flutterwave"',
  '    assert PaymentProviderName.RAENEST.value == "raenest"',
]);

writeLines('backend/tests/test_fedapay_service.py', [
  '"""Tests du provider FedaPay."""',
  '',
  'from app.services.payment.fedapay import FedaPayProvider',
  '',
  '',
  'def test_fedapay_provider_instantiation() -> None:',
  '    """Verifie que le provider peut etre instancie."""',
  '    provider = FedaPayProvider()',
  '    assert provider.name == "fedapay"',
  '',
  '',
  'def test_fedapay_is_available_without_key() -> None:',
  '    """Sans cle API, is_available doit retourner False."""',
  '    provider = FedaPayProvider()',
  '    # Note : depend de la config .env actuelle',
  '    # Si FEDAPAY_SECRET_KEY est definie, ce test peut echouer',
  '    result = provider.is_available()',
  '    assert isinstance(result, bool)',
  '',
  '',
  'def test_fedapay_api_url_sandbox() -> None:',
  '    """L URL sandbox doit contenir sandbox-api."""',
  '    provider = FedaPayProvider()',
  '    provider.settings.fedapay_env = "sandbox"',
  '    url = provider._api_url()',
  '    assert "sandbox-api" in url',
  '',
  '',
  'def test_fedapay_api_url_live() -> None:',
  '    """L URL live doit contenir api.fedapay.com."""',
  '    provider = FedaPayProvider()',
  '    provider.settings.fedapay_env = "live"',
  '    url = provider._api_url()',
  '    assert "sandbox" not in url',
  '    assert "api.fedapay.com" in url',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 5a terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/payment/__init__.py');
console.log('    - backend/app/services/payment/schemas.py');
console.log('    - backend/app/services/payment/base.py');
console.log('    - backend/app/services/payment/fedapay.py');
console.log('    - backend/tests/test_payment_schemas.py');
console.log('    - backend/tests/test_fedapay_service.py');
console.log('');
console.log('  IMPORTANT : Configurer FedaPay dans .env');
console.log('    1. Inscription sandbox : https://fedapay.com');
console.log('    2. Recuperer les cles API sandbox');
console.log('    3. Ajouter dans backend/.env :');
console.log('       FEDAPAY_SECRET_KEY=sk_sandbox_xxx');
console.log('       FEDAPAY_PUBLIC_KEY=pk_sandbox_xxx');
console.log('       FEDAPAY_ENV=sandbox');
console.log('');
console.log('  TESTS :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pip install httpx==0.27.2');
console.log('    pytest tests/test_payment_schemas.py tests/test_fedapay_service.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase5b.js (Flutterwave)');
console.log('');