#!/usr/bin/env node
/**
 * fix-billing-webhooks.js
 * -----------------------
 * Corrige les 6 tests qui echouent :
 *   1. billing.py     -> prefix "/api/billing"
 *   2. webhooks.py    -> 400 sur signature manquante (pas 200)
 *
 * Usage :
 *   node scripts/fix-billing-webhooks.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const BACKUP_DIR = path.join(ROOT, ".backups", `fix-billing-${Date.now()}`);

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
  fs.writeFileSync(absPath, content, "utf8");
}

function readFile(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, "utf8");
}

function fixBillingPrefix() {
  log.title("1. billing.py — prefix /api/billing");

  const filePath = path.join(BACKEND, "app", "routers", "billing.py");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  if (content.includes('prefix="/api/billing"')) {
    log.skip("Prefix deja correct");
    return;
  }

  const before = content;
  content = content.replace(
    /APIRouter\(\s*prefix\s*=\s*["']\/billing["']/,
    'APIRouter(prefix="/api/billing"'
  );

  if (content === before) {
    log.warn("Pattern APIRouter(prefix=...) non trouve");
    return;
  }

  writeFile(filePath, content);
  log.ok('Prefix corrige : "/billing" -> "/api/billing"');
}

function fixWebhooksStatusCodes() {
  log.title("2. webhooks.py — status 400 sur signature manquante");

  const filePath = path.join(BACKEND, "app", "routers", "webhooks.py");
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return;
  }

  // FedaPay : passer 200 -> 400 quand c'est une erreur de signature manquante
  content = content.replace(
    /return JSONResponse\(\s*content=\{"status": "error", "message": str\(e\)\},\s*status_code=200,\s*\)/g,
    `status_code = 200 if "invalide" in str(e).lower() else 400
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=status_code,
        )`
  );

  if (content.includes('status_code = 200 if "invalide"')) {
    log.ok("webhooks.py : status conditionnel ajoute");
    writeFile(filePath, content);
  } else {
    log.warn("Aucun changement detecte — verification manuelle requise");
  }
}

function main() {
  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[35m║  CandidatIA - Correction billing + webhooks          ║\x1b[0m");
  console.log("\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m");
  console.log(`\nBackups : ${BACKUP_DIR}\n`);

  try {
    fixBillingPrefix();
  } catch (e) {
    log.err(`billing.py : ${e.message}`);
  }

  try {
    fixWebhooksStatusCodes();
  } catch (e) {
    log.err(`webhooks.py : ${e.message}`);
  }

  console.log("\n\x1b[1m\x1b[32m✅ Correction terminee.\x1b[0m\n");
  console.log("\x1b[1m\x1b[33mProchaine etape :\x1b[0m");
  console.log("  cd backend");
  console.log('  pytest -m "not integration" -q --no-header');
  console.log("");
}

main();