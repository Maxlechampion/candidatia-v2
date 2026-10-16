#!/usr/bin/env node
/**
 * setup-phase6a.js — CandidatIA
 * Phase 6a : Service de relance (CRUD + generation IA)
 *
 * Crée :
 *   - backend/app/services/relance/__init__.py
 *   - backend/app/services/relance/schemas.py
 *   - backend/app/services/relance/service.py
 *   - backend/tests/test_relance_service.py
 *
 * Usage : node setup-phase6a.js
 * Prérequis : avoir exécuté setup-phase5e.js
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

logHeader('CandidatIA — Setup Phase 6a : Service de relance');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'billing.py'))) {
  console.error('');
  console.error('  ERREUR : billing.py introuvable.');
  console.error('  Execute d abord setup-phase5d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. RELANCE __init__
// ============================================================

logStep('1. relance/__init__.py');

writeLines('backend/app/services/relance/__init__.py', [
  '"""Service de relance programmable."""',
  '',
  'from app.services.relance.schemas import (',
  '    RelanceStatus,',
  '    RelanceSchedule,',
  '    RelanceResponse,',
  ')',
  'from app.services.relance.service import (',
  '    schedule_relance,',
  '    get_user_relances,',
  '    cancel_relance,',
  '    mark_as_sent,',
  '    get_pending_relances,',
  '    mark_reminded,',
  ')',
  '',
  '__all__ = [',
  '    "RelanceStatus",',
  '    "RelanceSchedule",',
  '    "RelanceResponse",',
  '    "schedule_relance",',
  '    "get_user_relances",',
  '    "cancel_relance",',
  '    "mark_as_sent",',
  '    "get_pending_relances",',
  '    "mark_reminded",',
  ']',
]);

// ============================================================
// 2. RELANCE SCHEMAS
// ============================================================

logStep('2. relance/schemas.py');

writeLines('backend/app/services/relance/schemas.py', [
  '"""Schemas Pydantic pour le service de relance."""',
  '',
  'from datetime import date, datetime',
  'from enum import Enum',
  'from typing import Optional',
  '',
  'from pydantic import BaseModel, Field',
  '',
  '',
  'class RelanceStatus(str, Enum):',
  '    """Statuts possibles d une relance."""',
  '    PENDING = "pending"       # Programmee, en attente',
  '    REMINDED = "reminded"     # Rappel envoye a l utilisateur',
  '    SENT = "sent"             # L utilisateur a envoye la relance',
  '    CANCELLED = "cancelled"   # Annulee par l utilisateur',
  '',
  '',
  'class RelanceSchedule(BaseModel):',
  '    """Payload pour programmer une relance."""',
  '    user_id: str',
  '    generation_id: Optional[str] = None',
  '    company_name: str',
  '    job_title: str',
  '    wait_days: int = Field(7, ge=1, le=90, description="Jours avant relance (1-90)")',
  '    language: str = "fr"',
  '',
  '',
  'class RelanceResponse(BaseModel):',
  '    """Reponse d une relance."""',
  '    id: str',
  '    user_id: str',
  '    generation_id: Optional[str] = None',
  '    company_name: str',
  '    job_title: str',
  '    wait_days: int',
  '    scheduled_date: date',
  '    email_draft: str',
  '    language: str',
  '    status: str',
  '    created_at: Optional[datetime] = None',
  '    reminded_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

// ============================================================
// 3. RELANCE SERVICE
// ============================================================

logStep('3. relance/service.py');

writeLines('backend/app/services/relance/service.py', [
  '"""',
  'Service de relance : generation du brouillon + CRUD DB.',
  '',
  'Le brouillon est genere via l orchestrateur IA (provider gratuit).',
  'La relance est ensuite programmee en DB pour un envoi de rappel.',
  '"""',
  '',
  'from datetime import date, datetime, timedelta, timezone',
  'from typing import Any, Dict, List, Optional',
  '',
  'from app.core.database import insert_row, select_one, select_rows, update_row',
  'from app.core.errors import NotFoundError, ValidationError',
  'from app.core.logging import get_logger',
  'from app.services.ai.orchestrator import get_orchestrator',
  'from app.services.ai.prompts import get_relance_prompt',
  'from app.services.auth.user_service import get_user_by_id',
  'from app.services.language.locale_map import get_locale_conventions',
  'from app.services.relance.schemas import RelanceSchedule, RelanceStatus',
  '',
  'logger = get_logger("relance.service")',
  '',
  '',
  'def _generer_brouillon_ia(',
  '    nom_candidat: str,',
  '    poste: str,',
  '    entreprise: str,',
  '    wait_days: int,',
  '    language: str,',
  ') -> Dict[str, str]:',
  '    """Genere le brouillon de relance via l orchestrateur IA."""',
  '    locale = get_locale_conventions(language)',
  '    orchestrator = get_orchestrator()',
  '',
  '    system_prompt, user_prompt = get_relance_prompt(',
  '        nom_candidat=nom_candidat,',
  '        poste=poste,',
  '        entreprise=entreprise,',
  '        wait_days=wait_days,',
  '        locale=locale,',
  '        output_language=language,',
  '    )',
  '',
  '    result = orchestrator.generate_json(system_prompt, user_prompt)',
  '    return {',
  '        "subject": result.get("subject", f"Relance concernant ma candidature au poste de {poste}"),',
  '        "body": result.get("body", ""),',
  '        "signature": result.get("signature", nom_candidat),',
  '    }',
  '',
  '',
  'def schedule_relance(payload: RelanceSchedule) -> Dict[str, Any]:',
  '    """',
  '    Programme une relance pour un utilisateur.',
  '',
  '    1. Verifie que l utilisateur existe',
  '    2. Genere le brouillon via IA',
  '    3. Enregistre en DB',
  '    """',
  '    # 1. Verifier l utilisateur',
  '    user = get_user_by_id(payload.user_id)',
  '    nom_candidat = user.get("full_name") or user.get("email", "Candidat")',
  '',
  '    # 2. Calculer la date programmee',
  '    scheduled_date = date.today() + timedelta(days=payload.wait_days)',
  '',
  '    # 3. Generer le brouillon via IA',
  '    logger.info(',
  '        "relance_generating_draft",',
  '        user_id=payload.user_id,',
  '        company=payload.company_name,',
  '        job=payload.job_title,',
  '        wait_days=payload.wait_days,',
  '    )',
  '',
  '    try:',
  '        draft = _generer_brouillon_ia(',
  '            nom_candidat=nom_candidat,',
  '            poste=payload.job_title,',
  '            entreprise=payload.company_name,',
  '            wait_days=payload.wait_days,',
  '            language=payload.language,',
  '        )',
  '    except Exception as e:',
  '        logger.exception("relance_ia_generation_failed", error=str(e))',
  '        raise ValidationError(',
  '            message=f"Erreur generation du brouillon : {str(e)}",',
  '            details={"step": "ia_generation"},',
  '        )',
  '',
  '    # 4. Fusionner subject + body pour le stockage',
  '    email_draft = f"Objet : {draft[\'subject\']}\\n\\n{draft[\'body\']}\\n\\n{draft[\'signature\']}"',
  '',
  '    # 5. Enregistrer en DB',
  '    relance_data = {',
  '        "user_id": payload.user_id,',
  '        "generation_id": payload.generation_id,',
  '        "company_name": payload.company_name,',
  '        "job_title": payload.job_title,',
  '        "wait_days": payload.wait_days,',
  '        "scheduled_date": scheduled_date.isoformat(),',
  '        "email_draft": email_draft,',
  '        "language": payload.language,',
  '        "status": RelanceStatus.PENDING.value,',
  '    }',
  '',
  '    relance = insert_row("relances", relance_data)',
  '',
  '    logger.info(',
  '        "relance_scheduled",',
  '        relance_id=relance.get("id"),',
  '        user_id=payload.user_id,',
  '        scheduled_date=scheduled_date.isoformat(),',
  '    )',
  '',
  '    return relance',
  '',
  '',
  'def get_user_relances(',
  '    user_id: str,',
  '    status: Optional[str] = None,',
  '    limit: int = 50,',
  ') -> List[Dict[str, Any]]:',
  '    """Retourne les relances d un utilisateur."""',
  '    filters: Dict[str, Any] = {"user_id": user_id}',
  '    if status:',
  '        filters["status"] = status',
  '',
  '    return select_rows(',
  '        "relances",',
  '        filters=filters,',
  '        limit=limit,',
  '        order_by="scheduled_date",',
  '        descending=False,',
  '    )',
  '',
  '',
  'def cancel_relance(relance_id: str, user_id: str) -> Dict[str, Any]:',
  '    """Annule une relance (verifie qu elle appartient bien a l utilisateur)."""',
  '    relance = select_one("relances", {"id": relance_id})',
  '',
  '    if not relance:',
  '        raise NotFoundError(message=f"Relance {relance_id} introuvable.")',
  '',
  '    if relance.get("user_id") != user_id:',
  '        raise NotFoundError(message="Relance introuvable.")',
  '',
  '    if relance.get("status") == RelanceStatus.SENT.value:',
  '        raise ValidationError(message="Impossible d annuler une relance deja envoyee.")',
  '',
  '    updated = update_row(',
  '        "relances",',
  '        {"id": relance_id},',
  '        {"status": RelanceStatus.CANCELLED.value},',
  '    )',
  '',
  '    logger.info("relance_cancelled", relance_id=relance_id, user_id=user_id)',
  '    return updated or relance',
  '',
  '',
  'def mark_as_sent(relance_id: str, user_id: str) -> Dict[str, Any]:',
  '    """Marque une relance comme envoyee par l utilisateur."""',
  '    relance = select_one("relances", {"id": relance_id})',
  '',
  '    if not relance:',
  '        raise NotFoundError(message=f"Relance {relance_id} introuvable.")',
  '',
  '    if relance.get("user_id") != user_id:',
  '        raise NotFoundError(message="Relance introuvable.")',
  '',
  '    updated = update_row(',
  '        "relances",',
  '        {"id": relance_id},',
  '        {"status": RelanceStatus.SENT.value},',
  '    )',
  '',
  '    logger.info("relance_marked_sent", relance_id=relance_id)',
  '    return updated or relance',
  '',
  '',
  'def get_pending_relances_for_today() -> List[Dict[str, Any]]:',
  '    """',
  '    Retourne les relances qui doivent declencher un rappel aujourd hui.',
  '',
  '    Utilise par le scheduler (cron quotidien).',
  '    """',
  '    today = date.today().isoformat()',
  '',
  '    rows = select_rows(',
  '        "relances",',
  '        filters={',
  '            "status": RelanceStatus.PENDING.value,',
  '            "scheduled_date": today,',
  '        },',
  '        limit=1000,',
  '    )',
  '',
  '    logger.info("relances_due_today", count=len(rows), date=today)',
  '    return rows',
  '',
  '',
  'def mark_reminded(relance_id: str) -> Dict[str, Any]:',
  '    """Marque une relance comme ayant recu son rappel."""',
  '    now = datetime.now(timezone.utc).isoformat()',
  '',
  '    updated = update_row(',
  '        "relances",',
  '        {"id": relance_id},',
  '        {',
  '            "status": RelanceStatus.REMINDED.value,',
  '            "reminded_at": now,',
  '        },',
  '    )',
  '',
  '    logger.info("relance_reminded", relance_id=relance_id)',
  '    return updated or {}',
]);

// ============================================================
// 4. TESTS
// ============================================================

logStep('4. tests/test_relance_service.py');

writeLines('backend/tests/test_relance_service.py', [
  '"""Tests du service de relance."""',
  '',
  'from app.services.relance.schemas import RelanceSchedule, RelanceStatus',
  '',
  '',
  'def test_relance_status_values() -> None:',
  '    """Verifie les valeurs de l enum de statut."""',
  '    assert RelanceStatus.PENDING.value == "pending"',
  '    assert RelanceStatus.REMINDED.value == "reminded"',
  '    assert RelanceStatus.SENT.value == "sent"',
  '    assert RelanceStatus.CANCELLED.value == "cancelled"',
  '',
  '',
  'def test_relance_schedule_valid() -> None:',
  '    """Payload valide."""',
  '    schedule = RelanceSchedule(',
  '        user_id="user-123",',
  '        company_name="TechCorp",',
  '        job_title="Dev Python",',
  '        wait_days=7,',
  '    )',
  '    assert schedule.wait_days == 7',
  '    assert schedule.language == "fr"',
  '',
  '',
  'def test_relance_schedule_invalid_days() -> None:',
  '    """wait_days doit etre entre 1 et 90."""',
  '    import pytest',
  '',
  '    with pytest.raises(Exception):',
  '        RelanceSchedule(',
  '            user_id="user-123",',
  '            company_name="TechCorp",',
  '            job_title="Dev",',
  '            wait_days=0,',
  '        )',
  '',
  '    with pytest.raises(Exception):',
  '        RelanceSchedule(',
  '            user_id="user-123",',
  '            company_name="TechCorp",',
  '            job_title="Dev",',
  '            wait_days=100,',
  '        )',
  '',
  '',
  'def test_relance_module_imports() -> None:',
  '    """Verifie que le module s importe correctement."""',
  '    from app.services.relance import service',
  '    assert hasattr(service, "schedule_relance")',
  '    assert hasattr(service, "get_user_relances")',
  '    assert hasattr(service, "cancel_relance")',
  '    assert hasattr(service, "mark_as_sent")',
  '    assert hasattr(service, "get_pending_relances_for_today")',
  '    assert hasattr(service, "mark_reminded")',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 6a terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/relance/__init__.py');
console.log('    - backend/app/services/relance/schemas.py');
console.log('    - backend/app/services/relance/service.py');
console.log('    - backend/tests/test_relance_service.py');
console.log('');
console.log('  TESTS :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pytest tests/test_relance_service.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase6b.js (Router /api/relance)');
console.log('');