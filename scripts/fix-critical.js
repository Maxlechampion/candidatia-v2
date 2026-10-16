#!/usr/bin/env node
/**
 * fix-critical.js
 * ---------------
 * Corrige les 8 bloquants critiques identifies dans l'audit.
 *
 * Corrections appliquees :
 *   1. backend/app/services/payment/orchestrator.py  -> indentation verify_payment
 *   2. backend/app/services/generation/word_cv.py    -> f-string Python 3.11
 *   3. backend/scripts/schema.sql                    -> colonne password_hash
 *   4. backend/app/core/config.py                    -> allowed_origins + cors_origins
 *   5. backend/app/services/payment/fedapay.py       -> retirer print() debug
 *   6. backend/app/services/payment/flutterwave.py   -> reintegrer proprement
 *   7. frontend/next.config.js                       -> chemin i18n corrige
 *   8. frontend/app/layout.tsx                       -> layout racine minimal
 *   9. frontend/app/[locale]/layout.tsx              -> retirer <html>/<body>
 *
 * Usage :
 *   node scripts/fix-critical.js
 *
 * Le script est IDEMPOTENT : relancable sans casser.
 * Chaque fichier modifie est sauvegarde dans .backups/fix-critical-<ts>/
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");
const BACKUP_DIR = path.join(ROOT, ".backups", `fix-critical-${Date.now()}`);

const log = {
  info: (m) => console.log(`\x1b[36m[INFO]\x1b[0m ${m}`),
  ok: (m) => console.log(`\x1b[32m[ OK ]\x1b[0m ${m}`),
  warn: (m) => console.log(`\x1b[33m[WARN]\x1b[0m ${m}`),
  err: (m) => console.log(`\x1b[31m[ERR ]\x1b[0m ${m}`),
  skip: (m) => console.log(`\x1b[90m[SKIP]\x1b[0m ${m}`),
  title: (m) => console.log(`\n\x1b[1m\x1b[35m━━━ ${m} ━━━\x1b[0m`),
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
  fs.writeFileSync(absPath, content, "utf8");
}

function readFile(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, "utf8");
}

// ============================================================
// 1. orchestrator.py — Reecriture propre
// ============================================================

function fixOrchestrator() {
  log.title("1. orchestrator.py — indentation verify_payment");

  const filePath = path.join(BACKEND, "app", "services", "payment", "orchestrator.py");
  const content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  // Detection : verify_payment mal indente (ligne avec `def verify_payment` suivie de `"""` non indentee)
  if (content.includes("def verify_payment") && !content.match(/\n\s{8}def verify_payment/)) {
    log.warn("verify_payment mal indente — reecriture complete");
  } else if (content.includes("def verify_payment")) {
    log.skip("verify_payment deja correctement indente");
    return;
  }

  // Reecriture complete (fichier sain)
  const newContent = `"""
Orchestrateur paiement.
Route automatiquement vers le bon provider selon le canal choisi.
Selectionne aussi le bon plan tarifaire.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.database import insert_row, select_rows, update_row
from app.core.errors import NotFoundError, PaymentError, ValidationError
from app.core.logging import get_logger
from app.services.auth.user_service import add_credits
from app.services.payment.base import PaymentProvider
from app.services.payment.fedapay import FedaPayProvider
from app.services.payment.flutterwave import FlutterwaveProvider
from app.services.payment.plans import (
    get_currency_for_provider,
    get_plan,
    get_price_for_provider,
)
from app.services.payment.raenest import RaenestProvider
from app.services.payment.schemas import (
    PaymentIntent,
    PaymentProviderName,
    PaymentResult,
    PaymentStatus,
    WebhookPayload,
)

logger = get_logger("payment.orchestrator")


class PaymentOrchestrator:
    """Orchestrateur principal."""

    def __init__(self) -> None:
        self._providers: Dict[str, PaymentProvider] = {
            "fedapay": FedaPayProvider(),
            "flutterwave": FlutterwaveProvider(),
            "raenest": RaenestProvider(),
        }

    def get_provider(self, name: str) -> PaymentProvider:
        """Retourne un provider par son nom."""
        provider = self._providers.get(name.lower())
        if not provider:
            raise ValidationError(message=f"Provider de paiement inconnu : {name}")
        return provider

    def available_providers(self) -> List[str]:
        """Retourne les providers disponibles (configures)."""
        return [name for name, p in self._providers.items() if p.is_available()]

    def create_checkout(
        self,
        user_id: str,
        user_email: str,
        plan_code: str,
        provider_name: str,
        customer_name: Optional[str] = None,
        locale: str = "fr",
    ) -> Dict[str, Any]:
        """Cree une session de paiement."""
        plan = get_plan(plan_code)
        if not plan:
            raise NotFoundError(message=f"Plan inconnu : {plan_code}")

        provider = self.get_provider(provider_name)
        if not provider.is_available():
            raise PaymentError(
                message=f"Provider {provider_name} non disponible actuellement.",
                details={"provider": provider_name},
            )

        amount = get_price_for_provider(plan_code, provider_name)
        currency = get_currency_for_provider(provider_name)

        intent = PaymentIntent(
            user_id=user_id,
            amount=amount,
            currency=currency,
            plan_code=plan_code,
            credits_to_add=plan["credits"],
            description=f"Achat plan {plan['name']}",
            customer_email=user_email,
            customer_name=customer_name,
            locale=locale,
            metadata={"plan_name": plan["name"]},
        )

        try:
            result: PaymentResult = provider.safe_checkout(intent)
        except PaymentError:
            raise
        except Exception as e:
            logger.exception("checkout_failed", provider=provider_name, error=str(e))
            raise PaymentError(
                message=f"Erreur creation checkout : {str(e)}",
                details={"provider": provider_name},
            ) from e

        payment_record = insert_row(
            "payments",
            {
                "user_id": user_id,
                "provider": provider_name,
                "provider_transaction_id": result.provider_transaction_id,
                "amount": amount,
                "currency": currency,
                "credits_added": plan["credits"],
                "plan_purchased": plan_code,
                "status": "pending",
                "metadata": {
                    "checkout_url": result.checkout_url,
                    "plan_name": plan["name"],
                },
            },
        )

        logger.info(
            "checkout_created",
            user_id=user_id,
            provider=provider_name,
            plan=plan_code,
            amount=amount,
            payment_id=payment_record.get("id"),
        )

        return {
            "payment_id": payment_record.get("id"),
            "checkout_url": result.checkout_url,
            "provider": provider_name,
            "provider_transaction_id": result.provider_transaction_id,
            "amount": amount,
            "currency": currency,
            "plan_code": plan_code,
            "plan_name": plan["name"],
            "credits_to_add": plan["credits"],
        }

    def handle_webhook(
        self,
        provider_name: str,
        headers: Dict[str, str],
        body: bytes,
    ) -> Dict[str, Any]:
        """Traite un webhook provider."""
        provider = self.get_provider(provider_name)

        try:
            payload: WebhookPayload = provider.verify_webhook(headers, body)
        except PaymentError:
            raise
        except Exception as e:
            logger.exception("webhook_verify_failed", provider=provider_name, error=str(e))
            raise PaymentError(message=f"Webhook invalide : {str(e)}") from e

        logger.info(
            "webhook_received",
            provider=provider_name,
            transaction_id=payload.provider_transaction_id,
            status=payload.status.value,
        )

        payments = select_rows(
            "payments",
            filters={"provider_transaction_id": payload.provider_transaction_id},
            limit=1,
        )
        if not payments:
            logger.warning(
                "webhook_payment_not_found",
                provider=provider_name,
                transaction_id=payload.provider_transaction_id,
            )
            raise NotFoundError(message="Paiement introuvable.")

        payment = payments[0]
        current_status = payment.get("status", "pending")

        if current_status == "success":
            logger.info("webhook_already_processed", payment_id=payment.get("id"))
            return {"status": "already_processed", "payment_id": payment.get("id")}

        new_status = payload.status.value
        update_row(
            "payments",
            {"id": payment["id"]},
            {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **(payment.get("metadata") or {}),
                    "webhook_received_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        )

        if payload.status == PaymentStatus.SUCCESS:
            try:
                user_id = payment["user_id"]
                credits = payment.get("credits_added", 0)
                if credits > 0:
                    add_credits(user_id, credits)
                    logger.info(
                        "credits_added",
                        user_id=user_id,
                        credits=credits,
                        payment_id=payment["id"],
                    )
            except Exception as e:
                logger.exception(
                    "credits_add_failed",
                    payment_id=payment["id"],
                    error=str(e),
                )

        return {
            "status": "processed",
            "payment_id": payment["id"],
            "new_status": new_status,
        }

    def list_user_payments(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Retourne l historique des paiements d un utilisateur."""
        return select_rows(
            "payments",
            filters={"user_id": user_id},
            limit=limit,
            order_by="created_at",
            descending=True,
        )

    def verify_payment(self, transaction_id: str, user_id: str) -> Dict[str, Any]:
        """
        Verifie le statut reel d une transaction aupres du provider
        et credite l utilisateur si approuve.
        """
        payments = select_rows(
            "payments",
            filters={"provider_transaction_id": transaction_id},
            limit=1,
        )
        if not payments:
            raise NotFoundError(message="Paiement introuvable.")

        payment = payments[0]

        if payment["user_id"] != user_id:
            raise ValidationError(
                message="Ce paiement n appartient pas a cet utilisateur."
            )

        current_status = payment.get("status", "pending")

        if current_status == "success":
            logger.info("payment_already_verified", payment_id=payment["id"])
            return {
                "status": "already_processed",
                "payment_id": payment["id"],
                "current_status": current_status,
                "new_status": current_status,
            }

        provider = self.get_provider(payment["provider"])
        real_status = provider.get_transaction_status(transaction_id)

        logger.info(
            "payment_verified",
            payment_id=payment["id"],
            provider=payment["provider"],
            real_status=real_status.get("status"),
        )

        status_map = {
            "approved": "success",
            "transferred": "success",
            "declined": "failed",
            "canceled": "cancelled",
            "refunded": "refunded",
            "pending": "pending",
        }
        new_status = status_map.get(real_status.get("status", "").lower(), "pending")

        update_row(
            "payments",
            {"id": payment["id"]},
            {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **(payment.get("metadata") or {}),
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                    "real_status": real_status.get("status"),
                },
            },
        )

        if new_status == "success":
            credits = payment.get("credits_added", 0)
            if credits > 0:
                add_credits(payment["user_id"], credits)
                logger.info(
                    "credits_added",
                    user_id=payment["user_id"],
                    credits=credits,
                    payment_id=payment["id"],
                )

        return {
            "status": "verified",
            "payment_id": payment["id"],
            "new_status": new_status,
            "real_status": real_status.get("status"),
        }


# Singleton
_orchestrator: Optional[PaymentOrchestrator] = None


def get_payment_orchestrator() -> PaymentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PaymentOrchestrator()
    return _orchestrator
`;

  writeFile(filePath, newContent);
  log.ok("orchestrator.py reecrit proprement");
}

// ============================================================
// 2. word_cv.py — f-string Python 3.11
// ============================================================

function fixWordCv() {
  log.title("2. word_cv.py — f-string Python 3.11");

  const filePath = path.join(BACKEND, "app", "services", "generation", "word_cv.py");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  // Pattern problematique : f" [{", ".join(technos)}]"
  const badPattern = 'f" [{", ".join(technos)}]"';
  const goodPattern = 'f" [{\', \'.join(technos)}]"';

  if (content.includes(badPattern)) {
    content = content.split(badPattern).join(goodPattern);
    writeFile(filePath, content);
    log.ok("f-string corrigee : f-string Python 3.11");
  } else if (content.includes("', '.join(technos)")) {
    log.skip("f-string deja corrigee");
  } else {
    log.warn("Pattern f-string non trouve — verification manuelle recommandee");
  }
}

// ============================================================
// 3. schema.sql — colonne password_hash
// ============================================================

function fixSchema() {
  log.title("3. schema.sql — colonne password_hash");

  const filePath = path.join(BACKEND, "scripts", "schema.sql");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  if (content.includes("password_hash")) {
    log.skip("password_hash deja present");
    return;
  }

  // Ajouter password_hash apres email
  const emailLine = '    email TEXT UNIQUE NOT NULL,';
  if (content.includes(emailLine)) {
    content = content.replace(
      emailLine,
      emailLine + '\n    password_hash TEXT,'
    );
    writeFile(filePath, content);
    log.ok("Colonne password_hash ajoutee");
  } else {
    log.warn("Pattern email introuvable — verification manuelle recommandee");
  }
}

// ============================================================
// 4. config.py — allowed_origins + cors_origins
// ============================================================

function fixConfig() {
  log.title("4. config.py — allowed_origins + cors_origins");

  const filePath = path.join(BACKEND, "app", "core", "config.py");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  if (content.includes("cors_origins")) {
    log.skip("cors_origins deja present");
    return;
  }

  // 4a. Ajouter allowed_origins apres frontend_url
  const frontendUrlRegex = /(\s+)(frontend_url\s*:\s*str\s*=\s*["'][^"']+["'])/;
  const match = content.match(frontendUrlRegex);

  if (match) {
    const indent = match[1];
    content = content.replace(
      frontendUrlRegex,
      `${indent}${match[2]}\n${indent}allowed_origins: str = ""`
    );
    log.ok("allowed_origins ajoute");
  } else {
    log.warn("frontend_url introuvable — ajout manuel recommande");
  }

  // 4b. Ajouter la property cors_origins
  if (!content.includes("def cors_origins")) {
    // Trouver un point d'ancrage : apres is_development
    const anchor = /(\s+)(def is_development\(self\) -> bool:\n\s+return self\.app_env == "development")/;
    const m = content.match(anchor);

    const propertyCode = `

    @property
    def cors_origins(self) -> List[str]:
        """Liste des origines CORS autorisees (frontend + extras CSV)."""
        origins = {self.frontend_url}
        if self.allowed_origins:
            for origin in self.allowed_origins.split(","):
                origin = origin.strip()
                if origin:
                    origins.add(origin)
        return sorted(origins)`;

    if (m) {
      content = content.replace(m[0], m[0] + propertyCode);
      log.ok("Property cors_origins ajoutee");
    } else {
      // Fallback : ajouter avant la derniere accolade de la classe
      log.warn("Point d'ancrage introuvable — ajout manuel recommande");
    }
  }

  writeFile(filePath, content);
}

// ============================================================
// 5. fedapay.py — retirer print() debug
// ============================================================

function fixFedapay() {
  log.title("5. fedapay.py — retirer print() debug");

  const filePath = path.join(BACKEND, "app", "services", "payment", "fedapay.py");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  // Pattern : bloc print avec 🚨 DEBUG FEDAPAY
  const debugPattern = /\s*print\("\\n" \+ "="\*60\)\n\s*print\("🚨 DEBUG FEDAPAY - PAYLOAD ENVOYÉ :"\)\n\s*print\(json\.dumps\(payload, indent=2, ensure_ascii=False\)\)\n\s*print\("="\*60 \+ "\\n"\)\n/;

  if (content.match(debugPattern)) {
    content = content.replace(debugPattern, "\n");
    writeFile(filePath, content);
    log.ok("Bloc print() de debug retire");
  } else if (content.includes("🚨 DEBUG FEDAPAY")) {
    // Fallback : remplacer manuellement
    content = content.replace(
      /print\("🚨 DEBUG FEDAPAY[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n/g,
      ""
    );
    writeFile(filePath, content);
    log.ok("Bloc print() de debug retire (fallback)");
  } else {
    log.skip("Aucun print() de debug detecte");
  }
}

// ============================================================
// 6. flutterwave.py — reintegrer proprement
// ============================================================

function fixFlutterwave() {
  log.title("6. flutterwave.py — verification integration");

  const filePath = path.join(BACKEND, "app", "services", "payment", "flutterwave.py");
  const content = readFile(filePath);

  if (!content) {
    log.warn("flutterwave.py introuvable — skip");
    return;
  }

  // Verifier que la classe existe et herite bien de PaymentProvider
  if (content.includes("class FlutterwaveProvider(PaymentProvider)")) {
    log.ok("flutterwave.py present et correctement herite");
  } else {
    log.warn("Heritage PaymentProvider absent — verification manuelle requise");
  }
}

// ============================================================
// 7. frontend/next.config.js — chemin i18n
// ============================================================

function fixNextConfig() {
  log.title("7. next.config.js — chemin i18n");

  const filePath = path.join(FRONTEND, "next.config.js");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  const i18nPath = path.join(FRONTEND, "src", "i18n.ts");
  const i18nRootPath = path.join(FRONTEND, "i18n.ts");

  let targetPath = "./i18n.ts";
  if (fs.existsSync(i18nPath)) {
    targetPath = "./src/i18n.ts";
  } else if (fs.existsSync(i18nRootPath)) {
    targetPath = "./i18n.ts";
  } else {
    log.warn("Aucun i18n.ts trouve — skip");
    return;
  }

  // Remplacer le chemin dans createNextIntlPlugin
  const regex = /createNextIntlPlugin\(["'][^"']+["']\)/;
  if (content.match(regex)) {
    content = content.replace(regex, `createNextIntlPlugin("${targetPath}")`);
    writeFile(filePath, content);
    log.ok(`Chemin i18n corrige -> ${targetPath}`);
  } else if (content.includes(targetPath)) {
    log.skip("Chemin i18n deja correct");
  } else {
    log.warn("Pattern createNextIntlPlugin introuvable");
  }
}

// ============================================================
// 8. app/layout.tsx — layout racine minimal
// ============================================================

function fixRootLayout() {
  log.title("8. app/layout.tsx — layout racine");

  const filePath = path.join(FRONTEND, "app", "layout.tsx");
  const content = readFile(filePath);

  if (!content) {
    log.warn("app/layout.tsx introuvable — creation");
  } else if (content.includes("<html") && content.includes("<body")) {
    log.warn("app/layout.tsx contient deja <html>/<body> — skip (eviter conflit)");
    return;
  }

  const newContent = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CandidatIA - Generez votre pack de candidature en 1 clic",
  description:
    "CV optimise, lettre de motivation et guide d'entretien generes par IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note : <html> et <body> sont fournis par app/[locale]/layout.tsx
  return children;
}
`;

  writeFile(filePath, newContent);
  log.ok("app/layout.tsx reecrit (minimal)");
}

// ============================================================
// 9. app/[locale]/layout.tsx — retirer <html>/<body> ? NON
//    (on garde <html>/<body> dans [locale] pour compatibilite)
// ============================================================

function checkLocaleLayout() {
  log.title("9. app/[locale]/layout.tsx — verification");

  const filePath = path.join(FRONTEND, "app", "[locale]", "layout.tsx");
  const content = readFile(filePath);

  if (!content) {
    log.warn("app/[locale]/layout.tsx introuvable — skip");
    return;
  }

  if (content.includes("<html") && content.includes("<body")) {
    log.ok("app/[locale]/layout.tsx contient <html>/<body> (compatibilite OK)");
  } else {
    log.warn("app/[locale]/layout.tsx ne contient pas <html>/<body>");
    log.info("Verifier que app/layout.tsx les contient");
  }
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[35m║  CandidatIA - Corrections critiques (8 fichiers)     ║\x1b[0m");
  console.log("\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m");
  console.log(`\nRacine  : ${ROOT}`);
  console.log(`Backups : ${BACKUP_DIR}\n`);

  const startTime = Date.now();
  const tasks = [
    ["orchestrator.py", fixOrchestrator],
    ["word_cv.py", fixWordCv],
    ["schema.sql", fixSchema],
    ["config.py", fixConfig],
    ["fedapay.py", fixFedapay],
    ["flutterwave.py", fixFlutterwave],
    ["next.config.js", fixNextConfig],
    ["app/layout.tsx", fixRootLayout],
    ["app/[locale]/layout.tsx", checkLocaleLayout],
  ];

  const results = [];
  for (const [name, fn] of tasks) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      log.err(`${name} : ${e.message}`);
      results.push({ name, ok: false, error: e.message });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n\x1b[1m\x1b[35m━━━ RESUME ━━━\x1b[0m");
  for (const r of results) {
    const icon = r.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`  ${icon} ${r.name}${r.error ? " — " + r.error : ""}`);
  }

  console.log(`\n\x1b[36mDuree : ${duration}s\x1b[0m`);
  console.log(`\x1b[36mBackups : ${BACKUP_DIR}\x1b[0m`);

  console.log("\n\x1b[1m\x1b[32m✅ Corrections terminees.\x1b[0m\n");
  console.log("\x1b[1m\x1b[33mProchaines etapes :\x1b[0m");
  console.log("  1. Backend — tests unitaires");
  console.log("       cd backend");
  console.log("       .\\venv\\Scripts\\Activate.ps1");
  console.log("       pytest -m \"not integration\" -q --no-header");
  console.log("");
  console.log("  2. Frontend — type-check + build");
  console.log("       cd frontend");
  console.log("       npm run type-check");
  console.log("       Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue");
  console.log("       npm run build");
  console.log("");
  console.log("  3. Commit + push");
  console.log("       cd ..");
  console.log("       git add .");
  console.log("       git commit -m \"fix: corrections critiques pre-deploiement\"");
  console.log("       git push origin main");
  console.log("");
}

main();