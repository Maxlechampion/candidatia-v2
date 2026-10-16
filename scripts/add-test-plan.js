#!/usr/bin/env node
/**
 * add-test-plan.js
 * Ajoute un plan temporaire "test_1fcfa" a 100 FCFA pour tester FedaPay live.
 *
 * Usage : node scripts/add-test-plan.js
 *
 * ⚠️ Ce plan est TEMPORAIRE. Supprime-le apres le test avec :
 *    node scripts/remove-test-plan.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP = path.join(ROOT, '.backups', 'add-test-plan-' + Date.now());

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
// 1. Ajouter le plan dans plans.py
// ============================================================

function addToPlans() {
  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'plans.py');
  let content = readFile(filePath);

  if (!content) throw new Error('plans.py introuvable');
  if (content.includes('"test_1fcfa"')) {
    log.ok('test_1fcfa deja present dans plans.py');
    return;
  }

  const testPlan = [
    '    "test_1fcfa": {',
    '        "code": "test_1fcfa",',
    '        "name": "TEST - 100 FCFA",',
    '        "description": "Plan temporaire pour tester FedaPay live (100 FCFA minimum)",',
    '        "price_xof": 100,',
    '        "price_eur": 0.15,',
    '        "price_usd": 0.17,',
    '        "credits": 1,',
    '        "is_free": False,',
    '        "features": [',
    '            "Plan de test",',
    '            "A supprimer apres verification",',
    '        ],',
    '        "highlight": False,',
    '    },',
  ].join('\n');

  // Inserer apres le plan "free" (juste apres son bloc)
  const freeBlockEnd = content.indexOf('    "express": {');
  if (freeBlockEnd === -1) {
    throw new Error('Bloc "express" non trouve - structure inattendue');
  }

  content = content.slice(0, freeBlockEnd) + testPlan + '\n' + content.slice(freeBlockEnd);
  writeFile(filePath, content);
  log.ok('plans.py : test_1fcfa ajoute');
}

// ============================================================
// 2. Ajouter le quota dans quota_service.py
// ============================================================

function addToQuota() {
  const filePath = path.join(BACKEND, 'app', 'services', 'auth', 'quota_service.py');
  let content = readFile(filePath);

  if (!content) throw new Error('quota_service.py introuvable');
  if (content.includes('"test_1fcfa"')) {
    log.ok('test_1fcfa deja present dans quota_service.py');
    return;
  }

  const testQuota = '    "test_1fcfa": {"name": "TEST - 100 FCFA", "credits": 1, "price_eur": 0.15, "is_free": False},';

  // Inserer apres "free"
  const freeLine = content.indexOf('    "express":');
  if (freeLine === -1) {
    throw new Error('Ligne "express" non trouvee');
  }

  content = content.slice(0, freeLine) + testQuota + '\n' + content.slice(freeLine);
  writeFile(filePath, content);
  log.ok('quota_service.py : test_1fcfa ajoute');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  Ajout du plan test_1fcfa (100 FCFA minimum)');
  console.log('=====================================================\n');
  console.log('Backup : ' + BACKUP + '\n');

  try {
    addToPlans();
    addToQuota();
    console.log('\n--- ETAPES SUIVANTES ---\n');
    console.log('  1. Verifier import :');
    console.log('       cd backend');
    console.log('       .\\venv\\Scripts\\Activate.ps1');
    console.log('       python -c "from app.services.payment.plans import PLANS; print(list(PLANS.keys()))"');
    console.log('     Attendu : [..., "test_1fcfa", ...]');
    console.log('');
    console.log('  2. Commit + push :');
    console.log('       cd ..');
    console.log('       git add .');
    console.log('       git commit -m "test: ajouter plan temporaire 100 FCFA pour test FedaPay live"');
    console.log('       git push');
    console.log('');
    console.log('  3. Render va auto-deployer (~2 min)');
    console.log('');
    console.log('  4. ⚠️ Configurer FedaPay LIVE sur Render AVANT de tester :');
    console.log('       FEDAPAY_SECRET_KEY = sk_live_xxx');
    console.log('       FEDAPAY_PUBLIC_KEY = pk_live_xxx');
    console.log('       FEDAPAY_ENV = live');
    console.log('');
    console.log('  5. Tester : https://candidatia.vercel.app/fr/dashboard/billing');
    console.log('     -> Cliquer "Choisir ce plan" sur TEST - 100 FCFA');
    console.log('     -> Payer avec vrai numero Mobile Money');
    console.log('');
    console.log('  6. ⚠️ APRES LE TEST, nettoyer :');
    console.log('       node scripts/remove-test-plan.js');
    console.log('');
  } catch (e) {
    log.err(e.message);
    process.exit(1);
  }
}

main();