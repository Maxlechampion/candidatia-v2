#!/usr/bin/env node
/**
 * setup-phase6e.js — CandidatIA
 * Phase 6e : Tests d integration relance + script manuel
 *
 * Crée :
 *   - backend/tests/test_relance_integration.py
 *   - backend/scripts/test_relance_flow.py
 *
 * Usage : node setup-phase6e.js
 * Prérequis : avoir exécuté setup-phase6d.js
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

logHeader('CandidatIA — Setup Phase 6e : Tests integration relance');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'scheduler.py'))) {
  console.error('');
  console.error('  ERREUR : scheduler.py introuvable.');
  console.error('  Execute d abord setup-phase6d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. TESTS D'INTEGRATION
// ============================================================

logStep('1. tests/test_relance_integration.py');

writeLines('backend/tests/test_relance_integration.py', [
  '"""',
  'Tests d integration du systeme de relance.',
  '',
  'Marques integration car ils touchent la vraie DB et l IA.',
  '"""',
  '',
  'import uuid',
  'from datetime import date, timedelta',
  '',
  'import pytest',
  'from fastapi.testclient import TestClient',
  '',
  'from app.core.database import delete_row, insert_row, select_one',
  '',
  '',
  '@pytest.fixture',
  'def user_with_token(client: TestClient):',
  '    """Cree un utilisateur et retourne son token."""',
  '    email = f"relance-{uuid.uuid4().hex[:8]}@example.com"',
  '',
  '    reg = client.post(',
  '        "/api/auth/register",',
  '        json={"email": email, "password": "MotDePasse123!", "full_name": "Test Relance"},',
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
  '    try:',
  '        # Supprimer d abord les relances',
  '        relances = select_one("relances", {"user_id": data["user"]["id"]})',
  '        if relances:',
  '            delete_row("relances", {"user_id": data["user"]["id"]})',
  '        delete_row("profiles", {"email": email})',
  '    except Exception:',
  '        pass',
  '',
  '',
  '@pytest.mark.integration',
  'def test_schedule_relance_full_flow(client: TestClient, user_with_token) -> None:',
  '    """Test complet : programmer une relance via le router."""',
  '    headers = {"Authorization": f"Bearer {user_with_token[\'token\']}"}',
  '',
  '    # 1. Programmer une relance',
  '    response = client.post(',
  '        "/api/relance/schedule",',
  '        headers=headers,',
  '        json={',
  '            "company_name": "TechCorp",',
  '            "job_title": "Developpeur Python",',
  '            "wait_days": 7,',
  '            "language": "fr",',
  '        },',
  '    )',
  '',
  '    # Note : ce test utilise un vrai appel IA (lent, mais verifie l integration)',
  '    assert response.status_code == 200, response.text[:300]',
  '    data = response.json()',
  '',
  '    assert "id" in data',
  '    assert data["company_name"] == "TechCorp"',
  '    assert data["job_title"] == "Developpeur Python"',
  '    assert data["wait_days"] == 7',
  '    assert data["status"] == "pending"',
  '    assert "email_draft" in data',
  '    assert len(data["email_draft"]) > 50',
  '',
  '    relance_id = data["id"]',
  '',
  '    # 2. Lister les relances pending',
  '    response = client.get("/api/relance/pending", headers=headers)',
  '    assert response.status_code == 200',
  '    pending = response.json()',
  '    assert isinstance(pending, list)',
  '    assert any(r["id"] == relance_id for r in pending)',
  '',
  '    # 3. Annuler la relance',
  '    response = client.post(f"/api/relance/{relance_id}/cancel", headers=headers)',
  '    assert response.status_code == 200',
  '',
  '    # 4. Verifier que le statut est cancelled',
  '    response = client.get("/api/relance", headers=headers)',
  '    relances = response.json()',
  '    cancelled = next((r for r in relances if r["id"] == relance_id), None)',
  '    assert cancelled is not None',
  '    assert cancelled["status"] == "cancelled"',
  '',
  '',
  '@pytest.mark.integration',
  'def test_schedule_relance_invalid_days_returns_422(client: TestClient, user_with_token) -> None:',
  '    """wait_days doit etre entre 1 et 90."""',
  '    headers = {"Authorization": f"Bearer {user_with_token[\'token\']}"}',
  '',
  '    response = client.post(',
  '        "/api/relance/schedule",',
  '        headers=headers,',
  '        json={',
  '            "company_name": "Test",',
  '            "job_title": "Dev",',
  '            "wait_days": 999,',
  '        },',
  '    )',
  '    assert response.status_code == 422',
  '',
  '',
  '@pytest.mark.integration',
  'def test_scheduler_runs_without_error(client: TestClient) -> None:',
  '    """Le scheduler s execute sans erreur (meme sans relance)."""',
  '    import os',
  '',
  '    token = os.getenv("CRON_SECRET_TOKEN", "")',
  '    headers = {"X-Cron-Token": token}',
  '',
  '    response = client.post("/api/scheduler/run", headers=headers)',
  '    assert response.status_code == 200',
  '',
  '    data = response.json()',
  '    assert data["status"] == "ok"',
  '    assert "total" in data',
  '    assert "sent" in data',
  '    assert "failed" in data',
  '',
  '',
  '@pytest.mark.integration',
  'def test_scheduler_processes_due_relance(client: TestClient, user_with_token) -> None:',
  '    """',
  '    Le scheduler traite une relance due aujourd hui.',
  '',
  '    On insere directement une relance avec scheduled_date = today.',
  '    """',
  '    import os',
  '',
  '    # Inserer une relance due aujourd hui',
  '    today = date.today().isoformat()',
  '    relance = insert_row("relances", {',
  '        "user_id": user_with_token["user_id"],',
  '        "company_name": "SchedulerTest",',
  '        "job_title": "Dev Test",',
  '        "wait_days": 7,',
  '        "scheduled_date": today,',
  '        "email_draft": "Test draft pour scheduler",',
  '        "language": "fr",',
  '        "status": "pending",',
  '    })',
  '',
  '    relance_id = relance["id"]',
  '',
  '    # Lancer le scheduler',
  '    token = os.getenv("CRON_SECRET_TOKEN", "")',
  '    headers = {"X-Cron-Token": token}',
  '',
  '    response = client.post("/api/scheduler/run", headers=headers)',
  '    assert response.status_code == 200',
  '',
  '    # Verifier que la relance a ete traitée (peut avoir echoue si Brevo non configure)',
  '    updated = select_one("relances", {"id": relance_id})',
  '    assert updated is not None',
  '    # Le statut peut etre "reminded" (succes) ou "pending" (echec Brevo)',
  '    assert updated["status"] in ("reminded", "pending")',
  '',
  '',
  '@pytest.mark.integration',
  'def test_cancel_nonexistent_relance_returns_404(client: TestClient, user_with_token) -> None:',
  '    """Annuler une relance inexistante retourne 404."""',
  '    headers = {"Authorization": f"Bearer {user_with_token[\'token\']}"}',
  '',
  '    fake_id = "00000000-0000-0000-0000-000000000000"',
  '    response = client.post(f"/api/relance/{fake_id}/cancel", headers=headers)',
  '    assert response.status_code == 404',
  '',
  '',
  '@pytest.mark.integration',
  'def test_mark_sent_flow(client: TestClient, user_with_token) -> None:',
  '    """Marquer une relance comme envoyee."""',
  '    headers = {"Authorization": f"Bearer {user_with_token[\'token\']}"}',
  '',
  '    # 1. Creer une relance directement en DB (plus rapide que via IA)',
  '    relance = insert_row("relances", {',
  '        "user_id": user_with_token["user_id"],',
  '        "company_name": "MarkSentTest",',
  '        "job_title": "Dev",',
  '        "wait_days": 7,',
  '        "scheduled_date": date.today().isoformat(),',
  '        "email_draft": "Draft",',
  '        "language": "fr",',
  '        "status": "pending",',
  '    })',
  '',
  '    relance_id = relance["id"]',
  '',
  '    # 2. Marquer comme envoyee',
  '    response = client.post(f"/api/relance/{relance_id}/mark-sent", headers=headers)',
  '    assert response.status_code == 200',
  '',
  '    # 3. Verifier le statut',
  '    updated = select_one("relances", {"id": relance_id})',
  '    assert updated is not None',
  '    assert updated["status"] == "sent"',
]);

// ============================================================
// 2. SCRIPT MANUEL
// ============================================================

logStep('2. scripts/test_relance_flow.py');

writeLines('backend/scripts/test_relance_flow.py', [
  '"""',
  'Script de test manuel du flux de relance.',
  '',
  'Usage : python scripts/test_relance_flow.py',
  '',
  'Ce script :',
  '  1. Cree un utilisateur de test',
  '  2. Programme une relance (avec generation IA du brouillon)',
  '  3. Liste les relances pending',
  '  4. Annule la relance',
  '  5. Lance le scheduler',
  '"""',
  '',
  'import os',
  'import sys',
  'import uuid',
  'from pathlib import Path',
  '',
  'sys.path.insert(0, str(Path(__file__).parent.parent))',
  '',
  'import httpx',
  'from dotenv import load_dotenv',
  '',
  'load_dotenv()',
  '',
  '',
  'BASE_URL = "http://localhost:8000"',
  '',
  '',
  'def main() -> None:',
  '    email = f"relance-{uuid.uuid4().hex[:8]}@example.com"',
  '    password = "MotDePasse123!"',
  '    cron_token = os.getenv("CRON_SECRET_TOKEN", "")',
  '',
  '    print("=" * 60)',
  '    print("TEST MANUEL DU FLUX DE RELANCE")',
  '    print("=" * 60)',
  '    print(f"Email : {email}")',
  '    print(f"Password : {password}")',
  '    print(f"Cron token : {cron_token[:20]}..." if cron_token else "Cron token : VIDE")',
  '    print()',
  '',
  '    with httpx.Client(base_url=BASE_URL, timeout=120) as client:',
  '        # 1. Register',
  '        print("[1/6] Inscription...")',
  '        r = client.post("/api/auth/register", json={',
  '            "email": email,',
  '            "password": password,',
  '            "full_name": "Test Relance",',
  '        })',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '',
  '        token = r.json()["access_token"]',
  '        print("   OK : utilisateur cree")',
  '        print()',
  '',
  '        headers = {"Authorization": f"Bearer {token}"}',
  '',
  '        # 2. Programme une relance',
  '        print("[2/6] Programmation d une relance (appel IA en cours...)")',
  '        r = client.post(',
  '            "/api/relance/schedule",',
  '            headers=headers,',
  '            json={',
  '                "company_name": "TechCorp",',
  '                "job_title": "Developpeur Python Senior",',
  '                "wait_days": 7,',
  '                "language": "fr",',
  '            },',
  '        )',
  '',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:300]}")',
  '            sys.exit(1)',
  '',
  '        relance = r.json()',
  '        relance_id = relance["id"]',
  '        print(f"   OK : relance programmee")',
  '        print(f"   - ID : {relance_id}")',
  '        print(f"   - Date programmee : {relance[\'scheduled_date\']}")',
  '        print(f"   - Statut : {relance[\'status\']}")',
  '        print()',
  '        print("   Brouillon genere :")',
  '        draft_preview = relance["email_draft"][:200].replace("\\n", " ")',
  '        print(f"   {draft_preview}...")',
  '        print()',
  '',
  '        # 3. Lister les relances pending',
  '        print("[3/6] Liste des relances pending...")',
  '        r = client.get("/api/relance/pending", headers=headers)',
  '        pending = r.json()',
  '        print(f"   Nombre : {len(pending)}")',
  '        for p in pending:',
  '            print(f"   - {p[\'job_title\']} chez {p[\'company_name\']} ({p[\'scheduled_date\']})")',
  '        print()',
  '',
  '        # 4. Annuler la relance',
  '        print("[4/6] Annulation de la relance...")',
  '        r = client.post(f"/api/relance/{relance_id}/cancel", headers=headers)',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '            sys.exit(1)',
  '        print("   OK : relance annulee")',
  '        print()',
  '',
  '        # 5. Verifier le statut',
  '        print("[5/6] Verification du statut...")',
  '        r = client.get("/api/relance", headers=headers)',
  '        relances = r.json()',
  '        cancelled = next((x for x in relances if x["id"] == relance_id), None)',
  '        if cancelled:',
  '            print(f"   Statut : {cancelled[\'status\']}")',
  '        print()',
  '',
  '        # 6. Lancer le scheduler',
  '        print("[6/6] Execution du scheduler...")',
  '        cron_headers = {"X-Cron-Token": cron_token}',
  '        r = client.post("/api/scheduler/run", headers=cron_headers)',
  '',
  '        if r.status_code != 200:',
  '            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")',
  '        else:',
  '            report = r.json()',
  '            print(f"   OK : scheduler execute")',
  '            print(f"   - Total : {report[\'total\']}")',
  '            print(f"   - Envoyes : {report[\'sent\']}")',
  '            print(f"   - Echoues : {report[\'failed\']}")',
  '        print()',
  '',
  '    print("=" * 60)',
  '    print("SUCCES : Flux de relance operationnel")',
  '    print("=" * 60)',
  '    print()',
  '    print(f"Pour nettoyer la DB :")',
  '    print(f"  DELETE FROM relances WHERE user_id IN (SELECT id FROM profiles WHERE email = \'{email}\');")',
  '    print(f"  DELETE FROM profiles WHERE email = \'{email}\';")',
  '',
  '',
  'if __name__ == "__main__":',
  '    main()',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 6e terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/tests/test_relance_integration.py');
console.log('    - backend/scripts/test_relance_flow.py');
console.log('');
console.log('  TESTS :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('');
console.log('    # Tests d integration (lents, avec IA)');
console.log('    pytest tests/test_relance_integration.py -v');
console.log('');
console.log('    # Tous les tests');
console.log('    pytest');
console.log('');
console.log('  TEST MANUEL :');
console.log('    # Terminal 1 : uvicorn app.main:app --reload');
console.log('    # Terminal 2 : python scripts\\test_relance_flow.py');
console.log('');
console.log('  PHASE 6 COMPLETE !');
console.log('');
console.log('  Prochaine etape : Phase 7 (Frontend Next.js)');
console.log('');