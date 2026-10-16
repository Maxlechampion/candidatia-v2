#!/usr/bin/env node
/**
 * setup-phase5d.js — CandidatIA
 * Phase 5d : Orchestrateur paiement + Router billing + Webhooks
 *
 * Crée :
 *   - backend/app/services/payment/orchestrator.py
 *   - backend/app/services/payment/plans.py
 *   - backend/app/routers/billing.py
 *   - backend/app/routers/webhooks.py
 *
 * Modifie :
 *   - backend/app/main.py (ajout routers billing + webhooks)
 *
 * Usage : node setup-phase5d.js
 * Prérequis : avoir exécuté setup-phase5c.js
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

logHeader('CandidatIA — Setup Phase 5d : Orchestrateur + Router billing');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'payment', 'raenest.py'))) {
  console.error('');
  console.error('  ERREUR : raenest.py introuvable.');
  console.error('  Execute d abord setup-phase5c.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. PLANS (tarification)
// ============================================================

logStep('1. payment/plans.py');

writeLines('backend/app/services/payment/plans.py', [
  '"""',
  'Definitions des plans tarifaires.',
  '',
  'Chaque plan a :',
  '  - code : identifiant interne',
  '  - name : nom commercial',
  '  - price_xof : prix en FCFA',
  '  - price_eur : prix en EUR (pour Flutterwave)',
  '  - price_usd : prix en USD (pour Raenest)',
  '  - credits : nombre de packs inclus',
  '"""',
  '',
  'from typing import Any, Dict, List, Optional',
  '',
  '',
  'PLANS: Dict[str, Dict[str, Any]] = {',
  '    "essentiel": {',
  '        "code": "essentiel",',
  '        "name": "Essentiel",',
  '        "description": "5 packs de candidature, sans filigrane",',
  '        "price_xof": 3300,      # ~5 EUR',
  '        "price_eur": 4.99,',
  '        "price_usd": 5.49,',
  '        "credits": 5,',
  '        "features": [',
  '            "5 packs de candidature",',
  '            "CV methode STAR",',
  '            "Lettre de motivation",',
  '            "Guide d entretien",',
  '            "Sans filigrane",',
  '        ],',
  '    },',
  '    "pro": {',
  '        "code": "pro",',
  '        "name": "Pro",',
  '        "description": "30 packs par mois + simulateur entretien",',
  '        "price_xof": 9800,      # ~15 EUR',
  '        "price_eur": 14.99,',
  '        "price_usd": 16.49,',
  '        "credits": 30,',
  '        "features": [',
  '            "30 packs par mois",',
  '            "Tous les documents",',
  '            "Simulateur entretien IA",',
  '            "Suivi des candidatures",',
  '            "Support prioritaire",',
  '        ],',
  '    },',
  '    "carriere": {',
  '        "code": "carriere",',
  '        "name": "Carriere",',
  '        "description": "Packs illimites + coaching IA",',
  '        "price_xof": 26200,     # ~40 EUR',
  '        "price_eur": 39.99,',
  '        "price_usd": 43.99,',
  '        "credits": 999999,      # Illimite',
  '        "features": [',
  '            "Packs illimites",',
  '            "Coaching IA personnalise",',
  '            "Optimisation LinkedIn",',
  '            "Preparation salariale",',
  '            "Support VIP",',
  '        ],',
  '    },',
  '}',
  '',
  '',
  'def get_plan(code: str) -> Optional[Dict[str, Any]]:',
  '    """Retourne un plan par son code ou None."""',
  '    return PLANS.get(code.lower())',
  '',
  '',
  'def list_plans() -> List[Dict[str, Any]]:',
  '    """Retourne la liste des plans disponibles."""',
  '    return list(PLANS.values())',
  '',
  '',
  'def get_price_for_provider(plan_code: str, provider: str) -> float:',
  '    """Retourne le prix adapte au provider (XOF, EUR ou USD)."""',
  '    plan = get_plan(plan_code)',
  '    if not plan:',
  '        raise ValueError(f"Plan inconnu : {plan_code}")',
  '',
  '    if provider == "fedapay":',
  '        return float(plan["price_xof"])',
  '    elif provider == "flutterwave":',
  '        return float(plan["price_eur"])',
  '    elif provider == "raenest":',
  '        return float(plan["price_usd"])',
  '    else:',
  '        return float(plan["price_xof"])',
  '',
  '',
  'def get_currency_for_provider(provider: str) -> str:',
  '    """Retourne la devise pour un provider."""',
  '    if provider == "fedapay":',
  '        return "XOF"',
  '    elif provider == "flutterwave":',
  '        return "EUR"',
  '    elif provider == "raenest":',
  '        return "USD"',
  '    return "XOF"',
]);

// ============================================================
// 2. ORCHESTRATEUR PAIEMENT
// ============================================================

logStep('2. payment/orchestrator.py');

writeLines('backend/app/services/payment/orchestrator.py', [
  '"""',
  'Orchestrateur paiement.',
  '',
  'Route automatiquement vers le bon provider selon le canal choisi.',
  'Sélectionne aussi le bon plan tarifaire.',
  '"""',
  '',
  'from datetime import datetime, timezone',
  'from typing import Any, Dict, List, Optional',
  '',
  'from app.core.database import insert_row, select_rows, update_row',
  'from app.core.errors import NotFoundError, PaymentError, ValidationError',
  'from app.core.logging import get_logger',
  'from app.services.auth.user_service import add_credits',
  'from app.services.payment.base import PaymentProvider',
  'from app.services.payment.fedapay import FedaPayProvider',
  'from app.services.payment.flutterwave import FlutterwaveProvider',
  'from app.services.payment.plans import (',
  '    get_currency_for_provider,',
  '    get_plan,',
  '    get_price_for_provider,',
  '    list_plans,',
  ')',
  'from app.services.payment.raenest import RaenestProvider',
  'from app.services.payment.schemas import (',
  '    PaymentIntent,',
  '    PaymentProviderName,',
  '    PaymentResult,',
  '    PaymentStatus,',
  '    WebhookPayload,',
  ')',
  '',
  'logger = get_logger("payment.orchestrator")',
  '',
  '',
  'class PaymentOrchestrator:',
  '    """Orchestrateur principal."""',
  '',
  '    def __init__(self) -> None:',
  '        self._providers: Dict[str, PaymentProvider] = {',
  '            "fedapay": FedaPayProvider(),',
  '            "flutterwave": FlutterwaveProvider(),',
  '            "raenest": RaenestProvider(),',
  '        }',
  '',
  '    def get_provider(self, name: str) -> PaymentProvider:',
  '        """Retourne un provider par son nom."""',
  '        provider = self._providers.get(name.lower())',
  '        if not provider:',
  '            raise ValidationError(message=f"Provider de paiement inconnu : {name}")',
  '        return provider',
  '',
  '    def available_providers(self) -> List[str]:',
  '        """Retourne les providers disponibles (configures)."""',
  '        return [name for name, p in self._providers.items() if p.is_available()]',
  '',
  '    def create_checkout(',
  '        self,',
  '        user_id: str,',
  '        user_email: str,',
  '        plan_code: str,',
  '        provider_name: str,',
  '        customer_name: Optional[str] = None,',
  '    ) -> Dict[str, Any]:',
  '        """',
  '        Cree une session de paiement.',
  '',
  '        Retourne un dict avec :',
  '          - payment_id : ID en DB',
  '          - checkout_url : URL/Adresse pour payer',
  '          - provider : nom du provider',
  '          - amount : montant',
  '          - currency : devise',
  '        """',
  '        # 1. Verifier le plan',
  '        plan = get_plan(plan_code)',
  '        if not plan:',
  '            raise NotFoundError(message=f"Plan inconnu : {plan_code}")',
  '',
  '        # 2. Verifier le provider',
  '        provider = self.get_provider(provider_name)',
  '        if not provider.is_available():',
  '            raise PaymentError(',
  '                message=f"Provider {provider_name} non disponible actuellement.",',
  '                details={"provider": provider_name},',
  '            )',
  '',
  '        # 3. Calculer le montant',
  '        amount = get_price_for_provider(plan_code, provider_name)',
  '        currency = get_currency_for_provider(provider_name)',
  '',
  '        # 4. Creer l intention de paiement',
  '        intent = PaymentIntent(',
  '            user_id=user_id,',
  '            amount=amount,',
  '            currency=currency,',
  '            plan_code=plan_code,',
  '            credits_to_add=plan["credits"],',
  '            description=f"Achat plan {plan[\'name\']}",',
  '            customer_email=user_email,',
  '            customer_name=customer_name,',
  '            metadata={"plan_name": plan["name"]},',
  '        )',
  '',
  '        # 5. Appeler le provider',
  '        try:',
  '            result: PaymentResult = provider.safe_checkout(intent)',
  '        except PaymentError:',
  '            raise',
  '        except Exception as e:',
  '            logger.exception("checkout_failed", provider=provider_name, error=str(e))',
  '            raise PaymentError(',
  '                message=f"Erreur creation checkout : {str(e)}",',
  '                details={"provider": provider_name},',
  '            ) from e',
  '',
  '        # 6. Enregistrer en DB',
  '        payment_record = insert_row("payments", {',
  '            "user_id": user_id,',
  '            "provider": provider_name,',
  '            "provider_transaction_id": result.provider_transaction_id,',
  '            "amount": amount,',
  '            "currency": currency,',
  '            "credits_added": plan["credits"],',
  '            "plan_purchased": plan_code,',
  '            "status": "pending",',
  '            "metadata": {',
  '                "checkout_url": result.checkout_url,',
  '                "plan_name": plan["name"],',
  '            },',
  '        })',
  '',
  '        logger.info(',
  '            "checkout_created",',
  '            user_id=user_id,',
  '            provider=provider_name,',
  '            plan=plan_code,',
  '            amount=amount,',
  '            payment_id=payment_record.get("id"),',
  '        )',
  '',
  '        return {',
  '            "payment_id": payment_record.get("id"),',
  '            "checkout_url": result.checkout_url,',
  '            "provider": provider_name,',
  '            "provider_transaction_id": result.provider_transaction_id,',
  '            "amount": amount,',
  '            "currency": currency,',
  '            "plan_code": plan_code,',
  '            "plan_name": plan["name"],',
  '            "credits_to_add": plan["credits"],',
  '        }',
  '',
  '    def handle_webhook(',
  '        self,',
  '        provider_name: str,',
  '        headers: Dict[str, str],',
  '        body: bytes,',
  '    ) -> Dict[str, Any]:',
  '        """',
  '        Traite un webhook provider.',
  '',
  '        - Verifie la signature',
  '        - Met a jour le paiement en DB',
  '        - Ajoute les credits si succes',
  '        """',
  '        provider = self.get_provider(provider_name)',
  '',
  '        # 1. Verifier la signature et extraire le payload',
  '        try:',
  '            payload: WebhookPayload = provider.verify_webhook(headers, body)',
  '        except PaymentError:',
  '            raise',
  '        except Exception as e:',
  '            logger.exception("webhook_verify_failed", provider=provider_name, error=str(e))',
  '            raise PaymentError(message=f"Webhook invalide : {str(e)}") from e',
  '',
  '        logger.info(',
  '            "webhook_received",',
  '            provider=provider_name,',
  '            transaction_id=payload.provider_transaction_id,',
  '            status=payload.status.value,',
  '        )',
  '',
  '        # 2. Trouver le paiement en DB',
  '        payments = select_rows(',
  '            "payments",',
  '            filters={"provider_transaction_id": payload.provider_transaction_id},',
  '            limit=1,',
  '        )',
  '',
  '        if not payments:',
  '            logger.warning(',
  '                "webhook_payment_not_found",',
  '                provider=provider_name,',
  '                transaction_id=payload.provider_transaction_id,',
  '            )',
  '            raise NotFoundError(message="Paiement introuvable.")',
  '',
  '        payment = payments[0]',
  '        current_status = payment.get("status", "pending")',
  '',
  '        # 3. Idempotence : ne rien faire si deja traite',
  '        if current_status == "success":',
  '            logger.info("webhook_already_processed", payment_id=payment.get("id"))',
  '            return {"status": "already_processed", "payment_id": payment.get("id")}',
  '',
  '        # 4. Mettre a jour le statut',
  '        new_status = payload.status.value',
  '        update_row(',
  '            "payments",',
  '            {"id": payment["id"]},',
  '            {',
  '                "status": new_status,',
  '                "updated_at": datetime.now(timezone.utc).isoformat(),',
  '                "metadata": {',
  '                    **(payment.get("metadata") or {}),',
  '                    "webhook_received_at": datetime.now(timezone.utc).isoformat(),',
  '                },',
  '            },',
  '        )',
  '',
  '        # 5. Si succes, ajouter les credits',
  '        if payload.status == PaymentStatus.SUCCESS:',
  '            try:',
  '                user_id = payment["user_id"]',
  '                credits = payment.get("credits_added", 0)',
  '',
  '                if credits > 0:',
  '                    add_credits(user_id, credits)',
  '                    logger.info(',
  '                        "credits_added",',
  '                        user_id=user_id,',
  '                        credits=credits,',
  '                        payment_id=payment["id"],',
  '                    )',
  '            except Exception as e:',
  '                logger.exception(',
  '                    "credits_add_failed",',
  '                    payment_id=payment["id"],',
  '                    error=str(e),',
  '                )',
  '                # On ne raise pas : le paiement est enregistre',
  '',
  '        return {',
  '            "status": "processed",',
  '            "payment_id": payment["id"],',
  '            "new_status": new_status,',
  '        }',
  '',
  '    def list_user_payments(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:',
  '        """Retourne l historique des paiements d un utilisateur."""',
  '        return select_rows(',
  '            "payments",',
  '            filters={"user_id": user_id},',
  '            limit=limit,',
  '            order_by="created_at",',
  '            descending=True,',
  '        )',
  '',
  '',
  '# Singleton',
  '_orchestrator: Optional[PaymentOrchestrator] = None',
  '',
  '',
  'def get_payment_orchestrator() -> PaymentOrchestrator:',
  '    global _orchestrator',
  '    if _orchestrator is None:',
  '        _orchestrator = PaymentOrchestrator()',
  '    return _orchestrator',
]);

// ============================================================
// 3. ROUTER BILLING
// ============================================================

logStep('3. routers/billing.py');

writeLines('backend/app/routers/billing.py', [
  '"""Router /api/billing — Paiement et historique."""',
  '',
  'from typing import Any, Dict, List, Optional',
  '',
  'from fastapi import APIRouter, Depends, HTTPException',
  'from pydantic import BaseModel, Field',
  '',
  'from app.core.logging import get_logger',
  'from app.core.security import get_current_user',
  'from app.services.payment.orchestrator import get_payment_orchestrator',
  'from app.services.payment.plans import list_plans',
  '',
  'logger = get_logger("router.billing")',
  'router = APIRouter(prefix="/api/billing", tags=["billing"])',
  '',
  '',
  'class CheckoutRequest(BaseModel):',
  '    """Payload de demande de paiement."""',
  '    plan_code: str = Field(..., description="Code du plan (essentiel, pro, carriere)")',
  '    provider: str = Field(..., description="Provider (fedapay, flutterwave, raenest)")',
  '    customer_name: Optional[str] = None',
  '',
  '',
  '@router.get("/plans", summary="Liste des plans disponibles")',
  'async def get_plans() -> Dict[str, Any]:',
  '    """Retourne la liste des plans tarifaires."""',
  '    return {"plans": list_plans()}',
  '',
  '',
  '@router.get("/providers", summary="Providers de paiement disponibles")',
  'async def get_providers() -> Dict[str, Any]:',
  '    """Retourne les providers actuellement configures."""',
  '    orchestrator = get_payment_orchestrator()',
  '    return {"providers": orchestrator.available_providers()}',
  '',
  '',
  '@router.post("/checkout", summary="Creer une session de paiement")',
  'async def create_checkout(',
  '    payload: CheckoutRequest,',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  ') -> Dict[str, Any]:',
  '    """Cree une session de paiement pour un plan donne."""',
  '    orchestrator = get_payment_orchestrator()',
  '',
  '    try:',
  '        result = orchestrator.create_checkout(',
  '            user_id=user["id"],',
  '            user_email=user["email"],',
  '            plan_code=payload.plan_code,',
  '            provider_name=payload.provider,',
  '            customer_name=payload.customer_name or user.get("full_name"),',
  '        )',
  '        return result',
  '    except Exception as e:',
  '        logger.exception("checkout_endpoint_failed", error=str(e))',
  '        raise HTTPException(status_code=400, detail=str(e))',
  '',
  '',
  '@router.get("/payments", summary="Historique des paiements")',
  'async def list_payments(',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  '    limit: int = 20,',
  ') -> List[Dict[str, Any]]:',
  '    """Retourne l historique des paiements de l utilisateur."""',
  '    if limit < 1 or limit > 100:',
  '        raise HTTPException(status_code=400, detail="Limit doit etre entre 1 et 100.")',
  '',
  '    orchestrator = get_payment_orchestrator()',
  '    return orchestrator.list_user_payments(user["id"], limit=limit)',
]);

// ============================================================
// 4. ROUTER WEBHOOKS
// ============================================================

logStep('4. routers/webhooks.py');

writeLines('backend/app/routers/webhooks.py', [
  '"""',
  'Router /webhooks — Reception des notifications providers.',
  '',
  'Ces endpoints sont PUBLICS (pas de JWT) mais verifies par signature.',
  '"""',
  '',
  'from typing import Any, Dict',
  '',
  'from fastapi import APIRouter, HTTPException, Request',
  '',
  'from app.core.errors import PaymentError',
  'from app.core.logging import get_logger',
  'from app.services.payment.orchestrator import get_payment_orchestrator',
  '',
  'logger = get_logger("router.webhooks")',
  'router = APIRouter(prefix="/webhooks", tags=["webhooks"])',
  '',
  '',
  'async def _process_webhook(',
  '    provider_name: str,',
  '    request: Request,',
  ') -> Dict[str, Any]:',
  '    """Traite un webhook d un provider donne."""',
  '    body = await request.body()',
  '    headers = dict(request.headers)',
  '',
  '    logger.info(',
  '        "webhook_endpoint_called",',
  '        provider=provider_name,',
  '        body_size=len(body),',
  '        headers_count=len(headers),',
  '    )',
  '',
  '    orchestrator = get_payment_orchestrator()',
  '',
  '    try:',
  '        result = orchestrator.handle_webhook(provider_name, headers, body)',
  '        return {"status": "ok", **result}',
  '    except PaymentError as e:',
  '        logger.warning("webhook_payment_error", provider=provider_name, error=str(e))',
  '        raise HTTPException(status_code=400, detail=str(e))',
  '    except Exception as e:',
  '        logger.exception("webhook_unexpected_error", provider=provider_name, error=str(e))',
  '        raise HTTPException(status_code=500, detail=f"Erreur webhook : {str(e)}")',
  '',
  '',
  '@router.post("/fedapay", summary="Webhook FedaPay")',
  'async def webhook_fedapay(request: Request) -> Dict[str, Any]:',
  '    """Recoit les notifications de FedaPay."""',
  '    return await _process_webhook("fedapay", request)',
  '',
  '',
  '@router.post("/flutterwave", summary="Webhook Flutterwave")',
  'async def webhook_flutterwave(request: Request) -> Dict[str, Any]:',
  '    """Recoit les notifications de Flutterwave."""',
  '    return await _process_webhook("flutterwave", request)',
  '',
  '',
  '@router.post("/raenest", summary="Webhook Raenest")',
  'async def webhook_raenest(request: Request) -> Dict[str, Any]:',
  '    """Recoit les notifications de Raenest."""',
  '    return await _process_webhook("raenest", request)',
]);

// ============================================================
// 5. MISE À JOUR main.py
// ============================================================

logStep('5. main.py (ajout routers billing + webhooks)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');
let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

if (!mainContent.includes('billing')) {
  mainContent = mainContent.replace(
    /from app\.routers import ([^\n]+)/,
    (match, modules) => {
      const mods = modules.split(',').map(m => m.trim());
      ['billing', 'webhooks'].forEach(m => {
        if (!mods.includes(m)) mods.push(m);
      });
      return 'from app.routers import ' + mods.join(', ');
    }
  );
}

const includesToAdd = [
  { marker: 'app.include_router(quota.router)', newLine: 'app.include_router(billing.router)' },
  { marker: 'app.include_router(billing.router)', newLine: 'app.include_router(webhooks.router)' },
];

for (const item of includesToAdd) {
  if (!mainContent.includes(item.newLine)) {
    mainContent = mainContent.replace(
      new RegExp('(\\s+)' + item.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      '$1' + item.marker + '\n$1' + item.newLine
    );
  }
}

if (mainContent !== originalContent) {
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log('  OK  backend/app/main.py (mis a jour)');
} else {
  console.log('  SKIP  backend/app/main.py (deja a jour)');
}

// ============================================================
// 6. TESTS
// ============================================================

logStep('6. tests/test_billing_router.py');

writeLines('backend/tests/test_billing_router.py', [
  '"""Tests du router /api/billing."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_plans_endpoint_public(client: TestClient) -> None:',
  '    """L endpoint /api/billing/plans est public."""',
  '    response = client.get("/api/billing/plans")',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert "plans" in data',
  '    assert len(data["plans"]) == 3',
  '',
  '    codes = {p["code"] for p in data["plans"]}',
  '    assert codes == {"essentiel", "pro", "carriere"}',
  '',
  '',
  'def test_providers_endpoint_public(client: TestClient) -> None:',
  '    """L endpoint /api/billing/providers est public."""',
  '    response = client.get("/api/billing/providers")',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert "providers" in data',
  '    assert isinstance(data["providers"], list)',
  '',
  '',
  'def test_checkout_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /api/billing/checkout requiert un JWT."""',
  '    response = client.post(',
  '        "/api/billing/checkout",',
  '        json={"plan_code": "essentiel", "provider": "fedapay"},',
  '    )',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_payments_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /api/billing/payments requiert un JWT."""',
  '    response = client.get("/api/billing/payments")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_webhook_fedapay_no_signature_returns_400(client: TestClient) -> None:',
  '    """Un webhook sans signature retourne 400."""',
  '    response = client.post(',
  '        "/webhooks/fedapay",',
  '        json={"name": "transaction.approved", "entity": {"id": 123}},',
  '    )',
  '    assert response.status_code == 400',
  '',
  '',
  'def test_webhook_flutterwave_no_signature_returns_400(client: TestClient) -> None:',
  '    """Un webhook sans signature retourne 400."""',
  '    response = client.post(',
  '        "/webhooks/flutterwave",',
  '        json={"event": "charge.completed", "data": {"tx_ref": "abc"}},',
  '    )',
  '    assert response.status_code == 400',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 5d terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/payment/plans.py');
console.log('    - backend/app/services/payment/orchestrator.py');
console.log('    - backend/app/routers/billing.py');
console.log('    - backend/app/routers/webhooks.py');
console.log('    - backend/tests/test_billing_router.py');
console.log('');
console.log('  Fichiers mis a jour :');
console.log('    - backend/app/main.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Redemarrer uvicorn :');
console.log('     CTRL+C puis :');
console.log('     uvicorn app.main:app --reload');
console.log('');
console.log('  2. Verifier les endpoints :');
console.log('     (irm http://localhost:8000/openapi.json).paths | Get-Member -MemberType NoteProperty | Select-Object Name');
console.log('');
console.log('     Attendu : /api/billing/plans, /api/billing/providers, /api/billing/checkout,');
console.log('               /api/billing/payments, /webhooks/fedapay, /webhooks/flutterwave, /webhooks/raenest');
console.log('');
console.log('  3. Tester :');
console.log('     irm http://localhost:8000/api/billing/plans');
console.log('     irm http://localhost:8000/api/billing/providers');
console.log('');
console.log('  4. Lancer les tests :');
console.log('     pytest tests/test_billing_router.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase5e.js (tests d integration + script manuel)');
console.log('');