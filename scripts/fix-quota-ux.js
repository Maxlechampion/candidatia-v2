#!/usr/bin/env node
/**
 * fix-quota-service.js
 * Repare quota_service.py apres l'injection ratee du fix-quota-ux.
 *
 * Usage : node scripts/fix-quota-service.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(
  ROOT, 'backend', 'app', 'services', 'auth', 'quota_service.py'
);
const BACKUP = path.join(ROOT, '.backups', 'fix-quota-service-' + Date.now());
fs.mkdirSync(BACKUP, { recursive: true });

if (!fs.existsSync(FILE)) {
  console.error('[ERR] introuvable : ' + FILE);
  process.exit(1);
}

fs.copyFileSync(FILE, path.join(BACKUP, 'quota_service.py'));

const content = fs.readFileSync(FILE, 'utf8');
if (content.includes('from app.core.errors import AppError') &&
    content.includes('class QuotaExceededError')) {
  // Verification que l'import est bien en haut (avant tout "class" ou "def")
  const firstClassIdx = content.indexOf('class ');
  const importIdx = content.indexOf('from app.core.errors import AppError');
  if (importIdx >= 0 && importIdx < firstClassIdx) {
    console.log('[SKIP] quota_service.py deja correct');
    process.exit(0);
  }
}

// ============================================================
// Reecriture complete et propre
// ============================================================

const newContent = `"""Gestion et verification des quotas par plan - PRICING-v2."""
from typing import Any, Dict

from app.core.errors import AppError
from app.core.logging import get_logger
from app.services.auth.user_service import get_user_by_id

logger = get_logger("auth.quota")


# ============================================================
# ERREUR SPECIFIQUE : quota depasse
# ============================================================

class QuotaExceededError(AppError):
    """Erreur specifique quand le quota est epuise."""
    status_code = 402  # Payment Required
    error_code = "QUOTA_EXCEEDED"
    message = "Vous avez epuise vos credits."


# ============================================================
# PLANS
# ============================================================

PLAN_QUOTAS: Dict[str, Dict[str, Any]] = {
    "free": {"name": "Decouverte", "credits": 1, "price_eur": 0, "is_free": True},
    "express": {"name": "Express", "credits": 1, "price_eur": 3.00, "is_free": False},
    "active": {"name": "Candidature Active", "credits": 5, "price_eur": 7.50, "is_free": False},
    "intensive": {"name": "Recherche Intensive", "credits": 15, "price_eur": 18.00, "is_free": False},
    "pro_unlimited": {"name": "Pro Illimite", "credits": 999999, "price_eur": 22.00, "is_free": False},
}


# ============================================================
# API PUBLIQUE
# ============================================================

def get_quota_info(user_id: str) -> Dict[str, Any]:
    """Retourne les informations de quota d un utilisateur."""
    user = get_user_by_id(user_id)
    plan = user.get("plan", "free")
    credits = user.get("credits", 0)
    plan_info = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["free"])

    return {
        "user_id": user_id,
        "plan": plan,
        "plan_name": plan_info["name"],
        "credits_remaining": credits,
        "credits_included": plan_info.get("credits", 0),
        "price_eur": plan_info.get("price_eur", 0),
        "is_free_tier": bool(user.get("is_free_tier", plan == "free")),
    }


def check_quota(user_id: str) -> None:
    """Verifie qu un utilisateur peut faire une generation."""
    user = get_user_by_id(user_id)
    credits = user.get("credits", 0)

    if credits <= 0:
        plan = user.get("plan", "free")
        logger.info("quota_exceeded", user_id=user_id, plan=plan)
        raise QuotaExceededError(
            message="Vous avez epuise vos credits. Rechargez pour continuer.",
            details={
                "plan": plan,
                "credits_remaining": 0,
                "upgrade_url": "/dashboard/billing",
                "action": "topup",
            },
        )
`;

fs.writeFileSync(FILE, newContent, 'utf8');
console.log('[ OK ] quota_service.py reecrit proprement');
console.log('Backup : ' + BACKUP);