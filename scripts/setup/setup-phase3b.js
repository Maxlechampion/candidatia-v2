#!/usr/bin/env node
/**
 * setup-phase3b.js — CandidatIA
 * Phase 3b : Word Lettre + Guide + Relance
 *
 * Crée :
 *   - backend/app/services/generation/word_lettre.py
 *   - backend/app/services/generation/word_guide.py
 *   - backend/app/services/generation/word_relance.py
 *
 * Usage : node setup-phase3b.js
 * Prérequis : avoir exécuté setup-phase3a.js
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

logHeader('CandidatIA — Setup Phase 3b : Lettre + Guide + Relance');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'generation', 'word_cv.py'))) {
  console.error('');
  console.error('  ERREUR : word_cv.py introuvable.');
  console.error('  Execute d abord setup-phase3a.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. WORD LETTRE
// ============================================================

logStep('1. word_lettre.py (Lettre de motivation)');

writeLines('backend/app/services/generation/word_lettre.py', [
  '"""',
  'Generateur Word : Lettre de motivation.',
  '',
  'Format epistolaire traditionnel adapte a la culture cible.',
  'Le contenu du corps est fourni par l IA (4 paragraphes style AIDA).',
  '"""',
  '',
  'from typing import Any, Dict',
  '',
  'from docx import Document',
  'from docx.shared import Pt',
  '',
  'from app.core.logging import get_logger',
  'from app.services.generation.base import DocumentGenerator',
  'from app.services.generation.style import (',
  '    ALIGN_DROITE,',
  '    ALIGN_JUSTIFIE,',
  '    COULEUR_PRIMAIRE,',
  '    ajouter_paragraphe,',
  '    configurer_marges,',
  '    configurer_style_normal,',
  ')',
  '',
  'logger = get_logger("generation.word_lettre")',
  '',
  '',
  'class WordLettreGenerator(DocumentGenerator):',
  '    name = "word_lettre"',
  '',
  '    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:',
  '        doc = Document()',
  '        configurer_marges(doc, top=1.0, bottom=1.0, left=1.0, right=1.0)',
  '        configurer_style_normal(doc, taille=11)',
  '',
  '        # ============================================================',
  '        # EN-TETE EXPEDITEUR',
  '        # ============================================================',
  '        expediteur = data.get("expediteur", "")',
  '        if expediteur:',
  '            for ligne in expediteur.split("\\n"):',
  '                ajouter_paragraphe(doc, ligne, taille=10, espace_apres=0)',
  '',
  '        # Espace',
  '        for _ in range(2):',
  '            ajouter_paragraphe(doc, "", taille=11)',
  '',
  '        # ============================================================',
  '        # DESTINATAIRE',
  '        # ============================================================',
  '        destinataire = data.get("destinataire", "")',
  '        if destinataire:',
  '            for ligne in destinataire.split("\\n"):',
  '                ajouter_paragraphe(doc, ligne, taille=10, alignement=ALIGN_DROITE, espace_apres=0)',
  '',
  '        # Espace',
  '        for _ in range(2):',
  '            ajouter_paragraphe(doc, "", taille=11)',
  '',
  '        # ============================================================',
  '        # LIEU ET DATE',
  '        # ============================================================',
  '        lieu_date = data.get("lieu_date", "")',
  '        if lieu_date:',
  '            ajouter_paragraphe(doc, lieu_date, taille=10, alignement=ALIGN_DROITE, espace_apres=12)',
  '',
  '        # ============================================================',
  '        # OBJET',
  '        # ============================================================',
  '        objet = data.get("objet", "")',
  '        if objet:',
  '            p = doc.add_paragraph()',
  '            r = p.add_run("Objet : ")',
  '            r.bold = True',
  '            r.font.size = Pt(11)',
  '            r.font.color.rgb = COULEUR_PRIMAIRE',
  '            r_obj = p.add_run(objet)',
  '            r_obj.bold = True',
  '            r_obj.font.size = Pt(11)',
  '            p.paragraph_format.space_after = Pt(18)',
  '',
  '        # ============================================================',
  '        # CORPS DE LA LETTRE',
  '        # ============================================================',
  '        corps = data.get("corps_paragraphes", [])',
  '        for para in corps:',
  '            p = doc.add_paragraph()',
  '            r = p.add_run(para)',
  '            r.font.size = Pt(11)',
  '            p.alignment = ALIGN_JUSTIFIE',
  '            p.paragraph_format.space_after = Pt(12)',
  '            p.paragraph_format.line_spacing = 1.15',
  '',
  '        # ============================================================',
  '        # SIGNATURE',
  '        # ============================================================',
  '        if corps:',
  '            ajouter_paragraphe(doc, "", taille=11)',
  '            expediteur_nom = expediteur.split("\\n")[0] if expediteur else ""',
  '            if expediteur_nom:',
  '                ajouter_paragraphe(',
  '                    doc,',
  '                    expediteur_nom,',
  '                    taille=11,',
  '                    gras=True,',
  '                    alignement=ALIGN_DROITE,',
  '                )',
  '',
  '        logger.info(',
  '            "word_lettre_built",',
  '            nb_paragraphes=len(corps),',
  '            country=locale.get("country", "unknown"),',
  '            format=locale.get("letter_format", "unknown"),',
  '        )',
  '',
  '        return doc',
]);

// ============================================================
// 2. WORD GUIDE
// ============================================================

logStep('2. word_guide.py (Guide d entretien)');

writeLines('backend/app/services/generation/word_guide.py', [
  '"""',
  'Generateur Word : Guide de preparation a l entretien.',
  '',
  'Structure :',
  '  - Titre (poste + entreprise)',
  '  - Analyse des enjeux caches de l entreprise',
  '  - Questions probables avec strategie de reponse',
  '  - Questions a poser en fin d entretien',
  '"""',
  '',
  'from typing import Any, Dict',
  '',
  'from docx import Document',
  'from docx.shared import Pt',
  '',
  'from app.core.logging import get_logger',
  'from app.services.generation.base import DocumentGenerator',
  'from app.services.generation.style import (',
  '    ALIGN_CENTRE,',
  '    COULEUR_PRIMAIRE,',
  '    COULEUR_SECONDAIRE,',
  '    ajouter_paragraphe,',
  '    ajouter_puce,',
  '    ajouter_titre_section,',
  '    configurer_marges,',
  '    configurer_style_normal,',
  ')',
  '',
  'logger = get_logger("generation.word_guide")',
  '',
  '',
  'class WordGuideGenerator(DocumentGenerator):',
  '    name = "word_guide"',
  '',
  '    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:',
  '        doc = Document()',
  '        configurer_marges(doc, top=1.0, bottom=1.0, left=1.0, right=1.0)',
  '        configurer_style_normal(doc, taille=11)',
  '',
  '        # ============================================================',
  '        # TITRE PRINCIPAL',
  '        # ============================================================',
  '        titre_poste = data.get("titre_poste", "Poste")',
  '        nom_entreprise = data.get("nom_entreprise", "Entreprise")',
  '',
  '        p_titre = doc.add_paragraph()',
  '        r_titre = p_titre.add_run("GUIDE DE PREPARATION A L ENTRETIEN")',
  '        r_titre.bold = True',
  '        r_titre.font.size = Pt(16)',
  '        r_titre.font.color.rgb = COULEUR_PRIMAIRE',
  '        p_titre.alignment = ALIGN_CENTRE',
  '        p_titre.paragraph_format.space_after = Pt(4)',
  '',
  '        p_sous_titre = doc.add_paragraph()',
  '        r_st = p_sous_titre.add_run(f"{titre_poste} — {nom_entreprise}")',
  '        r_st.italic = True',
  '        r_st.font.size = Pt(12)',
  '        r_st.font.color.rgb = COULEUR_SECONDAIRE',
  '        p_sous_titre.alignment = ALIGN_CENTRE',
  '        p_sous_titre.paragraph_format.space_after = Pt(20)',
  '',
  '        # ============================================================',
  '        # 1. ENJEUX CACHES',
  '        # ============================================================',
  '        defis = data.get("defis_cles_entreprise", [])',
  '        if defis:',
  '            ajouter_titre_section(doc, "1. Analyse des enjeux caches de l entreprise")',
  '',
  '            ajouter_paragraphe(',
  '                doc,',
  '                "Points sur lesquels insister lors de l entretien :",',
  '                taille=10,',
  '                italique=True,',
  '                espace_apres=6,',
  '            )',
  '',
  '            for defi in defis:',
  '                ajouter_puce(doc, defi, indent=0.15)',
  '',
  '        # ============================================================',
  '        # 2. QUESTIONS PROBABLES',
  '        # ============================================================',
  '        questions = data.get("questions_probables", [])',
  '        if questions:',
  '            ajouter_titre_section(doc, "2. Questions probables et strategies de reponse")',
  '',
  '            for i, q in enumerate(questions, 1):',
  '                # Question',
  '                p_q = doc.add_paragraph()',
  '                p_q.paragraph_format.space_before = Pt(10)',
  '                p_q.paragraph_format.space_after = Pt(4)',
  '                r_q = p_q.add_run(f"Question {i} : ")',
  '                r_q.bold = True',
  '                r_q.font.size = Pt(11)',
  '                r_q.font.color.rgb = COULEUR_PRIMAIRE',
  '                r_qtext = p_q.add_run(q.get("question", ""))',
  '                r_qtext.bold = True',
  '                r_qtext.font.size = Pt(11)',
  '',
  '                # Intention du recruteur',
  '                p_int = doc.add_paragraph()',
  '                p_int.paragraph_format.left_indent = Pt(10)',
  '                p_int.paragraph_format.space_after = Pt(3)',
  '                r_int_l = p_int.add_run("Ce que le recruteur cherche : ")',
  '                r_int_l.italic = True',
  '                r_int_l.font.size = Pt(10)',
  '                r_int_l.font.color.rgb = COULEUR_SECONDAIRE',
  '                r_int_v = p_int.add_run(q.get("intention_recruteur", ""))',
  '                r_int_v.italic = True',
  '                r_int_v.font.size = Pt(10)',
  '',
  '                # Strategie de reponse',
  '                p_strat = doc.add_paragraph()',
  '                p_strat.paragraph_format.left_indent = Pt(10)',
  '                p_strat.paragraph_format.space_after = Pt(4)',
  '                r_strat_l = p_strat.add_run("Votre strategie gagnante : ")',
  '                r_strat_l.bold = True',
  '                r_strat_l.font.size = Pt(10)',
  '                r_strat_l.font.color.rgb = COULEUR_PRIMAIRE',
  '                r_strat_v = p_strat.add_run(q.get("strategie_reponse", ""))',
  '                r_strat_v.font.size = Pt(10)',
  '',
  '        # ============================================================',
  '        # 3. QUESTIONS A POSER',
  '        # ============================================================',
  '        questions_poser = data.get("questions_a_poser", [])',
  '        if questions_poser:',
  '            ajouter_titre_section(doc, "3. Vos questions pour marquer des points")',
  '',
  '            ajouter_paragraphe(',
  '                doc,',
  '                "Posez au moins deux de ces questions en fin d entretien :",',
  '                taille=10,',
  '                italique=True,',
  '                espace_apres=6,',
  '            )',
  '',
  '            for q in questions_poser:',
  '                ajouter_puce(doc, q, indent=0.15)',
  '',
  '        logger.info(',
  '            "word_guide_built",',
  '            poste=titre_poste,',
  '            entreprise=nom_entreprise,',
  '            nb_questions=len(questions),',
  '        )',
  '',
  '        return doc',
]);

// ============================================================
// 3. WORD RELANCE
// ============================================================

logStep('3. word_relance.py (Brouillon de relance)');

writeLines('backend/app/services/generation/word_relance.py', [
  '"""',
  'Generateur Word : Brouillon de relance apres candidature.',
  '',
  'Format email professionnel court, a envoyer manuellement par l utilisateur.',
  '"""',
  '',
  'from typing import Any, Dict',
  '',
  'from docx import Document',
  'from docx.shared import Pt',
  '',
  'from app.core.logging import get_logger',
  'from app.services.generation.base import DocumentGenerator',
  'from app.services.generation.style import (',
  '    COULEUR_PRIMAIRE,',
  '    ajouter_paragraphe,',
  '    configurer_marges,',
  '    configurer_style_normal,',
  ')',
  '',
  'logger = get_logger("generation.word_relance")',
  '',
  '',
  'class WordRelanceGenerator(DocumentGenerator):',
  '    name = "word_relance"',
  '',
  '    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:',
  '        doc = Document()',
  '        configurer_marges(doc, top=1.0, bottom=1.0, left=1.0, right=1.0)',
  '        configurer_style_normal(doc, taille=11)',
  '',
  '        # En-tete',
  '        ajouter_paragraphe(',
  '            doc,',
  '            "BROUILLON DE RELANCE",',
  '            taille=14,',
  '            gras=True,',
  '            couleur=COULEUR_PRIMAIRE,',
  '            espace_apres=12,',
  '        )',
  '',
  '        # Metadata',
  '        company = data.get("company_name", "")',
  '        job = data.get("job_title", "")',
  '        wait_days = data.get("wait_days", 7)',
  '',
  '        ajouter_paragraphe(doc, f"Entreprise : {company}", taille=10, espace_apres=2)',
  '        ajouter_paragraphe(doc, f"Poste : {job}", taille=10, espace_apres=2)',
  '        ajouter_paragraphe(',
  '            doc,',
  '            f"Relance apres : {wait_days} jours",',
  '            taille=10,',
  '            italique=True,',
  '            espace_apres=16,',
  '        )',
  '',
  '        # Objet',
  '        p = doc.add_paragraph()',
  '        r = p.add_run("Objet : ")',
  '        r.bold = True',
  '        r.font.size = Pt(11)',
  '        r.font.color.rgb = COULEUR_PRIMAIRE',
  '        objet = data.get("subject", f"Relance concernant ma candidature au poste de {job}")',
  '        p.add_run(objet).font.size = Pt(11)',
  '        p.paragraph_format.space_after = Pt(16)',
  '',
  '        # Corps',
  '        corps = data.get("body", "")',
  '        if corps:',
  '            for para in corps.split("\\n\\n"):',
  '                if para.strip():',
  '                    p = doc.add_paragraph()',
  '                    r = p.add_run(para.strip())',
  '                    r.font.size = Pt(11)',
  '                    p.paragraph_format.space_after = Pt(10)',
  '                    p.paragraph_format.line_spacing = 1.15',
  '',
  '        # Signature',
  '        signature = data.get("signature", "")',
  '        if signature:',
  '            ajouter_paragraphe(doc, "", taille=11)',
  '            for ligne in signature.split("\\n"):',
  '                ajouter_paragraphe(doc, ligne, taille=11, espace_apres=0)',
  '',
  '        logger.info(',
  '            "word_relance_built",',
  '            company=company,',
  '            job=job,',
  '            wait_days=wait_days,',
  '        )',
  '',
  '        return doc',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 3b terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/generation/word_lettre.py');
console.log('    - backend/app/services/generation/word_guide.py');
console.log('    - backend/app/services/generation/word_relance.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Verifier les fichiers :');
console.log('     dir backend\\app\\services\\generation');
console.log('     # Doit afficher : __init__.py, base.py, style.py, word_cv.py,');
console.log('     #                 word_lettre.py, word_guide.py, word_relance.py');
console.log('');
console.log('  2. Tester les imports :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('     python -c "from app.services.generation.word_lettre import WordLettreGenerator; from app.services.generation.word_guide import WordGuideGenerator; from app.services.generation.word_relance import WordRelanceGenerator; print(\\"OK\\")"');
console.log('');
console.log('  Prochaine etape : setup-phase3c.js (PDF export + Templates)');
console.log('');