#!/usr/bin/env node
/**
 * setup-phase3d.js — CandidatIA
 * Phase 3d : Prompts IA + Router /api/generate + intégration main.py
 *
 * Crée :
 *   - backend/app/services/ai/prompts/__init__.py
 *   - backend/app/services/ai/prompts/cv_prompt.py
 *   - backend/app/services/ai/prompts/lettre_prompt.py
 *   - backend/app/services/ai/prompts/guide_prompt.py
 *   - backend/app/services/ai/prompts/relance_prompt.py
 *   - backend/app/routers/generation.py
 *
 * Modifie :
 *   - backend/app/main.py (ajout du router generation)
 *
 * Usage : node setup-phase3d.js
 * Prérequis : avoir exécuté setup-phase0 a setup-phase3c
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

// ============================================================
// VÉRIFICATIONS
// ============================================================

logHeader('CandidatIA — Setup Phase 3d : Prompts IA + Router /api/generate');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'generation', 'pack_builder.py'))) {
  console.error('');
  console.error('  ERREUR : pack_builder.py introuvable.');
  console.error('  Execute d abord setup-phase3a.js a setup-phase3c.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. PROMPTS INIT
// ============================================================

logStep('1. prompts/__init__.py');

writeLines('backend/app/services/ai/prompts/__init__.py', [
  '"""Prompts IA pour la generation de documents de candidature."""',
  '',
  'from app.services.ai.prompts.cv_prompt import get_cv_prompt',
  'from app.services.ai.prompts.lettre_prompt import get_lettre_prompt',
  'from app.services.ai.prompts.guide_prompt import get_guide_prompt',
  'from app.services.ai.prompts.relance_prompt import get_relance_prompt',
  '',
  '__all__ = [',
  '    "get_cv_prompt",',
  '    "get_lettre_prompt",',
  '    "get_guide_prompt",',
  '    "get_relance_prompt",',
  ']',
]);

// ============================================================
// 2. PROMPT CV
// ============================================================

logStep('2. cv_prompt.py');

writeLines('backend/app/services/ai/prompts/cv_prompt.py', [
  '"""Prompt pour la generation du CV au format STAR."""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'def get_cv_prompt(',
  '    profil: str,',
  '    offre: str,',
  '    locale: Dict[str, Any],',
  '    output_language: str = "fr",',
  ') -> tuple:',
  '    """Retourne (system_prompt, user_prompt) pour generer un CV."""',
  '',
  '    language_name = locale.get("language_name", "Francais")',
  '    country = locale.get("country", "FR")',
  '    cv_max_pages = locale.get("cv_max_pages", 1)',
  '    include_photo = locale.get("cv_include_photo", False)',
  '    include_age = locale.get("cv_include_age", False)',
  '    tone = locale.get("tone", "formel")',
  '',
  '    photo_rule = "Une photo est attendue." if include_photo else "Ne PAS mentionner de photo."',
  '    age_rule = "Tu peux mentionner l age." if include_age else "Ne PAS mentionner l age."',
  '',
  '    system_prompt = f"""Tu es un chasseur de tetes international et expert en optimisation de profils pour les systemes ATS modernes (Workday, Taleo).',
  '',
  'CONTEXTE CULTUREL :',
  '- Pays cible : {country}',
  '- Langue de redaction : {language_name} (code: {output_language})',
  '- Longueur maximale du CV : {cv_max_pages} page(s)',
  '- Photo : {photo_rule}',
  '- Age : {age_rule}',
  '- Ton : {tone}',
  '',
  'REGLES DE REDACTION :',
  '1. Redige EXCLUSIVEMENT en {language_name}.',
  '2. titre_professionnel : intitule exact du poste cible.',
  '3. accroche : proposition de valeur executive, 3 lignes max, axee impact.',
  '4. competences_techniques : mots-cles denses extraits de l offre.',
  '5. experiences (methode STAR) :',
  '   - situation_tache : perimetre + enjeu business (volume, budget, equipe).',
  '   - actions_menees : 3-4 puces commencant par un verbe d action fort.',
  '   - resultats_quantifiables : OBLIGATOIRE - chiffre ou KPI precis (+25%, -15k EUR, etc.).',
  '',
  'Genere un objet JSON strict avec cette structure :',
  '{',
  '  "analyse": {',
  '    "score_matching": 92,',
  '    "points_forts": ["Argument 1", "Argument 2"],',
  '    "competences_a_valoriser": ["Comp 1"],',
  '    "strategie_candidature": "Explication de la posture"',
  '  },',
  '  "coordonnees": {',
  '    "nom_complet": "",',
  '    "email": "",',
  '    "telephone": "",',
  '    "adresse": "",',
  '    "liens": []',
  '  },',
  '  "titre_professionnel": "",',
  '  "accroche": "",',
  '  "competences_techniques": [],',
  '  "competences_humaines": [],',
  '  "experiences": [',
  '    {',
  '      "poste": "",',
  '      "entreprise": "",',
  '      "periode": "",',
  '      "lieu": "",',
  '      "situation_tache": "",',
  '      "actions_menees": [],',
  '      "resultats_quantifiables": ""',
  '    }',
  '  ],',
  '  "formations": [',
  '    {"diplome": "", "etablissement": "", "annee": "2020", "mention": null}',
  '  ],',
  '  "projets": [',
  '    {"nom": "", "description": "", "technologies": []}',
  '  ],',
  '  "langues": [],',
  '  "centres_interet": []',
  '}"""',
  '',
  '    user_prompt = f"""PROFIL DU CANDIDAT :',
  '{profil}',
  '',
  'OFFRE D EMPLOI CIBLE :',
  '{offre}',
  '',
  'Genere le CV optimise au format JSON strict."""',
  '',
  '    return system_prompt, user_prompt',
]);

// ============================================================
// 3. PROMPT LETTRE
// ============================================================

logStep('3. lettre_prompt.py');

writeLines('backend/app/services/ai/prompts/lettre_prompt.py', [
  '"""Prompt pour la generation de la lettre de motivation."""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'def get_lettre_prompt(',
  '    cv_contexte: str,',
  '    offre: str,',
  '    locale: Dict[str, Any],',
  '    output_language: str = "fr",',
  ') -> tuple:',
  '    """Retourne (system_prompt, user_prompt) pour generer une lettre."""',
  '',
  '    language_name = locale.get("language_name", "Francais")',
  '    letter_format = locale.get("letter_format", "epistolaire_traditionnel")',
  '    letter_max_words = locale.get("letter_max_words", 400)',
  '    tone = locale.get("tone", "formel")',
  '',
  '    system_prompt = f"""Tu es un copywriter d elite specialise dans les lettres d influence professionnelle.',
  '',
  'CONTEXTE CULTUREL :',
  '- Langue de redaction : {language_name} (code: {output_language})',
  '- Format attendu : {letter_format}',
  '- Longueur max : {letter_max_words} mots',
  '- Ton : {tone}',
  '',
  'ELIMINE tous les cliches :',
  '- "Je me permets de..."',
  '- "Actuellement a la recherche..."',
  '- "Je suis motive et dynamique..."',
  '',
  'STRUCTURE NARRATIVE (AIDA adapte RH) :',
  '- Paragraphe 1 (ACCROCHE) : entre dans le vif. Cite un defi majeur de l entreprise ou un projet recent.',
  '- Paragraphe 2 (INTERET) : demontre une comprehension fine de leur secteur/enjeux. Parle d eux, pas de toi.',
  '- Paragraphe 3 (SYNERGIE) : pont entre tes realisations STAR chiffrees et leurs besoins.',
  '- Paragraphe 4 (ACTION) : demande d entretien assuree et chaleureuse + formule de politesse.',
  '',
  'Genere un objet JSON strict :',
  '{',
  '  "expediteur": "Prenom Nom\\nAdresse\\nTelephone\\nEmail",',
  '  "destinataire": "A l attention du Responsable Recrutement\\nEntreprise\\nAdresse",',
  '  "lieu_date": "Fait a [Ville], le [Date du jour]",',
  '  "objet": "Candidature au poste de [Intitule] - Ref: [Si presente]",',
  '  "corps_paragraphes": [',
  '    "Texte accroche disruptive",',
  '    "Texte analyse entreprise",',
  '    "Texte preuve par les faits",',
  '    "Demande entretien et formule de politesse"',
  '  ]',
  '}"""',
  '',
  '    user_prompt = f"""CONTEXTE STRATEGIQUE DU CV :',
  '{cv_contexte}',
  '',
  'OFFRE D EMPLOI CIBLE :',
  '{offre}',
  '',
  'Genere la lettre de motivation au format JSON strict."""',
  '',
  '    return system_prompt, user_prompt',
]);

// ============================================================
// 4. PROMPT GUIDE
// ============================================================

logStep('4. guide_prompt.py');

writeLines('backend/app/services/ai/prompts/guide_prompt.py', [
  '"""Prompt pour la generation du guide d entretien."""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'def get_guide_prompt(',
  '    cv_contexte: str,',
  '    offre: str,',
  '    locale: Dict[str, Any],',
  '    output_language: str = "fr",',
  ') -> tuple:',
  '    """Retourne (system_prompt, user_prompt) pour generer un guide d entretien."""',
  '',
  '    language_name = locale.get("language_name", "Francais")',
  '    tone = locale.get("tone", "formel")',
  '',
  '    system_prompt = f"""Tu es un coach de dirigeants et negociateur de carrieres d elite.',
  '',
  'CONTEXTE CULTUREL :',
  '- Langue de redaction : {language_name} (code: {output_language})',
  '- Ton : {tone}',
  '',
  'DIRECTIVES DE CONTENU :',
  '',
  '1. defis_cles_entreprise : au-dela du texte de l offre, deduis les VRAIES craintes',
  '   ou douleurs organisationnelles cachees (manque de leadership, dette technique,',
  '   risques de retards...). 3 a 5 defis.',
  '',
  '2. questions_probables : 4 a 5 questions pointues dont AU MOINS UNE "piege".',
  '   Pour chaque question :',
  '   - intention_recruteur : decryptage psychologique de la crainte masquee',
  '   - strategie_reponse : script tactique etape par etape utilisant les forces du CV',
  '',
  '3. questions_a_poser : 3 questions a forte valeur ajoutee que le candidat posera',
  '   en fin d entretien pour se positionner en consultant.',
  '',
  'Genere un objet JSON strict :',
  '{',
  '  "titre_poste": "Intitule du poste",',
  '  "nom_entreprise": "Nom de l entreprise",',
  '  "defis_cles_entreprise": [',
  '    "Analyse de l enjeu business cache"',
  '  ],',
  '  "questions_probables": [',
  '    {',
  '      "question": "Question exigeante",',
  '      "intention_recruteur": "Decryptage de la crainte sous-jacente",',
  '      "strategie_reponse": "Script tactique"',
  '    }',
  '  ],',
  '  "questions_a_poser": [',
  '    "Question de haut niveau"',
  '  ]',
  '}"""',
  '',
  '    user_prompt = f"""CONTEXTE DU CV OPTIMISE :',
  '{cv_contexte}',
  '',
  'OFFRE D EMPLOI CIBLE :',
  '{offre}',
  '',
  'Genere le guide d entretien au format JSON strict."""',
  '',
  '    return system_prompt, user_prompt',
]);

// ============================================================
// 5. PROMPT RELANCE
// ============================================================

logStep('5. relance_prompt.py');

writeLines('backend/app/services/ai/prompts/relance_prompt.py', [
  '"""Prompt pour la generation du brouillon de relance."""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'def get_relance_prompt(',
  '    nom_candidat: str,',
  '    poste: str,',
  '    entreprise: str,',
  '    wait_days: int,',
  '    locale: Dict[str, Any],',
  '    output_language: str = "fr",',
  ') -> tuple:',
  '    """Retourne (system_prompt, user_prompt) pour generer une relance."""',
  '',
  '    language_name = locale.get("language_name", "Francais")',
  '    tone = locale.get("tone", "formel")',
  '',
  '    system_prompt = f"""Tu es un expert en communication professionnelle.',
  '',
  'CONTEXTE CULTUREL :',
  '- Langue de redaction : {language_name} (code: {output_language})',
  '- Ton : {tone}',
  '',
  'MISSION :',
  'Redige un email de relance COURT (100-150 mots) apres une candidature sans reponse.',
  '',
  'REGLES :',
  '- Ne sois PAS insistant ni desespere.',
  '- Rappelle brievement l interet pour le poste.',
  '- Propose une valeur ajoutee specifique.',
  '- Termine par une formule de politesse.',
  '- Pas de "je me permets de", pas de "je reviens vers vous".',
  '',
  'Genere un objet JSON strict :',
  '{',
  '  "subject": "Objet de l email",',
  '  "body": "Corps de l email avec sauts de ligne (\\n)",',
  '  "signature": "Prenom Nom\\nTelephone\\nEmail"',
  '}"""',
  '',
  '    user_prompt = f"""CANDIDAT : {nom_candidat}',
  'POSTE : {poste}',
  'ENTREPRISE : {entreprise}',
  'DELAI ECOULE : {wait_days} jours',
  '',
  'Genere le brouillon de relance au format JSON strict."""',
  '',
  '    return system_prompt, user_prompt',
]);

// ============================================================
// 6. ROUTER GENERATION
// ============================================================

logStep('6. routers/generation.py (endpoint /api/generate)');

writeLines('backend/app/routers/generation.py', [
  '"""Router /api/generate — pipeline complet de generation de pack."""',
  '',
  'import os',
  'from typing import Optional',
  '',
  'from fastapi import APIRouter, File, Form, HTTPException, UploadFile',
  'from fastapi.responses import FileResponse',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import AppError, GenerationError, IngestionError',
  'from app.core.logging import get_logger',
  'from app.services.ai.orchestrator import get_orchestrator',
  'from app.services.ai.prompts import (',
  '    get_cv_prompt,',
  '    get_guide_prompt,',
  '    get_lettre_prompt,',
  '    get_relance_prompt,',
  ')',
  'from app.services.generation.pack_builder import get_pack_builder',
  'from app.services.ingestion.detector import detect_content_type',
  'from app.services.ingestion.service import get_ingestion_service',
  'from app.services.language.detector import detect_language',
  'from app.services.language.locale_map import get_locale_conventions',
  '',
  'logger = get_logger("router.generation")',
  'router = APIRouter(prefix="/api", tags=["generation"])',
  '',
  '',
  'async def _extraire_entree(',
  '    fichier: Optional[UploadFile],',
  '    texte: Optional[str],',
  '    label: str,',
  ') -> str:',
  '    """Extrait le texte depuis un fichier ou un texte brut."""',
  '    settings = get_settings()',
  '    service = get_ingestion_service()',
  '',
  '    if fichier:',
  '        content_bytes = await fichier.read()',
  '        max_bytes = settings.max_file_size_mb * 1024 * 1024',
  '        if len(content_bytes) > max_bytes:',
  '            raise HTTPException(',
  '                status_code=413,',
  '                detail=f"{label} : fichier trop volumineux (max {settings.max_file_size_mb} MB).",',
  '            )',
  '        try:',
  '            return service.extract_from_bytes(content_bytes, fichier.filename or "unknown")',
  '        except IngestionError as e:',
  '            raise HTTPException(status_code=e.status_code, detail=f"{label} : {e.message}")',
  '',
  '    if texte:',
  '        try:',
  '            return service.extract_from_text(texte)',
  '        except Exception as e:',
  '            raise HTTPException(status_code=400, detail=f"{label} : {str(e)}")',
  '',
  '    raise HTTPException(',
  '        status_code=400,',
  '        detail=f"{label} : fournir soit un fichier soit un texte.",',
  '    )',
  '',
  '',
  '@router.post("/generate", summary="Generer un pack complet de candidature")',
  'async def generate_pack(',
  '    fichier_profil: Optional[UploadFile] = File(None),',
  '    fichier_offre: Optional[UploadFile] = File(None),',
  '    texte_profil: Optional[str] = Form(None),',
  '    texte_offre: Optional[str] = Form(None),',
  '    output_language: str = Form("fr"),',
  '    inclure_relance: bool = Form(False),',
  '    relance_wait_days: int = Form(7),',
  '):',
  '    """',
  '    Pipeline complet :',
  '    1. Ingestion du profil et de l offre',
  '    2. Detection langue + conventions culturelles',
  '    3. Generation CV structure (IA)',
  '    4. Generation Lettre + Guide + Relance (IA)',
  '    5. Assemblage des documents Word',
  '    6. Compression ZIP',
  '    7. Retour du ZIP telechargeable',
  '    """',
  '    logger.info(',
  '        "generate_start",',
  '        output_language=output_language,',
  '        inclure_relance=inclure_relance,',
  '    )',
  '',
  '    # ============================================================',
  '    # 1. Extraction',
  '    # ============================================================',
  '    profil = await _extraire_entree(fichier_profil, texte_profil, "Profil")',
  '    offre = await _extraire_entree(fichier_offre, texte_offre, "Offre")',
  '',
  '    if len(profil) < 50:',
  '        raise HTTPException(status_code=400, detail="Profil trop court (min 50 caracteres).")',
  '    if len(offre) < 50:',
  '        raise HTTPException(status_code=400, detail="Offre trop courte (min 50 caracteres).")',
  '',
  '    # ============================================================',
  '    # 2. Conventions culturelles',
  '    # ============================================================',
  '    locale = get_locale_conventions(output_language)',
  '    logger.info("locale_resolved", language=output_language, country=locale.get("country"))',
  '',
  '    orchestrator = get_orchestrator()',
  '',
  '    # ============================================================',
  '    # 3. CV',
  '    # ============================================================',
  '    try:',
  '        sys_prompt, user_prompt = get_cv_prompt(profil, offre, locale, output_language)',
  '        cv_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except AppError:',
  '        raise',
  '    except Exception as e:',
  '        logger.exception("cv_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation CV : {str(e)}")',
  '',
  '    # Contexte strategique pour harmoniser les autres documents',
  '    coordonnees = cv_data.get("coordonnees", {})',
  '    nom_candidat = coordonnees.get("nom_complet", "Candidat")',
  '    analyse = cv_data.get("analyse", {})',
  '    cv_contexte = (',
  '        f"Candidat: {nom_candidat}\\n"',
  '        f"Poste vise: {cv_data.get(\'titre_professionnel\', \'\')}\\n"',
  '        f"Score: {analyse.get(\'score_matching\', 0)}/100\\n"',
  '        f"Points forts: {\', \'.join(analyse.get(\'points_forts\', []))}\\n"',
  '        f"Strategie: {analyse.get(\'strategie_candidature\', \'\')}"',
  '    )',
  '',
  '    # ============================================================',
  '    # 4. Lettre',
  '    # ============================================================',
  '    try:',
  '        sys_prompt, user_prompt = get_lettre_prompt(cv_contexte, offre, locale, output_language)',
  '        lettre_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except Exception as e:',
  '        logger.exception("lettre_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation Lettre : {str(e)}")',
  '',
  '    # ============================================================',
  '    # 5. Guide',
  '    # ============================================================',
  '    try:',
  '        sys_prompt, user_prompt = get_guide_prompt(cv_contexte, offre, locale, output_language)',
  '        guide_data = orchestrator.generate_json(sys_prompt, user_prompt)',
  '    except Exception as e:',
  '        logger.exception("guide_generation_failed", error=str(e))',
  '        raise HTTPException(status_code=502, detail=f"Erreur generation Guide : {str(e)}")',
  '',
  '    # ============================================================',
  '    # 6. Relance (optionnel)',
  '    # ============================================================',
  '    relance_data = None',
  '    if inclure_relance:',
  '        try:',
  '            entreprise = guide_data.get("nom_entreprise", "Entreprise")',
  '            poste = guide_data.get("titre_poste", cv_data.get("titre_professionnel", "Poste"))',
  '            sys_prompt, user_prompt = get_relance_prompt(',
  '                nom_candidat, poste, entreprise, relance_wait_days, locale, output_language',
  '            )',
  '            relance_ia = orchestrator.generate_json(sys_prompt, user_prompt)',
  '            relance_data = {',
  '                "company_name": entreprise,',
  '                "job_title": poste,',
  '                "wait_days": relance_wait_days,',
  '                "subject": relance_ia.get("subject", ""),',
  '                "body": relance_ia.get("body", ""),',
  '                "signature": relance_ia.get("signature", ""),',
  '            }',
  '        except Exception as e:',
  '            logger.warning("relance_generation_failed", error=str(e))',
  '            relance_data = None',
  '',
  '    # ============================================================',
  '    # 7. Assemblage des documents',
  '    # ============================================================',
  '    try:',
  '        builder = get_pack_builder()',
  '        pack_name = f"Pack_{nom_candidat.replace(\' \', \'_\')}"',
  '        result = builder.build_pack(',
  '            cv_data=cv_data,',
  '            lettre_data=lettre_data,',
  '            guide_data=guide_data,',
  '            relance_data=relance_data,',
  '            locale=locale,',
  '            pack_name=pack_name,',
  '        )',
  '    except GenerationError as e:',
  '        logger.exception("pack_build_failed", error=str(e))',
  '        raise HTTPException(status_code=500, detail=f"Erreur assemblage : {e.message}")',
  '',
  '    # ============================================================',
  '    # 8. Retour du ZIP',
  '    # ============================================================',
  '    zip_path = result["zip_path"]',
  '    if not os.path.exists(zip_path):',
  '        raise HTTPException(status_code=500, detail="Le ZIP n a pas ete cree.")',
  '',
  '    logger.info("generate_success", zip_path=zip_path, documents=len(result["documents"]))',
  '',
  '    return FileResponse(',
  '        path=zip_path,',
  '        filename=os.path.basename(zip_path),',
  '        media_type="application/zip",',
  '    )',
  '',
  '',
  '@router.get("/generate/info", summary="Informations sur le pipeline de generation")',
  'async def generate_info() -> dict:',
  '    """Retourne les informations sur le pipeline (langues supportees, PDF dispo)."""',
  '    from app.services.generation.pdf_export import pdf_disponible',
  '    from app.services.language.locale_map import list_supported_locales',
  '',
  '    return {',
  '        "supported_languages": list_supported_locales(),',
  '        "pdf_available": pdf_disponible(),',
  '        "max_file_size_mb": get_settings().max_file_size_mb,',
  '    }',
]);

// ============================================================
// 7. METTRE À JOUR main.py
// ============================================================

logStep('7. main.py (ajout du router generation)');

const mainPath = path.join(ROOT, 'backend', 'app', 'main.py');

if (!fs.existsSync(mainPath)) {
  console.error('  ERREUR : main.py introuvable.');
  process.exit(1);
}

let mainContent = fs.readFileSync(mainPath, 'utf-8');
const originalContent = mainContent;

// Normaliser l'import : ajouter generation s'il n'y est pas
if (!mainContent.includes('from app.routers import health, ingestion, generation')) {
  // Remplacer la ligne d'import existante
  mainContent = mainContent.replace(
    /from app\.routers import ([^\n]+)/,
    (match, modules) => {
      const mods = modules.split(',').map(m => m.trim());
      if (!mods.includes('generation')) {
        mods.push('generation');
      }
      return 'from app.routers import ' + mods.join(', ');
    }
  );
}

// Normaliser l'include_router : ajouter generation s'il n'y est pas
if (!mainContent.includes('app.include_router(generation.router)')) {
  mainContent = mainContent.replace(
    /(\s+)app\.include_router\(ingestion\.router\)/,
    '$1app.include_router(ingestion.router)\n$1app.include_router(generation.router)'
  );
}

if (mainContent !== originalContent) {
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log('  OK  backend/app/main.py (mis a jour)');
} else {
  console.log('  SKIP  backend/app/main.py (deja a jour)');
}

// Vérification
const finalContent = fs.readFileSync(mainPath, 'utf-8');
const hasImport = finalContent.includes('generation');
const hasInclude = finalContent.includes('app.include_router(generation.router)');

if (!hasImport || !hasInclude) {
  console.log('');
  console.log('  ATTENTION : La mise a jour automatique de main.py a echoue.');
  console.log('  Verifie manuellement que main.py contient :');
  console.log('    from app.routers import health, ingestion, generation');
  console.log('    app.include_router(health.router)');
  console.log('    app.include_router(ingestion.router)');
  console.log('    app.include_router(generation.router)');
}

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 3d terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/ai/prompts/__init__.py');
console.log('    - backend/app/services/ai/prompts/cv_prompt.py');
console.log('    - backend/app/services/ai/prompts/lettre_prompt.py');
console.log('    - backend/app/services/ai/prompts/guide_prompt.py');
console.log('    - backend/app/services/ai/prompts/relance_prompt.py');
console.log('    - backend/app/routers/generation.py');
console.log('');
console.log('  Fichiers mis a jour :');
console.log('    - backend/app/main.py');
console.log('');
console.log('  VERIFICATION CRITIQUE :');
console.log('');
console.log('  1. Verifier que prompts/ existe :');
console.log('     dir backend\\app\\services\\ai\\prompts');
console.log('     # Doit afficher : __init__.py, cv_prompt.py, lettre_prompt.py,');
console.log('     #                 guide_prompt.py, relance_prompt.py');
console.log('');
console.log('  2. Redemarrer uvicorn (CRITIQUE) :');
console.log('     CTRL+C');
console.log('     uvicorn app.main:app --reload');
console.log('');
console.log('  3. Verifier que /api/generate est charge :');
console.log('     (irm http://localhost:8000/openapi.json).paths | Get-Member -MemberType NoteProperty | Select-Object Name');
console.log('     # Attendu : /, /health, /api/ingest, /api/generate, /api/generate/info');
console.log('');
console.log('  4. Tester avec Swagger :');
console.log('     http://localhost:8000/docs');
console.log('');
console.log('  Prochaine etape : setup-phase3e.js (tests unitaires Phase 3)');
console.log('');