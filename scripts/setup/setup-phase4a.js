#!/usr/bin/env node
/**
 * setup-phase4a.js — CandidatIA
 * Phase 4a : Client Supabase + Schéma SQL + Modèles
 *
 * Crée :
 *   - backend/app/core/supabase_client.py
 *   - backend/app/core/database.py
 *   - backend/scripts/schema.sql
 *   - backend/scripts/init_db.py
 *   - backend/app/models/user.py
 *   - backend/app/models/generation.py
 *   - backend/app/models/payment.py
 *   - backend/app/models/relance.py
 *   - backend/app/models/ai_log.py
 *   - backend/tests/test_supabase_client.py
 *
 * Usage : node setup-phase4a.js
 * Prérequis : avoir exécuté setup-phase0 a setup-phase3e
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

logHeader('CandidatIA — Setup Phase 4a : Client Supabase + Schema');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'generation.py'))) {
  console.error('');
  console.error('  ERREUR : generation.py introuvable.');
  console.error('  Execute d abord setup-phase3d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. SUPABASE CLIENT
// ============================================================

logStep('1. core/supabase_client.py');

writeLines('backend/app/core/supabase_client.py', [
  '"""',
  'Client Supabase (singleton).',
  '',
  'Fournit deux clients :',
  '  - get_supabase_admin() : client avec service_role (acces total, cote serveur)',
  '  - get_supabase_public() : client avec anon key (acces restreint, RLS)',
  '"""',
  '',
  'from typing import Optional',
  '',
  'from supabase import Client, create_client',
  '',
  'from app.core.config import get_settings',
  'from app.core.logging import get_logger',
  '',
  'logger = get_logger("core.supabase")',
  '',
  '_admin_client: Optional[Client] = None',
  '_public_client: Optional[Client] = None',
  '',
  '',
  'def get_supabase_admin() -> Client:',
  '    """Retourne le client Supabase avec service_role (acces total)."""',
  '    global _admin_client',
  '    if _admin_client is None:',
  '        settings = get_settings()',
  '        if not settings.supabase_url or not settings.supabase_service_key:',
  '            raise RuntimeError(',
  '                "SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant dans .env"',
  '            )',
  '        _admin_client = create_client(settings.supabase_url, settings.supabase_service_key)',
  '        logger.info("supabase_admin_client_created")',
  '    return _admin_client',
  '',
  '',
  'def get_supabase_public() -> Client:',
  '    """Retourne le client Supabase avec anon key (RLS applique)."""',
  '    global _public_client',
  '    if _public_client is None:',
  '        settings = get_settings()',
  '        if not settings.supabase_url or not settings.supabase_anon_key:',
  '            raise RuntimeError(',
  '                "SUPABASE_URL ou SUPABASE_ANON_KEY manquant dans .env"',
  '            )',
  '        _public_client = create_client(settings.supabase_url, settings.supabase_anon_key)',
  '        logger.info("supabase_public_client_created")',
  '    return _public_client',
  '',
  '',
  'def reset_clients() -> None:',
  '    """Reinitialise les clients (utile pour les tests)."""',
  '    global _admin_client, _public_client',
  '    _admin_client = None',
  '    _public_client = None',
]);

// ============================================================
// 2. DATABASE HELPERS
// ============================================================

logStep('2. core/database.py');

writeLines('backend/app/core/database.py', [
  '"""Helpers d acces a la base de donnees Supabase."""',
  '',
  'from typing import Any, Dict, List, Optional',
  '',
  'from app.core.errors import AppError',
  'from app.core.logging import get_logger',
  'from app.core.supabase_client import get_supabase_admin',
  '',
  'logger = get_logger("core.database")',
  '',
  '',
  'class DatabaseError(AppError):',
  '    status_code = 500',
  '    error_code = "DATABASE_ERROR"',
  '    message = "Erreur de base de donnees."',
  '',
  '',
  'def insert_row(table: str, data: Dict[str, Any]) -> Dict[str, Any]:',
  '    """Insere une ligne et retourne la ligne creee."""',
  '    try:',
  '        client = get_supabase_admin()',
  '        response = client.table(table).insert(data).execute()',
  '        if not response.data:',
  '            raise DatabaseError(message=f"Aucune donnee retournee pour {table}.")',
  '        return response.data[0]',
  '    except DatabaseError:',
  '        raise',
  '    except Exception as e:',
  '        logger.exception("db_insert_error", table=table, error=str(e))',
  '        raise DatabaseError(',
  '            message=f"Erreur insert dans {table}.",',
  '            details={"error": str(e)},',
  '        ) from e',
  '',
  '',
  'def select_rows(',
  '    table: str,',
  '    filters: Optional[Dict[str, Any]] = None,',
  '    limit: Optional[int] = None,',
  '    order_by: Optional[str] = None,',
  '    descending: bool = True,',
  ') -> List[Dict[str, Any]]:',
  '    """Selectionne des lignes avec filtres optionnels."""',
  '    try:',
  '        client = get_supabase_admin()',
  '        query = client.table(table).select("*")',
  '',
  '        if filters:',
  '            for key, value in filters.items():',
  '                query = query.eq(key, value)',
  '',
  '        if order_by:',
  '            query = query.order(order_by, desc=descending)',
  '',
  '        if limit:',
  '            query = query.limit(limit)',
  '',
  '        response = query.execute()',
  '        return response.data or []',
  '    except Exception as e:',
  '        logger.exception("db_select_error", table=table, error=str(e))',
  '        raise DatabaseError(',
  '            message=f"Erreur select dans {table}.",',
  '            details={"error": str(e)},',
  '        ) from e',
  '',
  '',
  'def select_one(',
  '    table: str,',
  '    filters: Dict[str, Any],',
  ') -> Optional[Dict[str, Any]]:',
  '    """Selectionne une seule ligne (ou None)."""',
  '    rows = select_rows(table, filters=filters, limit=1)',
  '    return rows[0] if rows else None',
  '',
  '',
  'def update_row(',
  '    table: str,',
  '    filters: Dict[str, Any],',
  '    data: Dict[str, Any],',
  ') -> Optional[Dict[str, Any]]:',
  '    """Met a jour des lignes et retourne la premiere mise a jour."""',
  '    try:',
  '        client = get_supabase_admin()',
  '        query = client.table(table).update(data)',
  '',
  '        for key, value in filters.items():',
  '            query = query.eq(key, value)',
  '',
  '        response = query.execute()',
  '        return response.data[0] if response.data else None',
  '    except Exception as e:',
  '        logger.exception("db_update_error", table=table, error=str(e))',
  '        raise DatabaseError(',
  '            message=f"Erreur update dans {table}.",',
  '            details={"error": str(e)},',
  '        ) from e',
  '',
  '',
  'def delete_row(table: str, filters: Dict[str, Any]) -> int:',
  '    """Supprime des lignes. Retourne le nombre supprime."""',
  '    try:',
  '        client = get_supabase_admin()',
  '        query = client.table(table).delete()',
  '',
  '        for key, value in filters.items():',
  '            query = query.eq(key, value)',
  '',
  '        response = query.execute()',
  '        return len(response.data) if response.data else 0',
  '    except Exception as e:',
  '        logger.exception("db_delete_error", table=table, error=str(e))',
  '        raise DatabaseError(',
  '            message=f"Erreur delete dans {table}.",',
  '            details={"error": str(e)},',
  '        ) from e',
  '',
  '',
  'def health_check() -> bool:',
  '    """Verifie la connexion a la DB."""',
  '    try:',
  '        client = get_supabase_admin()',
  '        client.table("profiles").select("id").limit(1).execute()',
  '        return True',
  '    except Exception as e:',
  '        logger.warning("db_health_check_failed", error=str(e))',
  '        return False',
]);

// ============================================================
// 3. SCHEMA SQL
// ============================================================

logStep('3. scripts/schema.sql');

writeLines('backend/scripts/schema.sql', [
  '-- ============================================================',
  '-- CandidatIA - Schema de base de donnees',
  '-- ============================================================',
  '',
  '-- Extension pour UUID',
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  '',
  '-- ============================================================',
  '-- TABLE : profiles',
  '-- ============================================================',
  'CREATE TABLE IF NOT EXISTS profiles (',
  '    id UUID PRIMARY KEY,',
  '    email TEXT UNIQUE NOT NULL,',
  '    full_name TEXT,',
  '    preferred_locale TEXT DEFAULT \'fr\',',
  '    country_code TEXT,',
  '    credits INT DEFAULT 1,',
  '    plan TEXT DEFAULT \'free\',',
  '    email_verified BOOLEAN DEFAULT FALSE,',
  '    fedapay_customer_id TEXT,',
  '    flutterwave_customer_id TEXT,',
  '    created_at TIMESTAMPTZ DEFAULT NOW(),',
  '    updated_at TIMESTAMPTZ DEFAULT NOW()',
  ');',
  '',
  'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);',
  'CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);',
  '',
  '-- ============================================================',
  '-- TABLE : generations',
  '-- ============================================================',
  'CREATE TABLE IF NOT EXISTS generations (',
  '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
  '    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,',
  '    input_profile_hash TEXT NOT NULL,',
  '    input_offer_hash TEXT NOT NULL,',
  '    output_language TEXT NOT NULL DEFAULT \'fr\',',
  '    score_matching INT,',
  '    cv_path TEXT,',
  '    lettre_path TEXT,',
  '    guide_path TEXT,',
  '    zip_path TEXT,',
  '    credits_consumed INT DEFAULT 1,',
  '    status TEXT DEFAULT \'completed\',',
  '    created_at TIMESTAMPTZ DEFAULT NOW()',
  ');',
  '',
  'CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);',
  '',
  '-- ============================================================',
  '-- TABLE : relances',
  '-- ============================================================',
  'CREATE TABLE IF NOT EXISTS relances (',
  '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
  '    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,',
  '    generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,',
  '    company_name TEXT,',
  '    job_title TEXT,',
  '    wait_days INT NOT NULL DEFAULT 7,',
  '    scheduled_date DATE NOT NULL,',
  '    email_draft TEXT,',
  '    language TEXT NOT NULL DEFAULT \'fr\',',
  '    status TEXT DEFAULT \'pending\',',
  '    created_at TIMESTAMPTZ DEFAULT NOW(),',
  '    reminded_at TIMESTAMPTZ',
  ');',
  '',
  'CREATE INDEX IF NOT EXISTS idx_relances_user ON relances(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_relances_scheduled ON relances(scheduled_date, status);',
  '',
  '-- ============================================================',
  '-- TABLE : payments',
  '-- ============================================================',
  'CREATE TABLE IF NOT EXISTS payments (',
  '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
  '    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,',
  '    provider TEXT NOT NULL,',
  '    provider_transaction_id TEXT UNIQUE,',
  '    amount DECIMAL(10,2) NOT NULL,',
  '    currency TEXT NOT NULL DEFAULT \'XOF\',',
  '    credits_added INT DEFAULT 0,',
  '    plan_purchased TEXT,',
  '    status TEXT DEFAULT \'pending\',',
  '    metadata JSONB DEFAULT \'{}\'::jsonb,',
  '    created_at TIMESTAMPTZ DEFAULT NOW(),',
  '    updated_at TIMESTAMPTZ DEFAULT NOW()',
  ');',
  '',
  'CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider, provider_transaction_id);',
  'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);',
  '',
  '-- ============================================================',
  '-- TABLE : ai_logs',
  '-- ============================================================',
  'CREATE TABLE IF NOT EXISTS ai_logs (',
  '    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
  '    provider TEXT NOT NULL,',
  '    model TEXT NOT NULL,',
  '    prompt_hash TEXT NOT NULL,',
  '    tokens_input INT,',
  '    tokens_output INT,',
  '    latency_ms INT,',
  '    success BOOLEAN DEFAULT TRUE,',
  '    error_message TEXT,',
  '    created_at TIMESTAMPTZ DEFAULT NOW()',
  ');',
  '',
  'CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_logs(provider, created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_ai_logs_prompt ON ai_logs(prompt_hash);',
  '',
  '-- ============================================================',
  '-- FIN DU SCHEMA',
  '-- ============================================================',
]);

// ============================================================
// 4. INIT DB SCRIPT
// ============================================================

logStep('4. scripts/init_db.py');

writeLines('backend/scripts/init_db.py', [
  '"""',
  'Script d initialisation de la base de donnees.',
  '',
  'Execute le schema SQL via la connexion PostgreSQL directe.',
  '',
  'Usage : python scripts/init_db.py',
  '"""',
  '',
  'import os',
  'import sys',
  'from pathlib import Path',
  '',
  '# Ajouter le dossier backend au path',
  'sys.path.insert(0, str(Path(__file__).parent.parent))',
  '',
  'from dotenv import load_dotenv',
  '',
  'load_dotenv()',
  '',
  '',
  'def main() -> None:',
  '    """Execute le schema SQL sur la base Supabase."""',
  '    import psycopg2',
  '',
  '    database_url = os.getenv("DATABASE_URL")',
  '    if not database_url:',
  '        print("ERREUR : DATABASE_URL manquant dans .env")',
  '        sys.exit(1)',
  '',
  '    schema_path = Path(__file__).parent / "schema.sql"',
  '    if not schema_path.exists():',
  '        print(f"ERREUR : {schema_path} introuvable")',
  '        sys.exit(1)',
  '',
  '    schema_sql = schema_path.read_text(encoding="utf-8")',
  '',
  '    print("Connexion a Supabase PostgreSQL...")',
  '    print(f"Host : {database_url.split(\'@\')[1].split(\'/\')[0] if \'@\' in database_url else \'?\'}")',
  '',
  '    try:',
  '        conn = psycopg2.connect(database_url)',
  '        conn.autocommit = True',
  '        cursor = conn.cursor()',
  '',
  '        print("Execution du schema SQL...")',
  '        cursor.execute(schema_sql)',
  '',
  '        print("Verification des tables creees...")',
  '        cursor.execute("""',
  '            SELECT table_name',
  '            FROM information_schema.tables',
  '            WHERE table_schema = \'public\'',
  '            ORDER BY table_name;',
  '        """)',
  '        tables = [row[0] for row in cursor.fetchall()]',
  '',
  '        print()',
  '        print("=" * 60)',
  '        print("SCHEMA INITIALISE AVEC SUCCES")',
  '        print("=" * 60)',
  '        print()',
  '        print("Tables creees :")',
  '        for t in tables:',
  '            print(f"  - {t}")',
  '        print()',
  '',
  '        cursor.close()',
  '        conn.close()',
  '',
  '    except Exception as e:',
  '        print()',
  '        print(f"ERREUR : {type(e).__name__} : {e}")',
  '        sys.exit(1)',
  '',
  '',
  'if __name__ == "__main__":',
  '    main()',
]);

// ============================================================
// 5. MODELS
// ============================================================

logStep('5. models/ (Pydantic)');

writeLines('backend/app/models/__init__.py', [
  '"""Modeles Pydantic de CandidatIA."""',
  '',
  'from app.models.user import User, UserCreate, UserUpdate',
  'from app.models.generation import Generation, GenerationCreate',
  'from app.models.payment import Payment, PaymentCreate',
  'from app.models.relance import Relance, RelanceCreate',
  'from app.models.ai_log import AILog',
  '',
  '__all__ = [',
  '    "User", "UserCreate", "UserUpdate",',
  '    "Generation", "GenerationCreate",',
  '    "Payment", "PaymentCreate",',
  '    "Relance", "RelanceCreate",',
  '    "AILog",',
  ']',
]);

writeLines('backend/app/models/user.py', [
  '"""Modeles Pydantic : User."""',
  '',
  'from datetime import datetime',
  'from typing import Optional',
  '',
  'from pydantic import BaseModel, EmailStr, Field',
  '',
  '',
  'class UserBase(BaseModel):',
  '    """Champs communs."""',
  '    email: EmailStr',
  '    full_name: Optional[str] = None',
  '    preferred_locale: str = "fr"',
  '    country_code: Optional[str] = None',
  '',
  '',
  'class UserCreate(UserBase):',
  '    """Payload de creation d utilisateur."""',
  '    password: str = Field(..., min_length=8)',
  '',
  '',
  'class UserUpdate(BaseModel):',
  '    """Payload de mise a jour."""',
  '    full_name: Optional[str] = None',
  '    preferred_locale: Optional[str] = None',
  '    country_code: Optional[str] = None',
  '',
  '',
  'class User(UserBase):',
  '    """Utilisateur complet (depuis la DB)."""',
  '    id: str',
  '    credits: int = 0',
  '    plan: str = "free"',
  '    email_verified: bool = False',
  '    fedapay_customer_id: Optional[str] = None',
  '    flutterwave_customer_id: Optional[str] = None',
  '    created_at: Optional[datetime] = None',
  '    updated_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

writeLines('backend/app/models/generation.py', [
  '"""Modeles Pydantic : Generation."""',
  '',
  'from datetime import datetime',
  'from typing import Optional',
  '',
  'from pydantic import BaseModel',
  '',
  '',
  'class GenerationCreate(BaseModel):',
  '    """Payload de creation d une generation."""',
  '    user_id: str',
  '    input_profile_hash: str',
  '    input_offer_hash: str',
  '    output_language: str = "fr"',
  '    score_matching: Optional[int] = None',
  '    cv_path: Optional[str] = None',
  '    lettre_path: Optional[str] = None',
  '    guide_path: Optional[str] = None',
  '    zip_path: Optional[str] = None',
  '    credits_consumed: int = 1',
  '',
  '',
  'class Generation(BaseModel):',
  '    """Generation complete (depuis la DB)."""',
  '    id: str',
  '    user_id: str',
  '    input_profile_hash: str',
  '    input_offer_hash: str',
  '    output_language: str',
  '    score_matching: Optional[int] = None',
  '    cv_path: Optional[str] = None',
  '    lettre_path: Optional[str] = None',
  '    guide_path: Optional[str] = None',
  '    zip_path: Optional[str] = None',
  '    credits_consumed: int = 1',
  '    status: str = "completed"',
  '    created_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

writeLines('backend/app/models/payment.py', [
  '"""Modeles Pydantic : Payment."""',
  '',
  'from datetime import datetime',
  'from typing import Any, Dict, Optional',
  '',
  'from pydantic import BaseModel',
  '',
  '',
  'class PaymentCreate(BaseModel):',
  '    """Payload de creation d un paiement."""',
  '    user_id: str',
  '    provider: str',
  '    provider_transaction_id: str',
  '    amount: float',
  '    currency: str = "XOF"',
  '    credits_added: int = 0',
  '    plan_purchased: Optional[str] = None',
  '    status: str = "pending"',
  '    metadata: Dict[str, Any] = {}',
  '',
  '',
  'class Payment(BaseModel):',
  '    """Paiement complet (depuis la DB)."""',
  '    id: str',
  '    user_id: str',
  '    provider: str',
  '    provider_transaction_id: Optional[str] = None',
  '    amount: float',
  '    currency: str',
  '    credits_added: int = 0',
  '    plan_purchased: Optional[str] = None',
  '    status: str = "pending"',
  '    metadata: Dict[str, Any] = {}',
  '    created_at: Optional[datetime] = None',
  '    updated_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

writeLines('backend/app/models/relance.py', [
  '"""Modeles Pydantic : Relance."""',
  '',
  'from datetime import date, datetime',
  'from typing import Optional',
  '',
  'from pydantic import BaseModel',
  '',
  '',
  'class RelanceCreate(BaseModel):',
  '    """Payload de creation d une relance."""',
  '    user_id: str',
  '    generation_id: Optional[str] = None',
  '    company_name: str',
  '    job_title: str',
  '    wait_days: int = 7',
  '    scheduled_date: date',
  '    email_draft: str',
  '    language: str = "fr"',
  '',
  '',
  'class Relance(BaseModel):',
  '    """Relance complete (depuis la DB)."""',
  '    id: str',
  '    user_id: str',
  '    generation_id: Optional[str] = None',
  '    company_name: Optional[str] = None',
  '    job_title: Optional[str] = None',
  '    wait_days: int = 7',
  '    scheduled_date: date',
  '    email_draft: Optional[str] = None',
  '    language: str = "fr"',
  '    status: str = "pending"',
  '    created_at: Optional[datetime] = None',
  '    reminded_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

writeLines('backend/app/models/ai_log.py', [
  '"""Modeles Pydantic : AILog."""',
  '',
  'from datetime import datetime',
  'from typing import Optional',
  '',
  'from pydantic import BaseModel',
  '',
  '',
  'class AILog(BaseModel):',
  '    """Log d appel IA."""',
  '    id: Optional[str] = None',
  '    provider: str',
  '    model: str',
  '    prompt_hash: str',
  '    tokens_input: Optional[int] = None',
  '    tokens_output: Optional[int] = None',
  '    latency_ms: Optional[int] = None',
  '    success: bool = True',
  '    error_message: Optional[str] = None',
  '    created_at: Optional[datetime] = None',
  '',
  '    class Config:',
  '        from_attributes = True',
]);

// ============================================================
// 6. TESTS
// ============================================================

logStep('6. tests/test_supabase_client.py');

writeLines('backend/tests/test_supabase_client.py', [
  '"""Tests du client Supabase et des helpers DB."""',
  '',
  'from app.core.supabase_client import get_supabase_admin, get_supabase_public',
  '',
  '',
  'def test_admin_client_creation() -> None:',
  '    """Le client admin doit pouvoir etre cree."""',
  '    client = get_supabase_admin()',
  '    assert client is not None',
  '',
  '',
  'def test_admin_client_singleton() -> None:',
  '    """Deux appels retournent la meme instance."""',
  '    c1 = get_supabase_admin()',
  '    c2 = get_supabase_admin()',
  '    assert c1 is c2',
  '',
  '',
  'def test_public_client_creation() -> None:',
  '    """Le client public doit pouvoir etre cree."""',
  '    client = get_supabase_public()',
  '    assert client is not None',
  '',
  '',
  'def test_public_client_singleton() -> None:',
  '    """Deux appels retournent la meme instance."""',
  '    c1 = get_supabase_public()',
  '    c2 = get_supabase_public()',
  '    assert c1 is c2',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 4a terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/core/supabase_client.py');
console.log('    - backend/app/core/database.py');
console.log('    - backend/scripts/schema.sql');
console.log('    - backend/scripts/init_db.py');
console.log('    - backend/app/models/__init__.py');
console.log('    - backend/app/models/user.py');
console.log('    - backend/app/models/generation.py');
console.log('    - backend/app/models/payment.py');
console.log('    - backend/app/models/relance.py');
console.log('    - backend/app/models/ai_log.py');
console.log('    - backend/tests/test_supabase_client.py');
console.log('');
console.log('  IMPORTANT : Installer psycopg2 pour init_db.py :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pip install psycopg2-binary==2.9.10');
console.log('');
console.log('  INITIALISER LA BASE DE DONNEES :');
console.log('    python scripts\\init_db.py');
console.log('');
console.log('  PUIS LANCER LES TESTS :');
console.log('    pytest tests/test_supabase_client.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase4b.js (Service Auth + JWT + quotas)');
console.log('');