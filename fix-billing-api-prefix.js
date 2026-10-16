#!/usr/bin/env node
/**
 * fix-billing-api-prefix.js — CandidatIA
 * ---------------------------------------
 * Corrige les chemins d'appel API dans les fichiers billing qui
 * n'ont pas le prefixe "/api" requis par le backend FastAPI.
 *
 * Cible UNIQUEMENT :
 *   - frontend/app/[locale]/dashboard/billing/page.tsx
 *   - frontend/app/[locale]/billing/return/page.tsx
 *
 * Ne touche PAS aux appels deja corrects (ex: "/api/auth/me").
 * Idempotent + backups automatiques.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKUP_DIR = path.join(ROOT, '.backups', `fix-billing-api-${Date.now()}`);

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
  const bak = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(bak));
  fs.copyFileSync(absPath, bak);
}

function readFile(p) {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

function writeFileSafe(p, content) {
  backupFile(p);
  fs.writeFileSync(p, content, 'utf-8');
}

// ============================================================
// CORRECTEUR GENERIQUE
// ============================================================

/**
 * Corrige les appels api.get/post/put/delete("<path>") qui :
 *   - commencent par "/" (chemin relatif)
 *   - ne commencent PAS par "/api/"
 *   - ne contiennent PAS "://" (URL absolue)
 *
 * Ajoute le prefixe "/api" devant le chemin.
 */
function fixApiCalls(content) {
  const fixes = [];

  // Regex : api.get<...>("...")  / api.post<...>("...")  etc.
  // Capture : (methode + quote ouvrante) (chemin) (quote fermante)
  const regex = /(api\.(?:get|post|put|delete)\s*(?:<[^>]*>)?\s*\(\s*)(["'`])(\/[^"'`]*?)(["'`])/g;

  const newContent = content.replace(regex, (match, prefix, quote1, urlPath, quote2) => {
    // Skip si deja prefixe par /api/
    if (urlPath.startsWith('/api/')) {
      return match;
    }

    // Skip si contient "://" (URL absolue accidentelle)
    if (urlPath.includes('://')) {
      return match;
    }

    const newPath = `/api${urlPath}`;
    fixes.push({ from: urlPath, to: newPath });
    return `${prefix}${quote1}${newPath}${quote2}`;
  });

  return { content: newContent, fixes };
}

// ============================================================
// TRAITEMENT D'UN FICHIER
// ============================================================

function processFile(relPath) {
  const absPath = path.join(ROOT, relPath);

  log.title(relPath);

  if (!fs.existsSync(absPath)) {
    log.err(`Fichier introuvable : ${absPath}`);
    return { ok: false, fixes: 0 };
  }

  const original = readFile(absPath);
  const { content: fixed, fixes } = fixApiCalls(original);

  // Afficher le detail
  const originalCalls = [...original.matchAll(/api\.(?:get|post|put|delete)\s*(?:<[^>]*>)?\s*\(\s*["'`]([^"'`]+)["'`]/g)];
  log.info(`${originalCalls.length} appel(s) API detecte(s) :`);
  for (const m of originalCalls) {
    const url = m[1];
    const isBad = url.startsWith('/') && !url.startsWith('/api/');
    const icon = isBad ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m';
    console.log(`   ${icon} ${url}`);
  }

  if (fixes.length === 0) {
    log.ok('Aucune correction necessaire');
    return { ok: true, fixes: 0 };
  }

  console.log('');
  log.info(`${fixes.length} correction(s) a appliquer :`);
  for (const f of fixes) {
    log.ok(`${f.from}  ->  ${f.to}`);
  }

  writeFileSafe(absPath, fixed);
  log.ok(`Fichier mis a jour (${fixes.length} correction(s))`);

  return { ok: true, fixes: fixes.length };
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  CandidatIA - Fix prefix /api sur billing/*          ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  console.log(`\nRacine  : ${ROOT}`);
  console.log(`Backups : ${BACKUP_DIR}\n`);

  // Verifier que le projet est bien la
  if (!fs.existsSync(path.join(ROOT, 'frontend', 'app'))) {
    console.error('\x1b[31m[ERR ] Dossier frontend/app introuvable.\x1b[0m');
    console.error('       Execute ce script depuis la racine du projet (candidatia/).\n');
    process.exit(1);
  }

  const targets = [
    'frontend/app/[locale]/dashboard/billing/page.tsx',
    'frontend/app/[locale]/billing/return/page.tsx',
  ];

  const results = [];
  for (const rel of targets) {
    results.push({ rel, ...processFile(rel) });
  }

  // Resume
  console.log('\n\x1b[1m\x1b[35m━━━ RESUME ━━━\x1b[0m');
  let totalFixes = 0;
  for (const r of results) {
    const icon = r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const status = r.fixes > 0 ? `\x1b[33m${r.fixes} fix\x1b[0m` : '\x1b[90m0 fix\x1b[0m';
    console.log(`  ${icon} ${r.rel}  (${status})`);
    totalFixes += r.fixes;
  }

  console.log('');
  if (totalFixes > 0) {
    console.log(`\x1b[1m\x1b[32m✅ ${totalFixes} correction(s) appliquee(s).\x1b[0m\n`);
    console.log('\x1b[1m\x1b[33mProchaines etapes OBLIGATOIRES :\x1b[0m');
    console.log('');
    console.log('  1. Attendre que Next.js recharge a chaud (5-10 sec).');
    console.log('     Ou forcer un restart :');
    console.log('       cd frontend');
    console.log('       # CTRL+C puis :');
    console.log('       npm run dev');
    console.log('');
    console.log('  2. Tester dans le navigateur :');
    console.log('       http://localhost:3000/fr/dashboard/billing');
    console.log('');
    console.log('  3. Verifier dans les DevTools (F12 -> Network) que :');
    console.log('       GET http://localhost:8000/api/billing/plans  ->  200 OK');
    console.log('       GET http://localhost:8000/api/billing/providers  ->  200 OK');
    console.log('       GET http://localhost:8000/api/billing/payments  ->  200 OK');
    console.log('');
  } else {
    console.log('\x1b[1m\x1b[33m⚠️  Aucune correction appliquee.\x1b[0m');
    console.log('   Verifie manuellement les fichiers :');
    for (const t of targets) {
      console.log(`   - ${t}`);
    }
    console.log('');
  }

  console.log('\x1b[36mBackups : ' + BACKUP_DIR + '\x1b[0m\n');
}

main();