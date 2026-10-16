#!/usr/bin/env node
/**
 * setup-pricing-v2.js — CandidatIA
 * PRICING-v2 : Nouvelle grille tarifaire 5 plans B2C
 *
 * Usage : node scripts/setup-pricing-v2.js
 * Idempotent : relancable sans casser
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const DOCS = path.join(ROOT, 'docs');
const BACKUP_DIR = path.join(ROOT, '.backups', 'pricing-v2-' + Date.now());

// ============================================================
// UTILITAIRES
// ============================================================

const log = {
  info: (m) => console.log('[INFO] ' + m),
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backupFile(absPath) {
  if (!fs.existsSync(absPath)) return;
  ensureDir(BACKUP_DIR);
  const rel = path.relative(ROOT, absPath);
  const backupPath = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(absPath, backupPath);
}

function writeFile(absPath, content) {
  backupFile(absPath);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, content, 'utf8');
}

function readFile(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf8');
}

// ============================================================
// 1. BACKEND — plans.py (5 plans B2C)
// ============================================================

function fixPlans() {
  log.title('1. backend/plans.py - 5 plans B2C');

  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'plans.py');
  const content = readFile(filePath);

  if (content && content.includes('"pro_unlimited"') && content.includes('"express"')) {
    log.skip('plans.py deja a jour');
    return;
  }

  const newContent = [
    '"""',
    'Definition des plans tarifaires CandidatIA - PRICING-v2',
    '',
    '5 plans B2C. Le plan free applique un filigrane.',
    '"""',
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
    '    """Retourne la liste de tous les plans."""',
    '    return list(PLANS.values())',
    '',
    '',
    'def get_plan(code: str) -> Optional[Dict[str, Any]]:',
    '    """Retourne un plan par son code, ou None."""',
    '    return PLANS.get(code.lower())',
    '',
    '',
    'def get_price_for_provider(plan_code: str, provider_name: str) -> float:',
    '    """Retourne le prix d un plan pour un provider donne."""',
    '    plan_code = plan_code.lower()',
    '    provider_name = provider_name.lower()',
    '',
    '    if plan_code not in PLANS:',
    '        raise ValueError(f"Plan inconnu : {plan_code}")',
    '',
    '    plan = PLANS[plan_code]',
    '',
    '    if provider_name == "fedapay":',
    '        return float(plan["price_xof"])',
    '    if provider_name == "flutterwave":',
    '        return float(plan["price_eur"])',
    '    if provider_name == "raenest":',
    '        return float(plan["price_usd"])',
    '',
    '    raise ValueError(f"Provider inconnu : {provider_name}")',
    '',
    '',
    'def get_currency_for_provider(provider_name: str) -> str:',
    '    """Retourne la devise utilisee par un provider."""',
    '    provider_name = provider_name.lower()',
    '    mapping = {',
    '        "fedapay": "XOF",',
    '        "flutterwave": "EUR",',
    '        "raenest": "USD",',
    '    }',
    '    currency = mapping.get(provider_name)',
    '    if not currency:',
    '        raise ValueError(f"Devise inconnue pour provider : {provider_name}")',
    '    return currency',
    '',
    '',
    'def format_price(amount: float, currency: str) -> str:',
    '    """Formate un prix pour affichage."""',
    '    currency = currency.upper()',
    '    if currency == "XOF":',
    '        return f"{int(amount):,}".replace(",", " ") + " FCFA"',
    '    if currency == "USD":',
    '        return "$" + f"{amount:.2f}"',
    '    if currency == "EUR":',
    '        return f"{amount:.2f} EUR"',
    '    return f"{amount:.2f} {currency}"',
  ].join('\n') + '\n';

  writeFile(filePath, newContent);
  log.ok('plans.py reecrit avec 5 plans B2C');
}

// ============================================================
// 2. BACKEND — quota_service.py
// ============================================================

function fixQuotaService() {
  log.title('2. backend/quota_service.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'quota_service.py');
  const content = readFile(filePath);

  if (content && content.includes('"pro_unlimited"') && content.includes('"express"')) {
    log.skip('quota_service.py deja aligne');
    return;
  }

  const newContent = [
    '"""Gestion et verification des quotas par plan - PRICING-v2."""',
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
    '    "free": {',
    '        "name": "Decouverte",',
    '        "credits": 1,',
    '        "price_eur": 0,',
    '        "is_free": True,',
    '    },',
    '    "express": {',
    '        "name": "Express",',
    '        "credits": 1,',
    '        "price_eur": 3.00,',
    '        "is_free": False,',
    '    },',
    '    "active": {',
    '        "name": "Candidature Active",',
    '        "credits": 5,',
    '        "price_eur": 7.50,',
    '        "is_free": False,',
    '    },',
    '    "intensive": {',
    '        "name": "Recherche Intensive",',
    '        "credits": 15,',
    '        "price_eur": 18.00,',
    '        "is_free": False,',
    '    },',
    '    "pro_unlimited": {',
    '        "name": "Pro Illimite",',
    '        "credits": 999999,',
    '        "price_eur": 22.00,',
    '        "is_free": False,',
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
    '        "credits_included": plan_info.get("credits", 0),',
    '        "price_eur": plan_info.get("price_eur", 0),',
    '        "is_free_tier": bool(user.get("is_free_tier", plan == "free")),',
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
  ].join('\n') + '\n';

  writeFile(filePath, newContent);
  log.ok('quota_service.py aligne avec les 5 plans');
}

// ============================================================
// 3. BACKEND — models/user.py
// ============================================================

function fixUserModel() {
  log.title('3. backend/models/user.py');

  const filePath = path.join(BACKEND, 'app', 'models', 'user.py');
  const content = readFile(filePath);

  if (content && content.includes('is_free_tier')) {
    log.skip('user.py contient deja is_free_tier');
    return;
  }

  const newContent = [
    '"""Modeles Pydantic : User."""',
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
    '    is_free_tier: bool = True',
    '    email_verified: bool = False',
    '    fedapay_customer_id: Optional[str] = None',
    '    flutterwave_customer_id: Optional[str] = None',
    '    created_at: Optional[datetime] = None',
    '    updated_at: Optional[datetime] = None',
    '',
    '    class Config:',
    '        from_attributes = True',
  ].join('\n') + '\n';

  writeFile(filePath, newContent);
  log.ok('user.py : ajout du champ is_free_tier');
}

// ============================================================
// 4. BACKEND — schema.sql
// ============================================================

function fixSchema() {
  log.title('4. backend/schema.sql');

  const filePath = path.join(BACKEND, 'scripts', 'schema.sql');
  let content = readFile(filePath);

  if (!content) {
    log.err('schema.sql introuvable');
    return;
  }

  if (content.includes('is_free_tier')) {
    log.skip('schema.sql contient deja is_free_tier');
    return;
  }

  // Ajouter la colonne is_free_tier apres plan
  content = content.replace(
    /(plan\s+TEXT\s+DEFAULT\s+'free',)/,
    '$1\n    is_free_tier BOOLEAN DEFAULT TRUE,'
  );

  // Ajouter la migration a la fin
  content += '\n-- ============================================================\n';
  content += '-- MIGRATION PRICING-v2 (idempotent)\n';
  content += '-- ============================================================\n';
  content += 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT TRUE;\n';
  content += "UPDATE profiles SET is_free_tier = FALSE WHERE plan IN ('express', 'active', 'intensive', 'pro_unlimited');\n";
  content += "UPDATE profiles SET is_free_tier = TRUE WHERE plan = 'free' AND is_free_tier IS NULL;\n";

  writeFile(filePath, content);
  log.ok('schema.sql : ajout is_free_tier + migration');
}

// ============================================================
// 5. BACKEND — user_service.py
// ============================================================

function fixUserService() {
  log.title('5. backend/user_service.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'user_service.py');
  let content = readFile(filePath);

  if (!content) {
    log.err('user_service.py introuvable');
    return;
  }

  if (content.includes('is_free_tier')) {
    log.skip('user_service.py contient deja is_free_tier');
    return;
  }

  content = content.replace(
    /("plan": "free",)/,
    '$1\n        "is_free_tier": True,'
  );

  if (!content.includes('def mark_paid_tier')) {
    content += '\n\n';
    content += 'def mark_paid_tier(user_id: str) -> Dict[str, Any]:\n';
    content += '    """Marque un utilisateur comme payant (retire le filigrane)."""\n';
    content += '    return update_user(user_id, {"is_free_tier": False})\n';
  }

  writeFile(filePath, content);
  log.ok('user_service.py : is_free_tier + mark_paid_tier()');
}

// ============================================================
// 6. BACKEND — word_cv.py (filigrane conditionnel)
// ============================================================

function fixWordCvWatermark() {
  log.title('6. backend/word_cv.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_cv.py');
  let content = readFile(filePath);

  if (!content) {
    log.err('word_cv.py introuvable');
    return;
  }

  if (content.includes('_ajouter_filigrane')) {
    log.skip('word_cv.py contient deja le filigrane');
    return;
  }

  // Inserer le helper avant la classe
  const helperLines = [
    '',
    'def _ajouter_filigrane(doc):',
    '    """Ajoute un filigrane discret en pied de document."""',
    '    from docx.shared import Pt, RGBColor',
    '    from docx.enum.text import WD_ALIGN_PARAGRAPH',
    '',
    '    p = doc.add_paragraph()',
    '    p.alignment = WD_ALIGN_PARAGRAPH.CENTER',
    '    p.paragraph_format.space_before = Pt(24)',
    '    run = p.add_run("Genere gratuitement avec CandidatIA - candidatia.com")',
    '    run.italic = True',
    '    run.font.size = Pt(8)',
    '    run.font.color.rgb = RGBColor(160, 160, 160)',
    '',
    '',
  ].join('\n');

  content = content.replace(
    /(class WordCVGenerator\(DocumentGenerator\):)/,
    helperLines + '$1'
  );

  // Ajouter l appel avant return doc
  content = content.replace(
    /(\n\s+logger\.info\(\s*\n\s+"word_cv_built",[\s\S]*?\)\n\s+)(return doc)/,
    '$1        if locale.get("apply_watermark", False):\n            _ajouter_filigrane(doc)\n\n$2'
  );

  writeFile(filePath, content);
  log.ok('word_cv.py : filigrane conditionnel');
}

// ============================================================
// 7. BACKEND — word_guide.py (filigrane conditionnel)
// ============================================================

function fixWordGuideWatermark() {
  log.title('7. backend/word_guide.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_guide.py');
  let content = readFile(filePath);

  if (!content) {
    log.err('word_guide.py introuvable');
    return;
  }

  if (content.includes('_ajouter_filigrane')) {
    log.skip('word_guide.py contient deja le filigrane');
    return;
  }

  const helperLines = [
    '',
    'def _ajouter_filigrane(doc):',
    '    """Ajoute un filigrane discret en pied de document."""',
    '    from docx.shared import Pt, RGBColor',
    '    from docx.enum.text import WD_ALIGN_PARAGRAPH',
    '',
    '    p = doc.add_paragraph()',
    '    p.alignment = WD_ALIGN_PARAGRAPH.CENTER',
    '    p.paragraph_format.space_before = Pt(24)',
    '    run = p.add_run("Genere gratuitement avec CandidatIA - candidatia.com")',
    '    run.italic = True',
    '    run.font.size = Pt(8)',
    '    run.font.color.rgb = RGBColor(160, 160, 160)',
    '',
    '',
  ].join('\n');

  content = content.replace(
    /(class WordGuideGenerator\(DocumentGenerator\):)/,
    helperLines + '$1'
  );

  content = content.replace(
    /(\n\s+logger\.info\(\s*\n\s+"word_guide_built",[\s\S]*?\)\n\s+)(return doc)/,
    '$1        if locale.get("apply_watermark", False):\n            _ajouter_filigrane(doc)\n\n$2'
  );

  writeFile(filePath, content);
  log.ok('word_guide.py : filigrane conditionnel');
}

// ============================================================
// 8. BACKEND — generation.py
// ============================================================

function fixGenerationRouter() {
  log.title('8. backend/generation.py');

  const filePath = path.join(BACKEND, 'app', 'routers', 'generation.py');
  let content = readFile(filePath);

  if (!content) {
    log.err('generation.py introuvable');
    return;
  }

  if (content.includes('apply_watermark') && content.includes('_save_generation')) {
    log.skip('generation.py deja a jour');
    return;
  }

  // 1. Import insert_row
  if (!content.includes('from app.core.database import insert_row')) {
    content = content.replace(
      /(from app\.services\.language\.locale_map import get_locale_conventions)/,
      '$1\nfrom app.core.database import insert_row'
    );
  }

  // 2. Fonction _save_generation
  if (!content.includes('def _save_generation')) {
    const saveFn = [
      '',
      'def _save_generation(',
      '    user_id: str,',
      '    cv_data: Dict[str, Any],',
      '    locale: Dict[str, Any],',
      '    result: Dict[str, Any],',
      ') -> None:',
      '    """Sauvegarde la generation en DB pour l historique."""',
      '    try:',
      '        score = cv_data.get("analyse", {}).get("score_matching", 0)',
      '        insert_row("generations", {',
      '            "user_id": user_id,',
      '            "input_profile_hash": "n/a",',
      '            "input_offer_hash": "n/a",',
      '            "output_language": locale.get("language_code", "fr"),',
      '            "score_matching": int(score) if score else None,',
      '            "cv_path": result.get("cv_path"),',
      '            "lettre_path": result.get("lettre_path"),',
      '            "guide_path": result.get("guide_path"),',
      '            "zip_path": result.get("zip_path"),',
      '            "credits_consumed": 1,',
      '            "status": "completed",',
      '        })',
      '        logger.info("generation_saved", user_id=user_id)',
      '    except Exception as e:',
      '        logger.warning("generation_save_failed", user_id=user_id, error=str(e))',
      '',
      '',
    ].join('\n');

    content = content.replace(
      /(@router\.post\("\/generate", summary="Generer un pack complet \(JWT requis\)"\))/,
      saveFn + '$1'
    );
  }

  // 3. Propager apply_watermark
  if (!content.includes('apply_watermark')) {
    content = content.replace(
      /(locale = get_locale_conventions\(output_language\))/,
      '$1\n    # Propagation du flag free tier pour le filigrane\n    is_free = bool(user.get("is_free_tier", user.get("plan", "free") == "free"))\n    locale["apply_watermark"] = is_free'
    );
  }

  // 4. Sauvegarder la generation avant retour ZIP
  if (!content.includes('_save_generation(user_id')) {
    content = content.replace(
      /(logger\.info\("generate_success", user_id=user_id, zip_path=zip_path\))/,
      'try:\n        _save_generation(user_id, cv_data, locale, result)\n    except Exception as _e:\n        logger.warning("save_generation_wrapper_failed", error=str(_e))\n\n    $1'
    );
  }

  writeFile(filePath, content);
  log.ok('generation.py : is_free_tier propage + sauvegarde DB');
}

// ============================================================
// 9. BACKEND — payment/orchestrator.py
// ============================================================

function fixPaymentOrchestrator() {
  log.title('9. backend/payment/orchestrator.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'orchestrator.py');
  let content = readFile(filePath);

  if (!content) {
    log.err('payment/orchestrator.py introuvable');
    return;
  }

  if (content.includes('mark_paid_tier')) {
    log.skip('payment/orchestrator.py gere deja mark_paid_tier');
    return;
  }

  // Importer mark_paid_tier
  content = content.replace(
    /(from app\.services\.auth\.user_service import add_credits)/,
    '$1, mark_paid_tier'
  );

  // Apres chaque add_credits(...), ajouter l appel a mark_paid_tier
  // Pattern 1 : webhook (variable user_id)
  content = content.replace(
    /(add_credits\(user_id, credits\)\n)(\s+)(logger\.info\()/g,
    '$1$2try:\n$2    mark_paid_tier(user_id)\n$2except Exception as _e:\n$2    logger.warning("mark_paid_tier_failed", error=str(_e))\n$2$3'
  );

  // Pattern 2 : verify (variable payment["user_id"])
  content = content.replace(
    /(add_credits\(payment\["user_id"\], credits\)\n)(\s+)(logger\.info\()/g,
    '$1$2try:\n$2    mark_paid_tier(payment["user_id"])\n$2except Exception as _e:\n$2    logger.warning("mark_paid_tier_failed", error=str(_e))\n$2$3'
  );

  writeFile(filePath, content);
  log.ok('payment/orchestrator.py : mark_paid_tier() appele');
}

// ============================================================
// 10. FRONTEND — PlanCard.tsx
// ============================================================

function fixPlanCard() {
  log.title('10. frontend/PlanCard.tsx');

  const filePath = path.join(FRONTEND, 'components', 'billing', 'PlanCard.tsx');
  const content = readFile(filePath);

  if (content && content.includes('is_free') && content.includes('isUnlimited')) {
    log.skip('PlanCard.tsx deja a jour');
    return;
  }

  // Utiliser une approche sans backticks complexes : concatenation
  const newContent = [
    '"use client";',
    '',
    'import { useTranslations } from "next-intl";',
    'import { cn } from "@/lib/utils";',
    '',
    'export interface Plan {',
    '  code: string;',
    '  name: string;',
    '  description?: string;',
    '  price_eur: number;',
    '  price_xof: number;',
    '  price_usd?: number;',
    '  credits: number;',
    '  is_free?: boolean;',
    '  features: string[];',
    '  highlight?: boolean;',
    '}',
    '',
    'export function PlanCard({',
    '  plan,',
    '  isCurrentPlan,',
    '  onSelect,',
    '  highlighted,',
    '}: {',
    '  plan: Plan;',
    '  isCurrentPlan: boolean;',
    '  onSelect: (code: string) => void;',
    '  highlighted?: boolean;',
    '}) {',
    '  const t = useTranslations("billing");',
    '  const isFree = plan.is_free === true || plan.code === "free";',
    '  const isHighlighted = highlighted !== undefined ? highlighted : plan.highlight === true;',
    '  const isUnlimited = plan.credits >= 999999;',
    '',
    '  const creditsLabel = isUnlimited',
    '    ? t("credits_unlimited")',
    '    : plan.credits + " " + t("packs_count");',
    '',
    '  const priceLabel =',
    '    plan.price_eur === 0 ? t("free_label") : plan.price_eur.toFixed(2);',
    '',
    '  return (',
    '    <div',
    '      className={cn(',
    '        "relative bg-white rounded-xl border p-6 transition flex flex-col",',
    '        isHighlighted',
    '          ? "border-primary-500 shadow-lg shadow-primary-500/20"',
    '          : "border-slate-200 hover:border-primary-300"',
    '      )}',
    '    >',
    '      {isHighlighted && !isFree && (',
    '        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">',
    '          {t("popular")}',
    '        </span>',
    '      )}',
    '',
    '      {isFree && (',
    '        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">',
    '          {t("free_badge")}',
    '        </span>',
    '      )}',
    '',
    '      <h3 className="text-lg font-bold text-dark mb-2">{plan.name}</h3>',
    '',
    '      {plan.description && (',
    '        <p className="text-xs text-slate-500 mb-3">{plan.description}</p>',
    '      )}',
    '',
    '      <div className="mb-4">',
    '        <span className="text-3xl font-bold text-dark">{priceLabel}</span>',
    '        {!isFree && <span className="text-slate-500 text-sm ml-1">EUR</span>}',
    '      </div>',
    '',
    '      <p className="text-sm text-slate-500 mb-6">{creditsLabel}</p>',
    '',
    '      <ul className="space-y-2 mb-6 flex-1">',
    '        {plan.features.map((feature, i) => (',
    '          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">',
    '            <svg',
    '              width="16"',
    '              height="16"',
    '              viewBox="0 0 24 24"',
    '              fill="none"',
    '              stroke="currentColor"',
    '              strokeWidth="2"',
    '              className="text-emerald-500 shrink-0 mt-0.5"',
    '            >',
    '              <polyline points="20 6 9 17 4 12" />',
    '            </svg>',
    '            <span>{feature}</span>',
    '          </li>',
    '        ))}',
    '      </ul>',
    '',
    '      <button',
    '        onClick={() => onSelect(plan.code)}',
    '        disabled={isCurrentPlan}',
    '        className={cn(',
    '          "w-full py-2.5 rounded-lg font-semibold text-sm transition",',
    '          isCurrentPlan',
    '            ? "bg-slate-100 text-slate-400 cursor-not-allowed"',
    '            : isHighlighted',
    '            ? "bg-primary-600 text-white hover:bg-primary-700"',
    '            : isFree',
    '            ? "bg-emerald-600 text-white hover:bg-emerald-700"',
    '            : "bg-slate-100 text-slate-700 hover:bg-slate-200"',
    '        )}',
    '      >',
    '        {isCurrentPlan ? t("current_plan") : t("choose_plan")}',
    '      </button>',
    '    </div>',
    '  );',
    '}',
    '',
  ].join('\n');

  writeFile(filePath, newContent);
  log.ok('PlanCard.tsx : support 5 plans + badge Free');
}

// ============================================================
// 11. FRONTEND — billing/page.tsx
// ============================================================

function fixBillingPage() {
  log.title('11. frontend/billing/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'billing', 'page.tsx');
  const content = readFile(filePath);

  if (!content) {
    log.err('billing/page.tsx introuvable');
    return;
  }

  if (content.includes('is_free') && !content.includes('FEDAPAY_PRICES')) {
    log.skip('billing/page.tsx deja dynamique');
    return;
  }

  if (!content.includes('FEDAPAY_PRICES')) {
    log.warn('FEDAPAY_PRICES non trouve - skip manuel recommande');
    return;
  }

  const newContent = [
    '"use client";',
    '',
    'import { useEffect, useState } from "react";',
    'import { useTranslations } from "next-intl";',
    'import { api } from "@/lib/api";',
    'import { useAuthStore } from "@/lib/store";',
    'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";',
    'import { Alert } from "@/components/ui/Alert";',
    'import { PlanCard, Plan } from "@/components/billing/PlanCard";',
    '',
    'interface Payment {',
    '  id: string;',
    '  provider: string;',
    '  amount: number;',
    '  currency: string;',
    '  plan_purchased: string;',
    '  status: string;',
    '  created_at: string;',
    '}',
    '',
    'export default function BillingPage() {',
    '  const t = useTranslations("billing");',
    '  const { user } = useAuthStore();',
    '',
    '  const [plans, setPlans] = useState<Plan[]>([]);',
    '  const [providers, setProviders] = useState<string[]>([]);',
    '  const [payments, setPayments] = useState<Payment[]>([]);',
    '  const [selectedProvider, setSelectedProvider] = useState("fedapay");',
    '  const [loading, setLoading] = useState(true);',
    '  const [error, setError] = useState("");',
    '',
    '  useEffect(() => {',
    '    async function load() {',
    '      try {',
    '        const [plansRes, providersRes, paymentsRes, meRes] = await Promise.all([',
    '          api.get("/api/billing/plans"),',
    '          api.get("/api/billing/providers"),',
    '          api.get("/api/billing/payments"),',
    '          api.get("/api/auth/me"),',
    '        ]);',
    '',
    '        useAuthStore.getState().setUser(meRes.data);',
    '        setPlans(plansRes.data.plans);',
    '        setProviders(providersRes.data.providers);',
    '        setPayments(paymentsRes.data);',
    '        setSelectedProvider(providersRes.data.providers[0] || "fedapay");',
    '      } catch (err: any) {',
    '        setError(err.response?.data?.detail || "Erreur de chargement.");',
    '      } finally {',
    '        setLoading(false);',
    '      }',
    '    }',
    '    load();',
    '  }, []);',
    '',
    '  async function handleCheckout(planCode: string) {',
    '    if (planCode === "free") {',
    '      window.location.href = "/dashboard/generate";',
    '      return;',
    '    }',
    '',
    '    setError("");',
    '',
    '    try {',
    '      const { data } = await api.post("/api/billing/checkout", {',
    '        plan_code: planCode,',
    '        provider: selectedProvider,',
    '      });',
    '      window.location.href = data.checkout_url;',
    '    } catch (err: any) {',
    '      setError(err.response?.data?.detail || "Erreur de paiement.");',
    '    }',
    '  }',
    '',
    '  return (',
    '    <div className="max-w-7xl mx-auto space-y-8">',
    '      <div>',
    '        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>',
    '        <p className="text-slate-600">{t("subtitle")}</p>',
    '      </div>',
    '',
    '      {error && <Alert variant="error">{error}</Alert>}',
    '',
    '      <div>',
    '        <h2 className="text-xl font-bold text-dark mb-4">{t("plans_title")}</h2>',
    '        {loading ? (',
    '          <p className="text-slate-500 text-sm">{t("plans_loading")}</p>',
    '        ) : (',
    '          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">',
    '            {plans.map((plan) => (',
    '              <PlanCard',
    '                key={plan.code}',
    '                plan={plan}',
    '                isCurrentPlan={user?.plan === plan.code}',
    '                onSelect={handleCheckout}',
    '              />',
    '            ))}',
    '          </div>',
    '        )}',
    '      </div>',
    '',
    '      <Card>',
    '        <CardHeader>',
    '          <CardTitle>{t("payment_methods")}</CardTitle>',
    '        </CardHeader>',
    '        <CardContent>',
    '          {providers.length === 0 ? (',
    '            <Alert variant="info">{t("no_providers")}</Alert>',
    '          ) : (',
    '            <div className="flex flex-wrap gap-3">',
    '              {providers.map((p) => (',
    '                <button',
    '                  key={p}',
    '                  type="button"',
    '                  onClick={() => setSelectedProvider(p)}',
    '                  className={',
    '                    "px-4 py-2 rounded-lg border-2 text-sm font-medium transition " +',
    '                    (selectedProvider === p',
    '                      ? "border-primary-500 bg-primary-50 text-primary-700"',
    '                      : "border-slate-200 hover:border-primary-300 text-slate-600")',
    '                  }',
    '                >',
    '                  {p === "fedapay" && "Mobile Money (FedaPay)"}',
    '                  {p === "flutterwave" && "Carte bancaire"}',
    '                  {p === "raenest" && "Crypto (USDT/USDC)"}',
    '                </button>',
    '              ))}',
    '            </div>',
    '          )}',
    '        </CardContent>',
    '      </Card>',
    '',
    '      <Card>',
    '        <CardHeader>',
    '          <CardTitle>{t("history_title")}</CardTitle>',
    '        </CardHeader>',
    '        <CardContent>',
    '          {payments.length === 0 ? (',
    '            <p className="text-slate-500 text-sm text-center py-4">',
    '              {t("no_payments")}',
    '            </p>',
    '          ) : (',
    '            <div className="space-y-2">',
    '              {payments.map((p) => (',
    '                <div',
    '                  key={p.id}',
    '                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"',
    '                >',
    '                  <div>',
    '                    <p className="font-medium text-slate-700">',
    '                      Plan {p.plan_purchased}',
    '                    </p>',
    '                    <p className="text-xs text-slate-500">',
    '                      {new Date(p.created_at).toLocaleString()}',
    '                    </p>',
    '                  </div>',
    '                  <div className="text-right">',
    '                    <p className="font-bold text-slate-700">',
    '                      {p.amount} {p.currency}',
    '                    </p>',
    '                    <p className="text-xs text-slate-500">{p.status}</p>',
    '                  </div>',
    '                </div>',
    '              ))}',
    '            </div>',
    '          )}',
    '        </CardContent>',
    '      </Card>',
    '    </div>',
    '  );',
    '}',
    '',
  ].join('\n');

  writeFile(filePath, newContent);
  log.ok('billing/page.tsx : 5 plans dynamiques');
}

// ============================================================
// 12. FRONTEND — Landing page.tsx
// ============================================================

function fixLandingPage() {
  log.title('12. frontend/landing page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'page.tsx');
  const content = readFile(filePath);

  if (content && content.includes('plan_express_name') && content.includes('plan_pro_unlimited_name')) {
    log.skip('landing page.tsx deja a jour');
    return;
  }

  const newContent = [
    'import { useTranslations } from "next-intl";',
    'import Link from "next/link";',
    'import { LandingFooter } from "@/components/Layout/LandingFooter";',
    '',
    'export default function HomePage() {',
    '  const t = useTranslations("landing");',
    '',
    '  const features = [',
    '    { title: t("feature_cv_title"), desc: t("feature_cv_desc"), icon: "[CV]" },',
    '    { title: t("feature_lettre_title"), desc: t("feature_lettre_desc"), icon: "[Lettre]" },',
    '    { title: t("feature_guide_title"), desc: t("feature_guide_desc"), icon: "[Guide]" },',
    '  ];',
    '',
    '  const steps = [',
    '    { step: "1", title: t("how_step1_title"), desc: t("how_step1_desc") },',
    '    { step: "2", title: t("how_step2_title"), desc: t("how_step2_desc") },',
    '    { step: "3", title: t("how_step3_title"), desc: t("how_step3_desc") },',
    '  ];',
    '',
    '  const plans = [',
    '    {',
    '      code: "free",',
    '      name: t("plan_free_name"),',
    '      price: "0",',
    '      features: [t("plan_free_f1"), t("plan_free_f2"), t("plan_free_f3")],',
    '      cta: t("plan_free_cta"),',
    '      highlighted: false,',
    '      isFree: true,',
    '    },',
    '    {',
    '      code: "express",',
    '      name: t("plan_express_name"),',
    '      price: "3",',
    '      features: [t("plan_express_f1"), t("plan_express_f2"), t("plan_express_f3")],',
    '      cta: t("plan_express_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "active",',
    '      name: t("plan_active_name"),',
    '      price: "7.50",',
    '      features: [',
    '        t("plan_active_f1"),',
    '        t("plan_active_f2"),',
    '        t("plan_active_f3"),',
    '        t("plan_active_f4"),',
    '      ],',
    '      cta: t("plan_active_cta"),',
    '      highlighted: true,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "intensive",',
    '      name: t("plan_intensive_name"),',
    '      price: "18",',
    '      features: [',
    '        t("plan_intensive_f1"),',
    '        t("plan_intensive_f2"),',
    '        t("plan_intensive_f3"),',
    '      ],',
    '      cta: t("plan_intensive_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '    {',
    '      code: "pro_unlimited",',
    '      name: t("plan_pro_unlimited_name"),',
    '      price: "22",',
    '      features: [',
    '        t("plan_pro_unlimited_f1"),',
    '        t("plan_pro_unlimited_f2"),',
    '        t("plan_pro_unlimited_f3"),',
    '      ],',
    '      cta: t("plan_pro_unlimited_cta"),',
    '      highlighted: false,',
    '      isFree: false,',
    '    },',
    '  ];',
    '',
    '  return (',
    '    <main className="min-h-screen bg-white">',
    '      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">',
    '        <div className="container-main flex items-center justify-between py-4">',
    '          <div className="text-xl font-bold text-dark">',
    '            Candidat<span className="text-primary-500">IA</span>',
    '          </div>',
    '          <nav className="flex items-center gap-3">',
    '            <Link',
    '              href="/login"',
    '              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition"',
    '            >',
    '              {t("nav_login")}',
    '            </Link>',
    '            <Link',
    '              href="/register"',
    '              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"',
    '            >',
    '              {t("nav_register")}',
    '            </Link>',
    '          </nav>',
    '        </div>',
    '      </header>',
    '',
    '      <section className="container-main py-20 md:py-28 text-center">',
    '        <span className="inline-block px-3 py-1 text-xs font-bold text-primary-700 bg-primary-50 rounded-full mb-6">',
    '          {t("badge_new")}',
    '        </span>',
    '        <h1 className="text-4xl md:text-6xl font-bold text-dark mb-6 leading-tight">',
    '          {t("hero_title")}',
    '        </h1>',
    '        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">',
    '          {t("hero_subtitle")}',
    '        </p>',
    '        <div className="flex flex-col sm:flex-row gap-4 justify-center">',
    '          <Link',
    '            href="/register"',
    '            className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"',
    '          >',
    '            {t("cta_primary")}',
    '          </Link>',
    '          <Link',
    '            href="#how"',
    '            className="px-6 py-3 text-base font-semibold text-primary-600 bg-white border-2 border-primary-100 rounded-lg hover:border-primary-300 transition"',
    '          >',
    '            {t("cta_secondary")}',
    '          </Link>',
    '        </div>',
    '      </section>',
    '',
    '      <section id="features" className="container-main py-16 md:py-24">',
    '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
    '          {t("features_title")}',
    '        </h2>',
    '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
    '          {t("features_subtitle")}',
    '        </p>',
    '',
    '        <div className="grid md:grid-cols-3 gap-6">',
    '          {features.map((feature, i) => (',
    '            <div',
    '              key={i}',
    '              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition"',
    '            >',
    '              <div className="text-lg font-bold text-primary-600 mb-4">{feature.icon}</div>',
    '              <h3 className="text-lg font-bold text-dark mb-3">{feature.title}</h3>',
    '              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>',
    '            </div>',
    '          ))}',
    '        </div>',
    '      </section>',
    '',
    '      <section id="how" className="bg-slate-50 py-16 md:py-24">',
    '        <div className="container-main">',
    '          <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-12">',
    '            {t("how_title")}',
    '          </h2>',
    '',
    '          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">',
    '            {steps.map((item, i) => (',
    '              <div key={i} className="text-center">',
    '                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">',
    '                  {item.step}',
    '                </div>',
    '                <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>',
    '                <p className="text-slate-600 text-sm">{item.desc}</p>',
    '              </div>',
    '            ))}',
    '          </div>',
    '        </div>',
    '      </section>',
    '',
    '      <section id="pricing" className="container-main py-16 md:py-24">',
    '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
    '          {t("pricing_title")}',
    '        </h2>',
    '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
    '          {t("pricing_subtitle")}',
    '        </p>',
    '',
    '        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">',
    '          {plans.map((plan) => (',
    '            <div',
    '              key={plan.code}',
    '              className={',
    '                "relative p-5 rounded-xl border-2 flex flex-col " +',
    '                (plan.highlighted',
    '                  ? "border-primary-500 shadow-lg"',
    '                  : plan.isFree',
    '                  ? "border-emerald-300"',
    '                  : "border-slate-200")',
    '              }',
    '            >',
    '              {plan.highlighted && (',
    '                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full whitespace-nowrap">',
    '                  {t("plan_popular")}',
    '                </span>',
    '              )}',
    '              {plan.isFree && (',
    '                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-full whitespace-nowrap">',
    '                  {t("plan_free_badge")}',
    '                </span>',
    '              )}',
    '              <h3 className="text-base font-bold text-dark mb-2">{plan.name}</h3>',
    '              <div className="mb-4">',
    '                <span className="text-3xl font-bold text-dark">{plan.price}</span>',
    '                <span className="text-slate-500 ml-1 text-sm">EUR</span>',
    '              </div>',
    '              <ul className="space-y-2 mb-6 flex-1">',
    '                {plan.features.map((f, j) => (',
    '                  <li key={j} className="flex items-start gap-2 text-xs text-slate-600">',
    '                    <span className="text-emerald-500">-</span>',
    '                    <span>{f}</span>',
    '                  </li>',
    '                ))}',
    '              </ul>',
    '              <Link',
    '                href="/register"',
    '                className={',
    '                  "block text-center py-2.5 rounded-lg font-semibold text-sm transition " +',
    '                  (plan.highlighted',
    '                    ? "bg-primary-600 text-white hover:bg-primary-700"',
    '                    : plan.isFree',
    '                    ? "bg-emerald-600 text-white hover:bg-emerald-700"',
    '                    : "bg-slate-100 text-slate-700 hover:bg-slate-200")',
    '                }',
    '              >',
    '                {plan.cta}',
    '              </Link>',
    '            </div>',
    '          ))}',
    '        </div>',
    '      </section>',
    '',
    '      <section className="bg-gradient-to-br from-dark to-primary-900 py-16 md:py-24">',
    '        <div className="container-main text-center">',
    '          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">',
    '            {t("cta_final_title")}',
    '          </h2>',
    '          <p className="text-primary-100 max-w-2xl mx-auto mb-8">',
    '            {t("cta_final_subtitle")}',
    '          </p>',
    '          <Link',
    '            href="/register"',
    '            className="inline-block px-8 py-3 text-base font-semibold text-primary-700 bg-white rounded-lg hover:bg-primary-50 transition"',
    '          >',
    '            {t("cta_final_button")}',
    '          </Link>',
    '        </div>',
    '      </section>',
    '',
    '      <LandingFooter />',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');

  writeFile(filePath, newContent);
  log.ok('landing page.tsx : 5 plans B2C');
}

// ============================================================
// 13. FRONTEND — messages/fr.json
// ============================================================

function fixMessagesFr() {
  log.title('13. frontend/messages/fr.json');

  const filePath = path.join(FRONTEND, 'messages', 'fr.json');
  const content = readFile(filePath);

  if (!content) {
    log.err('fr.json introuvable');
    return;
  }

  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    log.err('fr.json invalide : ' + e.message);
    return;
  }

  if (!json.billing) json.billing = {};
  json.billing.free_label = "Gratuit";
  json.billing.free_badge = "GRATUIT";
  json.billing.packs_count = "pack(s)";
  json.billing.credits_unlimited = "Illimite";

  if (!json.landing) json.landing = {};
  const L = json.landing;

  L.plan_free_name = "Decouverte";
  L.plan_free_cta = "Commencer gratuitement";
  L.plan_free_f1 = "1 pack unique";
  L.plan_free_f2 = "CV + Lettre + Guide";
  L.plan_free_f3 = "Filigrane CandidatIA";
  L.plan_free_badge = "GRATUIT";

  L.plan_express_name = "Express";
  L.plan_express_cta = "Choisir Express";
  L.plan_express_f1 = "1 pack sans filigrane";
  L.plan_express_f2 = "CV methode STAR";
  L.plan_express_f3 = "Lettre personnalisee";

  L.plan_active_name = "Candidature Active";
  L.plan_active_cta = "Choisir Candidature Active";
  L.plan_active_f1 = "5 packs";
  L.plan_active_f2 = "Guide d entretien enrichi";
  L.plan_active_f3 = "Relances automatiques";
  L.plan_active_f4 = "Sans filigrane";

  L.plan_intensive_name = "Recherche Intensive";
  L.plan_intensive_cta = "Choisir Recherche Intensive";
  L.plan_intensive_f1 = "15 packs";
  L.plan_intensive_f2 = "Coaching IA";
  L.plan_intensive_f3 = "Support prioritaire";

  L.plan_pro_unlimited_name = "Pro Illimite";
  L.plan_pro_unlimited_cta = "Passer au Pro Illimite";
  L.plan_pro_unlimited_f1 = "Packs illimites";
  L.plan_pro_unlimited_f2 = "Coaching premium";
  L.plan_pro_unlimited_f3 = "Support VIP";

  writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  log.ok('fr.json : cles plans B2C ajoutees');
}

// ============================================================
// 14. FRONTEND — messages/en.json
// ============================================================

function fixMessagesEn() {
  log.title('14. frontend/messages/en.json');

  const filePath = path.join(FRONTEND, 'messages', 'en.json');
  const content = readFile(filePath);

  if (!content) {
    log.err('en.json introuvable');
    return;
  }

  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    log.err('en.json invalide : ' + e.message);
    return;
  }

  if (!json.billing) json.billing = {};
  json.billing.free_label = "Free";
  json.billing.free_badge = "FREE";
  json.billing.packs_count = "pack(s)";
  json.billing.credits_unlimited = "Unlimited";

  if (!json.landing) json.landing = {};
  const L = json.landing;

  L.plan_free_name = "Discovery";
  L.plan_free_cta = "Start for free";
  L.plan_free_f1 = "1 free pack";
  L.plan_free_f2 = "CV + Cover Letter + Guide";
  L.plan_free_f3 = "CandidatIA watermark";
  L.plan_free_badge = "FREE";

  L.plan_express_name = "Express";
  L.plan_express_cta = "Choose Express";
  L.plan_express_f1 = "1 pack without watermark";
  L.plan_express_f2 = "STAR method CV";
  L.plan_express_f3 = "Personalized cover letter";

  L.plan_active_name = "Active Application";
  L.plan_active_cta = "Choose Active";
  L.plan_active_f1 = "5 packs";
  L.plan_active_f2 = "Enhanced interview guide";
  L.plan_active_f3 = "Automatic follow-ups";
  L.plan_active_f4 = "No watermark";

  L.plan_intensive_name = "Intensive Search";
  L.plan_intensive_cta = "Choose Intensive";
  L.plan_intensive_f1 = "15 packs";
  L.plan_intensive_f2 = "AI coaching";
  L.plan_intensive_f3 = "Priority support";

  L.plan_pro_unlimited_name = "Pro Unlimited";
  L.plan_pro_unlimited_cta = "Go Pro Unlimited";
  L.plan_pro_unlimited_f1 = "Unlimited packs";
  L.plan_pro_unlimited_f2 = "Premium coaching";
  L.plan_pro_unlimited_f3 = "VIP support";

  writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  log.ok('en.json : cles plans B2C ajoutees');
}

// ============================================================
// 15. BACKEND — tests/test_pricing_v2.py
// ============================================================

function addBackendTests() {
  log.title('15. backend/tests/test_pricing_v2.py');

  const filePath = path.join(BACKEND, 'tests', 'test_pricing_v2.py');
  const content = readFile(filePath);

  if (content && content.includes('test_plans_has_5_b2c')) {
    log.skip('test_pricing_v2.py existe deja');
    return;
  }

  const newContent = [
    '"""Tests PRICING-v2 : grille tarifaire 5 plans B2C."""',
    'from app.services.payment.plans import (',
    '    PLANS,',
    '    get_plan,',
    '    get_price_for_provider,',
    '    get_currency_for_provider,',
    '    list_plans,',
    ')',
    'from app.services.auth.quota_service import PLAN_QUOTAS',
    '',
    '',
    'def test_plans_has_5_b2c():',
    '    """La grille contient exactement 5 plans B2C."""',
    '    assert len(PLANS) == 5',
    '    expected = {"free", "express", "active", "intensive", "pro_unlimited"}',
    '    assert set(PLANS.keys()) == expected',
    '',
    '',
    'def test_free_plan_is_free():',
    '    """Le plan free est gratuit avec 1 credit."""',
    '    free = PLANS["free"]',
    '    assert free["is_free"] is True',
    '    assert free["credits"] == 1',
    '    assert free["price_eur"] == 0',
    '',
    '',
    'def test_prices_match_specs():',
    '    """Verifie les prix specifiques."""',
    '    assert PLANS["express"]["price_eur"] == 3.00',
    '    assert PLANS["active"]["price_eur"] == 7.50',
    '    assert PLANS["intensive"]["price_eur"] == 18.00',
    '    assert PLANS["pro_unlimited"]["price_eur"] == 22.00',
    '',
    '',
    'def test_credits_match_specs():',
    '    """Verifie les credits specifiques."""',
    '    assert PLANS["express"]["credits"] == 1',
    '    assert PLANS["active"]["credits"] == 5',
    '    assert PLANS["intensive"]["credits"] == 15',
    '    assert PLANS["pro_unlimited"]["credits"] >= 999999',
    '',
    '',
    'def test_price_xof_values():',
    '    """Verifie les prix XOF."""',
    '    assert PLANS["express"]["price_xof"] == 2000',
    '    assert PLANS["active"]["price_xof"] == 5000',
    '    assert PLANS["intensive"]["price_xof"] == 12000',
    '    assert PLANS["pro_unlimited"]["price_xof"] == 15000',
    '',
    '',
    'def test_get_price_for_provider_fedapay():',
    '    """FedaPay retourne le prix XOF."""',
    '    assert get_price_for_provider("active", "fedapay") == 5000.0',
    '',
    '',
    'def test_get_price_for_provider_flutterwave():',
    '    """Flutterwave retourne le prix EUR."""',
    '    assert get_price_for_provider("active", "flutterwave") == 7.50',
    '',
    '',
    'def test_get_price_for_provider_raenest():',
    '    """Raenest retourne le prix USD."""',
    '    assert get_price_for_provider("active", "raenest") == 8.50',
    '',
    '',
    'def test_currency_per_provider():',
    '    """Verifie les devises par provider."""',
    '    assert get_currency_for_provider("fedapay") == "XOF"',
    '    assert get_currency_for_provider("flutterwave") == "EUR"',
    '    assert get_currency_for_provider("raenest") == "USD"',
    '',
    '',
    'def test_quota_service_aligns_with_plans():',
    '    """PLAN_QUOTAS doit etre aligne avec PLANS."""',
    '    assert set(PLAN_QUOTAS.keys()) == set(PLANS.keys())',
    '    for code in PLANS:',
    '        assert PLAN_QUOTAS[code]["credits"] == PLANS[code]["credits"]',
    '        assert PLAN_QUOTAS[code]["price_eur"] == PLANS[code]["price_eur"]',
    '',
    '',
    'def test_only_free_has_is_free_true():',
    '    """Seul le plan free a is_free=True."""',
    '    for code, plan in PLANS.items():',
    '        if code == "free":',
    '            assert plan["is_free"] is True',
    '        else:',
    '            assert plan["is_free"] is False',
    '',
    '',
    'def test_get_plan_unknown_returns_none():',
    '    """get_plan retourne None pour un code inconnu."""',
    '    assert get_plan("inexistant") is None',
    '',
    '',
    'def test_list_plans_returns_all():',
    '    """list_plans retourne 5 plans."""',
    '    plans = list_plans()',
    '    assert len(plans) == 5',
    '    codes = [p["code"] for p in plans]',
    '    assert "free" in codes',
    '    assert "pro_unlimited" in codes',
    '',
  ].join('\n');

  writeFile(filePath, newContent);
  log.ok('test_pricing_v2.py cree');
}

// ============================================================
// 16. DOCS — context.md
// ============================================================

function updateContext() {
  log.title('16. docs/context.md');

  const filePath = path.join(DOCS, 'context.md');
  const content = readFile(filePath);

  if (!content) {
    log.warn('docs/context.md introuvable - skip');
    return;
  }

  if (content.includes('pro_unlimited')) {
    log.skip('docs/context.md deja a jour');
    return;
  }

  const plansTableRegex = /\| Plan \| Code \| Prix \| Crédits \|[\s\S]*?\n\n\*\*Canaux de paiement/;
  const newPlansTable = [
    '| Plan | Code | Prix EUR | Prix XOF | Prix USD | Crédits |',
    '|---|---|---|---|---|---|',
    '| Découverte | `free` | 0 € | 0 FCFA | 0 $ | 1 (unique) |',
    '| Express | `express` | 3 € | 2 000 FCFA | 3,50 $ | 1 |',
    '| Candidature Active | `active` | 7,50 € | 5 000 FCFA | 8,50 $ | 5 |',
    '| Recherche Intensive | `intensive` | 18 € | 12 000 FCFA | 20 $ | 15 |',
    '| Pro Illimité | `pro_unlimited` | 22 €/mois | 15 000 FCFA/mois | 25 $/mois | Illimité |',
    '',
    '**Filigrane sur plan gratuit** : les packs générés en plan `free` portent la mention *"Généré gratuitement avec CandidatIA"* en pied de page.',
    '',
    '**Canaux de paiement',
  ].join('\n');

  if (plansTableRegex.test(content)) {
    writeFile(filePath, content.replace(plansTableRegex, newPlansTable));
    log.ok('docs/context.md : grille tarifaire mise a jour');
  } else {
    log.warn('Pattern tableau plans non trouve dans docs/context.md');
  }
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=======================================================');
  console.log('  CandidatIA - PRICING-v2 (5 plans B2C)');
  console.log('=======================================================\n');
  console.log('Racine  : ' + ROOT);
  console.log('Backups : ' + BACKUP_DIR + '\n');

  const startTime = Date.now();
  const tasks = [
    ['plans.py', fixPlans],
    ['quota_service.py', fixQuotaService],
    ['models/user.py', fixUserModel],
    ['schema.sql', fixSchema],
    ['user_service.py', fixUserService],
    ['word_cv.py', fixWordCvWatermark],
    ['word_guide.py', fixWordGuideWatermark],
    ['generation.py', fixGenerationRouter],
    ['payment/orchestrator.py', fixPaymentOrchestrator],
    ['PlanCard.tsx', fixPlanCard],
    ['billing/page.tsx', fixBillingPage],
    ['landing page.tsx', fixLandingPage],
    ['messages/fr.json', fixMessagesFr],
    ['messages/en.json', fixMessagesEn],
    ['test_pricing_v2.py', addBackendTests],
    ['docs/context.md', updateContext],
  ];

  const results = [];
  for (const item of tasks) {
    const name = item[0];
    const fn = item[1];
    try {
      fn();
      results.push({ name: name, ok: true });
    } catch (e) {
      log.err(name + ' : ' + e.message);
      results.push({ name: name, ok: false, error: e.message });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n--- RESUME ---');
  for (const r of results) {
    const icon = r.ok ? '[OK]' : '[!!]';
    console.log('  ' + icon + ' ' + r.name + (r.error ? ' -- ' + r.error : ''));
  }

  console.log('\nDuree : ' + duration + 's');
  console.log('Backups : ' + BACKUP_DIR);

  console.log('\n=======================================================');
  console.log('  ETAPES SUIVANTES');
  console.log('=======================================================\n');
  console.log('  1. Migration DB (Supabase SQL Editor) :');
  console.log('       Copie-colle les 3 lignes ALTER/UPDATE de');
  console.log('       backend/scripts/schema.sql (section MIGRATION PRICING-v2)');
  console.log('');
  console.log('  2. Tests backend :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       pytest tests/test_pricing_v2.py -v');
  console.log('       pytest -m "not integration" -q');
  console.log('');
  console.log('  3. Frontend :');
  console.log('       cd frontend');
  console.log('       npm run type-check');
  console.log('       npm run dev');
  console.log('');
}

main();