#!/usr/bin/env node
/**
 * setup-phase2d.js — CandidatIA
 * Phase 2d : Tests unitaires pour la Phase 2
 *
 * Crée :
 *   - backend/tests/test_ingestion_detector.py
 *   - backend/tests/test_language_detector.py
 *   - backend/tests/test_locale_map.py
 *   - backend/tests/test_text_raw.py
 *   - backend/tests/test_markdown_extractor.py
 *   - backend/tests/test_ingestion_service.py
 *   - backend/tests/test_ingest_router.py
 *
 * Usage : node setup-phase2d.js
 * Prérequis : avoir exécuté setup-phase2a, 2b, 2c
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

logHeader('CandidatIA — Setup Phase 2d : Tests unitaires');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'ingestion.py'))) {
  console.error('');
  console.error('  ERREUR : Le router ingestion est introuvable.');
  console.error('  Execute d abord setup-phase2c.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. TEST DETECTOR CONTENT TYPE
// ============================================================

logStep('1. test_ingestion_detector.py');

writeLines('backend/tests/test_ingestion_detector.py', [
  '"""Tests du detecteur de type de contenu."""',
  '',
  'from app.services.ingestion.detector import detect_content_type',
  '',
  '',
  'def test_detect_cv() -> None:',
  '    text = """',
  '    CURRICULUM VITAE',
  '    Jean Dupont',
  '    EXPERIENCE PROFESSIONNELLE',
  '    - Developpeur senior chez TechCorp',
  '    FORMATION',
  '    - Master en informatique',
  '    COMPETENCES TECHNIQUES',
  '    - Python, FastAPI, Docker',
  '    LANGUES',
  '    - Francais, Anglais',
  '    CENTRES D INTERET',
  '    - Randonnee',
  '    """',
  '    content_type, confidence = detect_content_type(text)',
  '    assert content_type == "cv"',
  '    assert confidence > 0.5',
  '',
  '',
  'def test_detect_offre() -> None:',
  '    text = """',
  '    Nous recherchons un developpeur Python',
  '    Rejoignez notre equipe dynamique !',
  '    Profil recherche : 5 ans d experience',
  '    Missions principales : developpement backend',
  '    Ce que nous offrons : CDI, salaire competitif',
  '    Poste base a Paris',
  '    Pour candidater, envoyez votre CV et lettre de motivation.',
  '    """',
  '    content_type, confidence = detect_content_type(text)',
  '    assert content_type == "offre"',
  '    assert confidence > 0.5',
  '',
  '',
  'def test_detect_inconnu() -> None:',
  '    content_type, confidence = detect_content_type("Bonjour")',
  '    assert content_type == "inconnu"',
  '    assert confidence == 0.0',
  '',
  '',
  'def test_detect_empty() -> None:',
  '    content_type, confidence = detect_content_type("")',
  '    assert content_type == "inconnu"',
  '    assert confidence == 0.0',
  '',
  '',
  'def test_detect_handles_accents() -> None:',
  '    text = """',
  '    Nous recherchons un développeur expérimenté',
  '    Rejoignez notre équipe ! Profil recherché. Poste basé à Paris.',
  '    Missions principales : développement. CDI. Salaire attractif.',
  '    """',
  '    content_type, confidence = detect_content_type(text)',
  '    assert content_type == "offre"',
  '    assert confidence > 0.5',
]);

// ============================================================
// 2. TEST LANGUAGE DETECTOR
// ============================================================

logStep('2. test_language_detector.py');

writeLines('backend/tests/test_language_detector.py', [
  '"""Tests du detecteur de langue."""',
  '',
  'from app.services.language.detector import (',
  '    detect_language,',
  '    get_language_name,',
  '    is_supported,',
  ')',
  '',
  '',
  'def test_detect_french() -> None:',
  '    text = (',
  '        "Bonjour, je suis un developpeur passionne par les nouvelles "',
  '        "technologies et j aime creer des applications web modernes."',
  '    )',
  '    assert detect_language(text) == "fr"',
  '',
  '',
  'def test_detect_english() -> None:',
  '    text = (',
  '        "Hello, I am a passionate developer who loves building web "',
  '        "applications and solving complex problems every day."',
  '    )',
  '    assert detect_language(text) == "en"',
  '',
  '',
  'def test_detect_spanish() -> None:',
  '    text = (',
  '        "Hola, soy un desarrollador apasionado por las nuevas "',
  '        "tecnologias y me encanta crear aplicaciones web modernas."',
  '    )',
  '    assert detect_language(text) == "es"',
  '',
  '',
  'def test_detect_short_text_returns_default() -> None:',
  '    assert detect_language("hi") == "en"',
  '    assert detect_language("") == "en"',
  '',
  '',
  'def test_detect_custom_default() -> None:',
  '    assert detect_language("short", default="fr") == "fr"',
  '',
  '',
  'def test_get_language_name() -> None:',
  '    assert get_language_name("fr") == "Francais"',
  '    assert get_language_name("en") == "English"',
  '    assert get_language_name("es") == "Espanol"',
  '',
  '',
  'def test_get_language_name_unknown() -> None:',
  '    assert get_language_name("xx") == "XX"',
  '',
  '',
  'def test_is_supported() -> None:',
  '    assert is_supported("fr") is True',
  '    assert is_supported("en") is True',
  '    assert is_supported("xx") is False',
]);

// ============================================================
// 3. TEST LOCALE MAP
// ============================================================

logStep('3. test_locale_map.py');

writeLines('backend/tests/test_locale_map.py', [
  '"""Tests du mapping langue -> conventions culturelles."""',
  '',
  'from app.services.language.locale_map import (',
  '    get_locale_conventions,',
  '    list_supported_locales,',
  ')',
  '',
  '',
  'def test_french_conventions() -> None:',
  '    conv = get_locale_conventions("fr")',
  '    assert conv["country"] == "FR"',
  '    assert conv["cv_include_photo"] is True',
  '    assert conv["cv_max_pages"] == 1',
  '    assert conv["letter_format"] == "epistolaire_traditionnel"',
  '',
  '',
  'def test_english_conventions() -> None:',
  '    conv = get_locale_conventions("en")',
  '    assert conv["country"] == "US"',
  '    assert conv["cv_include_photo"] is False',
  '    assert conv["cv_max_pages"] == 1',
  '    assert conv["letter_format"] == "cover_letter_american"',
  '',
  '',
  'def test_german_conventions() -> None:',
  '    conv = get_locale_conventions("de")',
  '    assert conv["country"] == "DE"',
  '    assert conv["cv_include_photo"] is True',
  '    assert conv["date_format"] == "DD.MM.YYYY"',
  '',
  '',
  'def test_japanese_conventions() -> None:',
  '    conv = get_locale_conventions("ja")',
  '    assert conv["country"] == "JP"',
  '    assert conv["cv_include_photo"] is True',
  '    assert conv["cv_include_age"] is True',
  '    assert conv["letter_format"] == "rirekisho_shokumu"',
  '',
  '',
  'def test_arabic_conventions() -> None:',
  '    conv = get_locale_conventions("ar")',
  '    assert conv["country"] == "AE"',
  '    assert conv["cv_include_marital_status"] is True',
  '',
  '',
  'def test_unknown_language_fallback() -> None:',
  '    conv = get_locale_conventions("xx")',
  '    assert conv["country"] == "US"',
  '    assert conv["letter_format"] == "cover_letter_american"',
  '',
  '',
  'def test_case_insensitive() -> None:',
  '    conv1 = get_locale_conventions("FR")',
  '    conv2 = get_locale_conventions("fr")',
  '    assert conv1 == conv2',
  '',
  '',
  'def test_list_supported_locales() -> None:',
  '    locales = list_supported_locales()',
  '    assert "fr" in locales',
  '    assert "en" in locales',
  '    assert "es" in locales',
  '    assert "zh-cn" in locales',
  '    assert len(locales) >= 15',
]);

// ============================================================
// 4. TEST TEXT RAW
// ============================================================

logStep('4. test_text_raw.py');

writeLines('backend/tests/test_text_raw.py', [
  '"""Tests du nettoyage de texte brut."""',
  '',
  'import pytest',
  '',
  'from app.services.ingestion.text_raw import TextRawExtractor, clean_raw_text',
  '',
  '',
  'def test_clean_removes_multiple_spaces() -> None:',
  '    assert clean_raw_text("hello    world") == "hello world"',
  '',
  '',
  'def test_clean_removes_multiple_newlines() -> None:',
  '    result = clean_raw_text("a\\n\\n\\n\\nb")',
  '    assert "\\n\\n\\n" not in result',
  '    assert result == "a\\n\\nb"',
  '',
  '',
  'def test_clean_handles_crlf() -> None:',
  '    result = clean_raw_text("a\\r\\nb")',
  '    assert "\\r" not in result',
  '    assert result == "a\\nb"',
  '',
  '',
  'def test_clean_handles_tabs() -> None:',
  '    result = clean_raw_text("a\\tb")',
  '    assert "\\t" not in result',
  '',
  '',
  'def test_clean_empty_returns_empty() -> None:',
  '    assert clean_raw_text("") == ""',
  '    assert clean_raw_text("   ") == ""',
  '',
  '',
  'def test_extractor_valid_text() -> None:',
  '    extractor = TextRawExtractor()',
  '    result = extractor.extract("  Bonjour    le monde  ")',
  '    assert result == "Bonjour le monde"',
  '',
  '',
  'def test_extractor_empty_raises() -> None:',
  '    extractor = TextRawExtractor()',
  '    with pytest.raises(ValueError):',
  '        extractor.extract("")',
  '',
  '',
  'def test_extractor_whitespace_only_raises() -> None:',
  '    extractor = TextRawExtractor()',
  '    with pytest.raises(ValueError):',
  '        extractor.extract("   \\n\\n  ")',
]);

// ============================================================
// 5. TEST MARKDOWN EXTRACTOR
// ============================================================

logStep('5. test_markdown_extractor.py');

writeLines('backend/tests/test_markdown_extractor.py', [
  '"""Tests de l extracteur Markdown."""',
  '',
  'from app.services.ingestion.markdown import MarkdownExtractor',
  '',
  '',
  'def test_markdown_removes_headers() -> None:',
  '    extractor = MarkdownExtractor()',
  '    content = b"# Titre\\n\\n## Sous-titre\\n\\nParagraphe normal."',
  '    result = extractor.safe_extract(content, "test.md")',
  '    assert "Titre" in result',
  '    assert "Sous-titre" in result',
  '    assert "#" not in result',
  '',
  '',
  'def test_markdown_removes_bold() -> None:',
  '    extractor = MarkdownExtractor()',
  '    content = b"Ceci est **important** et _aussi_."',
  '    result = extractor.safe_extract(content, "test.md")',
  '    assert "**" not in result',
  '    assert "important" in result',
  '    assert "aussi" in result',
  '',
  '',
  'def test_markdown_removes_links() -> None:',
  '    extractor = MarkdownExtractor()',
  '    content = b"Voir [Google](https://google.com) pour plus."',
  '    result = extractor.safe_extract(content, "test.md")',
  '    assert "[" not in result',
  '    assert "Google" in result',
  '    assert "https://" not in result',
  '',
  '',
  'def test_markdown_removes_code_blocks() -> None:',
  '    extractor = MarkdownExtractor()',
  '    content = b"Voici du code:\\n```python\\nprint(1)\\n```\\nFin."',
  '    result = extractor.safe_extract(content, "test.md")',
  '    assert "print(1)" not in result',
  '    assert "Voici" in result',
  '',
  '',
  'def test_markdown_removes_list_markers() -> None:',
  '    extractor = MarkdownExtractor()',
  '    content = b"- Item 1\\n- Item 2\\n1. Numero 1\\n2. Numero 2"',
  '    result = extractor.safe_extract(content, "test.md")',
  '    assert "Item 1" in result',
  '    assert "- Item" not in result',
  '',
  '',
  'def test_markdown_extensions() -> None:',
  '    extractor = MarkdownExtractor()',
  '    assert "md" in extractor.extensions',
  '    assert "markdown" in extractor.extensions',
  '',
  '',
  'def test_markdown_can_handle() -> None:',
  '    extractor = MarkdownExtractor()',
  '    assert extractor.can_handle("test.md") is True',
  '    assert extractor.can_handle("test.markdown") is True',
  '    assert extractor.can_handle("test.txt") is False',
]);

// ============================================================
// 6. TEST INGESTION SERVICE
// ============================================================

logStep('6. test_ingestion_service.py');

writeLines('backend/tests/test_ingestion_service.py', [
  '"""Tests du service d ingestion."""',
  '',
  'import pytest',
  '',
  'from app.core.errors import IngestionError',
  'from app.services.ingestion.service import IngestionService, get_ingestion_service',
  '',
  '',
  'def test_extract_from_text() -> None:',
  '    service = IngestionService()',
  '    result = service.extract_from_text("  Hello    world  ")',
  '    assert result == "Hello world"',
  '',
  '',
  'def test_extract_from_bytes_empty_raises() -> None:',
  '    service = IngestionService()',
  '    with pytest.raises(IngestionError):',
  '        service.extract_from_bytes(b"", "test.pdf")',
  '',
  '',
  'def test_extract_from_bytes_no_extension_raises() -> None:',
  '    service = IngestionService()',
  '    with pytest.raises(IngestionError):',
  '        service.extract_from_bytes(b"content", "noextension")',
  '',
  '',
  'def test_extract_from_bytes_unsupported_raises() -> None:',
  '    service = IngestionService()',
  '    with pytest.raises(IngestionError):',
  '        service.extract_from_bytes(b"content", "test.xyz")',
  '',
  '',
  'def test_extract_markdown_works() -> None:',
  '    service = IngestionService()',
  '    content = b"# Titre\\nContenu normal."',
  '    result = service.extract_from_bytes(content, "test.md")',
  '    assert "Titre" in result',
  '    assert "Contenu normal" in result',
  '',
  '',
  'def test_extract_html_works() -> None:',
  '    service = IngestionService()',
  '    content = b"<html><body><h1>Titre</h1><p>Paragraphe</p></body></html>"',
  '    result = service.extract_from_bytes(content, "test.html")',
  '    assert "Titre" in result',
  '    assert "Paragraphe" in result',
  '',
  '',
  'def test_singleton_returns_same_instance() -> None:',
  '    s1 = get_ingestion_service()',
  '    s2 = get_ingestion_service()',
  '    assert s1 is s2',
  '',
  '',
  'def test_extract_from_bytes_case_insensitive_extension() -> None:',
  '    service = IngestionService()',
  '    content = b"# Titre\\nContenu."',
  '    result = service.extract_from_bytes(content, "test.MD")',
  '    assert "Titre" in result',
]);

// ============================================================
// 7. TEST INGEST ROUTER
// ============================================================

logStep('7. test_ingest_router.py');

writeLines('backend/tests/test_ingest_router.py', [
  '"""Tests du router /api/ingest."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_ingest_text_only(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/ingest",',
  '        data={',
  '            "texte": (',
  '                "CURRICULUM VITAE Jean Dupont EXPERIENCE PROFESSIONNELLE "',
  '                "Developpeur senior chez TechCorp FORMATION Master "',
  '                "informatique COMPETENCES Python Docker FastAPI"',
  '            ),',
  '        },',
  '    )',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert data["status"] == "ok"',
  '    assert data["source"] == "text"',
  '    assert data["filename"] is None',
  '    assert "text" in data',
  '    assert "language" in data',
  '    assert "content_type" in data',
  '    assert "locale" in data',
  '    assert data["language"]["code"] in ("fr", "en")',
  '',
  '',
  'def test_ingest_no_input_returns_400(client: TestClient) -> None:',
  '    response = client.post("/api/ingest")',
  '    assert response.status_code == 400',
  '',
  '',
  'def test_ingest_with_content_type_hint_cv(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/ingest",',
  '        data={',
  '            "texte": "Texte quelconque mais assez long pour etre ingere correctement par notre systeme.",',
  '            "content_type_hint": "cv",',
  '        },',
  '    )',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert data["content_type"]["type"] == "cv"',
  '    assert data["content_type"]["confidence"] == 1.0',
  '',
  '',
  'def test_ingest_with_content_type_hint_offre(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/ingest",',
  '        data={',
  '            "texte": "Texte quelconque mais assez long pour etre ingere correctement.",',
  '            "content_type_hint": "offre",',
  '        },',
  '    )',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert data["content_type"]["type"] == "offre"',
  '    assert data["content_type"]["confidence"] == 1.0',
  '',
  '',
  'def test_ingest_auto_detect_cv(client: TestClient) -> None:',
  '    text = (',
  '        "CURRICULUM VITAE Jean Dupont EXPERIENCE PROFESSIONNELLE "',
  '        "Developpeur FORMATION Master informatique COMPETENCES "',
  '        "TECHNIQUES Python Docker LANGUES Francais Anglais"',
  '    )',
  '    response = client.post("/api/ingest", data={"texte": text})',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert data["content_type"]["type"] == "cv"',
  '',
  '',
  'def test_ingest_locale_included(client: TestClient) -> None:',
  '    text = (',
  '        "Bonjour, je suis un developpeur passionne par les nouvelles "',
  '        "technologies et j aime creer des applications web modernes."',
  '    )',
  '    response = client.post("/api/ingest", data={"texte": text})',
  '    assert response.status_code == 200',
  '    data = response.json()',
  '    assert "locale" in data',
  '    assert "country" in data["locale"]',
  '    assert "cv_max_pages" in data["locale"]',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 2d terminee avec succes');

console.log('  Fichiers de tests crees :');
console.log('    - backend/tests/test_ingestion_detector.py');
console.log('    - backend/tests/test_language_detector.py');
console.log('    - backend/tests/test_locale_map.py');
console.log('    - backend/tests/test_text_raw.py');
console.log('    - backend/tests/test_markdown_extractor.py');
console.log('    - backend/tests/test_ingestion_service.py');
console.log('    - backend/tests/test_ingest_router.py');
console.log('');
console.log('  VERIFICATION — Lance les commandes suivantes :');
console.log('');
console.log('  1. Aller dans backend :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('');
console.log('  2. Lancer tous les tests :');
console.log('     pytest');
console.log('');
console.log('  Attendu : plus de 60 tests PASSED');
console.log('');
console.log('  3. Lancer uniquement les tests Phase 2 :');
console.log('     pytest tests/test_ingestion_detector.py tests/test_language_detector.py tests/test_locale_map.py tests/test_text_raw.py tests/test_markdown_extractor.py tests/test_ingestion_service.py tests/test_ingest_router.py -v');
console.log('');
console.log('  Prochaine etape : Phase 3 (Generation Word/PDF multi-culturel)');
console.log('');