#!/usr/bin/env node
/**
 * pricing-v2-phase2.js — CandidatIA
 * PRICING-v2 Phase 2 : filigrane + propagation + historique
 *
 * Usage : node scripts/pricing-v2-phase2.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const BACKUP_DIR = path.join(ROOT, '.backups', 'pricing-v2-p2-' + Date.now());

const log = {
  info: (m) => console.log('[INFO] ' + m),
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

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

// ============================================================
// HELPER : insert filigrane de maniere safe (par lignes)
// ============================================================

function injectWatermarkToDocxFile(absPath, className) {
  const content = readFile(absPath);
  if (!content) { log.err('introuvable : ' + absPath); return false; }

  if (content.includes('def _ajouter_filigrane')) {
    log.skip(path.basename(absPath) + ' : filigrane deja present');
    return true;
  }

  // Split en lignes en preservant les fins de ligne
  const lines = content.split('\n');

  // 1. Trouver l'index de la classe
  const classIdx = lines.findIndex((l) => l.startsWith('class ' + className));
  if (classIdx === -1) {
    log.err(path.basename(absPath) + ' : classe ' + className + ' introuvable');
    return false;
  }

  // 2. Inserer la fonction helper AVANT la classe (avec 2 lignes vides)
  const helperLines = [
    'def _ajouter_filigrane(doc):',
    '    """Ajoute un filigrane discret en pied de document."""',
    '    from docx.shared import Pt, RGBColor',
    '    from docx.enum.text import WD_ALIGN_PARAGRAPH',
    '',
    '    p = doc.add_paragraph()',
    '    p.alignment = WD_ALIGN_PARAGRAPH.CENTER',
    '    p.paragraph_format.space_before = Pt(24)',
    '    run = p.add_run("Genere gratuitement avec CandidatIA - candidatia.com")',
    '    run.italic = True',
    '    run.font.size = Pt(8)',
    '    run.font.color.rgb = RGBColor(160, 160, 160)',
    '',
    '',
  ];

  // 3. Trouver la derniere ligne "        return doc" (12 espaces) DANS la classe
  //    (la 1ere occurrence apres classIdx)
  let returnIdx = -1;
  for (let i = lines.length - 1; i > classIdx; i--) {
    if (lines[i] === '        return doc') {
      returnIdx = i;
      break;
    }
  }

  if (returnIdx === -1) {
    log.err(path.basename(absPath) + ' : "        return doc" introuvable');
    return false;
  }

  // 4. Construire le nouveau contenu
  const before = lines.slice(0, classIdx);
  const classBody = lines.slice(classIdx, returnIdx);
  const after = lines.slice(returnIdx);

  const watermarkBlock = [
    '        # Filigrane pour les utilisateurs gratuits',
    '        if locale.get("apply_watermark", False):',
    '            _ajouter_filigrane(doc)',
    '',
  ];

  const newLines = [
    ...before,
    ...helperLines,
    ...classBody,
    ...watermarkBlock,
    ...after,
  ];

  writeFile(absPath, newLines.join('\n'));
  log.ok(path.basename(absPath) + ' : filigrane injecte');
  return true;
}

// ============================================================
// 1. word_cv.py
// ============================================================

function fixWordCv() {
  log.title('1. backend/word_cv.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_cv.py');
  injectWatermarkToDocxFile(filePath, 'WordCVGenerator');
}

// ============================================================
// 2. word_guide.py
// ============================================================

function fixWordGuide() {
  log.title('2. backend/word_guide.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'generation', 'word_guide.py');
  injectWatermarkToDocxFile(filePath, 'WordGuideGenerator');
}

// ============================================================
// 3. generation.py — propagation apply_watermark + save DB
// ============================================================

function fixGenerationRouter() {
  log.title('3. backend/generation.py');
  const filePath = path.join(BACKEND, 'app', 'routers', 'generation.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }

  if (content.includes('apply_watermark') && content.includes('_save_generation')) {
    log.skip('generation.py deja a jour');
    return;
  }

  // 3.1 Import insert_row
  if (!content.includes('from app.core.database import insert_row')) {
    content = content.replace(
      /(from app\.services\.language\.locale_map import get_locale_conventions)/,
      '$1\nfrom app.core.database import insert_row'
    );
  }

  // 3.2 Ajouter la fonction _save_generation avant le decorateur @router.post
  if (!content.includes('def _save_generation')) {
    const saveFn = [
      '',
      'def _save_generation(',
      '    user_id: str,',
      '    cv_data: Dict[str, Any],',
      '    locale: Dict[str, Any],',
      '    result: Dict[str, Any],',
      ') -> None:',
      '    """Sauvegarde la generation en DB pour l historique."""',
      '    try:',
      '        score = cv_data.get("analyse", {}).get("score_matching", 0)',
      '        insert_row("generations", {',
      '            "user_id": user_id,',
      '            "input_profile_hash": "n/a",',
      '            "input_offer_hash": "n/a",',
      '            "output_language": locale.get("language_code", "fr"),',
      '            "score_matching": int(score) if score else None,',
      '            "cv_path": result.get("cv_path"),',
      '            "lettre_path": result.get("lettre_path"),',
      '            "guide_path": result.get("guide_path"),',
      '            "zip_path": result.get("zip_path"),',
      '            "credits_consumed": 1,',
      '            "status": "completed",',
      '        })',
      '        logger.info("generation_saved", user_id=user_id)',
      '    except Exception as e:',
      '        logger.warning("generation_save_failed", user_id=user_id, error=str(e))',
      '',
      '',
    ].join('\n');

    // Trouver la ligne du decorateur @router.post("/generate"...
    const lines = content.split('\n');
    const idx = lines.findIndex((l) => l.includes('@router.post("/generate"'));
    if (idx === -1) {
      log.err('@router.post("/generate") introuvable');
      return;
    }
    lines.splice(idx, 0, saveFn);
    content = lines.join('\n');
  }

  // 3.3 Propagation apply_watermark apres locale = get_locale_conventions(...)
  if (!content.includes('apply_watermark')) {
    content = content.replace(
      /(locale\s*=\s*get_locale_conventions\(output_language\))/,
      [
        '$1',
        '    # Propagation du flag free tier pour le filigrane',
        '    is_free = bool(user.get("is_free_tier", user.get("plan", "free") == "free"))',
        '    locale["apply_watermark"] = is_free',
      ].join('\n')
    );
  }

  // 3.4 Appel _save_generation AVANT le logger.info("generate_success"...)
  if (!content.includes('_save_generation(user_id')) {
    content = content.replace(
      /(\n\s+)(logger\.info\("generate_success", user_id=user_id, zip_path=zip_path\))/,
      [
        '$1# Sauvegarde dans l historique',
        '$1try:',
        '$1    _save_generation(user_id, cv_data, locale, result)',
        '$1except Exception as _e:',
        '$1    logger.warning("save_generation_wrapper_failed", error=str(_e))',
        '$1',
        '$1$2',
      ].join('\n')
    );
  }

  writeFile(filePath, content);
  log.ok('generation.py : apply_watermark + _save_generation');
}

// ============================================================
// 4. payment/orchestrator.py — mark_paid_tier apres achat
// ============================================================

function fixPaymentOrchestrator() {
  log.title('4. backend/payment/orchestrator.py');
  const filePath = path.join(BACKEND, 'app', 'services', 'payment', 'orchestrator.py');
  let content = readFile(filePath);

  if (!content) { log.err('introuvable'); return; }

  if (content.includes('mark_paid_tier')) {
    log.skip('orchestrator deja a jour');
    return;
  }

  // 4.1 Import mark_paid_tier
  content = content.replace(
    /(from app\.services\.auth\.user_service import add_credits)/,
    '$1, mark_paid_tier'
  );

  // 4.2 Apres chaque add_credits (2 emplacements), inserer mark_paid_tier
  //     Astuce : chercher add_credits( et ajouter juste apres le logger.info suivant
  //     plus safe : utilisation d'un remplacement sur un motif precis

  // Emplacement 1 : webhook — add_credits(user_id, credits)
  content = content.replace(
    /(if credits > 0:\s*\n\s+add_credits\(user_id, credits\)\n\s+logger\.info\([\s\S]*?\)\n)/,
    (match) => {
      return match + [
        '                    try:',
        '                        mark_paid_tier(user_id)',
        '                    except Exception as _e:',
        '                        logger.warning("mark_paid_tier_failed", error=str(_e))',
        '',
      ].join('\n');
    }
  );

  // Emplacement 2 : verify — add_credits(payment["user_id"], credits)
  content = content.replace(
    /(if credits > 0:\s*\n\s+add_credits\(payment\["user_id"\], credits\)\n\s+logger\.info\([\s\S]*?\)\n)/,
    (match) => {
      return match + [
        '                try:',
        '                    mark_paid_tier(payment["user_id"])',
        '                except Exception as _e:',
        '                    logger.warning("mark_paid_tier_failed", error=str(_e))',
        '',
      ].join('\n');
    }
  );

  writeFile(filePath, content);
  log.ok('orchestrator.py : mark_paid_tier apres achat');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  PRICING-v2 PHASE 2 : filigrane + propagation');
  console.log('=====================================================\n');
  console.log('Backups : ' + BACKUP_DIR + '\n');

  const tasks = [
    ['word_cv.py', fixWordCv],
    ['word_guide.py', fixWordGuide],
    ['generation.py', fixGenerationRouter],
    ['payment/orchestrator.py', fixPaymentOrchestrator],
  ];

  const results = [];
  for (const t of tasks) {
    try {
      t[1]();
      results.push({ name: t[0], ok: true });
    } catch (e) {
      log.err(t[0] + ' : ' + e.message);
      results.push({ name: t[0], ok: false, error: e.message });
    }
  }

  console.log('\n--- RESUME ---');
  for (const r of results) {
    console.log('  ' + (r.ok ? '[OK]' : '[!!]') + ' ' + r.name + (r.error ? ' -- ' + r.error : ''));
  }

  console.log('\n--- ETAPES SUIVANTES ---');
  console.log('  1. Verifier import (CRITIQUE) :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       python -c "from app.main import app; print(\'IMPORT OK\')"');
  console.log('');
  console.log('  2. Verifier la presence du filigrane :');
  console.log('       python -c "from app.services.generation.word_cv import _ajouter_filigrane; print(\'FILIGRANE OK\')"');
  console.log('       python -c "from app.services.generation.word_guide import _ajouter_filigrane; print(\'FILIGRANE GUIDE OK\')"');
  console.log('');
  console.log('  3. Tests existants (regression) :');
  console.log('       pytest tests/test_word_cv.py tests/test_word_guide.py -v');
  console.log('');
  console.log('  4. Si tout est OK, lance : node scripts/pricing-v2-phase3.js');
  console.log('');
}

main();