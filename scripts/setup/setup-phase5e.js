#!/usr/bin/env node
/**
 * setup-phase5e.js — CandidatIA
 * Phase 5e : Tests d integration paiement + script manuel
 *
 * Crée :
 *   - backend/tests/test_billing_integration.py
 *   - backend/scripts/test_payment_flow.py
 *
 * Usage : node setup-phase5e.js
 * Prérequis : avoir exécuté setup-phase5d.js
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

logHeader('CandidatIA — Setup Phase 5e : Tests integration paiement');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'billing.py'))) {
  console.error('');
  console.error('  ERREUR : billing.py introuvable.');
  console.error('  Execute d abord setup-phase5d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. TESTS D'INTEGRATION
// ============================================================

logStep('1. tests/test_billing_integration.py');

writeLines('backend/tests/test_billing_integration.py', [
  '"""',
  'Tests d integration du flux de paiement.',
  '',
  'Ces tests verifient le flux complet :',
  '  register -> checkout -> verification',
  '',
  'Ils necessitent un provider configure (FEDAPAY_SECRET_KEY).',
  'Si aucun provider n est configure, ils sont skippes.',
  '"""',
  '',
  'import uuid',
  '',
  'import pytest',
  'from fastapi.testclient import TestClient',
  '',
  'from app.core.database import delete_row',
  'from app.services.payment.orchestrator import get_payment_orchestrator',
  '',
  '',
  '@pytest.fixture',
  'def user_authenticated(client: TestClient):',
  '    """Cree un utilisateur et retourne son token JWT."""',
  '    email = f"pay-{uuid.uuid4().hex[:8]}@example.com"',
  '',
  '    reg = client.post(',
  '        "/api/auth/register",',
  '        json={"email": email, "password": "MotDePasse123!"},',
  '    )',
  '    assert reg.status_code == 200',
  '',
  '    data = reg.json()',
  '    yield {',
  '        "email": email,',
  '        "token": data["access_token"],',
  '        "user_id": data["user"]["id"],',
  '    }',
  '',
  '    # Cleanup',
  '    try:',
  '        delete_row("profiles", {"email": email})',
  '    except Exception:',
  '        pass',
  '',
  '',
  '@pytest.mark.integration',
  'def test_billing_plans_endpoint_full(client: TestClient) -> None:',
  '    """Verifie le contenu detaille des 3 plans."""',
  '    response = client.get("/api/billing/plans")',
  '    assert response.status_code == 200',
  '',
  '    plans = response.json()["plans"]',
  '    assert len(plans) == 3',
  '',
  '    essentiel = next(p for p in plans if p["code"] == "essentiel")',
  '    assert essentiel["credits"] == 5',
  '    assert essentiel["price_xof"] > 0',
  '    assert essentiel["price_eur"] > 0',
  '    assert essentiel["price_usd"] > 0',
  '    assert len(essentiel["features"]) > 0',
  '',
  '    pro = next(p for p in plans if p["code"] == "pro")',
  '    assert pro["credits"] == 30',
  '    assert pro["price_eur"] > essentiel["price_eur"]',
  '',
  '    carriere = next(p for p in plans if p["code"] == "carriere")',
  '    assert carriere["price_eur"] > pro["price_eur"]',
  '',
  '',
  '@pytest.mark.integration',
  'def test_billing_providers_endpoint(client: TestClient) -> None:',
  '    """Verifie que les providers sont listes correctement."""',
  '    response = client.get("/api/billing/providers")',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert "providers" in data',
  '    assert isinstance(data["providers"], list)',
  '',
  '',
  '@pytest.mark.integration',
  'def test_billing_payments_history_empty(client: TestClient, user_authenticated) -> None:',
  '    """Un nouvel utilisateur n a aucun paiement."""',
  '    headers = {"Authorization": f"Bearer {user_authenticated[\'token\']}"}',
  '',
  '    response = client.get("/api/billing/payments", headers=headers)',
  '    assert response.status_code == 200',
  '',
  '    payments = response.json()',
  '    assert isinstance(payments, list)',
  '    assert len(payments) == 0',
  '',
  '',
  '@pytest.mark.integration',
  'def test_billing_checkout_unknown_plan_returns_400(client: TestClient, user_authenticated) -> None:',
  '    """Un plan inconnu retourne 400."""',
  '    headers = {"Authorization": f"Bearer {user_authenticated[\'token\']}"}',
  '',
  '    response = client.post(',
  '        "/api/billing/checkout",',
  '        headers=headers,',
  '        json={"plan_code": "inexistant", "provider": "fedapay"},',
  '    )',
  '    assert response.status_code == 400',
  '',
  '',
  '@pytest.mark.integration',
  'def test_billing_checkout_unknown_provider_returns_400(client: TestClient, user_authenticated) -> None:',
  '    """Un provider inconnu retourne 400."""',
  '    headers = {"Authorization": f"Bearer {user_authenticated[\'token\']}"}',
  '',
  '    response = client.post(',
  '        "/api/billing/checkout",',
  '        headers=headers,',
  '        json={"plan_code": "essentiel", "provider": "inexistant"},',
  '    )',
  '    assert response.status_code == 400',
  '',
  '',
  '@pytest.mark.integration',
  'def test_webhook_invalid_signature_rejected(client: TestClient) -> None:',
  '    """Un webhook avec une signature invalide est rejete."""',
  '    response = client.post(',
  '        "/webhooks/fedapay",',
  '        headers={"x-fedapay-signature": "invalide_signature"},',
  '        json={"name": "transaction.approved", "entity": {"id": 12345}},',
  '    )',
  '    assert response.status_code == 400',
  '',
  '',
  '@pytest.mark.integration',
  'def test_payment_orchestrator_available_providers() -> None:',
  '    """L orchestrateur retourne une liste de providers disponibles."""',
  '    orchestrator = get_payment_orchestrator()',
  '    providers = orchestrator.available_providers()',
  '    assert isinstance(providers, list)',
]);

// ============================================================
// 2. SCRIPT DE TEST MANUEL
// ============================================================

logStep('2. scripts/test_payment_flow.py');

writeLines('backend/scripts/test_payment_flow.py', [
  '"""',
  'Script de test manuel du flux de paiement complet.',
  '',
  'Usage : python scripts/test_payment_flow.py',
  '',
  'Ce script :',
  '  1. Cree un utilisateur de test',
  '  2. Verifie les plans disponibles',
  '  3. Verifie les providers disponibles',
  '  4. Tente un checkout (si un provider est configure)',
  '  5. Affiche l historique des paiements',
  '',
  'Note : si aucun provider n est configure (FEDAPAY_SECRET_KEY vide),',
  'le script s arrete a l etape 3 et affiche un message.',
  '"""',
  '',
  'import sys',
  'import uuid',
  'from pathlib import Path',
  '',
  'sys.path.insert(0, str(Path(__file__).parent.parent))',
  '',
  'import httpx',
  '',
  '',
  'BASE_URL = "http://localhost:8000"',
  '',
  '',
  'def main() -> None:',
  '    email = f"pay-test-{uuid.uuid4().hex[:8]}@example.com"',
  '    password = "MotDePasse123!"',
  '',
  '    print("=" * 60)',
  '    print("TEST MANUEL DU FLUX PAIEMENT")',
  '    print("=" * 60)',
  '    print(f"Email : {email}")',
  '    print(f"Password : {password}")',
  '    print()',
  '',
  '    with httpx.Client(base_url=BASE_URL, timeout=30) as client:',
  '        # 1. Register',
  '        print("[1/5] Inscription...")',
  '        r = client.post("/api/auth/register", json={',
  '            "email": email,',
  '            "password": password,',
  '        })',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        token = r.json()["access_token"]',
  '        print("   OK : token recu")',
  '        print()',
  '',
  '        headers = {"Authorization": f"Bearer {token}"}',
  '',
  '        # 2. Plans',
  '        print("[2/5] Plans disponibles...")',
  '        r = client.get("/api/billing/plans")',
  '        plans = r.json()["plans"]',
  '        for p in plans:',
  '            price_info = f"{p[\'price_eur\']} EUR / {p[\'price_xof\']} XOF"',
  '            print(f"   - {p[\'name\']} ({p[\'credits\']} credits) : {price_info}")',
  '        print()',
  '',
  '        # 3. Providers',
  '        print("[3/5] Providers disponibles...")',
  '        r = client.get("/api/billing/providers")',
  '        providers = r.json()["providers"]',
  '        if not providers:',
  '            print("   AUCUN provider configure.")',
  '            print()',
  '            print("Pour tester le paiement, ajoute dans .env :")',
  '            print("  FEDAPAY_SECRET_KEY=sk_sandbox_xxx")',
  '            print()',
  '            print("Puis relance ce script.")',
  '            return',
  '',
  '        print(f"   Providers disponibles : {providers}")',
  '        print()',
  '',
  '        # 4. Checkout',
  '        print("[4/5] Creation d une session de paiement (plan Essentiel)...")',
  '        r = client.post(',
  '            "/api/billing/checkout",',
  '            headers=headers,',
  '            json={"plan_code": "essentiel", "provider": providers[0]},',
  '        )',
  '',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:300]}")',
  '            sys.exit(1)',
  '',
  '        checkout = r.json()',
  '        print("   OK : paiement cree")',
  '        print(f"   - payment_id : {checkout[\'payment_id\']}")',
  '        print(f"   - provider : {checkout[\'provider\']}")',
  '        print(f"   - montant : {checkout[\'amount\']} {checkout[\'currency\']}")',
  '        print(f"   - URL de paiement : {checkout[\'checkout_url\'][:80]}")',
  '        print()',
  '',
  '        # 5. Historique',
  '        print("[5/5] Historique des paiements...")',
  '        r = client.get("/api/billing/payments", headers=headers)',
  '        payments = r.json()',
  '        print(f"   Nombre de paiements : {len(payments)}")',
  '        for p in payments:',
  '            print(f"   - {p[\'plan_purchased\']} : {p[\'amount\']} {p[\'currency\']} ({p[\'status\']})")',
  '        print()',
  '',
  '    print("=" * 60)',
  '    print("SUCCES : Flux paiement complet operationnel")',
  '    print("=" * 60)',
  '    print()',
  '    print("Pour finaliser : ouvre l URL de paiement dans un navigateur.")',
  '    print("Apres paiement, le webhook FedaPay creditera automatiquement le compte.")',
  '',
  '',
  'if __name__ == "__main__":',
  '    main()',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 5e terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/tests/test_billing_integration.py');
console.log('    - backend/scripts/test_payment_flow.py');
console.log('');
console.log('  TESTS :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pytest tests/test_billing_integration.py -v');
console.log('');
console.log('  TEST MANUEL :');
console.log('    # Terminal 1 : uvicorn app.main:app --reload');
console.log('    # Terminal 2 : python scripts\\test_payment_flow.py');
console.log('');
console.log('  PHASE 5 COMPLETE !');
console.log('');
console.log('  Prochaine etape : Phase 6 (Systeme de relance)');
console.log('');