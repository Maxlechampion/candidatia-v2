#!/usr/bin/env node
/**
 * setup-phase2c.js — CandidatIA
 * Phase 2c : Router /api/ingest + réactivation dans main.py
 *
 * Crée :
 *   - backend/app/routers/ingestion.py (le router manquant)
 *   - backend/app/routers/__init__.py (mis à jour)
 *
 * Modifie :
 *   - backend/app/main.py (réactive l'import ingestion)
 *
 * Usage : node setup-phase2c.js
 * Prérequis : avoir exécuté setup-phase2a.js et setup-phase2b.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ============================================================
// UTILITAIRES
// ============================================================

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

// ============================================================
// VÉRIFICATIONS
// ============================================================

logHeader('CandidatIA — Setup Phase 2c : Router /api/ingest');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'ingestion', 'service.py'))) {
  console.error('');
  console.error('  ERREUR : Les services d ingestion sont introuvables.');
  console.error('  Execute d abord setup-phase2a.js.');
  console.error('');
  process.exit(1);
}

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'language', 'detector.py'))) {
  console.error('');
  console.error('  ERREUR : Les services de langue sont introuvables.');
  console.error('  Execute d abord setup-phase2b.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. ROUTER INGESTION
// ============================================================

logStep('1. routers/ingestion.py (endpoint /api/ingest)');

writeLines('backend/app/routers/ingestion.py', [
  '"""Router /api/ingest — Point d entree unique pour l ingestion."""',
  '',
  'from typing import Optional',
  '',
  'from fastapi import APIRouter, File, Form, HTTPException, UploadFile',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import IngestionError',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.detector import detect_content_type',
  'from app.services.ingestion.service import get_ingestion_service',
  'from app.services.language.detector import detect_language, get_language_name',
  'from app.services.language.locale_map import get_locale_conventions',
  '',
  'logger = get_logger("router.ingestion")',
  'router = APIRouter(prefix="/api", tags=["ingestion"])',
  '',
  '',
  '@router.post("/ingest", summary="Ingestion d un fichier ou texte brut")',
  'async def ingest(',
  '    fichier: Optional[UploadFile] = File(None),',
  '    texte: Optional[str] = Form(None),',
  '    content_type_hint: Optional[str] = Form(None),',
  '):',
  '    """',
  '    Ingere un document (fichier ou texte brut) et retourne :',
  '    - le texte nettoye',
  '    - la langue detectee',
  '    - le type de contenu (cv / offre / inconnu)',
  '    - les conventions culturelles associees',
  '    """',
  '    settings = get_settings()',
  '    service = get_ingestion_service()',
  '',
  '    # Validation : au moins un des deux',
  '    if not fichier and not texte:',
  '        raise HTTPException(',
  '            status_code=400,',
  '            detail="Fournir soit un fichier soit un texte.",',
  '        )',
  '',
  '    # 1. Extraction',
  '    if fichier:',
  '        content_bytes = await fichier.read()',
  '',
  '        # Verification taille',
  '        max_bytes = settings.max_file_size_mb * 1024 * 1024',
  '        if len(content_bytes) > max_bytes:',
  '            raise HTTPException(',
  '                status_code=413,',
  '                detail=f"Fichier trop volumineux (max {settings.max_file_size_mb} MB).",',
  '            )',
  '',
  '        try:',
  '            extracted = service.extract_from_bytes(content_bytes, fichier.filename or "unknown")',
  '        except IngestionError as e:',
  '            raise HTTPException(status_code=e.status_code, detail=e.message)',
  '',
  '        source = "file"',
  '        filename = fichier.filename',
  '    else:',
  '        try:',
  '            extracted = service.extract_from_text(texte)',
  '        except Exception as e:',
  '            raise HTTPException(status_code=400, detail=str(e))',
  '',
  '        source = "text"',
  '        filename = None',
  '',
  '    # 2. Detection langue',
  '    detected_language = detect_language(extracted)',
  '    language_name = get_language_name(detected_language)',
  '',
  '    # 3. Detection type de contenu',
  '    if content_type_hint in ("cv", "offre"):',
  '        detected_type = content_type_hint',
  '        confidence = 1.0',
  '    else:',
  '        detected_type, confidence = detect_content_type(extracted)',
  '',
  '    # 4. Conventions culturelles',
  '    locale_conventions = get_locale_conventions(detected_language)',
  '',
  '    logger.info(',
  '        "ingestion_success",',
  '        source=source,',
  '        filename=filename,',
  '        text_length=len(extracted),',
  '        language=detected_language,',
  '        content_type=detected_type,',
  '        confidence=confidence,',
  '    )',
  '',
  '    return {',
  '        "status": "ok",',
  '        "source": source,',
  '        "filename": filename,',
  '        "text": extracted,',
  '        "text_length": len(extracted),',
  '        "language": {',
  '            "code": detected_language,',
  '            "name": language_name,',
  '        },',
  '        "content_type": {',
  '            "type": detected_type,',
  '            "confidence": confidence,',
  '        },',
  '        "locale": locale_conventions,',
  '    }',
]);

// ============================================================
// 2. METTRE À JOUR routers/__init__.py
// ============================================================

logStep('2. routers/__init__.py (mise a jour)');

writeLines('backend/app/routers/__init__.py', [
  '"""Routers FastAPI de CandidatIA."""',
  '',
  'from app.routers import health, ingestion',
  '',
  '__all__ = ["health", "ingestion"]',
]);

// ============================================================
// 3. METTRE À JOUR main.py
// ============================================================

logStep('3. main.py (reactivation de l import ingestion)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');

if (!fs.existsSync(mainPath)) {
  console.error('  ERREUR : backend/app/main.py introuvable.');
  process.exit(1);
}

let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

// Normaliser l'import : ajouter ingestion s'il n'y est pas
if (!mainContent.includes('from app.routers import health, ingestion')) {
  mainContent = mainContent.replace(
    /from app\.routers import health(?!\s*,\s*ingestion)/,
    'from app.routers import health, ingestion'
  );
}

// Normaliser l'include_router : ajouter ingestion s'il n'y est pas
if (!mainContent.includes('app.include_router(ingestion.router)')) {
  mainContent = mainContent.replace(
    /(\s+)app\.include_router\(health\.router\)/,
    '$1app.include_router(health.router)\n$1app.include_router(ingestion.router)'
  );
}

if (mainContent !== originalContent) {
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log('  OK  backend/app/main.py (mis a jour)');
} else {
  console.log('  SKIP  backend/app/main.py (deja a jour)');
}

// Vérification finale
const finalContent = fs.readFileSync(mainPath, 'utf-8');
const hasImport = finalContent.includes('from app.routers import health, ingestion');
const hasInclude = finalContent.includes('app.include_router(ingestion.router)');

if (!hasImport || !hasInclude) {
  console.log('');
  console.log('  ATTENTION : La mise a jour automatique de main.py a echoue.');
  console.log('  Verifie manuellement que main.py contient :');
  console.log('    from app.routers import health, ingestion');
  console.log('    app.include_router(health.router)');
  console.log('    app.include_router(ingestion.router)');
}

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 2c terminee avec succes');

console.log('  Fichiers crees / mis a jour :');
console.log('    - backend/app/routers/ingestion.py (nouveau)');
console.log('    - backend/app/routers/__init__.py (mis a jour)');
console.log('    - backend/app/main.py (mis a jour)');
console.log('');
console.log('  VERIFICATION CRITIQUE — Lance ces commandes :');
console.log('');
console.log('  1. Arreter uvicorn (CTRL+C dans son terminal)');
console.log('');
console.log('  2. Relancer uvicorn :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('     uvicorn app.main:app --reload');
console.log('');
console.log('  3. Dans un autre terminal, verifier que /api/ingest est charge :');
console.log('     (irm http://localhost:8000/openapi.json).paths | Get-Member -MemberType NoteProperty | Select-Object Name');
console.log('');
console.log('     Attendu : /, /health, /api/ingest');
console.log('');
console.log('  4. Tester avec Swagger :');
console.log('     http://localhost:8000/docs');
console.log('');
console.log('  Prochaine etape : setup-phase2d.js (tests unitaires)');
console.log('');