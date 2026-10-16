#!/usr/bin/env node
/**
 * setup-phase6d.js — CandidatIA
 * Phase 6d : Scheduler cron pour les rappels de relance
 *
 * Crée :
 *   - backend/app/services/relance/scheduler.py
 *   - backend/app/routers/scheduler.py
 *   - backend/tests/test_relance_scheduler.py
 *
 * Modifie :
 *   - backend/app/main.py (ajout router scheduler)
 *
 * Usage : node setup-phase6d.js
 * Prérequis : avoir exécuté setup-phase6c.js
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

logHeader('CandidatIA — Setup Phase 6d : Scheduler cron');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'email', 'service.py'))) {
  console.error('');
  console.error('  ERREUR : email/service.py introuvable.');
  console.error('  Execute d abord setup-phase6c.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. SCHEDULER SERVICE
// ============================================================

logStep('1. relance/scheduler.py');

writeLines('backend/app/services/relance/scheduler.py', [
  '"""',
  'Scheduler de rappels de relance.',
  '',
  'Fonctionne en mode "pull" : un cron job externe (Render Cron, GitHub Actions,',
  'ou un simple appel HTTP quotidien) appelle l endpoint /api/scheduler/run.',
  '',
  'A chaque execution :',
  '  1. Recupere les relances qui doivent declencher un rappel aujourd hui',
  '  2. Pour chaque relance, envoie un email de rappel a l utilisateur',
  '  3. Marque la relance comme "reminded"',
  '"""',
  '',
  'from datetime import date',
  'from typing import Any, Dict, List',
  '',
  'from app.core.logging import get_logger',
  'from app.services.auth.user_service import get_user_by_id',
  'from app.services.email.service import send_relance_reminder',
  'from app.services.relance.service import (',
  '    get_pending_relances_for_today,',
  '    mark_reminded,',
  ')',
  '',
  'logger = get_logger("relance.scheduler")',
  '',
  '',
  'def run_daily_reminders() -> Dict[str, Any]:',
  '    """',
  '    Execute la tache quotidienne d envoi de rappels.',
  '',
  '    Retourne un rapport :',
  '      - date : date d execution',
  '      - total : nombre de relances traitees',
  '      - sent : nombre de rappels envoyes',
  '      - failed : nombre d echecs',
  '      - details : liste des resultats individuels',
  '    """',
  '    today = date.today().isoformat()',
  '    logger.info("scheduler_run_started", date=today)',
  '',
  '    # 1. Recuperer les relances du jour',
  '    try:',
  '        relances = get_pending_relances_for_today()',
  '    except Exception as e:',
  '        logger.exception("scheduler_fetch_failed", error=str(e))',
  '        return {',
  '            "date": today,',
  '            "total": 0,',
  '            "sent": 0,',
  '            "failed": 0,',
  '            "error": str(e),',
  '        }',
  '',
  '    if not relances:',
  '        logger.info("scheduler_no_relances_today", date=today)',
  '        return {',
  '            "date": today,',
  '            "total": 0,',
  '            "sent": 0,',
  '            "failed": 0,',
  '            "details": [],',
  '        }',
  '',
  '    logger.info("scheduler_relances_found", count=len(relances))',
  '',
  '    # 2. Pour chaque relance, envoyer le rappel',
  '    sent = 0',
  '    failed = 0',
  '    details: List[Dict[str, Any]] = []',
  '',
  '    for relance in relances:',
  '        relance_id = relance.get("id")',
  '        user_id = relance.get("user_id")',
  '        company = relance.get("company_name", "?")',
  '        job = relance.get("job_title", "?")',
  '        scheduled_date = relance.get("scheduled_date", today)',
  '        email_draft = relance.get("email_draft", "")',
  '',
  '        try:',
  '            # Recuperer l utilisateur',
  '            user = get_user_by_id(user_id)',
  '            user_email = user.get("email")',
  '            user_name = user.get("full_name") or user_email',
  '',
  '            if not user_email:',
  '                raise ValueError(f"Pas d email pour l utilisateur {user_id}")',
  '',
  '            # Envoyer le rappel',
  '            send_relance_reminder(',
  '                to_email=user_email,',
  '                user_name=user_name,',
  '                company_name=company,',
  '                job_title=job,',
  '                scheduled_date=str(scheduled_date),',
  '                email_draft=email_draft,',
  '            )',
  '',
  '            # Marquer comme "reminded"',
  '            mark_reminded(relance_id)',
  '',
  '            sent += 1',
  '            details.append({',
  '                "relance_id": relance_id,',
  '                "user_email": user_email,',
  '                "status": "sent",',
  '            })',
  '',
  '            logger.info(',
  '                "relance_reminder_sent",',
  '                relance_id=relance_id,',
  '                user_email=user_email,',
  '            )',
  '',
  '        except Exception as e:',
  '            failed += 1',
  '            details.append({',
  '                "relance_id": relance_id,',
  '                "status": "failed",',
  '                "error": str(e),',
  '            })',
  '            logger.exception(',
  '                "relance_reminder_failed",',
  '                relance_id=relance_id,',
  '                error=str(e),',
  '            )',
  '',
  '    report = {',
  '        "date": today,',
  '        "total": len(relances),',
  '        "sent": sent,',
  '        "failed": failed,',
  '        "details": details,',
  '    }',
  '',
  '    logger.info(',
  '        "scheduler_run_completed",',
  '        date=today,',
  '        total=len(relances),',
  '        sent=sent,',
  '        failed=failed,',
  '    )',
  '',
  '    return report',
]);

// ============================================================
// 2. ROUTER SCHEDULER
// ============================================================

logStep('2. routers/scheduler.py');

writeLines('backend/app/routers/scheduler.py', [
  '"""Router /api/scheduler — Endpoints pour les taches planifiees."""',
  '',
  'import os',
  'from typing import Any, Dict',
  '',
  'from fastapi import APIRouter, Header, HTTPException',
  '',
  'from app.core.logging import get_logger',
  'from app.services.relance.scheduler import run_daily_reminders',
  '',
  'logger = get_logger("router.scheduler")',
  'router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])',
  '',
  '',
  'def _verify_cron_token(token: str) -> None:',
  '    """',
  '    Verifie le token cron.',
  '',
  '    Ce token protege les endpoints de scheduler pour eviter',
  '    que n importe qui puisse les declencher.',
  '    """',
  '    expected = os.getenv("CRON_SECRET_TOKEN", "")',
  '',
  '    if not expected:',
  '        logger.warning("cron_token_not_configured")',
  '        # En dev, on accepte si pas de token configure',
  '        if os.getenv("APP_ENV") == "production":',
  '            raise HTTPException(',
  '                status_code=500,',
  '                detail="CRON_SECRET_TOKEN non configure en production.",',
  '            )',
  '        return',
  '',
  '    if token != expected:',
  '        logger.warning("cron_token_invalid")',
  '        raise HTTPException(status_code=401, detail="Token cron invalide.")',
  '',
  '',
  '@router.post("/run", summary="Executer les taches planifiees")',
  'async def run_scheduler(',
  '    authorization: str = Header("", alias="X-Cron-Token"),',
  ') -> Dict[str, Any]:',
  '    """',
  '    Execute les taches planifiees quotidiennes.',
  '',
  '    Appele par un cron externe (Render Cron, GitHub Actions, cron-job.org).',
  '    Envoie les rappels de relance du jour.',
  '    """',
  '    _verify_cron_token(authorization)',
  '',
  '    logger.info("scheduler_endpoint_called")',
  '    report = run_daily_reminders()',
  '',
  '    return {',
  '        "status": "ok",',
  '        **report,',
  '    }',
  '',
  '',
  '@router.get("/health", summary="Health check du scheduler")',
  'async def scheduler_health() -> Dict[str, Any]:',
  '    """Verifie que le scheduler est pret."""',
  '    from datetime import date',
  '',
  '    return {',
  '        "status": "ok",',
  '        "service": "scheduler",',
  '        "date": date.today().isoformat(),',
  '    }',
]);

// ============================================================
// 3. MISE À JOUR main.py
// ============================================================

logStep('3. main.py (ajout router scheduler)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');
let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

if (!mainContent.includes('scheduler')) {
  mainContent = mainContent.replace(
    /from app\.routers import ([^\n]+)/,
    (match, modules) => {
      const mods = modules.split(',').map(m => m.trim());
      if (!mods.includes('scheduler')) mods.push('scheduler');
      return 'from app.routers import ' + mods.join(', ');
    }
  );
}

if (!mainContent.includes('app.include_router(scheduler.router)')) {
  mainContent = mainContent.replace(
    /(\s+)app\.include_router\(relance\.router\)/,
    '$1app.include_router(relance.router)\n$1app.include_router(scheduler.router)'
  );
}

if (mainContent !== originalContent) {
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log('  OK  backend/app/main.py (mis a jour)');
} else {
  console.log('  SKIP  backend/app/main.py (deja a jour)');
}

// ============================================================
// 4. TESTS
// ============================================================

logStep('4. tests/test_relance_scheduler.py');

writeLines('backend/tests/test_relance_scheduler.py', [
  '"""Tests du scheduler de relance."""',
  '',
  'from app.services.relance.scheduler import run_daily_reminders',
  '',
  '',
  'def test_scheduler_returns_report() -> None:',
  '    """Le scheduler retourne un rapport."""',
  '    report = run_daily_reminders()',
  '',
  '    assert isinstance(report, dict)',
  '    assert "date" in report',
  '    assert "total" in report',
  '    assert "sent" in report',
  '    assert "failed" in report',
  '',
  '',
  'def test_scheduler_report_types() -> None:',
  '    """Les types du rapport sont corrects."""',
  '    report = run_daily_reminders()',
  '',
  '    assert isinstance(report["date"], str)',
  '    assert isinstance(report["total"], int)',
  '    assert isinstance(report["sent"], int)',
  '    assert isinstance(report["failed"], int)',
  '',
  '',
  'def test_scheduler_no_negative_counts() -> None:',
  '    """Les compteurs ne sont jamais negatifs."""',
  '    report = run_daily_reminders()',
  '',
  '    assert report["total"] >= 0',
  '    assert report["sent"] >= 0',
  '    assert report["failed"] >= 0',
  '    assert report["sent"] + report["failed"] <= report["total"]',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 6d terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/relance/scheduler.py');
console.log('    - backend/app/routers/scheduler.py');
console.log('    - backend/tests/test_relance_scheduler.py');
console.log('');
console.log('  Fichiers mis a jour :');
console.log('    - backend/app/main.py');
console.log('');
console.log('  IMPORTANT : Configurer CRON_SECRET_TOKEN dans .env');
console.log('    CRON_SECRET_TOKEN=un-token-aleatoire-long');
console.log('');
console.log('  VERIFICATION :');
console.log('    1. Redemarrer uvicorn');
console.log('    2. Tester : irm http://localhost:8000/api/scheduler/health');
console.log('    3. Tester : irm -Method POST http://localhost:8000/api/scheduler/run');
console.log('');
console.log('  TESTS :');
console.log('    pytest tests/test_relance_scheduler.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase6e.js (tests integration)');
console.log('');