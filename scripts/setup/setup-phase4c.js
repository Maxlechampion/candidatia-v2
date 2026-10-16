#!/usr/bin/env node
/**
 * setup-phase4c.js — CandidatIA
 * Phase 4c : Middleware JWT + protection routes
 *
 * Crée :
 *   - backend/app/core/security.py (dependencies FastAPI pour l auth)
 *
 * Modifie :
 *   - backend/app/routers/generation.py (ajout de la protection JWT + decrement credits)
 *
 * Usage : node setup-phase4c.js
 * Prérequis : avoir exécuté setup-phase4b.js
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

logHeader('CandidatIA — Setup Phase 4c : Middleware JWT + protection routes');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'auth', 'jwt_service.py'))) {
  console.error('');
  console.error('  ERREUR : jwt_service.py introuvable.');
  console.error('  Execute d abord setup-phase4b.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. SECURITY - Dependencies FastAPI
// ============================================================

logStep('1. core/security.py (dependencies FastAPI)');

writeLines('backend/app/core/security.py', [
  '"""',
  'Dependencies FastAPI pour l authentification.',
  '',
  'Fournit :',
  '  - get_current_user : extrait et valide le JWT depuis l en-tete Authorization',
  '  - get_current_user_optional : idem mais retourne None si pas de token',
  '"""',
  '',
  'from typing import Any, Dict, Optional',
  '',
  'from fastapi import Depends, Header',
  '',
  'from app.core.errors import UnauthorizedError',
  'from app.core.logging import get_logger',
  'from app.services.auth.jwt_service import decode_access_token',
  'from app.services.auth.user_service import get_user_by_id',
  '',
  'logger = get_logger("core.security")',
  '',
  '',
  'def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:',
  '    """Extrait le token Bearer de l en-tete Authorization."""',
  '    if not authorization:',
  '        return None',
  '',
  '    parts = authorization.split()',
  '    if len(parts) != 2 or parts[0].lower() != "bearer":',
  '        return None',
  '',
  '    return parts[1]',
  '',
  '',
  'async def get_current_user(',
  '    authorization: Optional[str] = Header(None),',
  ') -> Dict[str, Any]:',
  '    """',
  '    Dependency : recupere l utilisateur courant depuis le JWT.',
  '',
  '    Usage :',
  '        @router.get("/protected")',
  '        async def route(user = Depends(get_current_user)):',
  '            return {"user_id": user["id"]}',
  '    """',
  '    token = _extract_bearer_token(authorization)',
  '    if not token:',
  '        raise UnauthorizedError(message="Token d authentification manquant.")',
  '',
  '    payload = decode_access_token(token)',
  '    user_id = payload.get("sub")',
  '    if not user_id:',
  '        raise UnauthorizedError(message="Token invalide (pas d ID utilisateur).")',
  '',
  '    try:',
  '        user = get_user_by_id(user_id)',
  '    except Exception as e:',
  '        logger.warning("user_lookup_failed", user_id=user_id, error=str(e))',
  '        raise UnauthorizedError(message="Utilisateur introuvable.")',
  '',
  '    return user',
  '',
  '',
  'async def get_current_user_optional(',
  '    authorization: Optional[str] = Header(None),',
  ') -> Optional[Dict[str, Any]]:',
  '    """Dependency : idem mais retourne None si pas de token valide."""',
  '    token = _extract_bearer_token(authorization)',
  '    if not token:',
  '        return None',
  '',
  '    try:',
  '        payload = decode_access_token(token)',
  '        user_id = payload.get("sub")',
  '        if not user_id:',
  '            return None',
  '        return get_user_by_id(user_id)',
  '    except Exception:',
  '        return None',
]);

// ============================================================
// 2. MISE À JOUR generation.py (protection JWT + decrement)
// ============================================================

logStep('2. Mise a jour routers/generation.py');

const generationPath = path.join(ROOT, 'backend', 'app', 'routers', 'generation.py');

if (!fs.existsSync(generationPath)) {
  console.error('  ERREUR : generation.py introuvable.');
  process.exit(1);
}

// On remplace complètement le fichier par la version protégée
writeLines('backend/app/routers/generation.py', [
  '"""Router /api/generate — pipeline complet de generation de pack (protege par JWT)."""',
  '',
  'import os',
  'from typing import Any, Dict, Optional',
  '',
  'from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile',
  'from fastapi.responses import FileResponse',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import AppError, GenerationError, IngestionError',
  'from app.core.logging import get_logger',
  'from app.core.security import get_current_user',
  'from app.services.ai.orchestrator import get_orchestrator',
  'from app.services.ai.prompts import (',
  '    get_cv_prompt,',
  '    get_guide_prompt,',
  '    get_lettre_prompt,',
  '    get_relance_prompt,',
  ')',
  'from app.services.auth.quota_service import check_quota',
  'from app.services.auth.user_service import consume_credit',
  'from app.services.generation.pack_builder import get_pack_builder',
  'from app.services.ingestion.service import get_ingestion_service',
  'from app.services.language.locale_map import get_locale_conventions',
  '',
  'logger = get_logger("router.generation")',
  'router = APIRouter(prefix="/api", tags=["generation"])',
  '',
  '',
  'async def _extraire_entree(',
  '    fichier: Optional[UploadFile],',
  '    texte: Optional[str],',
  '    label: str,',
  ') -> str:',
  '    """Extrait le texte depuis un fichier ou un texte brut."""',
  '    settings = get_settings()',
  '    service = get_ingestion_service()',
  '',
  '    if fichier:',
  '        content_bytes = await fichier.read()',
  '        max_bytes = settings.max_file_size_mb * 1024 * 1024',
  '        if len(content_bytes) > max_bytes:',
  '            raise HTTPException(',
  '                status_code=413,',
  '                detail=f"{label} : fichier trop volumineux (max {settings.max_file_size_mb} MB).",',
  '            )',
  '        try:',
  '            return service.extract_from_bytes(content_bytes, fichier.filename or "unknown")',
  '        except IngestionError as e:',
  '            raise HTTPException(status_code=e.status_code, detail=f"{label} : {e.message}")',
  '',
  '    if texte:',
  '        try:',
  '            return service.extract_from_text(texte)',
  '        except Exception as e:',
  '            raise HTTPException(status_code=400, detail=f"{label} : {str(e)}")',
  '',
  '    raise HTTPException(',
  '        status_code=400,',
  '        detail=f"{label} : fournir soit un fichier soit un texte.",',
  '    )',
  '',
  '',
  '@router.post("/generate", summary="Generer un pack complet (JWT requis)")',
  'async def generate_pack(',
  '    fichier_profil: Optional[UploadFile] = File(None),',
  '    fichier_offre: Optional[UploadFile] = File(None),',
  '    texte_profil: Optional[str] = Form(None),',
  '    texte_offre: Optional[str] = Form(None),',
  '    output_language: str = Form("fr"),',
  '    inclure_relance: bool = Form(False),',
  '    relance_wait_days: int = Form(7),',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  '):',
  '    """',
  '    Pipeline complet protege par JWT :',
  '    1. Verification du quota utilisateur',
  '    2. Ingestion du profil et de l offre',
  '    3. Generation CV + Lettre + Guide (IA)',
  '    4. Assemblage des documents Word',
  '    5. Compression ZIP',
  '    6. Decrement du credit',
  '    7. Retour du ZIP telechargeable',
  '    """',
  '    user_id = user["id"]',
  '    user_email = user.get("email", "unknown")',
  '',
  '    logger.info(',
  '        "generate_start",',
  '        user_id=user_id,',
  '        user_email=user_email,',
  '        output_language=output_language,',
  '    )',
  '',
  '    # 0. Verification du quota',
  '    check_quota(user_id)',
  '',
  '    # 1. Extraction',
  '    profil = await _extraire_entree(fichier_profil, texte_profil, "Profil")',
  '    offre = await _extraire_entree(fichier_offre, texte_offre, "Offre")',
  '',
  '    if len(profil) < 50:',
  '        raise HTTPException(status_code=400, detail="Profil trop court (min 50 caracteres).")',
  '    if len(offre) < 50:',
  '        raise HTTPException(status_code=400, detail="Offre trop courte (min 50 caracteres).")',
  '',
  '    # 2. Conventions culturelles',
  '    locale = get_locale_conventions(output_language)',
  '    logger.info("locale_resolved", language=output_language, country=locale.get("country"))',
  '',
  '    orchestrator = get_orchestrator()',
  '',
  '    # 3. CV',
  '    try:',
  '        sys_prompt, user_prompt = get_cv_prompt(profil, offre, locale, output_language)',
  '        cv_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except AppError:',
  '        raise',
  '    except Exception as e:',
  '        logger.exception("cv_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation CV : {str(e)}")',
  '',
  '    coordonnees = cv_data.get("coordonnees", {})',
  '    nom_candidat = coordonnees.get("nom_complet", "Candidat")',
  '    analyse = cv_data.get("analyse", {})',
  '    cv_contexte = (',
  '        f"Candidat: {nom_candidat}\\n"',
  '        f"Poste vise: {cv_data.get(\'titre_professionnel\', \'\')}\\n"',
  '        f"Score: {analyse.get(\'score_matching\', 0)}/100\\n"',
  '        f"Points forts: {\', \'.join(analyse.get(\'points_forts\', []))}\\n"',
  '        f"Strategie: {analyse.get(\'strategie_candidature\', \'\')}"',
  '    )',
  '',
  '    # 4. Lettre',
  '    try:',
  '        sys_prompt, user_prompt = get_lettre_prompt(cv_contexte, offre, locale, output_language)',
  '        lettre_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except Exception as e:',
  '        logger.exception("lettre_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation Lettre : {str(e)}")',
  '',
  '    # 5. Guide',
  '    try:',
  '        sys_prompt, user_prompt = get_guide_prompt(cv_contexte, offre, locale, output_language)',
  '        guide_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except Exception as e:',
  '        logger.exception("guide_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation Guide : {str(e)}")',
  '',
  '    # 6. Relance (optionnel)',
  '    relance_data = None',
  '    if inclure_relance:',
  '        try:',
  '            entreprise = guide_data.get("nom_entreprise", "Entreprise")',
  '            poste = guide_data.get("titre_poste", cv_data.get("titre_professionnel", "Poste"))',
  '            sys_prompt, user_prompt = get_relance_prompt(',
  '                nom_candidat, poste, entreprise, relance_wait_days, locale, output_language',
  '            )',
  '            relance_ia = orchestrator.generate_json(sys_prompt, user_prompt)',
  '            relance_data = {',
  '                "company_name": entreprise,',
  '                "job_title": poste,',
  '                "wait_days": relance_wait_days,',
  '                "subject": relance_ia.get("subject", ""),',
  '                "body": relance_ia.get("body", ""),',
  '                "signature": relance_ia.get("signature", ""),',
  '            }',
  '        except Exception as e:',
  '            logger.warning("relance_generation_failed", error=str(e))',
  '            relance_data = None',
  '',
  '    # 7. Assemblage',
  '    try:',
  '        builder = get_pack_builder()',
  '        pack_name = f"Pack_{nom_candidat.replace(\' \', \'_\')}"',
  '        result = builder.build_pack(',
  '            cv_data=cv_data,',
  '            lettre_data=lettre_data,',
  '            guide_data=guide_data,',
  '            relance_data=relance_data,',
  '            locale=locale,',
  '            pack_name=pack_name,',
  '        )',
  '    except GenerationError as e:',
  '        logger.exception("pack_build_failed", error=str(e))',
  '        raise HTTPException(status_code=500, detail=f"Erreur assemblage : {e.message}")',
  '',
  '    # 8. Decrement du credit',
  '    try:',
  '        consume_credit(user_id)',
  '        logger.info("credit_consumed", user_id=user_id)',
  '    except Exception as e:',
  '        logger.warning("credit_consumption_failed", user_id=user_id, error=str(e))',
  '',
  '    # 9. Retour du ZIP',
  '    zip_path = result["zip_path"]',
  '    if not os.path.exists(zip_path):',
  '        raise HTTPException(status_code=500, detail="Le ZIP n a pas ete cree.")',
  '',
  '    logger.info("generate_success", user_id=user_id, zip_path=zip_path)',
  '',
  '    return FileResponse(',
  '        path=zip_path,',
  '        filename=os.path.basename(zip_path),',
  '        media_type="application/zip",',
  '    )',
  '',
  '',
  '@router.get("/generate/info", summary="Informations sur le pipeline")',
  'async def generate_info() -> dict:',
  '    """Endpoint public : retourne les infos du pipeline."""',
  '    from app.services.generation.pdf_export import pdf_disponible',
  '    from app.services.language.locale_map import list_supported_locales',
  '',
  '    return {',
  '        "supported_languages": list_supported_locales(),',
  '        "pdf_available": pdf_disponible(),',
  '        "max_file_size_mb": get_settings().max_file_size_mb,',
  '        "auth_required": True,',
  '    }',
]);

// ============================================================
// 3. TESTS
// ============================================================

logStep('3. tests/test_security.py');

writeLines('backend/tests/test_security.py', [
  '"""Tests des dependencies de securite."""',
  '',
  'from app.core.security import _extract_bearer_token',
  '',
  '',
  'def test_extract_bearer_valid() -> None:',
  '    assert _extract_bearer_token("Bearer abc123") == "abc123"',
  '',
  '',
  'def test_extract_bearer_case_insensitive() -> None:',
  '    assert _extract_bearer_token("bearer xyz") == "xyz"',
  '    assert _extract_bearer_token("BEARER xyz") == "xyz"',
  '',
  '',
  'def test_extract_bearer_missing() -> None:',
  '    assert _extract_bearer_token(None) is None',
  '    assert _extract_bearer_token("") is None',
  '',
  '',
  'def test_extract_bearer_invalid_format() -> None:',
  '    assert _extract_bearer_token("abc123") is None',
  '    assert _extract_bearer_token("Basic xyz") is None',
  '    assert _extract_bearer_token("Bearer abc extra") is None',
]);

logStep('4. tests/test_generation_protected.py');

writeLines('backend/tests/test_generation_protected.py', [
  '"""Tests de protection de /api/generate par JWT."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_generate_without_token_returns_401(client: TestClient) -> None:',
  '    """Sans token, /api/generate retourne 401."""',
  '    response = client.post("/api/generate")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_generate_with_invalid_token_returns_401(client: TestClient) -> None:',
  '    """Avec un token invalide, retourne 401."""',
  '    response = client.post(',
  '        "/api/generate",',
  '        headers={"Authorization": "Bearer invalid.token.here"},',
  '    )',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_generate_info_is_public(client: TestClient) -> None:',
  '    """L endpoint /info reste public."""',
  '    response = client.get("/api/generate/info")',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert data["auth_required"] is True',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 4c terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/core/security.py');
console.log('    - backend/tests/test_security.py');
console.log('    - backend/tests/test_generation_protected.py');
console.log('');
console.log('  Fichiers mis a jour :');
console.log('    - backend/app/routers/generation.py (protege par JWT)');
console.log('');
console.log('  TESTS :');
console.log('    pytest tests/test_security.py tests/test_generation_protected.py -v');
console.log('');
console.log('  VERIFICATION MANUELLE :');
console.log('    1. Demarrer uvicorn :');
console.log('       uvicorn app.main:app --reload');
console.log('');
console.log('    2. Sans token, /api/generate doit retourner 401 :');
console.log('       irm -Method POST http://localhost:8000/api/generate');
console.log('');
console.log('  Prochaine etape : setup-phase4d.js (Router auth + generations + quotas)');
console.log('');