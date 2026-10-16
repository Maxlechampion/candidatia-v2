#!/usr/bin/env node
/**
 * fix-cv-prompt-safe.js
 * Ajoute une note de format STRICT dans cv_prompt.py
 * SANS casser les triple-quotes.
 *
 * Usage : node scripts/fix-cv-prompt-safe.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(
  ROOT, 'backend', 'app', 'services', 'ai', 'prompts', 'cv_prompt.py'
);
const BACKUP = path.join(ROOT, '.backups', 'fix-cv-prompt-' + Date.now());
fs.mkdirSync(BACKUP, { recursive: true });

if (!fs.existsSync(FILE)) {
  console.error('[ERR] Fichier introuvable : ' + FILE);
  process.exit(1);
}

fs.copyFileSync(FILE, path.join(BACKUP, 'cv_prompt.py'));

const content = fs.readFileSync(FILE, 'utf8');

// Guard idempotent : si deja fait, skip
if (content.includes('FORMAT STRICT')) {
  console.log('[SKIP] cv_prompt.py deja corrige');
  process.exit(0);
}

// Rechercher les lignes cles qui existent dans le prompt JSON et y ajouter
// une note entre parentheses dans la MEME string.
// On cible les lignes avec "langues" et "centres_interet" dans la description JSON.

let modified = content;

// 1. Enrichir la ligne '  "langues": [],' du prompt JSON
//    en ajoutant un commentaire implicite (dans la string)
//    On utilise un remplacement qui reste DANS la string existante.
modified = modified.replace(
  /(\s*)'  "langues": \[\],'/,
  "$1'  \"langues\": [\"Francais (Natif)\", \"Anglais (C1)\"],',  # format: strings uniquement"
);

// 2. Meme logique pour centres_interet
modified = modified.replace(
  /(\s*)'  "centres_interet": \[\]'/,
  "$1'  \"centres_interet\": [\"Lecture\", \"Course\"]',  # format: strings uniquement"
);

// 3. Si aucune des deux lignes n'a ete trouvee, on ajoute une ligne APRES le bloc
//    "5. experiences (methode STAR)" qui est unique
if (modified === content) {
  console.log('[INFO] Patterns JSON non trouves, utilisation alternative...');
  // Injection apres la ligne "5. experiences (methode STAR) :" (bloc texte simple, pas de triple-quote)
  const target = "'5. experiences (methode STAR) :',";
  if (content.includes(target)) {
    modified = content.replace(
      target,
      [
        target,
        "        '- FORMAT STRICT pour langues/centres_interet/competences :',",
        "        '  utiliser des STRINGS simples, PAS de dicts.',",
      ].join('\n')
    );
  }
}

if (modified === content) {
  console.error('[ERR] Aucune modification appliquee. Verifie manuellement cv_prompt.py');
  console.error('Backup : ' + BACKUP);
  process.exit(2);
}

fs.writeFileSync(FILE, modified, 'utf8');
console.log('[ OK ] cv_prompt.py corrige');
console.log('Backup : ' + BACKUP);