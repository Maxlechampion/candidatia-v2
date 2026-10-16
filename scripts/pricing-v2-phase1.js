#!/usr/bin/env node
/**
 * pricing-v2-phase1.js — CandidatIA
 * PRICING-v2 Phase 1 : plans, quotas, DB, model user
 *
 * Usage : node scripts/pricing-v2-phase1.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP_DIR = path.join(ROOT, '.backups', 'pricing-v2-p1-' + Date.now());

const log = {
  info: (m) => console.log('[INFO] ' + m),
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function backupFile(p) {
  if (!fs.existsSync(p)) return;
  ensureDir(BACKUP_DIR);
  const rel = path.relative(ROOT, p);
  const bkp = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(bkp));
  fs.copyFileSync(p, bkp);
}
function writeFile(p, content) { backupFile(p); ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }
function writeLines(p, lines) { writeFile(p, lines.join('\n') + '\n'); }

// ============================================================
// 1. plans.py — 5 plans B2C
// ============================================================

function fixPlans() {
  log.title('1. backend/plans.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'plans.py');
  const content = readFile(filePath);

  if (content && content.includes('"pro_unlimited"') && content.includes('"express"')) {
    log.skip('deja a jour');
    return;
  }

  writeLines(filePath, [
    '"""Plans tarifaires CandidatIA - PRICING-v2"""',
    'from typing import Any, Dict, List, Optional',
    '',
    '',
    'PLANS: Dict[str, Dict[str, Any]] = {',
    '    "free": {',
    '        "code": "free",',
    '        "name": "Decouverte",',
    '        "description": "Testez CandidatIA avec 1 pack offert",',
    '        "price_xof": 0,',
    '        "price_eur": 0,',
    '        "price_usd": 0,',
    '        "credits": 1,',
    '        "is_free": True,',
    '        "features": [',
    '            "1 pack unique",',
    '            "CV + Lettre + Guide",',
    '            "Filigrane CandidatIA",',
    '            "Sans engagement",',
    '        ],',
    '        "highlight": False,',
    '    },',
    '    "express": {',
    '        "code": "express",',
    '        "name": "Express",',
    '        "description": "1 pack sans filigrane pour une candidature ciblee",',
    '        "price_xof": 2000,',
    '        "price_eur": 3.00,',
    '        "price_usd": 3.50,',
    '        "credits": 1,',
    '        "is_free": False,',
    '        "features": [',
    '            "1 pack de candidature",',
    '            "Sans filigrane",',
    '            "CV methode STAR",',
    '            "Lettre personnalisee",',
    '        ],',
    '        "highlight": False,',
    '    },',
    '    "active": {',
    '        "code": "active",',
    '        "name": "Candidature Active",',
    '        "description": "5 packs pour une recherche active",',
    '        "price_xof": 5000,',
    '        "price_eur": 7.50,',
    '        "price_usd": 8.50,',
    '        "credits": 5,',
    '        "is_free": False,',
    '        "features": [',
    '            "5 packs de candidature",',
    '            "Sans filigrane",',
    '            "Guide d entretien enrichi",',
    '            "Relances automatiques",',
    '        ],',
    '        "highlight": True,',
    '    },',
    '    "intensive": {',
    '        "code": "intensive",',
    '        "name": "Recherche Intensive",',
    '        "description": "15 packs pour une recherche soutenue",',
    '        "price_xof": 12000,',
    '        "price_eur": 18.00,',
    '        "price_usd": 20.00,',
    '        "credits": 15,',
    '        "is_free": False,',
    '        "features": [',
    '            "15 packs de candidature",',
    '            "Sans filigrane",',
    '            "Guide d entretien enrichi",',
    '            "Relances automatiques",',
    '            "Coaching IA",',
    '        ],',
    '        "highlight": False,',
    '    },',
    '    "pro_unlimited": {',
    '        "code": "pro_unlimited",',
    '        "name": "Pro Illimite",',
    '        "description": "Packs illimites + coaching premium (mensuel)",',
    '        "price_xof": 15000,',
    '        "price_eur": 22.00,',
    '        "price_usd": 25.00,',
    '        "credits": 999999,',
    '        "is_free": False,',
    '        "features": [',
    '            "Packs illimites",',
    '            "Coaching IA premium",',
    '            "Guide enrichi 8 phases",',
    '            "Support VIP",',
    '        ],',
    '        "highlight": False,',
    '    },',
    '}',
    '',
    '',
    'def list_plans() -> List[Dict[str, Any]]:',
    '    return list(PLANS.values())',
    '',
    '',
    'def get_plan(code: str) -> Optional[Dict[str, Any]]:',
    '    return PLANS.get(code.lower())',
    '',
    '',
    'def get_price_for_provider(plan_code: str, provider_name: str) -> float:',
    '    plan_code = plan_code.lower()',
    '    provider_name = provider_name.lower()',
    '    if plan_code not in PLANS:',
    '        raise ValueError("Plan inconnu : " + plan_code)',
    '    plan = PLANS[plan_code]',
    '    if provider_name == "fedapay":',
    '        return float(plan["price_xof"])',
    '    if provider_name == "flutterwave":',
    '        return float(plan["price_eur"])',
    '    if provider_name == "raenest":',
    '        return float(plan["price_usd"])',
    '    raise ValueError("Provider inconnu : " + provider_name)',
    '',
    '',
    'def get_currency_for_provider(provider_name: str) -> str:',
    '    provider_name = provider_name.lower()',
    '    mapping = {"fedapay": "XOF", "flutterwave": "EUR", "raenest": "USD"}',
    '    currency = mapping.get(provider_name)',
    '    if not currency:',
    '        raise ValueError("Devise inconnue : " + provider_name)',
    '    return currency',
    '',
    '',
    'def format_price(amount: float, currency: str) -> str:',
    '    currency = currency.upper()',
    '    if currency == "XOF":',
    '        return str(int(amount)) + " FCFA"',
    '    if currency == "USD":',
    '        return "$" + ("%.2f" % amount)',
    '    if currency == "EUR":',
    '        return ("%.2f" % amount) + " EUR"',
    '    return ("%.2f" % amount) + " " + currency',
  ]);
  log.ok('plans.py : 5 plans B2C');
}

// ============================================================
// 2. quota_service.py
// ============================================================

function fixQuotaService() {
  log.title('2. backend/quota_service.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'quota_service.py');
  const content = readFile(filePath);

  if (content && content.includes('"pro_unlimited"') && content.includes('"express"')) {
    log.skip('deja aligne');
    return;
  }

  writeLines(filePath, [
    '"""Quotas par plan - PRICING-v2"""',
    'from typing import Any, Dict',
    '',
    'from app.core.errors import ForbiddenError',
    'from app.core.logging import get_logger',
    'from app.services.auth.user_service import get_user_by_id',
    '',
    'logger = get_logger("auth.quota")',
    '',
    '',
    'PLAN_QUOTAS: Dict[str, Dict[str, Any]] = {',
    '    "free": {"name": "Decouverte", "credits": 1, "price_eur": 0, "is_free": True},',
    '    "express": {"name": "Express", "credits": 1, "price_eur": 3.00, "is_free": False},',
    '    "active": {"name": "Candidature Active", "credits": 5, "price_eur": 7.50, "is_free": False},',
    '    "intensive": {"name": "Recherche Intensive", "credits": 15, "price_eur": 18.00, "is_free": False},',
    '    "pro_unlimited": {"name": "Pro Illimite", "credits": 999999, "price_eur": 22.00, "is_free": False},',
    '}',
    '',
    '',
    'def get_quota_info(user_id: str) -> Dict[str, Any]:',
    '    user = get_user_by_id(user_id)',
    '    plan = user.get("plan", "free")',
    '    credits = user.get("credits", 0)',
    '    plan_info = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["free"])',
    '    return {',
    '        "user_id": user_id,',
    '        "plan": plan,',
    '        "plan_name": plan_info["name"],',
    '        "credits_remaining": credits,',
    '        "credits_included": plan_info.get("credits", 0),',
    '        "price_eur": plan_info.get("price_eur", 0),',
    '        "is_free_tier": bool(user.get("is_free_tier", plan == "free")),',
    '    }',
    '',
    '',
    'def check_quota(user_id: str) -> None:',
    '    user = get_user_by_id(user_id)',
    '    credits = user.get("credits", 0)',
    '    if credits <= 0:',
    '        plan = user.get("plan", "free")',
    '        logger.info("quota_exceeded", user_id=user_id, plan=plan)',
    '        raise ForbiddenError(',
    '            message="Quota epuise. Achetez des credits ou passez a un plan superieur.",',
    '            details={"plan": plan, "credits_remaining": 0, "upgrade_url": "/api/billing/upgrade"},',
    '        )',
  ]);
  log.ok('quota_service.py : aligne');
}

// ============================================================
// 3. models/user.py
// ============================================================

function fixUserModel() {
  log.title('3. backend/models/user.py');
  const filePath = path.join(BACKEND, 'app', 'models', 'user.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }
  if (content.includes('is_free_tier')) { log.skip('deja a jour'); return; }

  // Insertion ligne-par-ligne (safe) : ajouter is_free_tier apres plan
  content = content.replace(
    /^(    plan: str = "free")\r?\n/m,
    '$1\n    is_free_tier: bool = True\n'
  );

  writeFile(filePath, content);
  log.ok('user.py : +is_free_tier');
}

// ============================================================
// 4. schema.sql (colonne + migration)
// ============================================================

function fixSchema() {
  log.title('4. backend/schema.sql');
  const filePath = path.join(BACKEND, 'scripts', 'schema.sql');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }
  if (content.includes('is_free_tier')) { log.skip('deja a jour'); return; }

  // Ajouter la colonne dans CREATE TABLE profiles
  content = content.replace(
    /(plan\s+TEXT\s+DEFAULT\s+'free',)/,
    '$1\n    is_free_tier BOOLEAN DEFAULT TRUE,'
  );

  // Ajouter migration a la fin
  content += '\n-- MIGRATION PRICING-v2 (idempotent)\n';
  content += 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT TRUE;\n';
  content += "UPDATE profiles SET is_free_tier = FALSE WHERE plan IN ('express', 'active', 'intensive', 'pro_unlimited');\n";
  content += "UPDATE profiles SET is_free_tier = TRUE WHERE plan = 'free' AND is_free_tier IS NULL;\n";

  writeFile(filePath, content);
  log.ok('schema.sql : +is_free_tier + migration');
}

// ============================================================
// 5. user_service.py
// ============================================================

function fixUserService() {
  log.title('5. backend/user_service.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'user_service.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }
  if (content.includes('mark_paid_tier')) { log.skip('deja a jour'); return; }

  // Ajouter is_free_tier dans le dict de creation
  content = content.replace(
    /("plan":\s*"free",)/,
    '$1\n        "is_free_tier": True,'
  );

  // Ajouter mark_paid_tier a la fin
  content += '\n\ndef mark_paid_tier(user_id: str) -> Dict[str, Any]:\n';
  content += '    """Retire le filigrane (utilisateur devient payant)."""\n';
  content += '    return update_user(user_id, {"is_free_tier": False})\n';

  writeFile(filePath, content);
  log.ok('user_service.py : +is_free_tier + mark_paid_tier()');
}

// ============================================================
// 6. Tests backend
// ============================================================

function addBackendTests() {
  log.title('6. backend/tests/test_pricing_v2.py');
  const filePath = path.join(BACKEND, 'tests', 'test_pricing_v2.py');
  if (fs.existsSync(filePath)) { log.skip('existe deja'); return; }

  writeLines(filePath, [
    '"""Tests PRICING-v2 : grille tarifaire 5 plans B2C."""',
    'from app.services.payment.plans import (',
    '    PLANS, get_plan, get_price_for_provider,',
    '    get_currency_for_provider, list_plans,',
    ')',
    'from app.services.auth.quota_service import PLAN_QUOTAS',
    '',
    '',
    'def test_plans_has_5_b2c():',
    '    assert len(PLANS) == 5',
    '    assert set(PLANS.keys()) == {"free", "express", "active", "intensive", "pro_unlimited"}',
    '',
    '',
    'def test_free_plan():',
    '    free = PLANS["free"]',
    '    assert free["is_free"] is True',
    '    assert free["credits"] == 1',
    '    assert free["price_eur"] == 0',
    '',
    '',
    'def test_prices():',
    '    assert PLANS["express"]["price_eur"] == 3.00',
    '    assert PLANS["active"]["price_eur"] == 7.50',
    '    assert PLANS["intensive"]["price_eur"] == 18.00',
    '    assert PLANS["pro_unlimited"]["price_eur"] == 22.00',
    '',
    '',
    'def test_credits():',
    '    assert PLANS["express"]["credits"] == 1',
    '    assert PLANS["active"]["credits"] == 5',
    '    assert PLANS["intensive"]["credits"] == 15',
    '    assert PLANS["pro_unlimited"]["credits"] >= 999999',
    '',
    '',
    'def test_price_for_provider():',
    '    assert get_price_for_provider("active", "fedapay") == 5000.0',
    '    assert get_price_for_provider("active", "flutterwave") == 7.50',
    '    assert get_price_for_provider("active", "raenest") == 8.50',
    '',
    '',
    'def test_currency():',
    '    assert get_currency_for_provider("fedapay") == "XOF"',
    '    assert get_currency_for_provider("flutterwave") == "EUR"',
    '    assert get_currency_for_provider("raenest") == "USD"',
    '',
    '',
    'def test_quota_aligns():',
    '    assert set(PLAN_QUOTAS.keys()) == set(PLANS.keys())',
    '    for code in PLANS:',
    '        assert PLAN_QUOTAS[code]["credits"] == PLANS[code]["credits"]',
    '        assert PLAN_QUOTAS[code]["price_eur"] == PLANS[code]["price_eur"]',
    '',
    '',
    'def test_only_free_is_free():',
    '    for code, plan in PLANS.items():',
    '        if code == "free":',
    '            assert plan["is_free"] is True',
    '        else:',
    '            assert plan["is_free"] is False',
    '',
    '',
    'def test_get_plan_unknown():',
    '    assert get_plan("inexistant") is None',
    '',
    '',
    'def test_list_plans():',
    '    plans = list_plans()',
    '    assert len(plans) == 5',
  ]);
  log.ok('test_pricing_v2.py cree');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  PRICING-v2 PHASE 1 : Backend tarification');
  console.log('=====================================================\n');
  console.log('Backups : ' + BACKUP_DIR + '\n');

  const tasks = [
    ['plans.py', fixPlans],
    ['quota_service.py', fixQuotaService],
    ['models/user.py', fixUserModel],
    ['schema.sql', fixSchema],
    ['user_service.py', fixUserService],
    ['tests/test_pricing_v2.py', addBackendTests],
  ];

  const results = [];
  for (const t of tasks) {
    try {
      t[1]();
      results.push({ name: t[0], ok: true });
    } catch (e) {
      log.err(t[0] + ' : ' + e.message);
      results.push({ name: t[0], ok: false, error: e.message });
    }
  }

  console.log('\n--- RESUME ---');
  for (const r of results) {
    console.log('  ' + (r.ok ? '[OK]' : '[!!]') + ' ' + r.name + (r.error ? ' -- ' + r.error : ''));
  }

  console.log('\n--- ETAPES SUIVANTES ---');
  console.log('  1. Migration DB (Supabase SQL Editor) :');
  console.log('       ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT TRUE;');
  console.log('       UPDATE profiles SET is_free_tier = FALSE WHERE plan IN (\'express\', \'active\', \'intensive\', \'pro_unlimited\');');
  console.log('       UPDATE profiles SET is_free_tier = TRUE WHERE plan = \'free\' AND is_free_tier IS NULL;');
  console.log('');
  console.log('  2. Tests :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       pytest tests/test_pricing_v2.py -v');
  console.log('');
  console.log('  3. Verification import :');
  console.log('       python -c "from app.main import app; print(\'OK\')"');
  console.log('');
  console.log('  Si tout est OK, lance : node scripts/pricing-v2-phase2.js');
  console.log('');
}

main();