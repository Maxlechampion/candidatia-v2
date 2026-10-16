#!/usr/bin/env node
/**
 * setup-phase6b.js — CandidatIA
 * Phase 6b : Router /api/relance + integration main.py
 *
 * Crée :
 *   - backend/app/routers/relance.py
 *
 * Modifie :
 *   - backend/app/main.py (ajout router relance)
 *
 * Usage : node setup-phase6b.js
 * Prérequis : avoir exécuté setup-phase6a.js
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

logHeader('CandidatIA — Setup Phase 6b : Router /api/relance');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'relance', 'service.py'))) {
  console.error('');
  console.error('  ERREUR : relance/service.py introuvable.');
  console.error('  Execute d abord setup-phase6a.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. ROUTER RELANCE
// ============================================================

logStep('1. routers/relance.py');

writeLines('backend/app/routers/relance.py', [
  '"""Router /api/relance — Programmation et gestion des relances."""',
  '',
  'from typing import Any, Dict, List, Optional',
  '',
  'from fastapi import APIRouter, Depends, HTTPException',
  'from pydantic import BaseModel, Field',
  '',
  'from app.core.logging import get_logger',
  'from app.core.security import get_current_user',
  'from app.services.relance.schemas import RelanceSchedule',
  'from app.services.relance.service import (',
  '    cancel_relance,',
  '    get_user_relances,',
  '    mark_as_sent,',
  '    schedule_relance,',
  ')',
  '',
  'logger = get_logger("router.relance")',
  'router = APIRouter(prefix="/api/relance", tags=["relance"])',
  '',
  '',
  'class ScheduleRequest(BaseModel):',
  '    """Payload de programmation d une relance."""',
  '    company_name: str = Field(..., min_length=1, max_length=200)',
  '    job_title: str = Field(..., min_length=1, max_length=200)',
  '    wait_days: int = Field(7, ge=1, le=90)',
  '    language: str = "fr"',
  '    generation_id: Optional[str] = None',
  '',
  '',
  '@router.post("/schedule", summary="Programmer une relance")',
  'async def create_schedule(',
  '    payload: ScheduleRequest,',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  ') -> Dict[str, Any]:',
  '    """',
  '    Programme une relance :',
  '    1. Genere le brouillon d email via IA',
  '    2. Enregistre la relance avec la date programmee',
  '    3. Retourne le brouillon et la date',
  '    """',
  '    logger.info(',
  '        "schedule_relance_endpoint",',
  '        user_id=user["id"],',
  '        company=payload.company_name,',
  '        wait_days=payload.wait_days,',
  '    )',
  '',
  '    schedule = RelanceSchedule(',
  '        user_id=user["id"],',
  '        generation_id=payload.generation_id,',
  '        company_name=payload.company_name,',
  '        job_title=payload.job_title,',
  '        wait_days=payload.wait_days,',
  '        language=payload.language,',
  '    )',
  '',
  '    try:',
  '        relance = schedule_relance(schedule)',
  '    except Exception as e:',
  '        logger.exception("schedule_relance_failed", error=str(e))',
  '        raise HTTPException(status_code=400, detail=str(e))',
  '',
  '    return relance',
  '',
  '',
  '@router.get("/pending", summary="Relances en attente")',
  'async def list_pending(',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  ') -> List[Dict[str, Any]]:',
  '    """Retourne les relances en attente de l utilisateur."""',
  '    return get_user_relances(user["id"], status="pending")',
  '',
  '',
  '@router.get("", summary="Toutes les relances de l utilisateur")',
  'async def list_all(',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  '    limit: int = 50,',
  ') -> List[Dict[str, Any]]:',
  '    """Retourne toutes les relances de l utilisateur (tous statuts)."""',
  '    if limit < 1 or limit > 200:',
  '        raise HTTPException(status_code=400, detail="Limit doit etre entre 1 et 200.")',
  '',
  '    return get_user_relances(user["id"], limit=limit)',
  '',
  '',
  '@router.post("/{relance_id}/cancel", summary="Annuler une relance")',
  'async def cancel(',
  '    relance_id: str,',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  ') -> Dict[str, Any]:',
  '    """Annule une relance programmee."""',
  '    try:',
  '        return cancel_relance(relance_id, user["id"])',
  '    except Exception as e:',
  '        logger.warning("cancel_relance_failed", relance_id=relance_id, error=str(e))',
  '        raise HTTPException(status_code=404, detail=str(e))',
  '',
  '',
  '@router.post("/{relance_id}/mark-sent", summary="Marquer comme envoyee")',
  'async def mark_sent(',
  '    relance_id: str,',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  ') -> Dict[str, Any]:',
  '    """Marque une relance comme envoyee par l utilisateur."""',
  '    try:',
  '        return mark_as_sent(relance_id, user["id"])',
  '    except Exception as e:',
  '        logger.warning("mark_sent_failed", relance_id=relance_id, error=str(e))',
  '        raise HTTPException(status_code=404, detail=str(e))',
]);

// ============================================================
// 2. MISE À JOUR main.py
// ============================================================

logStep('2. main.py (ajout router relance)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');
let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

// Import : ajouter relance si absent
if (!mainContent.includes('relance')) {
  mainContent = mainContent.replace(
    /from app\.routers import ([^\n]+)/,
    (match, modules) => {
      const mods = modules.split(',').map(m => m.trim());
      if (!mods.includes('relance')) mods.push('relance');
      return 'from app.routers import ' + mods.join(', ');
    }
  );
}

// Include router : ajouter après webhooks
if (!mainContent.includes('app.include_router(relance.router)')) {
  mainContent = mainContent.replace(
    /(\s+)app\.include_router\(webhooks\.router\)/,
    '$1app.include_router(webhooks.router)\n$1app.include_router(relance.router)'
  );
}

if (mainContent !== originalContent) {
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log('  OK  backend/app/main.py (mis a jour)');
} else {
  console.log('  SKIP  backend/app/main.py (deja a jour)');
}

// ============================================================
// 3. TESTS
// ============================================================

logStep('3. tests/test_relance_router.py');

writeLines('backend/tests/test_relance_router.py', [
  '"""Tests du router /api/relance."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_schedule_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /schedule requiert un JWT."""',
  '    response = client.post(',
  '        "/api/relance/schedule",',
  '        json={"company_name": "Test", "job_title": "Dev", "wait_days": 7},',
  '    )',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_pending_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /pending requiert un JWT."""',
  '    response = client.get("/api/relance/pending")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_list_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /api/relance requiert un JWT."""',
  '    response = client.get("/api/relance")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_cancel_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /{id}/cancel requiert un JWT."""',
  '    response = client.post("/api/relance/test-id/cancel")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_mark_sent_requires_auth(client: TestClient) -> None:',
  '    """L endpoint /{id}/mark-sent requiert un JWT."""',
  '    response = client.post("/api/relance/test-id/mark-sent")',
  '    assert response.status_code == 401',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 6b terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/routers/relance.py');
console.log('    - backend/tests/test_relance_router.py');
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
console.log('     Attendu : /api/relance/schedule, /api/relance/pending, /api/relance');
console.log('');
console.log('  3. Lancer les tests :');
console.log('     pytest tests/test_relance_router.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase6c.js (Service email Brevo)');
console.log('');