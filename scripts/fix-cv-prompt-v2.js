#!/usr/bin/env node
/**
 * fix-cv-prompt-v2.js
 * Ajoute une note de FORMAT STRICT dans cv_prompt.py
 * sans casser la concatenation de strings.
 *
 * Usage : node scripts/fix-cv-prompt-v2.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(
  ROOT, 'backend', 'app', 'services', 'ai', 'prompts', 'cv_prompt.py'
);
const BACKUP = path.join(ROOT, '.backups', 'fix-cv-prompt-v2-' + Date.now());
fs.mkdirSync(BACKUP, { recursive: true });

if (!fs.existsSync(FILE)) {
  console.error('[ERR] Fichier introuvable : ' + FILE);
  process.exit(1);
}

fs.copyFileSync(FILE, path.join(BACKUP, 'cv_prompt.py'));

const content = fs.readFileSync(FILE, 'utf8');

if (content.includes('FORMAT STRICT POUR LES LISTES')) {
  console.log('[SKIP] cv_prompt.py deja corrige');
  process.exit(0);
}

// Ligne cible : la ligne exacte qui contient "REGLES DE REDACTION"
const target = '        "REGLES DE REDACTION :\\n"';

if (!content.includes(target)) {
  console.error('[ERR] Ancre "REGLES DE REDACTION" introuvable');
  console.error('Contenu recherche : ' + JSON.stringify(target));
  process.exit(2);
}

// Nouvelles lignes a inserer AVANT la cible (memes indentation 8 espaces)
const insertBefore = [
  '        "FORMAT STRICT POUR LES LISTES :\\n"',
  '        "Les champs suivants sont des tableaux de STRINGS simples "',
  '        "(JAMAIS de dicts) :\\n"',
  '        "  - langues : [\\"Francais (Natif)\\", \\"Anglais (C1)\\", \\"Wolof (Courant)\\" ]\\n"',
  '        "  - centres_interet : [\\"Lecture\\", \\"Course a pied\\"]\\n"',
  '        "  - competences_techniques : [\\"Python\\", \\"FastAPI\\"]\\n"',
  '        "  - competences_humaines : [\\"Autonomie\\", \\"Esprit d equipe\\"]\\n"',
  '        "  - actions_menees : [\\"Migration Kubernetes\\", \\"Mise en place CI/CD\\"]\\n"',
  '        "  - technologies (projets) : [\\"Python\\", \\"PostgreSQL\\"]\\n"',
  '        "\\n"',
].join('\n');

const newContent = content.replace(target, insertBefore + '\n' + target);

if (newContent === content) {
  console.error('[ERR] Remplacement inoperant');
  process.exit(3);
}

fs.writeFileSync(FILE, newContent, 'utf8');
console.log('[ OK ] cv_prompt.py : note FORMAT STRICT ajoutee');
console.log('Backup : ' + BACKUP);