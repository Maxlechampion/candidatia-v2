#!/usr/bin/env node
/**
 * fix-billing-404.js — CandidatIA
 * --------------------------------
 * Repare l'erreur 404 sur /api/billing/plans.
 *
 * Diagnostic en 4 points :
 *   1. Verifie que le prefix du router est bien "/api/billing"
 *   2. Verifie que le router est bien enregistre dans main.py
 *   3. Verifie que les endpoints (/plans, /providers, /checkout, /payments) existent
 *   4. Verifie que le fichier routers/billing.py existe et est valide
 *
 * Le script est IDEMPOTENT : relancable sans casser.
 * Backup automatique dans .backups/fix-billing-404-<timestamp>/
 *
 * Usage : node fix-billing-404.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const BACKUP_DIR = path.join(ROOT, '.backups', `fix-billing-404-${Date.now()}`);

// ============================================================
// UTILITAIRES
// ============================================================

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

function readFile(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf-8');
}

function writeFileSafe(absPath, content) {
  backupFile(absPath);
  fs.writeFileSync(absPath, content, 'utf-8');
}

// ============================================================
// ETAPE 1 : Verifier le prefix du router
// ============================================================

function checkBillingPrefix() {
  log.title('1. Verification du prefix du router billing');

  const filePath = path.join(BACKEND, 'app', 'routers', 'billing.py');

  if (!fs.existsSync(filePath)) {
    log.err(`Fichier introuvable : ${filePath}`);
    return { ok: false, needsFix: false };
  }

  let content = readFile(filePath);

  const hasApiBilling = content.includes('APIRouter(prefix="/api/billing"');
  const hasBillingOnly = content.match(/APIRouter\(\s*prefix\s*=\s*["']\/billing["']/);
  const hasNoPrefix = !content.includes('APIRouter(prefix=');

  if (hasApiBilling) {
    log.ok('Prefix correct : "/api/billing"');
    return { ok: true, needsFix: false };
  }

  if (hasBillingOnly) {
    log.warn('Prefix incorrect : "/billing" (devrait etre "/api/billing")');
    return { ok: false, needsFix: true, currentPrefix: '/billing' };
  }

  if (hasNoPrefix) {
    log.warn('Aucun prefix detecte sur le router billing');
    return { ok: false, needsFix: true, currentPrefix: '(aucun)' };
  }

  log.warn('Prefix non identifiable');
  return { ok: false, needsFix: true, currentPrefix: '(inconnu)' };
}

function fixBillingPrefix() {
  const filePath = path.join(BACKEND, 'app', 'routers', 'billing.py');
  let content = readFile(filePath);

  const before = content;

  // Remplacer APIRouter(prefix="/billing"... -> APIRouter(prefix="/api/billing"...
  content = content.replace(
    /APIRouter\(\s*prefix\s*=\s*["']\/billing["']/,
    'APIRouter(prefix="/api/billing"'
  );

  // Si aucun prefix, on le renseigne sur le premier APIRouter
  if (!content.includes('APIRouter(prefix=')) {
    content = content.replace(
      /APIRouter\(\s*tags\s*=/,
      'APIRouter(prefix="/api/billing", tags='
    );
  }

  if (content !== before) {
    writeFileSafe(filePath, content);
    log.ok('Prefix corrige en "/api/billing"');
    return true;
  }

  log.warn('Aucune modification appliquee (prefix inchange)');
  return false;
}

// ============================================================
// ETAPE 2 : Verifier l'enregistrement dans main.py
// ============================================================

function checkMainPyRegistration() {
  log.title('2. Verification de l enregistrement dans main.py');

  const filePath = path.join(BACKEND, 'app', 'main.py');

  if (!fs.existsSync(filePath)) {
    log.err(`Fichier introuvable : ${filePath}`);
    return { ok: false, needsFix: false };
  }

  const content = readFile(filePath);

  // Verifier l'import
  const hasImport = /from app\.routers import[^\n]*\bbilling\b/.test(content)
    || content.includes('from app.routers import billing')
    || /from app\.routers\.billing import/.test(content);

  // Verifier l'include_router
  const hasInclude = content.includes('app.include_router(billing.router)');

  log.info(`Import billing : ${hasImport ? 'OK' : 'MANQUANT'}`);
  log.info(`include_router(billing.router) : ${hasInclude ? 'OK' : 'MANQUANT'}`);

  return { ok: hasImport && hasInclude, needsFix: !hasImport || !hasInclude };
}

function fixMainPyRegistration() {
  const filePath = path.join(BACKEND, 'app', 'main.py');
  let content = readFile(filePath);
  const original = content;

  // --- Fix import ---
  const hasImport = /from app\.routers import[^\n]*\bbilling\b/.test(content)
    || content.includes('from app.routers import billing');

  if (!hasImport) {
    // Chercher la ligne "from app.routers import ..." et ajouter billing
    const importMatch = content.match(/from app\.routers import ([^\n]+)/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (!imports.includes('billing')) {
        imports.push('billing');
        content = content.replace(
          /from app\.routers import ([^\n]+)/,
          `from app.routers import ${imports.join(', ')}`
        );
        log.ok('Import "billing" ajoute a la ligne "from app.routers import ..."');
      }
    } else {
      log.err('Impossible de localiser la ligne "from app.routers import ..."');
    }
  } else {
    log.skip('Import billing deja present');
  }

  // --- Fix include_router ---
  if (!content.includes('app.include_router(billing.router)')) {
    // Chercher une ancre : le premier include_router existant
    const anchorMatch = content.match(/(\s+)app\.include_router\(([a-zA-Z_]+)\.router\)/);
    if (anchorMatch) {
      const indent = anchorMatch[1];
      const anchor = `app.include_router(${anchorMatch[2]}.router)`;
      content = content.replace(
        anchor,
        `${anchor}\n${indent}app.include_router(billing.router)`
      );
      log.ok('Ligne "app.include_router(billing.router)" ajoutee');
    } else {
      // Fallback : ajouter avant "return app"
      const returnMatch = content.match(/(\s+)return app\b/);
      if (returnMatch) {
        content = content.replace(
          /(\s+)return app\b/,
          `$1app.include_router(billing.router)\n\n$1return app`
        );
        log.ok('Ligne "app.include_router(billing.router)" ajoutee avant return app');
      } else {
        log.err('Impossible d ajouter include_router(billing.router) - ancre introuvable');
      }
    }
  } else {
    log.skip('include_router(billing.router) deja present');
  }

  if (content !== original) {
    writeFileSafe(filePath, content);
    log.ok('main.py mis a jour');
    return true;
  }

  return false;
}

// ============================================================
// ETAPE 3 : Verifier les endpoints dans billing.py
// ============================================================

function checkBillingEndpoints() {
  log.title('3. Verification des endpoints dans billing.py');

  const filePath = path.join(BACKEND, 'app', 'routers', 'billing.py');
  const content = readFile(filePath);

  if (!content) {
    log.err('billing.py introuvable');
    return false;
  }

  const endpoints = [
    { name: 'GET /plans', pattern: /@router\.get\(\s*["']\/plans["']/ },
    { name: 'GET /providers', pattern: /@router\.get\(\s*["']\/providers["']/ },
    { name: 'POST /checkout', pattern: /@router\.post\(\s*["']\/checkout["']/ },
    { name: 'GET /payments', pattern: /@router\.get\(\s*["']\/payments["']/ },
  ];

  let allPresent = true;
  for (const ep of endpoints) {
    if (ep.pattern.test(content)) {
      log.ok(`Endpoint present : ${ep.name}`);
    } else {
      log.warn(`Endpoint manquant : ${ep.name}`);
      allPresent = false;
    }
  }

  return allPresent;
}

// ============================================================
// ETAPE 4 : Verifier l'import des plans
// ============================================================

function checkPlansImport() {
  log.title('4. Verification de l import des plans');

  const filePath = path.join(BACKEND, 'app', 'routers', 'billing.py');
  const content = readFile(filePath);

  if (!content) return false;

  const hasPlansImport = content.includes('from app.services.payment.plans import')
    && (content.includes('list_plans') || content.includes('PLANS'));

  if (hasPlansImport) {
    log.ok('Import "list_plans" ou "PLANS" present');
  } else {
    log.warn('Import "list_plans" ou "PLANS" manquant ou invalide');
  }

  // Verifier que le module plans existe
  const plansPath = path.join(BACKEND, 'app', 'services', 'payment', 'plans.py');
  if (fs.existsSync(plansPath)) {
    const plansContent = readFile(plansPath);
    if (plansContent.includes('def list_plans')) {
      log.ok('Fonction list_plans existe dans plans.py');
    } else {
      log.warn('Fonction list_plans MANQUANTE dans plans.py');
    }
  } else {
    log.err('Fichier plans.py introuvable');
  }

  return hasPlansImport;
}

// ============================================================
// ETAPE 5 : Verifier le routeur webhooks (peut aussi 404)
// ============================================================

function checkWebhooksRouter() {
  log.title('5. Verification du router webhooks');

  const filePath = path.join(BACKEND, 'app', 'routers', 'webhooks.py');
  const content = readFile(filePath);

  if (!content) {
    log.warn('webhooks.py introuvable (peut etre normal si non utilise)');
    return;
  }

  const hasPrefix = content.includes('APIRouter(prefix="/webhooks"');
  if (hasPrefix) {
    log.ok('Prefix "/webhooks" present');
  } else {
    log.warn('Prefix "/webhooks" manquant - peut impacter les webhooks de paiement');
  }
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  CandidatIA - Diagnostic + Fix /api/billing/plans 404║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  console.log(`\nRacine  : ${ROOT}`);
  console.log(`Backups : ${BACKUP_DIR}\n`);

  // Verifier que le projet est bien la
  if (!fs.existsSync(BACKEND)) {
    console.error('\n\x1b[31m[ERR ] Dossier backend/ introuvable.\x1b[0m');
    console.error('       Execute ce script depuis la racine du projet (candidatia/).\n');
    process.exit(1);
  }

  // Diagnostic + correction
  const prefixResult = checkBillingPrefix();
  if (prefixResult.needsFix) {
    fixBillingPrefix();
  }

  const mainResult = checkMainPyRegistration();
  if (mainResult.needsFix) {
    fixMainPyRegistration();
  }

  checkBillingEndpoints();
  checkPlansImport();
  checkWebhooksRouter();

  // Re-check apres fix
  console.log('\n\x1b[1m\x1b[35m━━━ VERIFICATION FINALE ━━━\x1b[0m');
  const finalPrefix = checkBillingPrefix();
  const finalMain = checkMainPyRegistration();

  const allGood = finalPrefix.ok && finalMain.ok;

  if (allGood) {
    console.log('\n\x1b[1m\x1b[32m✅ Le router billing est correctement configure.\x1b[0m\n');
    console.log('\x1b[1m\x1b[33mProchaines etapes :\x1b[0m');
    console.log('  1. REDEMARRER uvicorn (obligatoire) :');
    console.log('       cd backend');
    console.log('       .\\venv\\Scripts\\Activate.ps1');
    console.log('       uvicorn app.main:app --reload');
    console.log('');
    console.log('  2. Verifier dans un navigateur ou via PowerShell :');
    console.log('       irm http://localhost:8000/api/billing/plans');
    console.log('       irm http://localhost:8000/api/billing/providers');
    console.log('');
    console.log('     Reponse attendue : un JSON avec la liste des 3 plans');
    console.log('     (essentiel, pro, carriere).');
    console.log('');
    console.log('  3. Verifier la liste complete des routes :');
    console.log('       (irm http://localhost:8000/openapi.json).paths |');
    console.log('         Get-Member -MemberType NoteProperty | Select-Object Name');
    console.log('');
    console.log('     Attendu :');
    console.log('       /api/billing/plans');
    console.log('       /api/billing/providers');
    console.log('       /api/billing/checkout');
    console.log('       /api/billing/payments');
    console.log('');
    console.log('  4. Recharger la page frontend :');
    console.log('       http://localhost:3000/fr/dashboard/billing');
    console.log('');
  } else {
    console.log('\n\x1b[1m\x1b[33m⚠️  Le probleme persiste. Verification manuelle necessaire.\x1b[0m\n');
    console.log('  Fichiers a verifier :');
    console.log('    - backend/app/routers/billing.py');
    console.log('    - backend/app/main.py');
    console.log('    - backend/app/services/payment/plans.py');
    console.log('');
    console.log(`  Backups disponibles dans :`);
    console.log(`    ${BACKUP_DIR}`);
    console.log('');
  }

  console.log('\x1b[90m  Note : apres application, redemarre TOUJOURS uvicorn.');
  console.log('         FastAPI ne recharge pas automatiquement les routes supprimees.\x1b[0m\n');
}

main();