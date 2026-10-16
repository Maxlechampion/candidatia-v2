#!/usr/bin/env node
/**
 * setup-phase3e.js — CandidatIA
 * Phase 3e : Tests unitaires Phase 3
 *
 * Crée :
 *   - backend/tests/test_word_cv.py
 *   - backend/tests/test_word_lettre.py
 *   - backend/tests/test_word_guide.py
 *   - backend/tests/test_word_relance.py
 *   - backend/tests/test_pack_builder.py
 *   - backend/tests/test_generate_router.py
 *
 * Usage : node setup-phase3e.js
 * Prérequis : avoir exécuté setup-phase3a a setup-phase3d
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

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

logHeader('CandidatIA — Setup Phase 3e : Tests unitaires');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'generation.py'))) {
  console.error('');
  console.error('  ERREUR : generation.py introuvable.');
  console.error('  Execute d abord setup-phase3d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. TEST WORD CV
// ============================================================

logStep('1. test_word_cv.py');

writeLines('backend/tests/test_word_cv.py', [
  '"""Tests du generateur Word CV."""',
  '',
  'import os',
  '',
  'import pytest',
  '',
  'from app.services.generation.word_cv import WordCVGenerator',
  '',
  '',
  '@pytest.fixture',
  'def cv_data():',
  '    return {',
  '        "coordonnees": {',
  '            "nom_complet": "Jean Dupont",',
  '            "email": "jean@example.com",',
  '            "telephone": "+33 6 00 00 00 00",',
  '            "adresse": "Paris, France",',
  '            "liens": ["linkedin.com/in/jeandupont"],',
  '        },',
  '        "titre_professionnel": "Developpeur Python Senior",',
  '        "accroche": "Expert backend avec 8 ans d experience.",',
  '        "competences_techniques": ["Python", "FastAPI", "Docker"],',
  '        "competences_humaines": ["Autonomie", "Esprit d equipe"],',
  '        "experiences": [',
  '            {',
  '                "poste": "Dev Backend",',
  '                "entreprise": "TechCorp",',
  '                "periode": "2022 - Present",',
  '                "lieu": "Paris",',
  '                "situation_tache": "Refonte monolithique vers microservices.",',
  '                "actions_menees": ["Migration Kubernetes", "CI/CD"],',
  '                "resultats_quantifiables": "+45% performance",',
  '            }',
  '        ],',
  '        "formations": [',
  '            {"diplome": "Master Info", "etablissement": "Paris-Saclay", "annee": "2018", "mention": None}',
  '        ],',
  '        "projets": [',
  '            {"nom": "API OSS", "description": "Auth JWT", "technologies": ["Python"]}',
  '        ],',
  '        "langues": ["Francais (maternelle)", "Anglais (C1)"],',
  '        "centres_interet": ["Open Source"],',
  '    }',
  '',
  '',
  'def test_cv_generates_file(cv_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    gen = WordCVGenerator()',
  '    path = gen.generate(cv_data, {"country": "FR"}, "test_cv.docx")',
  '',
  '    assert os.path.exists(path)',
  '    assert os.path.getsize(path) > 0',
  '',
  '',
  'def test_cv_with_minimal_data(tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    minimal = {',
  '        "coordonnees": {"nom_complet": "Test", "email": "", "telephone": "", "adresse": "", "liens": []},',
  '        "titre_professionnel": "",',
  '        "accroche": "",',
  '        "competences_techniques": [],',
  '        "competences_humaines": [],',
  '        "experiences": [],',
  '        "formations": [],',
  '        "projets": [],',
  '        "langues": [],',
  '        "centres_interet": [],',
  '    }',
  '',
  '    gen = WordCVGenerator()',
  '    path = gen.generate(minimal, {}, "test_minimal.docx")',
  '',
  '    assert os.path.exists(path)',
  '',
  '',
  'def test_cv_with_unicode_names(tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    data = {',
  '        "coordonnees": {"nom_complet": "Ahmed Ibn Sina", "email": "a@b.com", "telephone": "+212", "adresse": "Casablanca", "liens": []},',
  '        "titre_professionnel": "Data Scientist",',
  '        "accroche": "Expert",',
  '        "competences_techniques": [],',
  '        "competences_humaines": [],',
  '        "experiences": [],',
  '        "formations": [],',
  '        "projets": [],',
  '        "langues": [],',
  '        "centres_interet": [],',
  '    }',
  '',
  '    gen = WordCVGenerator()',
  '    path = gen.generate(data, {}, "test_unicode.docx")',
  '',
  '    assert os.path.exists(path)',
]);

// ============================================================
// 2. TEST WORD LETTRE
// ============================================================

logStep('2. test_word_lettre.py');

writeLines('backend/tests/test_word_lettre.py', [
  '"""Tests du generateur Word Lettre."""',
  '',
  'import os',
  '',
  'import pytest',
  '',
  'from app.services.generation.word_lettre import WordLettreGenerator',
  '',
  '',
  '@pytest.fixture',
  'def lettre_data():',
  '    return {',
  '        "expediteur": "Jean Dupont\\n12 rue de la Paix\\nParis\\njean@example.com",',
  '        "destinataire": "TechCorp\\n50 avenue de la Republique\\nParis",',
  '        "lieu_date": "Fait a Paris, le 29/09/2026",',
  '        "objet": "Candidature Developpeur Python",',
  '        "corps_paragraphes": [',
  '            "Madame, Monsieur,",',
  '            "Votre projet m interesse vivement.",',
  '            "Mon experience correspond parfaitement.",',
  '            "Cordialement,",',
  '        ],',
  '    }',
  '',
  '',
  'def test_lettre_generates_file(lettre_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    gen = WordLettreGenerator()',
  '    path = gen.generate(lettre_data, {"country": "FR"}, "test_lettre.docx")',
  '',
  '    assert os.path.exists(path)',
  '    assert os.path.getsize(path) > 0',
  '',
  '',
  'def test_lettre_with_empty_body(tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    data = {',
  '        "expediteur": "Test",',
  '        "destinataire": "Test",',
  '        "lieu_date": "Fait a X",',
  '        "objet": "Test",',
  '        "corps_paragraphes": [],',
  '    }',
  '',
  '    gen = WordLettreGenerator()',
  '    path = gen.generate(data, {}, "test_empty.docx")',
  '',
  '    assert os.path.exists(path)',
]);

// ============================================================
// 3. TEST WORD GUIDE
// ============================================================

logStep('3. test_word_guide.py');

writeLines('backend/tests/test_word_guide.py', [
  '"""Tests du generateur Word Guide."""',
  '',
  'import os',
  '',
  'import pytest',
  '',
  'from app.services.generation.word_guide import WordGuideGenerator',
  '',
  '',
  '@pytest.fixture',
  'def guide_data():',
  '    return {',
  '        "titre_poste": "Developpeur Python Senior",',
  '        "nom_entreprise": "TechCorp",',
  '        "defis_cles_entreprise": [',
  '            "Refonte microservices",',
  '            "Scalabilite 10x",',
  '        ],',
  '        "questions_probables": [',
  '            {',
  '                "question": "Comment gerez-vous les desaccords ?",',
  '                "intention_recruteur": "Intelligence relationnelle",',
  '                "strategie_reponse": "Privilegiez les donnees.",',
  '            }',
  '        ],',
  '        "questions_a_poser": [',
  '            "Quels sont vos KPI de succes a 6 mois ?",',
  '        ],',
  '    }',
  '',
  '',
  'def test_guide_generates_file(guide_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    gen = WordGuideGenerator()',
  '    path = gen.generate(guide_data, {"country": "FR"}, "test_guide.docx")',
  '',
  '    assert os.path.exists(path)',
  '    assert os.path.getsize(path) > 0',
  '',
  '',
  'def test_guide_with_no_questions(tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    data = {',
  '        "titre_poste": "Test",',
  '        "nom_entreprise": "Test",',
  '        "defis_cles_entreprise": [],',
  '        "questions_probables": [],',
  '        "questions_a_poser": [],',
  '    }',
  '',
  '    gen = WordGuideGenerator()',
  '    path = gen.generate(data, {}, "test_guide_empty.docx")',
  '',
  '    assert os.path.exists(path)',
]);

// ============================================================
// 4. TEST WORD RELANCE
// ============================================================

logStep('4. test_word_relance.py');

writeLines('backend/tests/test_word_relance.py', [
  '"""Tests du generateur Word Relance."""',
  '',
  'import os',
  '',
  'import pytest',
  '',
  'from app.services.generation.word_relance import WordRelanceGenerator',
  '',
  '',
  '@pytest.fixture',
  'def relance_data():',
  '    return {',
  '        "company_name": "TechCorp",',
  '        "job_title": "Developpeur Python Senior",',
  '        "wait_days": 7,',
  '        "subject": "Relance candidature",',
  '        "body": "Bonjour,\\n\\nJe me permets de revenir vers vous.\\n\\nCordialement.",',
  '        "signature": "Jean Dupont\\n+33 6 00 00 00 00",',
  '    }',
  '',
  '',
  'def test_relance_generates_file(relance_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    gen = WordRelanceGenerator()',
  '    path = gen.generate(relance_data, {"country": "FR"}, "test_relance.docx")',
  '',
  '    assert os.path.exists(path)',
  '    assert os.path.getsize(path) > 0',
  '',
  '',
  'def test_relance_with_empty_body(tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    data = {',
  '        "company_name": "Test",',
  '        "job_title": "Test",',
  '        "wait_days": 7,',
  '        "subject": "Test",',
  '        "body": "",',
  '        "signature": "",',
  '    }',
  '',
  '    gen = WordRelanceGenerator()',
  '    path = gen.generate(data, {}, "test_relance_empty.docx")',
  '',
  '    assert os.path.exists(path)',
]);

// ============================================================
// 5. TEST PACK BUILDER
// ============================================================

logStep('5. test_pack_builder.py');

writeLines('backend/tests/test_pack_builder.py', [
  '"""Tests du PackBuilder."""',
  '',
  'import os',
  'import zipfile',
  '',
  'import pytest',
  '',
  'from app.services.generation.pack_builder import PackBuilder',
  '',
  '',
  '@pytest.fixture',
  'def minimal_data():',
  '    cv = {',
  '        "coordonnees": {"nom_complet": "Test User", "email": "", "telephone": "", "adresse": "", "liens": []},',
  '        "titre_professionnel": "Dev",',
  '        "accroche": "Expert",',
  '        "competences_techniques": [],',
  '        "competences_humaines": [],',
  '        "experiences": [],',
  '        "formations": [],',
  '        "projets": [],',
  '        "langues": [],',
  '        "centres_interet": [],',
  '    }',
  '    lettre = {',
  '        "expediteur": "Test",',
  '        "destinataire": "Test",',
  '        "lieu_date": "Fait a X",',
  '        "objet": "Test",',
  '        "corps_paragraphes": ["Test body"],',
  '    }',
  '    guide = {',
  '        "titre_poste": "Dev",',
  '        "nom_entreprise": "Corp",',
  '        "defis_cles_entreprise": ["Defi 1"],',
  '        "questions_probables": [],',
  '        "questions_a_poser": ["Q1"],',
  '    }',
  '    return cv, lettre, guide',
  '',
  '',
  'def test_pack_builder_creates_zip(minimal_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    cv, lettre, guide = minimal_data',
  '    builder = PackBuilder()',
  '    result = builder.build_pack(',
  '        cv_data=cv,',
  '        lettre_data=lettre,',
  '        guide_data=guide,',
  '        locale={"country": "FR"},',
  '        pack_name="TestPack",',
  '    )',
  '',
  '    assert os.path.exists(result["zip_path"])',
  '    assert os.path.getsize(result["zip_path"]) > 0',
  '    assert len(result["documents"]) >= 3',
  '',
  '',
  'def test_pack_builder_zip_contains_docx(minimal_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    cv, lettre, guide = minimal_data',
  '    builder = PackBuilder()',
  '    result = builder.build_pack(',
  '        cv_data=cv,',
  '        lettre_data=lettre,',
  '        guide_data=guide,',
  '        locale={},',
  '        pack_name="TestZip",',
  '    )',
  '',
  '    with zipfile.ZipFile(result["zip_path"], "r") as zf:',
  '        names = zf.namelist()',
  '        assert any(n.endswith(".docx") for n in names)',
  '        assert len([n for n in names if n.endswith(".docx")]) >= 3',
  '',
  '',
  'def test_pack_builder_with_relance(minimal_data, tmp_path):',
  '    from app.core.config import get_settings',
  '    settings = get_settings()',
  '    settings.local_storage_path = str(tmp_path)',
  '',
  '    cv, lettre, guide = minimal_data',
  '    relance = {',
  '        "company_name": "Corp",',
  '        "job_title": "Dev",',
  '        "wait_days": 7,',
  '        "subject": "Relance",',
  '        "body": "Body",',
  '        "signature": "Me",',
  '    }',
  '',
  '    builder = PackBuilder()',
  '    result = builder.build_pack(',
  '        cv_data=cv,',
  '        lettre_data=lettre,',
  '        guide_data=guide,',
  '        relance_data=relance,',
  '        locale={},',
  '        pack_name="TestRelance",',
  '    )',
  '',
  '    assert result["relance_path"] is not None',
  '    with zipfile.ZipFile(result["zip_path"], "r") as zf:',
  '        names = zf.namelist()',
  '        assert any("Relance" in n for n in names)',
]);

// ============================================================
// 6. TEST GENERATE ROUTER
// ============================================================

logStep('6. test_generate_router.py');

writeLines('backend/tests/test_generate_router.py', [
  '"""Tests du router /api/generate (sans appel IA)."""',
  '',
  'from fastapi.testclient import TestClient',
  '',
  '',
  'def test_generate_info_endpoint(client: TestClient) -> None:',
  '    response = client.get("/api/generate/info")',
  '    assert response.status_code == 200',
  '',
  '    data = response.json()',
  '    assert "supported_languages" in data',
  '    assert "pdf_available" in data',
  '    assert "fr" in data["supported_languages"]',
  '    assert "en" in data["supported_languages"]',
  '    assert isinstance(data["pdf_available"], bool)',
  '',
  '',
  'def test_generate_missing_input_returns_400(client: TestClient) -> None:',
  '    response = client.post("/api/generate")',
  '    assert response.status_code == 400',
  '',
  '',
  'def test_generate_short_profil_returns_400(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/generate",',
  '        data={',
  '            "texte_profil": "trop court",',
  '            "texte_offre": "offre " * 30,',
  '        },',
  '    )',
  '    assert response.status_code == 400',
  '',
  '',
  'def test_generate_short_offre_returns_400(client: TestClient) -> None:',
  '    response = client.post(',
  '        "/api/generate",',
  '        data={',
  '            "texte_profil": "profil " * 20,',
  '            "texte_offre": "court",',
  '        },',
  '    )',
  '    assert response.status_code == 400',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 3e terminee avec succes');

console.log('  Fichiers de tests crees :');
console.log('    - backend/tests/test_word_cv.py');
console.log('    - backend/tests/test_word_lettre.py');
console.log('    - backend/tests/test_word_guide.py');
console.log('    - backend/tests/test_word_relance.py');
console.log('    - backend/tests/test_pack_builder.py');
console.log('    - backend/tests/test_generate_router.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Aller dans backend :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('');
console.log('  2. Lancer les tests Phase 3 uniquement :');
console.log('     pytest tests/test_word_cv.py tests/test_word_lettre.py tests/test_word_guide.py tests/test_word_relance.py tests/test_pack_builder.py tests/test_generate_router.py -v');
console.log('');
console.log('  3. Lancer TOUS les tests :');
console.log('     pytest');
console.log('');
console.log('  PHASE 3 COMPLETE !');
console.log('');