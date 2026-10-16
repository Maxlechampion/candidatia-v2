#!/usr/bin/env node
/**
 * fix-word-cv-langues.js
 * Corrige : TypeError: sequence item 0: expected str instance, dict found
 *
 * 1. word_cv.py       : helper safe_join qui tolere list[str] et list[dict]
 * 2. cv_prompt.py     : prompt explicite pour langues et centres_interet
 *
 * Usage : node scripts/fix-word-cv-langues.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP_DIR = path.join(ROOT, '.backups', 'fix-langues-' + Date.now());

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

const log = {
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

// ============================================================
// 1. word_cv.py — remplacer les 2 join() par un helper safe
// ============================================================

function fixWordCv() {
  log.title('1. word_cv.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_cv.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }

  if (content.includes('def _safe_join_items')) {
    log.skip('word_cv.py deja corrige');
    return;
  }

  // 1.1 Ajouter le helper avant la classe (ou avant _ajouter_filigrane)
  const helperCode = [
    '',
    'def _safe_join_items(items, sep=", "):',
    '    """',
    '    Joint une liste dont les elements peuvent etre :',
    '      - des strings : "Francais"',
    '      - des dicts  : {"langue": "Francais", "niveau": "Natif"}',
    '      - des dicts generiques : {"nom": "X", "niveau": "Y"}',
    '    Retourne toujours une string jointe par sep.',
    '    """',
    '    if not items:',
    '        return ""',
    '    parts = []',
    '    for item in items:',
    '        if isinstance(item, str):',
    '            parts.append(item)',
    '        elif isinstance(item, dict):',
    '            # Essayer plusieurs cles usuelles',
    '            name = (',
    '                item.get("langue")',
    '                or item.get("nom")',
    '                or item.get("name")',
    '                or item.get("label")',
    '                or ""',
    '            )',
    '            level = item.get("niveau") or item.get("level") or ""',
    '            if name and level:',
    '                parts.append(f"{name} ({level})")',
    '            elif name:',
    '                parts.append(str(name))',
    '            else:',
    '                parts.append(str(item))',
    '        else:',
    '            parts.append(str(item))',
    '    return sep.join(parts)',
    '',
    '',
  ].join('\n');

  // Inserer avant la fonction _ajouter_filigrane ou avant la classe
  if (content.includes('def _ajouter_filigrane')) {
    content = content.replace(
      /(def _ajouter_filigrane\(doc\):)/,
      helperCode + '$1'
    );
  } else {
    content = content.replace(
      /(class WordCVGenerator\(DocumentGenerator\):)/,
      helperCode + '$1'
    );
  }

  // 1.2 Remplacer les 2 join()
  content = content.replace(
    /p\.add_run\(", "\.join\(langues\)\)\.font\.size = Pt\(9\)/,
    'p.add_run(_safe_join_items(langues)).font.size = Pt(9)'
  );
  content = content.replace(
    /p\.add_run\(", "\.join\(centres\)\)\.font\.size = Pt\(9\)/,
    'p.add_run(_safe_join_items(centres)).font.size = Pt(9)'
  );

  // 1.3 Patch de securite : aussi pour competences (au cas ou)
  content = content.replace(
    /p\.add_run\(", "\.join\(tech_skills\)\)/,
    'p.add_run(_safe_join_items(tech_skills))'
  );
  content = content.replace(
    /p\.add_run\(", "\.join\(hum_skills\)\)/,
    'p.add_run(_safe_join_items(hum_skills))'
  );
  content = content.replace(
    /p\.add_run\(", "\.join\(actions\)\)/,
    'p.add_run(_safe_join_items(actions))'
  );
  content = content.replace(
    /p\.add_run\(", "\.join\(technos\)\)/,
    'p.add_run(_safe_join_items(technos))'
  );

  writeFile(filePath, content);
  log.ok('word_cv.py : helper _safe_join_items + 6 remplacements');
}

// ============================================================
// 2. cv_prompt.py — format explicite pour langues et centres
// ============================================================

function fixCvPrompt() {
  log.title('2. cv_prompt.py');

  const filePath = path.join(BACKEND, 'app', 'services', 'ai', 'prompts', 'cv_prompt.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }

  if (content.includes('FORMAT STRICT')) {
    log.skip('cv_prompt.py deja corrige');
    return;
  }

  // Ajouter une note claire sur le format des langues
  const addendum = [
    '',
    'REGLES DE FORMAT STRICTES (IMPORTANT) :',
    '- "langues" : tableau de STRINGS simples. Exemple : ["Francais (Natif)", "Anglais (C1)"]',
    '  NE PAS utiliser de dicts, uniquement des strings.',
    '- "centres_interet" : tableau de STRINGS simples. Exemple : ["Lecture", "Course"]',
    '- "competences_techniques" : tableau de STRINGS simples.',
    '- "competences_humaines" : tableau de STRINGS simples.',
    '- "actions_menees" : tableau de STRINGS simples.',
    '- "technologies" (dans projets) : tableau de STRINGS simples.',
    '',
  ].join('\n');

  // Inserer avant la ligne "Genere un objet JSON strict"
  content = content.replace(
    /(Genere un objet JSON strict avec cette structure :)/,
    addendum + '$1'
  );

  writeFile(filePath, content);
  log.ok('cv_prompt.py : format strict pour langues/centres/competences');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  Fix word_cv : langues/centres en dict');
  console.log('=====================================================\n');
  console.log('Backups : ' + BACKUP_DIR + '\n');

  const tasks = [
    ['word_cv.py', fixWordCv],
    ['cv_prompt.py', fixCvPrompt],
  ];

  for (const t of tasks) {
    try { t[1](); }
    catch (e) { log.err(t[0] + ' : ' + e.message); }
  }

  console.log('\n--- ETAPES SUIVANTES ---');
  console.log('  1. Import (doit afficher OK) :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       python -c "from app.services.generation.word_cv import _safe_join_items; print(_safe_join_items([{\'langue\': \'FR\', \'niveau\': \'Natif\'}, \'Anglais\']))"');
  console.log('     Attendu : Francais (Natif), Anglais (ou similaire)');
  console.log('');
  console.log('  2. Relance un pack dans /fr/dashboard/generate');
  console.log('');
}

main();