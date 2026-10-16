#!/usr/bin/env node
/**
 * remove-test-plan.js
 * Supprime le plan temporaire "test_1fcfa" apres le test FedaPay live.
 *
 * Usage : node scripts/remove-test-plan.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP = path.join(ROOT, '.backups', 'remove-test-plan-' + Date.now());

const log = {
  ok: (m) => console.log('[ OK ] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  info: (m) => console.log('[INFO] ' + m),
};

function backupFile(p) {
  if (!fs.existsSync(p)) return;
  fs.mkdirSync(BACKUP, { recursive: true });
  const rel = path.relative(ROOT, p);
  const bkp = path.join(BACKUP, rel);
  fs.mkdirSync(path.dirname(bkp), { recursive: true });
  fs.copyFileSync(p, bkp);
}

function readFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function writeFile(p, content) {
  backupFile(p);
  fs.writeFileSync(p, content, 'utf8');
}

// ============================================================
// 1. Supprimer du plans.py
// ============================================================

function removeFromPlans() {
  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'plans.py');
  let content = readFile(filePath);

  if (!content) throw new Error('plans.py introuvable');
  if (!content.includes('"test_1fcfa"')) {
    log.info('test_1fcfa absent de plans.py (deja supprime ?)');
    return;
  }

  // Regex pour matcher le bloc "test_1fcfa": { ... },
  const regex = /\s*"test_1fcfa":\s*\{[\s\S]*?\n\s*\},\n/;
  const newContent = content.replace(regex, '\n');

  if (newContent === content) {
    throw new Error('Regex de suppression n a rien matche - structure inattendue');
  }

  writeFile(filePath, newContent);
  log.ok('plans.py : test_1fcfa supprime');
}

// ============================================================
// 2. Supprimer du quota_service.py
// ============================================================

function removeFromQuota() {
  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'quota_service.py');
  let content = readFile(filePath);

  if (!content) throw new Error('quota_service.py introuvable');
  if (!content.includes('"test_1fcfa"')) {
    log.info('test_1fcfa absent de quota_service.py (deja supprime ?)');
    return;
  }

  // Regex pour la ligne : "test_1fcfa": { ... },
  const regex = /\s*"test_1fcfa":[^\n]*\n/;
  const newContent = content.replace(regex, '\n');

  if (newContent === content) {
    throw new Error('Regex de suppression n a rien matche dans quota_service.py');
  }

  writeFile(filePath, newContent);
  log.ok('quota_service.py : test_1fcfa supprime');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  Suppression du plan test_1fcfa');
  console.log('=====================================================\n');
  console.log('Backup : ' + BACKUP + '\n');

  try {
    removeFromPlans();
    removeFromQuota();
    console.log('\n--- ETAPES SUIVANTES ---\n');
    console.log('  1. Verifier import :');
    console.log('       cd backend');
    console.log('       .\\venv\\Scripts\\Activate.ps1');
    console.log('       python -c "from app.services.payment.plans import PLANS; print(list(PLANS.keys()))"');
    console.log('     Attendu : [..., "free", "express", "active", "intensive", "pro_unlimited"]');
    console.log('     (sans test_1fcfa)');
    console.log('');
    console.log('  2. Commit + push :');
    console.log('       cd ..');
    console.log('       git add .');
    console.log('       git commit -m "cleanup: supprimer plan temporaire 100 FCFA"');
    console.log('       git push');
    console.log('');
    console.log('  3. ⚠️ IMPORTANT : revenir en SANDBOX FedaPay sur Render :');
    console.log('       FEDAPAY_SECRET_KEY = sk_sandbox_xxx');
    console.log('       FEDAPAY_PUBLIC_KEY = pk_sandbox_xxx');
    console.log('       FEDAPAY_ENV = sandbox');
    console.log('');
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }
}

main();