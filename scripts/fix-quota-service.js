#!/usr/bin/env node
/**
 * fix-quota-service.js — Version 2 (ecriture inconditionnelle)
 * Reecrit quota_service.py en entier, sans condition ni regex.
 *
 * Usage : node scripts/fix-quota-service.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'backend', 'app', 'services', 'auth', 'quota_service.py');
const BACKUP = path.join(ROOT, '.backups', 'fix-quota-service-v2-' + Date.now());

// 1. Backup inconditionnel
fs.mkdirSync(BACKUP, { recursive: true });
if (fs.existsSync(FILE)) {
  fs.copyFileSync(FILE, path.join(BACKUP, 'quota_service.py'));
  console.log('[BACKUP] ' + path.join(BACKUP, 'quota_service.py'));
}

// 2. Contenu cible (ecriture inconditionnelle)
const content = `"""Gestion et verification des quotas par plan - PRICING-v2."""
from typing import Any, Dict

from app.core.errors import AppError
from app.core.logging import get_logger
from app.services.auth.user_service import get_user_by_id

logger = get_logger("auth.quota")


class QuotaExceededError(AppError):
    """Erreur specifique quand le quota est epuise."""
    status_code = 402
    error_code = "QUOTA_EXCEEDED"
    message = "Vous avez epuise vos credits."


PLAN_QUOTAS: Dict[str, Dict[str, Any]] = {
    "free": {"name": "Decouverte", "credits": 1, "price_eur": 0, "is_free": True},
    "express": {"name": "Express", "credits": 1, "price_eur": 3.00, "is_free": False},
    "active": {"name": "Candidature Active", "credits": 5, "price_eur": 7.50, "is_free": False},
    "intensive": {"name": "Recherche Intensive", "credits": 15, "price_eur": 18.00, "is_free": False},
    "pro_unlimited": {"name": "Pro Illimite", "credits": 999999, "price_eur": 22.00, "is_free": False},
}


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

fs.writeFileSync(FILE, content, 'utf8');
console.log('[ OK ] quota_service.py ecrit (' + content.length + ' chars)');
console.log('[ OK ] ' + FILE);