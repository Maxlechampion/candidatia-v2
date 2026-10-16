#!/usr/bin/env node
/**
 * fix-watermark-diagonal.js
 * Remplace le filigrane bas-de-page par un filigrane diagonal
 * occupant ~50% de la page (technique VML Word).
 *
 * Fichiers modifies :
 *   - backend/app/services/generation/style.py  (+ helper)
 *   - backend/app/services/generation/word_cv.py (utilise le nouveau helper)
 *   - backend/app/services/generation/word_guide.py (idem)
 *
 * Usage : node scripts/fix-watermark-diagonal.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP = path.join(ROOT, '.backups', 'fix-watermark-' + Date.now());

const log = {
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function backupFile(p) {
  if (!fs.existsSync(p)) return;
  ensureDir(BACKUP);
  const rel = path.relative(ROOT, p);
  const bkp = path.join(BACKUP, rel);
  ensureDir(path.dirname(bkp));
  fs.copyFileSync(p, bkp);
}
function writeFile(p, content) { backupFile(p); ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }

// ============================================================
// 1. style.py — ajout du helper ajouter_filigrane_diagonal()
// ============================================================

function addHelperToStyle() {
  log.title('1. style.py - helper filigrane diagonal');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'style.py');
  let content = readFile(filePath);

  if (!content) { log.err('style.py introuvable'); return; }

  if (content.includes('def ajouter_filigrane_diagonal')) {
    log.skip('style.py contient deja le helper');
    return;
  }

  const helperCode = [
    '',
    '',
    '# ============================================================',
    '# FILIGRANE DIAGONAL (technique VML Word)',
    '# ============================================================',
    '',
    '',
    'def ajouter_filigrane_diagonal(doc, texte, taille_pt=60, opacite="0.15"):',
    '    """',
    '    Ajoute un filigrane diagonal en arriere-plan (occupe ~50% de la page).',
    '',
    '    Utilise VML (Vector Markup Language) - technique officielle de Word.',
    '    Le filigrane est insere dans le header pour apparaitre sur toutes les pages.',
    '',
    '    Args:',
    '        doc : document python-docx',
    '        texte : texte du filigrane',
    '        taille_pt : taille de police en points (60 par defaut)',
    '        opacite : opacite 0.0-1.0 (0.15 = tres discret)',
    '    """',
    '    from docx.oxml import OxmlElement',
    '    from docx.oxml.ns import qn',
    '    from lxml import etree',
    '',
    '    # 1. Recuperer le header de la premiere section',
    '    section = doc.sections[0]',
    '    header = section.header',
    '',
    '    # 2. Ajouter un paragraphe vide dans le header (obligatoire)',
    '    p = header.paragraphs[0] if header.paragraphs else header.add_paragraph()',
    '',
    '    # 3. Construire le XML du filigrane VML',
    '    #    Les namespaces VML necessaires',
    '    nsmap = {',
    '        "v": "urn:schemas-microsoft-com:vml",',
    '        "o": "urn:schemas-microsoft-com:office:office",',
    '        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",',
    '    }',
    '',
    '    vml_xml = (',
    '        \'<w:pict xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" \'',
    '        \'xmlns:v="urn:schemas-microsoft-com:vml" \'',
    '        \'xmlns:o="urn:schemas-microsoft-com:office:office">\'',
    '        \'<v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" \'',
    '        \'adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">\'',
    '        \'<v:formulas>\'',
    '        \'<v:f eqn="sum #0 0 10800"/>\'',
    '        \'<v:f eqn="prod #0 2 1"/>\'',
    '        \'<v:f eqn="sum 21600 0 @1"/>\'',
    '        \'<v:f eqn="sum 0 0 @2"/>\'',
    '        \'<v:f eqn="sum 21600 0 @3"/>\'',
    '        \'<v:f eqn="if @0 @3 0"/>\'',
    '        \'<v:f eqn="if @0 21600 @1"/>\'',
    '        \'<v:f eqn="if @0 0 @2"/>\'',
    '        \'<v:f eqn="if @0 @4 21600"/>\'',
    '        \'<v:f eqn="mid @5 @6"/>\'',
    '        \'<v:f eqn="mid @8 @5"/>\'',
    '        \'<v:f eqn="mid @7 @8"/>\'',
    '        \'<v:f eqn="mid @6 @7"/>\'',
    '        \'<v:f eqn="sum @6 0 @5"/>\'',
    '        \'</v:formulas>\'',
    '        \'<v:path textpathok="t" o:connecttype="custom" \'',
    '        \'o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" \'',
    '        \'o:connectangles="270,180,90,0"/>\'',
    '        \'<v:textpath on="t" fitshape="t"/>\'',
    '        \'<v:handles>\'',
    '        \'<v:h position="#0,bottomRight" xrange="6629,14971"/>\'',
    '        \'</v:handles>\'',
    '        \'</v:shapetype>\'',
    '        f\'<v:shape id="PowerPlusWaterMarkObject" o:spid="_x0000_s2049" \'',
    '        f\'type="#_x0000_t136" \'',
    '        f\'style="position:absolute;margin-left:0;margin-top:0;width:500pt;height:110pt; \'',
    '        f\'rotation:315;z-index:-251658752;mso-position-horizontal:center; \'',
    '        f\'mso-position-horizontal-relative:margin;mso-position-vertical:center; \'',
    '        f\'mso-position-vertical-relative:margin" \'',
    '        f\'o:allowincell="f" fillcolor="#d1d1d1" stroked="f">\'',
    '        f\'<v:fill opacity="{opacite}"/>\'',
    '        f\'<v:textpath style="font-family:&quot;Calibri&quot;;font-size:{taille_pt}pt" \'',
    '        f\'string="{texte}"/>\'',
    '        \'</v:shape>\'',
    '        \'</w:pict>\'',
    '    )',
    '',
    '    # 4. Parser et inserer le XML dans le paragraphe du header',
    '    pict = etree.fromstring(vml_xml)',
    '    p._p.append(pict)',
    '',
  ].join('\n');

  // Ajouter le helper a la fin du fichier style.py
  content = content + helperCode;

  writeFile(filePath, content);
  log.ok('style.py : +ajouter_filigrane_diagonal()');
}

// ============================================================
// 2. word_cv.py — remplacer le filigrane bas-de-page par le diagonal
// ============================================================

function fixWordCv() {
  log.title('2. word_cv.py - utilise le filigrane diagonal');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_cv.py');
  let content = readFile(filePath);

  if (!content) { log.err('word_cv.py introuvable'); return; }

  if (content.includes('ajouter_filigrane_diagonal')) {
    log.skip('word_cv.py deja mis a jour');
    return;
  }

  // 2.1 Ajouter l'import (au bloc des imports de style)
  content = content.replace(
    /(from app\.services\.generation\.style import \()/,
    '$1\n    ajouter_filigrane_diagonal,'
  );

  // 2.2 Remplacer l'appel _ajouter_filigrane(doc) par ajouter_filigrane_diagonal(doc, ...)
  content = content.replace(
    /(        # Filigrane pour les utilisateurs gratuits\s*\n\s+if locale\.get\("apply_watermark", False\):\s*\n\s+)_ajouter_filigrane\(doc\)/,
    '$1ajouter_filigrane_diagonal(doc, "CandidatIA - Genere gratuitement - candidatia.com", taille_pt=60, opacite="0.15")'
  );

  // 2.3 Supprimer l'ancienne fonction _ajouter_filigrane (bas de page)
  //     On la garde si jamais elle est referencee ailleurs, mais on la neutralise
  if (content.includes('def _ajouter_filigrane(doc):')) {
    // Retirer la fonction (regex safe : du def jusqu'a la ligne blanche suivante)
    content = content.replace(
      /\ndef _ajouter_filigrane\(doc\):\n(?:[^\n]*\n)*?(?=\n\nclass |\n\ndef |\nclass )/,
      '\n'
    );
  }

  writeFile(filePath, content);
  log.ok('word_cv.py : filigrane diagonal active');
}

// ============================================================
// 3. word_guide.py — idem
// ============================================================

function fixWordGuide() {
  log.title('3. word_guide.py - utilise le filigrane diagonal');

  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_guide.py');
  let content = readFile(filePath);

  if (!content) { log.err('word_guide.py introuvable'); return; }

  if (content.includes('ajouter_filigrane_diagonal')) {
    log.skip('word_guide.py deja mis a jour');
    return;
  }

  content = content.replace(
    /(from app\.services\.generation\.style import \()/,
    '$1\n    ajouter_filigrane_diagonal,'
  );

  content = content.replace(
    /(        # Filigrane pour les utilisateurs gratuits\s*\n\s+if locale\.get\("apply_watermark", False\):\s*\n\s+)_ajouter_filigrane\(doc\)/,
    '$1ajouter_filigrane_diagonal(doc, "CandidatIA - Genere gratuitement - candidatia.com", taille_pt=60, opacite="0.15")'
  );

  if (content.includes('def _ajouter_filigrane(doc):')) {
    content = content.replace(
      /\ndef _ajouter_filigrane\(doc\):\n(?:[^\n]*\n)*?(?=\n\nclass |\n\ndef |\nclass )/,
      '\n'
    );
  }

  writeFile(filePath, content);
  log.ok('word_guide.py : filigrane diagonal active');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  Filigrane diagonal (Word VML)');
  console.log('=====================================================\n');
  console.log('Backup : ' + BACKUP + '\n');

  const tasks = [
    ['style.py', addHelperToStyle],
    ['word_cv.py', fixWordCv],
    ['word_guide.py', fixWordGuide],
  ];

  for (const t of tasks) {
    try { t[1](); }
    catch (e) { log.err(t[0] + ' : ' + e.message); }
  }

  console.log('\n--- ETAPES SUIVANTES ---');
  console.log('  1. Import :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       python -c "from app.main import app; print(\'IMPORT OK\')"');
  console.log('');
  console.log('  2. Generer un pack sur /fr/dashboard/generate');
  console.log('     -> ouvrir le CV.docx dans Word/LibreOffice');
  console.log('     -> verifier le filigrane diagonal en arriere-plan');
  console.log('');
}

main();