#!/usr/bin/env node
/**
 * setup-phase4d.js — CandidatIA
 * Phase 4d : Router auth + router generations + router quotas + integration main.py
 *
 * Crée :
 *   - backend/app/routers/auth.py
 *   - backend/app/routers/generations.py
 *   - backend/app/routers/quota.py
 *
 * Modifie :
 *   - backend/app/main.py (ajout des 3 routers)
 *   - backend/tests/test_auth_router.py (nouveau)
 *
 * Usage : node setup-phase4d.js
 * Prérequis : avoir exécuté setup-phase4c.js
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

logHeader('CandidatIA — Setup Phase 4d : Router auth + generations + quota');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'core', 'security.py'))) {
  console.error('');
  console.error('  ERREUR : core/security.py introuvable.');
  console.error('  Execute d abord setup-phase4c.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. ROUTER AUTH
// ============================================================

logStep('1. routers/auth.py');

writeLines('backend/app/routers/auth.py', [
  '"""Router /api/auth — Inscription, connexion, profil utilisateur."""',
  '',
  'from typing import Any, Dict, Optional',
  '',
  'from fastapi import APIRouter, Depends, HTTPException',
  'from pydantic import BaseModel, EmailStr, Field',
  '',
  'from app.core.logging import get_logger',
  'from app.core.security import get_current_user',
  'from app.services.auth.jwt_service import create_access_token',
  'from app.services.auth.password import verify_password',
  'from app.services.auth.quota_service import get_quota_info',
  'from app.services.auth.user_service import create_user, get_user_by_email',
  '',
  'logger = get_logger("router.auth")',
  'router = APIRouter(prefix="/api/auth", tags=["auth"])',
  '',
  '',
  'class RegisterRequest(BaseModel):',
  '    """Payload d inscription."""',
  '    email: EmailStr',
  '    password: str = Field(..., min_length=8)',
  '    full_name: Optional[str] = None',
  '    preferred_locale: str = "fr"',
  '',
  '',
  'class LoginRequest(BaseModel):',
  '    """Payload de connexion."""',
  '    email: EmailStr',
  '    password: str',
  '',
  '',
  'class AuthResponse(BaseModel):',
  '    """Reponse d authentification."""',
  '    access_token: str',
  '    token_type: str = "bearer"',
  '    user: Dict[str, Any]',
  '',
  '',
  'def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:',
  '    """Retire les champs sensibles avant de retourner un user au client."""',
  '    return {',
  '        "id": user.get("id"),',
  '        "email": user.get("email"),',
  '        "full_name": user.get("full_name"),',
  '        "credits": user.get("credits", 0),',
  '        "plan": user.get("plan", "free"),',
  '        "email_verified": user.get("email_verified", False),',
  '        "preferred_locale": user.get("preferred_locale", "fr"),',
  '        "created_at": user.get("created_at"),',
  '    }',
  '',
  '',
  '@router.post("/register", response_model=AuthResponse, summary="Inscription")',
  'async def register(payload: RegisterRequest) -> AuthResponse:',
  '    """Cree un compte utilisateur et retourne un JWT."""',
  '    logger.info("register_attempt", email=payload.email)',
  '',
  '    try:',
  '        user = create_user(',
  '            email=payload.email,',
  '            password=payload.password,',
  '            full_name=payload.full_name,',
  '        )',
  '    except Exception as e:',
  '        logger.warning("register_failed", email=payload.email, error=str(e))',
  '        raise HTTPException(status_code=400, detail=str(e))',
  '',
  '    token = create_access_token(user_id=user["id"], email=user["email"])',
  '',
  '    logger.info("register_success", email=payload.email, user_id=user["id"])',
  '',
  '    return AuthResponse(',
  '        access_token=token,',
  '        user=_public_user(user),',
  '    )',
  '',
  '',
  '@router.post("/login", response_model=AuthResponse, summary="Connexion")',
  'async def login(payload: LoginRequest) -> AuthResponse:',
  '    """Authentifie un utilisateur et retourne un JWT."""',
  '    logger.info("login_attempt", email=payload.email)',
  '',
  '    user = get_user_by_email(payload.email)',
  '    if not user:',
  '        logger.warning("login_failed_user_not_found", email=payload.email)',
  '        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")',
  '',
  '    password_hash = user.get("password_hash", "")',
  '    if not password_hash or not verify_password(payload.password, password_hash):',
  '        logger.warning("login_failed_bad_password", email=payload.email)',
  '        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")',
  '',
  '    token = create_access_token(user_id=user["id"], email=user["email"])',
  '',
  '    logger.info("login_success", email=payload.email, user_id=user["id"])',
  '',
  '    return AuthResponse(',
  '        access_token=token,',
  '        user=_public_user(user),',
  '    )',
  '',
  '',
  '@router.get("/me", summary="Profil de l utilisateur courant")',
  'async def me(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:',
  '    """Retourne le profil de l utilisateur authentifie."""',
  '    return _public_user(user)',
  '',
  '',
  '@router.get("/me/quota", summary="Quota de l utilisateur courant")',
  'async def my_quota(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:',
  '    """Retourne les informations de quota de l utilisateur."""',
  '    return get_quota_info(user["id"])',
]);

// ============================================================
// 2. ROUTER GENERATIONS (historique)
// ============================================================

logStep('2. routers/generations.py');

writeLines('backend/app/routers/generations.py', [
  '"""Router /api/generations — Historique des packs generes."""',
  '',
  'from typing import Any, Dict, List',
  '',
  'from fastapi import APIRouter, Depends, HTTPException',
  '',
  'from app.core.database import select_rows',
  'from app.core.logging import get_logger',
  'from app.core.security import get_current_user',
  '',
  'logger = get_logger("router.generations")',
  'router = APIRouter(prefix="/api/generations", tags=["generations"])',
  '',
  '',
  '@router.get("", summary="Liste des generations de l utilisateur")',
  'async def list_my_generations(',
  '    user: Dict[str, Any] = Depends(get_current_user),',
  '    limit: int = 20,',
  ') -> List[Dict[str, Any]]:',
  '    """Retourne l historique des packs generes par l utilisateur."""',
  '    if limit < 1 or limit > 100:',
  '        raise HTTPException(status_code=400, detail="Limit doit etre entre 1 et 100.")',
  '',
  '    try:',
  '        rows = select_rows(',
  '            "generations",',
  '            filters={"user_id": user["id"]},',
  '            limit=limit,',
  '            order_by="created_at",',
  '            descending=True,',
  '        )',
  '        return rows',
  '    except Exception as e:',
  '        logger.exception("list_generations_failed", user_id=user["id"], error=str(e))',
  '        raise HTTPException(status_code=500, detail="Erreur lecture historique.")',
  '',
  '',
  '@router.get("/stats", summary="Statistiques de l utilisateur")',
  'async def my_stats(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:',
  '    """Retourne les statistiques de l utilisateur."""',
  '    try:',
  '        rows = select_rows("generations", filters={"user_id": user["id"]})',
  '',
  '        total = len(rows)',
  '        scores = [r.get("score_matching") for r in rows if r.get("score_matching")]',
  '        avg_score = round(sum(scores) / len(scores), 1) if scores else 0',
  '',
  '        return {',
  '            "total_generations": total,',
  '            "average_score": avg_score,',
  '            "credits_remaining": user.get("credits", 0),',
  '            "plan": user.get("plan", "free"),',
  '        }',
  '    except Exception as e:',
  '        logger.exception("stats_failed", user_id=user["id"], error=str(e))',
  '        raise HTTPException(status_code=500, detail="Erreur calcul statistiques.")',
]);

// ============================================================
// 3. ROUTER QUOTA
// ============================================================

logStep('3. routers/quota.py');

writeLines('backend/app/routers/quota.py', [
  '"""Router /api/quota — Informations sur les plans et quotas."""',
  '',
  'from typing import Any, Dict',
  '',
  'from fastapi import APIRouter, Depends',
  '',
  'from app.core.security import get_current_user',
  'from app.services.auth.quota_service import PLAN_QUOTAS, get_quota_info',
  '',
  'router = APIRouter(prefix="/api/quota", tags=["quota"])',
  '',
  '',
  '@router.get("/plans", summary="Liste des plans disponibles (public)")',
  'async def list_plans() -> Dict[str, Any]:',
  '    """Retourne la liste des plans avec leurs tarifs."""',
  '    return {',
  '        "plans": [',
  '            {',
  '                "code": code,',
  '                "name": info["name"],',
  '                "monthly_credits": info.get("monthly_credits", 0),',
  '                "total_credits": info.get("total_credits", 0),',
  '                "price_eur": info.get("price_eur", 0),',
  '            }',
  '            for code, info in PLAN_QUOTAS.items()',
  '        ]',
  '    }',
  '',
  '',
  '@router.get("/me", summary="Mon quota actuel")',
  'async def my_quota(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:',
  '    """Retourne le quota de l utilisateur connecte."""',
  '    return get_quota_info(user["id"])',
]);

// ============================================================
// 4. MISE À JOUR main.py
// ============================================================

logStep('4. main.py (ajout des 3 routers)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');
let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

// Import : ajouter auth, generations, quota si absents
if (!mainContent.includes('quota')) {
  mainContent = mainContent.replace(
    /from app\.routers import ([^\n]+)/,
    (match, modules) => {
      const mods = modules.split(',').map(m => m.trim());
      ['auth', 'generations', 'quota'].forEach(m => {
        if (!mods.includes(m)) mods.push(m);
      });
      return 'from app.routers import ' + mods.join(', ');
    }
  );
}

// Include_router : ajouter les 3 routers
const includesToAdd = [
  { marker: 'app.include_router(generation.router)', newLine: 'app.include_router(auth.router)' },
  { marker: 'app.include_router(auth.router)', newLine: 'app.include_router(generations.router)' },
  { marker: 'app.include_router(generations.router)', newLine: 'app.include_router(quota.router)' },
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
// 5. TEST AUTH ROUTER
// ============================================================

logStep('5. tests/test_auth_router.py');

writeLines('backend/tests/test_auth_router.py', [
  '"""Tests du router /api/auth."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_register_short_password_returns_422(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/auth/register",',
  '        json={"email": "test@example.com", "password": "short"},',
  '    )',
  '    assert response.status_code == 422',
  '',
  '',
  'def test_register_invalid_email_returns_422(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/auth/register",',
  '        json={"email": "not-an-email", "password": "motdepasse123"},',
  '    )',
  '    assert response.status_code == 422',
  '',
  '',
  'def test_login_missing_fields_returns_422(client: TestClient) -> None:',
  '    response = client.post("/api/auth/login", json={})',
  '    assert response.status_code == 422',
  '',
  '',
  'def test_login_unknown_user_returns_401(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/auth/login",',
  '        json={"email": "unknown@nowhere.com", "password": "anypassword123"},',
  '    )',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_me_without_token_returns_401(client: TestClient) -> None:',
  '    response = client.get("/api/auth/me")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_me_quota_without_token_returns_401(client: TestClient) -> None:',
  '    response = client.get("/api/auth/me/quota")',
  '    assert response.status_code == 401',
  '',
  '',
  'def test_plans_is_public(client: TestClient) -> None:',
  '    response = client.get("/api/quota/plans")',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert "plans" in data',
  '    assert len(data["plans"]) >= 4',
  '',
  '',
  'def test_generations_requires_auth(client: TestClient) -> None:',
  '    response = client.get("/api/generations")',
  '    assert response.status_code == 401',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 4d terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/routers/auth.py');
console.log('    - backend/app/routers/generations.py');
console.log('    - backend/app/routers/quota.py');
console.log('    - backend/tests/test_auth_router.py');
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
console.log('  2. Verifier les endpoints charges :');
console.log('     (irm http://localhost:8000/openapi.json).paths | Get-Member -MemberType NoteProperty | Select-Object Name');
console.log('');
console.log('     Attendu :');
console.log('       /, /health, /api/ingest, /api/generate, /api/generate/info');
console.log('       /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/me/quota');
console.log('       /api/generations, /api/generations/stats');
console.log('       /api/quota/plans, /api/quota/me');
console.log('');
console.log('  3. Lancer les tests :');
console.log('     pytest tests/test_auth_router.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase4e.js (tests d integration)');
console.log('');