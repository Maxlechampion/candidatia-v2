#!/usr/bin/env node
/**
 * setup-phase2b.js — CandidatIA
 * Phase 2b : Services de langue
 *
 * Crée :
 *   - backend/app/services/language/detector.py
 *   - backend/app/services/language/locale_map.py
 *   - backend/app/services/language/__init__.py (mis a jour)
 *
 * Usage : node setup-phase2b.js
 * Prérequis : avoir exécuté setup-phase2a.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ============================================================
// UTILITAIRES
// ============================================================

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, lines.join('\n') + '\n', 'utf-8');
  console.log('  OK  ' + relPath);
}

function logHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
  console.log('');
}

function logStep(step) {
  console.log('');
  console.log('> ' + step);
}

// ============================================================
// VÉRIFICATIONS
// ============================================================

logHeader('CandidatIA — Setup Phase 2b : Services de langue');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'ingestion', 'service.py'))) {
  console.error('');
  console.error('  ERREUR : Les services d ingestion sont introuvables.');
  console.error('  Execute d abord setup-phase2a.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. DETECTOR DE LANGUE
// ============================================================

logStep('1. detector.py (detection langue via langdetect)');

writeLines('backend/app/services/language/detector.py', [
  '"""Detection de la langue source d un texte (langdetect)."""',
  '',
  'from app.core.logging import get_logger',
  '',
  'logger = get_logger("language.detector")',
  '',
  '',
  'SUPPORTED_LANGUAGES = {',
  '    "fr": "Francais",',
  '    "en": "English",',
  '    "es": "Espanol",',
  '    "pt": "Portugues",',
  '    "de": "Deutsch",',
  '    "it": "Italiano",',
  '    "nl": "Nederlands",',
  '    "ar": "Arabic",',
  '    "zh-cn": "Chinese (Simplified)",',
  '    "ja": "Japanese",',
  '    "ko": "Korean",',
  '    "ru": "Russian",',
  '    "tr": "Turkish",',
  '    "hi": "Hindi",',
  '    "wo": "Wolof",',
  '    "sw": "Swahili",',
  '}',
  '',
  '',
  'def detect_language(text: str, default: str = "en") -> str:',
  '    """',
  '    Detecte la langue d un texte. Retourne un code ISO 639-1.',
  '',
  '    Si la langue detectee n est pas dans SUPPORTED_LANGUAGES,',
  '    retourne la langue par defaut (anglais).',
  '    """',
  '    if not text or len(text.strip()) < 20:',
  '        return default',
  '',
  '    try:',
  '        from langdetect import detect, DetectorFactory',
  '        DetectorFactory.seed = 0  # Resultats deterministes',
  '',
  '        code = detect(text)',
  '        code = code.lower()',
  '',
  '        # Normalisation du chinois (zh, zh-cn, zh-tw -> zh-cn)',
  '        if code in ("zh", "zh-cn", "zh-tw"):',
  '            return "zh-cn"',
  '',
  '        # Si la langue est supportee, on la retourne',
  '        if code in SUPPORTED_LANGUAGES:',
  '            return code',
  '',
  '        # Sinon fallback sur la langue par defaut',
  '        logger.info("language_unsupported_fallback", detected=code, fallback=default)',
  '        return default',
  '',
  '    except Exception as e:',
  '        logger.warning("language_detection_failed", error=str(e))',
  '        return default',
  '',
  '',
  'def get_language_name(code: str) -> str:',
  '    """Retourne le nom lisible d une langue a partir de son code."""',
  '    return SUPPORTED_LANGUAGES.get(code.lower(), code.upper())',
  '',
  '',
  'def is_supported(code: str) -> bool:',
  '    """Verifie si une langue est supportee."""',
  '    return code.lower() in SUPPORTED_LANGUAGES',
]);

// ============================================================
// 2. LOCALE MAP
// ============================================================

logStep('2. locale_map.py (conventions culturelles)');

writeLines('backend/app/services/language/locale_map.py', [
  '"""',
  'Mapping langue -> conventions culturelles du marche cible.',
  '',
  'Determine comment un CV / une lettre doit etre formate selon',
  'le pays ou la culture cible.',
  '"""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'LOCALE_CONVENTIONS: Dict[str, Dict[str, Any]] = {',
  '    "fr": {',
  '        "country": "FR",',
  '        "language_name": "Francais",',
  '        "cv_max_pages": 1,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "epistolaire_traditionnel",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "en": {',
  '        "country": "US",',
  '        "language_name": "English",',
  '        "cv_max_pages": 1,',
  '        "cv_include_photo": False,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "cover_letter_american",',
  '        "letter_max_words": 350,',
  '        "date_format": "MM/DD/YYYY",',
  '        "tone": "direct_professionnel",',
  '    },',
  '    "es": {',
  '        "country": "ES",',
  '        "language_name": "Espanol",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "carta_presentacion",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "pt": {',
  '        "country": "PT",',
  '        "language_name": "Portugues",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "carta_apresentacao",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "de": {',
  '        "country": "DE",',
  '        "language_name": "Deutsch",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "anschreiben_formel",',
  '        "letter_max_words": 450,',
  '        "date_format": "DD.MM.YYYY",',
  '        "tone": "tres_formel",',
  '    },',
  '    "it": {',
  '        "country": "IT",',
  '        "language_name": "Italiano",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "lettera_presentazione",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "nl": {',
  '        "country": "NL",',
  '        "language_name": "Nederlands",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": False,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "sollicitatiebrief",',
  '        "letter_max_words": 350,',
  '        "date_format": "DD-MM-YYYY",',
  '        "tone": "direct_professionnel",',
  '    },',
  '    "ar": {',
  '        "country": "AE",',
  '        "language_name": "Arabic",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": True,',
  '        "letter_format": "cover_letter_bilingue",',
  '        "letter_max_words": 350,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel_respectueux",',
  '    },',
  '    "zh-cn": {',
  '        "country": "CN",',
  '        "language_name": "Chinese (Simplified)",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": True,',
  '        "letter_format": "cover_letter_asiatique",',
  '        "letter_max_words": 300,',
  '        "date_format": "YYYY-MM-DD",',
  '        "tone": "humble_respectueux",',
  '    },',
  '    "ja": {',
  '        "country": "JP",',
  '        "language_name": "Japanese",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "rirekisho_shokumu",',
  '        "letter_max_words": 300,',
  '        "date_format": "YYYY-MM-DD",',
  '        "tone": "tres_formel_respectueux",',
  '    },',
  '    "ko": {',
  '        "country": "KR",',
  '        "language_name": "Korean",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "jagisoseo",',
  '        "letter_max_words": 350,',
  '        "date_format": "YYYY-MM-DD",',
  '        "tone": "formel_respectueux",',
  '    },',
  '    "ru": {',
  '        "country": "RU",',
  '        "language_name": "Russian",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "soprovoditelnoe_pismo",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD.MM.YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "tr": {',
  '        "country": "TR",',
  '        "language_name": "Turkish",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "ozel_letter",',
  '        "letter_max_words": 400,',
  '        "date_format": "DD.MM.YYYY",',
  '        "tone": "formel",',
  '    },',
  '    "hi": {',
  '        "country": "IN",',
  '        "language_name": "Hindi",',
  '        "cv_max_pages": 2,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": True,',
  '        "cv_include_marital_status": True,',
  '        "letter_format": "cover_letter_indien",',
  '        "letter_max_words": 350,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel_respectueux",',
  '    },',
  '    "wo": {',
  '        "country": "SN",',
  '        "language_name": "Wolof",',
  '        "cv_max_pages": 1,',
  '        "cv_include_photo": True,',
  '        "cv_include_age": False,',
  '        "cv_include_marital_status": False,',
  '        "letter_format": "lettre_francophone",',
  '        "letter_max_words": 350,',
  '        "date_format": "DD/MM/YYYY",',
  '        "tone": "formel",',
  '    },',
  '}',
  '',
  '',
  'DEFAULT_LOCALE: Dict[str, Any] = {',
  '    "country": "US",',
  '    "language_name": "English",',
  '    "cv_max_pages": 1,',
  '    "cv_include_photo": False,',
  '    "cv_include_age": False,',
  '    "cv_include_marital_status": False,',
  '    "letter_format": "cover_letter_american",',
  '    "letter_max_words": 350,',
  '    "date_format": "MM/DD/YYYY",',
  '    "tone": "direct_professionnel",',
  '}',
  '',
  '',
  'def get_locale_conventions(language_code: str) -> Dict[str, Any]:',
  '    """Retourne les conventions culturelles pour une langue donnee."""',
  '    code = language_code.lower().strip()',
  '    return LOCALE_CONVENTIONS.get(code, DEFAULT_LOCALE)',
  '',
  '',
  'def list_supported_locales() -> list:',
  '    """Retourne la liste des codes de langue supportes."""',
  '    return list(LOCALE_CONVENTIONS.keys())',
]);

// ============================================================
// 3. MISE À JOUR __init__.py
// ============================================================

logStep('3. Mise a jour __init__.py');

writeLines('backend/app/services/language/__init__.py', [
  '"""Services de detection et de mapping de langue."""',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 2b terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/language/detector.py');
console.log('    - backend/app/services/language/locale_map.py');
console.log('    - backend/app/services/language/__init__.py (mis a jour)');
console.log('');
console.log('  Verification rapide :');
console.log('    dir backend\\app\\services\\language');
console.log('    # Doit afficher : __init__.py, detector.py, locale_map.py, prompts\\');
console.log('');
console.log('  Test rapide :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    python -c "from app.services.language.detector import detect_language; print(detect_language(\'Bonjour, je suis un developpeur passionne par les nouvelles technologies.\'))"');
console.log('    python -c "from app.services.language.locale_map import get_locale_conventions; print(get_locale_conventions(\'fr\'))"');
console.log('');
console.log('  Prochaine etape : setup-phase2c.js (router + tests)');
console.log('');