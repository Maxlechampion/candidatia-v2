#!/usr/bin/env node
/**
 * setup-phase4b.js — CandidatIA
 * Phase 4b : Service Auth (password, JWT, users, quotas)
 *
 * Crée :
 *   - backend/app/services/auth/__init__.py
 *   - backend/app/services/auth/password.py
 *   - backend/app/services/auth/jwt_service.py
 *   - backend/app/services/auth/user_service.py
 *   - backend/app/services/auth/quota_service.py
 *   - backend/tests/test_password.py
 *   - backend/tests/test_jwt_service.py
 *   - backend/tests/test_user_service.py
 *   - backend/tests/test_quota_service.py
 *
 * Usage : node setup-phase4b.js
 * Prérequis : avoir exécuté setup-phase4a.js
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

logHeader('CandidatIA — Setup Phase 4b : Service Auth');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'core', 'supabase_client.py'))) {
  console.error('');
  console.error('  ERREUR : supabase_client.py introuvable.');
  console.error('  Execute d abord setup-phase4a.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. AUTH __init__
// ============================================================

logStep('1. auth/__init__.py');

writeLines('backend/app/services/auth/__init__.py', [
  '"""Services d authentification et de gestion utilisateurs."""',
  '',
  'from app.services.auth.password import hash_password, verify_password',
  'from app.services.auth.jwt_service import create_access_token, decode_access_token',
  'from app.services.auth.user_service import (',
  '    create_user,',
  '    get_user_by_email,',
  '    get_user_by_id,',
  '    update_user,',
  '    add_credits,',
  '    consume_credit,',
  ')',
  'from app.services.auth.quota_service import check_quota, get_quota_info',
  '',
  '__all__ = [',
  '    "hash_password",',
  '    "verify_password",',
  '    "create_access_token",',
  '    "decode_access_token",',
  '    "create_user",',
  '    "get_user_by_email",',
  '    "get_user_by_id",',
  '    "update_user",',
  '    "add_credits",',
  '    "consume_credit",',
  '    "check_quota",',
  '    "get_quota_info",',
  ']',
]);

// ============================================================
// 2. PASSWORD
// ============================================================

logStep('2. password.py (hachage bcrypt)');

writeLines('backend/app/services/auth/password.py', [
  '"""Hachage et verification des mots de passe (bcrypt)."""',
  '',
  'import bcrypt',
  '',
  'from app.core.errors import ValidationError',
  '',
  '',
  'def hash_password(password: str) -> str:',
  '    """Hache un mot de passe en bcrypt."""',
  '    if not password or len(password) < 8:',
  '        raise ValidationError(message="Le mot de passe doit faire au moins 8 caracteres.")',
  '',
  '    salt = bcrypt.gensalt(rounds=12)',
  '    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)',
  '    return hashed.decode("utf-8")',
  '',
  '',
  'def verify_password(password: str, hashed: str) -> bool:',
  '    """Verifie qu un mot de passe correspond a son hash."""',
  '    if not password or not hashed:',
  '        return False',
  '',
  '    try:',
  '        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))',
  '    except Exception:',
  '        return False',
]);

// ============================================================
// 3. JWT SERVICE
// ============================================================

logStep('3. jwt_service.py');

writeLines('backend/app/services/auth/jwt_service.py', [
  '"""Creation et verification des tokens JWT."""',
  '',
  'from datetime import datetime, timedelta, timezone',
  'from typing import Any, Dict, Optional',
  '',
  'from jose import JWTError, jwt',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import UnauthorizedError',
  'from app.core.logging import get_logger',
  '',
  'logger = get_logger("auth.jwt")',
  '',
  '',
  'def create_access_token(',
  '    user_id: str,',
  '    email: str,',
  '    expires_minutes: Optional[int] = None,',
  ') -> str:',
  '    """Cree un JWT signe pour un utilisateur."""',
  '    settings = get_settings()',
  '    expire_minutes = expires_minutes or settings.jwt_expiration_minutes',
  '',
  '    now = datetime.now(timezone.utc)',
  '    payload: Dict[str, Any] = {',
  '        "sub": user_id,',
  '        "email": email,',
  '        "iat": int(now.timestamp()),',
  '        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),',
  '    }',
  '',
  '    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)',
  '',
  '',
  'def decode_access_token(token: str) -> Dict[str, Any]:',
  '    """Decode et verifie un JWT. Leve UnauthorizedError si invalide."""',
  '    settings = get_settings()',
  '',
  '    try:',
  '        payload = jwt.decode(',
  '            token,',
  '            settings.secret_key,',
  '            algorithms=[settings.jwt_algorithm],',
  '        )',
  '        return payload',
  '    except JWTError as e:',
  '        logger.warning("jwt_decode_failed", error=str(e))',
  '        raise UnauthorizedError(message="Token invalide ou expire.") from e',
  '',
  '',
  'def extract_user_id(token: str) -> str:',
  '    """Extrait l ID utilisateur d un JWT."""',
  '    payload = decode_access_token(token)',
  '    user_id = payload.get("sub")',
  '    if not user_id:',
  '        raise UnauthorizedError(message="Token ne contient pas d ID utilisateur.")',
  '    return user_id',
]);

// ============================================================
// 4. USER SERVICE
// ============================================================

logStep('4. user_service.py');

writeLines('backend/app/services/auth/user_service.py', [
  '"""CRUD utilisateurs + gestion des credits."""',
  '',
  'from datetime import datetime, timezone',
  'from typing import Any, Dict, Optional',
  '',
  'from app.core.database import insert_row, select_one, update_row',
  'from app.core.errors import ForbiddenError, NotFoundError, ValidationError',
  'from app.core.logging import get_logger',
  'from app.services.auth.password import hash_password',
  '',
  'logger = get_logger("auth.user")',
  '',
  '',
  'def create_user(email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:',
  '    """Cree un nouvel utilisateur."""',
  '    email = email.lower().strip()',
  '',
  '    # Verifier si l email existe deja',
  '    existing = select_one("profiles", {"email": email})',
  '    if existing:',
  '        raise ValidationError(message="Un compte existe deja avec cet email.")',
  '',
  '    # Hacher le mot de passe',
  '    password_hash = hash_password(password)',
  '',
  '    # Inserer dans la DB',
  '    user_data = {',
  '        "email": email,',
  '        "full_name": full_name,',
  '        "password_hash": password_hash,',
  '        "credits": 1,',
  '        "plan": "free",',
  '        "email_verified": False,',
  '        "preferred_locale": "fr",',
  '    }',
  '',
  '    try:',
  '        user = insert_row("profiles", user_data)',
  '        logger.info("user_created", email=email, user_id=user.get("id"))',
  '        return user',
  '    except Exception as e:',
  '        logger.exception("user_creation_failed", email=email, error=str(e))',
  '        raise ValidationError(message=f"Erreur creation utilisateur : {str(e)}")',
  '',
  '',
  'def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:',
  '    """Recupere un utilisateur par email."""',
  '    return select_one("profiles", {"email": email.lower().strip()})',
  '',
  '',
  'def get_user_by_id(user_id: str) -> Dict[str, Any]:',
  '    """Recupere un utilisateur par ID. Leve NotFoundError si absent."""',
  '    user = select_one("profiles", {"id": user_id})',
  '    if not user:',
  '        raise NotFoundError(message=f"Utilisateur {user_id} introuvable.")',
  '    return user',
  '',
  '',
  'def update_user(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:',
  '    """Met a jour un utilisateur."""',
  '    updates["updated_at"] = datetime.now(timezone.utc).isoformat()',
  '    user = update_row("profiles", {"id": user_id}, updates)',
  '    if not user:',
  '        raise NotFoundError(message=f"Utilisateur {user_id} introuvable.")',
  '    return user',
  '',
  '',
  'def add_credits(user_id: str, amount: int) -> Dict[str, Any]:',
  '    """Ajoute des credits a un utilisateur."""',
  '    if amount <= 0:',
  '        raise ValidationError(message="Le montant de credits doit etre positif.")',
  '',
  '    user = get_user_by_id(user_id)',
  '    new_credits = user.get("credits", 0) + amount',
  '',
  '    return update_user(user_id, {"credits": new_credits})',
  '',
  '',
  'def consume_credit(user_id: str) -> Dict[str, Any]:',
  '    """Decremente le quota d un utilisateur. Leve ForbiddenError si insuffisant."""',
  '    user = get_user_by_id(user_id)',
  '    credits = user.get("credits", 0)',
  '',
  '    if credits <= 0:',
  '        raise ForbiddenError(',
  '            message="Quota epuise. Veuillez acheter des credits pour continuer.",',
  '            details={"credits_remaining": 0},',
  '        )',
  '',
  '    return update_user(user_id, {"credits": credits - 1})',
]);

// ============================================================
// 5. QUOTA SERVICE
// ============================================================

logStep('5. quota_service.py');

writeLines('backend/app/services/auth/quota_service.py', [
  '"""Gestion et verification des quotas par plan."""',
  '',
  'from typing import Any, Dict',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import ForbiddenError',
  'from app.core.logging import get_logger',
  'from app.services.auth.user_service import get_user_by_id',
  '',
  'logger = get_logger("auth.quota")',
  '',
  '',
  'PLAN_QUOTAS: Dict[str, Dict[str, Any]] = {',
  '    "free": {',
  '        "name": "Decouverte",',
  '        "monthly_credits": 1,',
  '        "price_eur": 0,',
  '    },',
  '    "essentiel": {',
  '        "name": "Essentiel",',
  '        "total_credits": 5,',
  '        "price_eur": 4.99,',
  '    },',
  '    "pro": {',
  '        "name": "Pro",',
  '        "monthly_credits": 30,',
  '        "price_eur": 14.99,',
  '    },',
  '    "carriere": {',
  '        "name": "Carriere",',
  '        "monthly_credits": 999999,',
  '        "price_eur": 39.99,',
  '    },',
  '}',
  '',
  '',
  'def get_quota_info(user_id: str) -> Dict[str, Any]:',
  '    """Retourne les informations de quota d un utilisateur."""',
  '    user = get_user_by_id(user_id)',
  '    plan = user.get("plan", "free")',
  '    credits = user.get("credits", 0)',
  '    plan_info = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["free"])',
  '',
  '    return {',
  '        "user_id": user_id,',
  '        "plan": plan,',
  '        "plan_name": plan_info["name"],',
  '        "credits_remaining": credits,',
  '        "monthly_credits": plan_info.get("monthly_credits", 0),',
  '        "price_eur": plan_info.get("price_eur", 0),',
  '    }',
  '',
  '',
  'def check_quota(user_id: str) -> None:',
  '    """Verifie qu un utilisateur peut faire une generation."""',
  '    user = get_user_by_id(user_id)',
  '    credits = user.get("credits", 0)',
  '',
  '    if credits <= 0:',
  '        plan = user.get("plan", "free")',
  '        logger.info("quota_exceeded", user_id=user_id, plan=plan)',
  '        raise ForbiddenError(',
  '            message="Quota epuise. Achetez des credits ou passez a un plan superieur.",',
  '            details={',
  '                "plan": plan,',
  '                "credits_remaining": 0,',
  '                "upgrade_url": "/api/billing/upgrade",',
  '            },',
  '        )',
]);

// ============================================================
// 6. TESTS
// ============================================================

logStep('6. Tests unitaires');

writeLines('backend/tests/test_password.py', [
  '"""Tests du service de hachage des mots de passe."""',
  '',
  'import pytest',
  '',
  'from app.core.errors import ValidationError',
  'from app.services.auth.password import hash_password, verify_password',
  '',
  '',
  'def test_hash_password_returns_string() -> None:',
  '    h = hash_password("motdepasse123")',
  '    assert isinstance(h, str)',
  '    assert len(h) > 50',
  '',
  '',
  'def test_hash_password_too_short_raises() -> None:',
  '    with pytest.raises(ValidationError):',
  '        hash_password("abc")',
  '',
  '',
  'def test_verify_password_correct() -> None:',
  '    h = hash_password("motdepasse123")',
  '    assert verify_password("motdepasse123", h) is True',
  '',
  '',
  'def test_verify_password_incorrect() -> None:',
  '    h = hash_password("motdepasse123")',
  '    assert verify_password("mauvais", h) is False',
  '',
  '',
  'def test_verify_password_empty_returns_false() -> None:',
  '    h = hash_password("motdepasse123")',
  '    assert verify_password("", h) is False',
  '',
  '',
  'def test_two_hashes_different_salts() -> None:',
  '    h1 = hash_password("motdepasse123")',
  '    h2 = hash_password("motdepasse123")',
  '    assert h1 != h2',
  '    assert verify_password("motdepasse123", h1) is True',
  '    assert verify_password("motdepasse123", h2) is True',
]);

writeLines('backend/tests/test_jwt_service.py', [
  '"""Tests du service JWT."""',
  '',
  'import pytest',
  '',
  'from app.core.errors import UnauthorizedError',
  'from app.services.auth.jwt_service import (',
  '    create_access_token,',
  '    decode_access_token,',
  '    extract_user_id,',
  ')',
  '',
  '',
  'def test_create_access_token() -> None:',
  '    token = create_access_token("user-123", "test@example.com")',
  '    assert isinstance(token, str)',
  '    assert len(token) > 50',
  '',
  '',
  'def test_decode_access_token() -> None:',
  '    token = create_access_token("user-123", "test@example.com")',
  '    payload = decode_access_token(token)',
  '    assert payload["sub"] == "user-123"',
  '    assert payload["email"] == "test@example.com"',
  '    assert "exp" in payload',
  '    assert "iat" in payload',
  '',
  '',
  'def test_extract_user_id() -> None:',
  '    token = create_access_token("user-xyz", "a@b.com")',
  '    assert extract_user_id(token) == "user-xyz"',
  '',
  '',
  'def test_decode_invalid_token_raises() -> None:',
  '    with pytest.raises(UnauthorizedError):',
  '        decode_access_token("invalid.token.here")',
  '',
  '',
  'def test_decode_expired_token_raises() -> None:',
  '    token = create_access_token("user-123", "a@b.com", expires_minutes=-1)',
  '    with pytest.raises(UnauthorizedError):',
  '        decode_access_token(token)',
]);

writeLines('backend/tests/test_quota_service.py', [
  '"""Tests du service de quotas."""',
  '',
  'from app.services.auth.quota_service import PLAN_QUOTAS, get_quota_info',
  '',
  '',
  'def test_plan_quotas_defined() -> None:',
  '    assert "free" in PLAN_QUOTAS',
  '    assert "essentiel" in PLAN_QUOTAS',
  '    assert "pro" in PLAN_QUOTAS',
  '    assert "carriere" in PLAN_QUOTAS',
  '',
  '',
  'def test_free_plan_quota() -> None:',
  '    assert PLAN_QUOTAS["free"]["monthly_credits"] == 1',
  '    assert PLAN_QUOTAS["free"]["price_eur"] == 0',
  '',
  '',
  'def test_pro_plan_quota() -> None:',
  '    assert PLAN_QUOTAS["pro"]["monthly_credits"] == 30',
  '    assert PLAN_QUOTAS["pro"]["price_eur"] == 14.99',
]);

writeLines('backend/tests/test_user_service.py', [
  '"""Tests du service utilisateur."""',
  '',
  'from app.services.auth.user_service import add_credits, consume_credit',
  '',
  '',
  '# Note : les tests d integration DB complete sont dans test_user_service_integration.py',
  '# Ces tests verifient uniquement la logique metier.',
  '',
  '',
  'def test_module_imports() -> None:',
  '    """Verifie que le module s importe correctement."""',
  '    from app.services.auth import user_service',
  '    assert hasattr(user_service, "create_user")',
  '    assert hasattr(user_service, "get_user_by_email")',
  '    assert hasattr(user_service, "get_user_by_id")',
  '    assert hasattr(user_service, "update_user")',
  '    assert hasattr(user_service, "add_credits")',
  '    assert hasattr(user_service, "consume_credit")',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 4b terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/auth/__init__.py');
console.log('    - backend/app/services/auth/password.py');
console.log('    - backend/app/services/auth/jwt_service.py');
console.log('    - backend/app/services/auth/user_service.py');
console.log('    - backend/app/services/auth/quota_service.py');
console.log('    - backend/tests/test_password.py');
console.log('    - backend/tests/test_jwt_service.py');
console.log('    - backend/tests/test_user_service.py');
console.log('    - backend/tests/test_quota_service.py');
console.log('');
console.log('  IMPORTANT : Installer python-jose et bcrypt :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pip install python-jose[cryptography]==3.3.0 bcrypt==4.2.0');
console.log('');
console.log('  TESTS :');
console.log('    pytest tests/test_password.py tests/test_jwt_service.py tests/test_quota_service.py tests/test_user_service.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase4c.js (Middleware JWT + protection routes)');
console.log('');