#!/usr/bin/env node
/**
 * setup-phase4e.js — CandidatIA
 * Phase 4e : Tests d integration Phase 4 + Script manuel
 *
 * Crée :
 *   - backend/tests/test_auth_integration.py
 *   - backend/tests/test_quota_enforcement.py
 *   - backend/scripts/test_auth_flow.py
 *
 * Usage : node setup-phase4e.js
 * Prérequis : avoir exécuté setup-phase4d.js
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

logHeader('CandidatIA — Setup Phase 4e : Tests d integration');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'auth.py'))) {
  console.error('');
  console.error('  ERREUR : auth.py introuvable.');
  console.error('  Execute d abord setup-phase4d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. TEST D'INTEGRATION AUTH
// ============================================================

logStep('1. tests/test_auth_integration.py');

writeLines('backend/tests/test_auth_integration.py', [
  '"""',
  'Tests d integration du flux auth complet.',
  '',
  'Ces tests utilisent un vrai utilisateur temporaire dans Supabase.',
  'Ils sont marques "integration" et peuvent etre exclus avec :',
  '  pytest -m "not integration"',
  '"""',
  '',
  'import uuid',
  '',
  'import pytest',
  'from fastapi.testclient import TestClient',
  '',
  'from app.core.database import delete_row',
  '',
  '',
  '@pytest.fixture',
  'def test_email():',
  '    """Email unique pour chaque test (evite les collisions)."""',
  '    email = f"test-{uuid.uuid4().hex[:8]}@example.com"',
  '    yield email',
  '    # Cleanup',
  '    try:',
  '        delete_row("profiles", {"email": email})',
  '    except Exception:',
  '        pass',
  '',
  '',
  '@pytest.mark.integration',
  'def test_full_register_login_flow(client: TestClient, test_email: str) -> None:',
  '    """Test complet : register -> login -> me."""',
  '',
  '    # 1. Register',
  '    register_resp = client.post(',
  '        "/api/auth/register",',
  '        json={',
  '            "email": test_email,',
  '            "password": "MotDePasse123!",',
  '            "full_name": "Test Integration",',
  '        },',
  '    )',
  '    assert register_resp.status_code == 200, register_resp.text',
  '    data = register_resp.json()',
  '    assert "access_token" in data',
  '    assert data["user"]["email"] == test_email',
  '    assert data["user"]["credits"] == 1',
  '    assert data["user"]["plan"] == "free"',
  '',
  '    token = data["access_token"]',
  '',
  '    # 2. Me',
  '    headers = {"Authorization": f"Bearer {token}"}',
  '    me_resp = client.get("/api/auth/me", headers=headers)',
  '    assert me_resp.status_code == 200',
  '    me_data = me_resp.json()',
  '    assert me_data["email"] == test_email',
  '    assert me_data["credits"] == 1',
  '',
  '    # 3. Login',
  '    login_resp = client.post(',
  '        "/api/auth/login",',
  '        json={"email": test_email, "password": "MotDePasse123!"},',
  '    )',
  '    assert login_resp.status_code == 200',
  '    login_data = login_resp.json()',
  '    assert "access_token" in login_data',
  '    assert login_data["user"]["email"] == test_email',
  '',
  '',
  '@pytest.mark.integration',
  'def test_register_duplicate_email_fails(client: TestClient, test_email: str) -> None:',
  '    """Deux inscriptions avec le meme email -> 400."""',
  '',
  '    # 1ere inscription',
  '    r1 = client.post(',
  '        "/api/auth/register",',
  '        json={"email": test_email, "password": "MotDePasse123!"},',
  '    )',
  '    assert r1.status_code == 200',
  '',
  '    # 2eme inscription -> 400',
  '    r2 = client.post(',
  '        "/api/auth/register",',
  '        json={"email": test_email, "password": "AutreMotDePasse456!"},',
  '    )',
  '    assert r2.status_code == 400',
  '',
  '',
  '@pytest.mark.integration',
  'def test_login_wrong_password_returns_401(client: TestClient, test_email: str) -> None:',
  '    """Login avec mauvais mot de passe -> 401."""',
  '',
  '    # Inscription',
  '    client.post(',
  '        "/api/auth/register",',
  '        json={"email": test_email, "password": "MotDePasse123!"},',
  '    )',
  '',
  '    # Login mauvais mot de passe',
  '    r = client.post(',
  '        "/api/auth/login",',
  '        json={"email": test_email, "password": "MauvaisMotDePasse"},',
  '    )',
  '    assert r.status_code == 401',
  '',
  '',
  '@pytest.mark.integration',
  'def test_me_quota_after_register(client: TestClient, test_email: str) -> None:',
  '    """Apres inscription, le quota doit etre de 1 credit."""',
  '',
  '    reg = client.post(',
  '        "/api/auth/register",',
  '        json={"email": test_email, "password": "MotDePasse123!"},',
  '    )',
  '    token = reg.json()["access_token"]',
  '    headers = {"Authorization": f"Bearer {token}"}',
  '',
  '    quota = client.get("/api/auth/me/quota", headers=headers)',
  '    assert quota.status_code == 200',
  '    data = quota.json()',
  '    assert data["credits_remaining"] == 1',
  '    assert data["plan"] == "free"',
  '    assert data["plan_name"] == "Decouverte"',
  '',
  '',
  '@pytest.mark.integration',
  'def test_plans_endpoint_returns_4_plans(client: TestClient) -> None:',
  '    """L endpoint /api/quota/plans retourne 4 plans."""',
  '',
  '    r = client.get("/api/quota/plans")',
  '    assert r.status_code == 200',
  '    data = r.json()',
  '    assert len(data["plans"]) == 4',
  '',
  '    plans_by_code = {p["code"]: p for p in data["plans"]}',
  '    assert "free" in plans_by_code',
  '    assert "essentiel" in plans_by_code',
  '    assert "pro" in plans_by_code',
  '    assert "carriere" in plans_by_code',
  '',
  '    assert plans_by_code["free"]["price_eur"] == 0',
  '    assert plans_by_code["pro"]["price_eur"] == 14.99',
]);

// ============================================================
// 2. TEST QUOTA ENFORCEMENT
// ============================================================

logStep('2. tests/test_quota_enforcement.py');

writeLines('backend/tests/test_quota_enforcement.py', [
  '"""',
  'Tests du respect des quotas.',
  '',
  'Marques integration car ils modifient la DB.',
  '"""',
  '',
  'import uuid',
  '',
  'import pytest',
  'from fastapi.testclient import TestClient',
  '',
  'from app.core.database import delete_row, update_row',
  '',
  '',
  '@pytest.fixture',
  'def user_with_zero_credits(client: TestClient):',
  '    """Cree un utilisateur avec 0 credit pour tester le blocage."""',
  '    email = f"quota-{uuid.uuid4().hex[:8]}@example.com"',
  '',
  '    reg = client.post(',
  '        "/api/auth/register",',
  '        json={"email": email, "password": "MotDePasse123!"},',
  '    )',
  '    assert reg.status_code == 200',
  '    token = reg.json()["access_token"]',
  '    user_id = reg.json()["user"]["id"]',
  '',
  '    # Mettre les credits a 0',
  '    update_row("profiles", {"id": user_id}, {"credits": 0})',
  '',
  '    yield {"email": email, "token": token, "user_id": user_id}',
  '',
  '    # Cleanup',
  '    try:',
  '        delete_row("profiles", {"email": email})',
  '    except Exception:',
  '        pass',
  '',
  '',
  '@pytest.mark.integration',
  'def test_generate_with_zero_credits_returns_403(client: TestClient, user_with_zero_credits) -> None:',
  '    """Avec 0 credit, /api/generate doit retourner 403."""',
  '    headers = {"Authorization": f"Bearer {user_with_zero_credits[\'token\']}"}',
  '',
  '    resp = client.post(',
  '        "/api/generate",',
  '        headers=headers,',
  '        data={',
  '            "texte_profil": "Profil de test. " * 10,',
  '            "texte_offre": "Offre de test. " * 10,',
  '        },',
  '    )',
  '    assert resp.status_code == 403',
  '    data = resp.json()',
  '    assert data["error_code"] == "FORBIDDEN"',
  '    assert "Quota" in data["message"] or "quota" in data["message"].lower()',
  '',
  '',
  '@pytest.mark.integration',
  'def test_generations_stats_endpoint(client: TestClient) -> None:',
  '    """L endpoint /api/generations/stats fonctionne."""',
  '    email = f"stats-{uuid.uuid4().hex[:8]}@example.com"',
  '',
  '    reg = client.post(',
  '        "/api/auth/register",',
  '        json={"email": email, "password": "MotDePasse123!"},',
  '    )',
  '    token = reg.json()["access_token"]',
  '    headers = {"Authorization": f"Bearer {token}"}',
  '',
  '    try:',
  '        resp = client.get("/api/generations/stats", headers=headers)',
  '        assert resp.status_code == 200',
  '        data = resp.json()',
  '        assert "total_generations" in data',
  '        assert "average_score" in data',
  '        assert "credits_remaining" in data',
  '        assert data["total_generations"] == 0',
  '    finally:',
  '        try:',
  '            delete_row("profiles", {"email": email})',
  '        except Exception:',
  '            pass',
]);

// ============================================================
// 3. SCRIPT DE TEST MANUEL
// ============================================================

logStep('3. scripts/test_auth_flow.py');

writeLines('backend/scripts/test_auth_flow.py', [
  '"""',
  'Script de test manuel du flux auth complet.',
  '',
  'Usage : python scripts/test_auth_flow.py',
  '',
  'Ce script :',
  '  1. Cree un utilisateur de test',
  '  2. Se connecte',
  '  3. Recupere le profil',
  '  4. Recupere le quota',
  '  5. Affiche l email de test pour le nettoyage',
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
  '    email = f"test-{uuid.uuid4().hex[:8]}@example.com"',
  '    password = "MotDePasse123!"',
  '',
  '    print("=" * 60)',
  '    print("TEST MANUEL DU FLUX AUTH")',
  '    print("=" * 60)',
  '    print(f"Email : {email}")',
  '    print(f"Password : {password}")',
  '    print()',
  '',
  '    with httpx.Client(base_url=BASE_URL, timeout=30) as client:',
  '        # 1. Register',
  '        print("[1/4] Inscription...")',
  '        r = client.post("/api/auth/register", json={',
  '            "email": email,',
  '            "password": password,',
  '            "full_name": "Test User",',
  '        })',
  '',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        data = r.json()',
  '        token = data["access_token"]',
  '        print(f"   OK : token recu ({token[:30]}...)")',
  '        print(f"   OK : user_id = {data[\'user\'][\'id\']}")',
  '        print(f"   OK : credits = {data[\'user\'][\'credits\']}")',
  '        print()',
  '',
  '        headers = {"Authorization": f"Bearer {token}"}',
  '',
  '        # 2. Login',
  '        print("[2/4] Connexion (login)...")',
  '        r = client.post("/api/auth/login", json={',
  '            "email": email,',
  '            "password": password,',
  '        })',
  '',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        login_data = r.json()',
  '        print(f"   OK : login reussi")',
  '        print(f"   OK : credits = {login_data[\'user\'][\'credits\']}")',
  '        print()',
  '',
  '        # 3. Me',
  '        print("[3/4] Profil /me...")',
  '        r = client.get("/api/auth/me", headers=headers)',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        me = r.json()',
  '        print(f"   OK : email = {me[\'email\']}")',
  '        print(f"   OK : plan = {me[\'plan\']}")',
  '        print(f"   OK : credits = {me[\'credits\']}")',
  '        print()',
  '',
  '        # 4. Quota',
  '        print("[4/4] Quota...")',
  '        r = client.get("/api/auth/me/quota", headers=headers)',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        quota = r.json()',
  '        print(f"   OK : plan_name = {quota[\'plan_name\']}")',
  '        print(f"   OK : credits_remaining = {quota[\'credits_remaining\']}")',
  '        print(f"   OK : price_eur = {quota[\'price_eur\']}")',
  '        print()',
  '',
  '    print("=" * 60)',
  '    print("SUCCES : Flux auth complet operationnel")',
  '    print("=" * 60)',
  '    print()',
  '    print(f"Pour nettoyer la DB, executer dans Supabase SQL Editor :")',
  '    print(f"  DELETE FROM profiles WHERE email = \'{email}\';")',
  '',
  '',
  'if __name__ == "__main__":',
  '    main()',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 4e terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/tests/test_auth_integration.py');
console.log('    - backend/tests/test_quota_enforcement.py');
console.log('    - backend/scripts/test_auth_flow.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Vérifier que pyproject.toml contient le marqueur :');
console.log('     type backend\\pyproject.toml');
console.log('     # Doit contenir : markers = ["integration: ..."]');
console.log('');
console.log('  2. Compter les tests :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('     pytest --co -q');
console.log('');
console.log('  3. Lancer les tests non-integration :');
console.log('     pytest -m "not integration"');
console.log('');
console.log('  4. Lancer les tests d integration :');
console.log('     pytest -m integration -v');
console.log('');
console.log('  5. Test manuel :');
console.log('     # Terminal 1 : uvicorn app.main:app --reload');
console.log('     # Terminal 2 : python scripts\\test_auth_flow.py');
console.log('');
console.log('  PHASE 4 COMPLETE !');
console.log('');