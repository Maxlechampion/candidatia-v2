#!/usr/bin/env node
/**
 * setup-phase3a.js — CandidatIA
 * Phase 3a : Styles + Génération Word CV méthode STAR
 *
 * Crée :
 *   - backend/app/services/generation/__init__.py
 *   - backend/app/services/generation/base.py
 *   - backend/app/services/generation/style.py
 *   - backend/app/services/generation/word_cv.py
 *
 * Usage : node setup-phase3a.js
 * Prérequis : avoir exécuté setup-phase2d.js
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

logHeader('CandidatIA — Setup Phase 3a : Styles + Word CV');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'ingestion', 'service.py'))) {
  console.error('');
  console.error('  ERREUR : Les services d ingestion sont introuvables.');
  console.error('  Execute d abord setup-phase2a.js a setup-phase2d.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. __init__.py
// ============================================================

logStep('1. generation/__init__.py');

writeLines('backend/app/services/generation/__init__.py', [
  '"""Services de generation de documents Word et PDF."""',
]);

// ============================================================
// 2. BASE — interface abstraite
// ============================================================

logStep('2. base.py (interface abstraite DocumentGenerator)');

writeLines('backend/app/services/generation/base.py', [
  '"""Interface abstraite de tout generateur de document."""',
  '',
  'import os',
  'from abc import ABC, abstractmethod',
  'from typing import Any, Dict',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import GenerationError',
  '',
  '',
  'class DocumentGenerator(ABC):',
  '    """Classe abstraite pour un generateur de document Word/PDF."""',
  '',
  '    name: str = "base"',
  '',
  '    @abstractmethod',
  '    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Any:',
  '        """Construit le document (retourne un objet python-docx Document)."""',
  '        ...',
  '',
  '    def generate(self, data: Dict[str, Any], locale: Dict[str, Any], output_filename: str) -> str:',
  '        """Genere le fichier sur disque et retourne son chemin complet."""',
  '        settings = get_settings()',
  '        output_dir = settings.local_storage_path',
  '        os.makedirs(output_dir, exist_ok=True)',
  '        output_path = os.path.join(output_dir, output_filename)',
  '',
  '        try:',
  '            doc = self.build(data, locale)',
  '            doc.save(output_path)',
  '        except GenerationError:',
  '            raise',
  '        except Exception as e:',
  '            raise GenerationError(',
  '                message=f"Erreur generation {self.name}: {str(e)}",',
  '                details={"generator": self.name, "filename": output_filename},',
  '            ) from e',
  '',
  '        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:',
  '            raise GenerationError(',
  '                message=f"Le fichier {output_filename} n a pas ete cree correctement.",',
  '                details={"generator": self.name},',
  '            )',
  '',
  '        return output_path',
]);

// ============================================================
// 3. STYLE — helpers python-docx
// ============================================================

logStep('3. style.py (couleurs, polices, helpers Word)');

writeLines('backend/app/services/generation/style.py', [
  '"""Helpers de mise en forme Word (python-docx)."""',
  '',
  'from docx.oxml import OxmlElement',
  'from docx.oxml.ns import qn',
  'from docx.shared import Inches, Pt, RGBColor',
  'from docx.enum.text import WD_ALIGN_PARAGRAPH',
  '',
  '',
  '# ============================================================',
  '# PALETTE DE COULEURS',
  '# ============================================================',
  '',
  'COULEUR_PRIMAIRE = RGBColor(27, 54, 93)      # Bleu nuit',
  'COULEUR_SECONDAIRE = RGBColor(80, 80, 80)    # Gris anthracite',
  'COULEUR_ACCENT = RGBColor(79, 70, 229)       # Indigo',
  'COULEUR_NOIR = RGBColor(0, 0, 0)',
  'COULEUR_BLANC = RGBColor(255, 255, 255)',
  '',
  '',
  '# ============================================================',
  '# POLICES',
  '# ============================================================',
  '',
  'POLICE_PRINCIPALE = "Calibri"',
  'POLICE_ALTERNATIVE = "Arial"',
  '',
  '',
  '# ============================================================',
  '# HELPERS',
  '# ============================================================',
  '',
  '',
  'def configurer_marges(doc, top=0.6, bottom=0.6, left=0.6, right=0.6) -> None:',
  '    """Configure les marges de toutes les sections du document."""',
  '    for section in doc.sections:',
  '        section.top_margin = Inches(top)',
  '        section.bottom_margin = Inches(bottom)',
  '        section.left_margin = Inches(left)',
  '        section.right_margin = Inches(right)',
  '',
  '',
  'def configurer_style_normal(doc, police=POLICE_PRINCIPALE, taille=10, couleur=COULEUR_SECONDAIRE) -> None:',
  '    """Configure le style Normal du document."""',
  '    style = doc.styles["Normal"]',
  '    style.font.name = police',
  '    style.font.size = Pt(taille)',
  '    style.font.color.rgb = couleur',
  '',
  '',
  'def ajouter_bordure_inferieure(paragraphe, couleur_hex="1B365D", epaisseur="6") -> None:',
  '    """Ajoute une bordure inferieure a un paragraphe."""',
  '    pPr = paragraphe._p.get_or_add_pPr()',
  '    pBdr = OxmlElement("w:pBdr")',
  '    bottom = OxmlElement("w:bottom")',
  '    bottom.set(qn("w:val"), "single")',
  '    bottom.set(qn("w:sz"), epaisseur)',
  '    bottom.set(qn("w:space"), "4")',
  '    bottom.set(qn("w:color"), couleur_hex)',
  '    pBdr.append(bottom)',
  '    pPr.append(pBdr)',
  '',
  '',
  'def ajouter_paragraphe(doc, texte="", taille=10, gras=False, italique=False,',
  '                       couleur=None, alignement=None, espace_avant=0,',
  '                       espace_apres=0, indent_gauche=0):',
  '    """Ajoute un paragraphe avec mise en forme."""',
  '    p = doc.add_paragraph()',
  '',
  '    if texte:',
  '        run = p.add_run(texte)',
  '        run.bold = gras',
  '        run.italic = italique',
  '        run.font.size = Pt(taille)',
  '        if couleur:',
  '            run.font.color.rgb = couleur',
  '',
  '    if alignement is not None:',
  '        p.alignment = alignement',
  '',
  '    p.paragraph_format.space_before = Pt(espace_avant)',
  '    p.paragraph_format.space_after = Pt(espace_apres)',
  '    if indent_gauche:',
  '        p.paragraph_format.left_indent = Inches(indent_gauche)',
  '',
  '    return p',
  '',
  '',
  'def ajouter_titre_section(doc, texte, couleur=COULEUR_PRIMAIRE, taille=11):',
  '    """Ajoute un titre de section avec bordure inferieure."""',
  '    p = doc.add_paragraph()',
  '    p.paragraph_format.space_before = Pt(12)',
  '    p.paragraph_format.space_after = Pt(4)',
  '    run = p.add_run(texte.upper())',
  '    run.bold = True',
  '    run.font.size = Pt(taille)',
  '    run.font.color.rgb = couleur',
  '    ajouter_bordure_inferieure(p)',
  '    return p',
  '',
  '',
  'def ajouter_puce(doc, texte, indent=0.15):',
  '    """Ajoute une puce."""',
  '    p = doc.add_paragraph(texte, style="List Bullet")',
  '    p.paragraph_format.left_indent = Inches(indent)',
  '    return p',
  '',
  '',
  'def ajouter_espace(doc, points=6):',
  '    """Ajoute un espace vertical."""',
  '    p = doc.add_paragraph()',
  '    p.paragraph_format.space_before = Pt(0)',
  '    p.paragraph_format.space_after = Pt(0)',
  '    run = p.add_run("")',
  '    run.font.size = Pt(points)',
  '    return p',
  '',
  '',
  'def ajouter_separateur(doc, couleur_hex="CCCCCC"):',
  '    """Ajoute un separateur horizontal discret."""',
  '    p = doc.add_paragraph()',
  '    p.paragraph_format.space_before = Pt(4)',
  '    p.paragraph_format.space_after = Pt(4)',
  '    ajouter_bordure_inferieure(p, couleur_hex=couleur_hex, epaisseur="4")',
  '    return p',
  '',
  '',
  '# ============================================================',
  '# ENUM ALIGNEMENT',
  '# ============================================================',
  '',
  'ALIGN_GAUCHE = WD_ALIGN_PARAGRAPH.LEFT',
  'ALIGN_CENTRE = WD_ALIGN_PARAGRAPH.CENTER',
  'ALIGN_DROITE = WD_ALIGN_PARAGRAPH.RIGHT',
  'ALIGN_JUSTIFIE = WD_ALIGN_PARAGRAPH.JUSTIFY',
]);

// ============================================================
// 4. WORD CV — méthode STAR
// ============================================================

logStep('4. word_cv.py (CV methode STAR)');

writeLines('backend/app/services/generation/word_cv.py', [
  '"""',
  'Generateur Word : CV methode STAR.',
  '',
  'Genere un CV professionnel adapte a la culture cible (locale).',
  'Utilise la methode STAR pour les experiences :',
  '  - Situation / Tache (contexte)',
  '  - Actions menees',
  '  - Resultats quantifiables',
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
  '    ALIGN_JUSTIFIE,',
  '    COULEUR_PRIMAIRE,',
  '    COULEUR_SECONDAIRE,',
  '    ajouter_espace,',
  '    ajouter_paragraphe,',
  '    ajouter_puce,',
  '    ajouter_titre_section,',
  '    configurer_marges,',
  '    configurer_style_normal,',
  ')',
  '',
  'logger = get_logger("generation.word_cv")',
  '',
  '',
  'class WordCVGenerator(DocumentGenerator):',
  '    name = "word_cv"',
  '',
  '    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:',
  '        doc = Document()',
  '        configurer_marges(doc)',
  '        configurer_style_normal(doc)',
  '',
  '        # ============================================================',
  '        # EN-TETE',
  '        # ============================================================',
  '        coordonnees = data.get("coordonnees", {})',
  '        nom_complet = coordonnees.get("nom_complet", "Candidat")',
  '',
  '        # Nom',
  '        p_nom = doc.add_paragraph()',
  '        r_nom = p_nom.add_run(nom_complet.upper())',
  '        r_nom.bold = True',
  '        r_nom.font.size = Pt(18)',
  '        r_nom.font.color.rgb = COULEUR_PRIMAIRE',
  '        p_nom.alignment = ALIGN_CENTRE',
  '        p_nom.paragraph_format.space_after = Pt(2)',
  '',
  '        # Coordonnees',
  '        contact_parts = []',
  '        if coordonnees.get("telephone"):',
  '            contact_parts.append(coordonnees["telephone"])',
  '        if coordonnees.get("email"):',
  '            contact_parts.append(coordonnees["email"])',
  '        if coordonnees.get("adresse"):',
  '            contact_parts.append(coordonnees["adresse"])',
  '',
  '        if contact_parts:',
  '            ajouter_paragraphe(',
  '                doc,',
  '                " | ".join(contact_parts),',
  '                taille=9,',
  '                couleur=COULEUR_SECONDAIRE,',
  '                alignement=ALIGN_CENTRE,',
  '                espace_apres=4,',
  '            )',
  '',
  '        # Liens (LinkedIn, GitHub, etc.)',
  '        liens = coordonnees.get("liens", [])',
  '        if liens:',
  '            ajouter_paragraphe(',
  '                doc,',
  '                " | ".join(liens),',
  '                taille=9,',
  '                couleur=COULEUR_SECONDAIRE,',
  '                alignement=ALIGN_CENTRE,',
  '                espace_apres=6,',
  '            )',
  '',
  '        # ============================================================',
  '        # TITRE PROFESSIONNEL + ACCROCHE',
  '        # ============================================================',
  '        titre = data.get("titre_professionnel", "")',
  '        if titre:',
  '            ajouter_paragraphe(',
  '                doc,',
  '                titre.upper(),',
  '                taille=12,',
  '                gras=True,',
  '                couleur=COULEUR_PRIMAIRE,',
  '                alignement=ALIGN_CENTRE,',
  '                espace_apres=4,',
  '            )',
  '',
  '        accroche = data.get("accroche", "")',
  '        if accroche:',
  '            ajouter_paragraphe(',
  '                doc,',
  '                accroche,',
  '                taille=10,',
  '                italique=True,',
  '                alignement=ALIGN_JUSTIFIE,',
  '                espace_apres=8,',
  '            )',
  '',
  '        # ============================================================',
  '        # COMPETENCES CLES',
  '        # ============================================================',
  '        tech_skills = data.get("competences_techniques", [])',
  '        hum_skills = data.get("competences_humaines", [])',
  '',
  '        if tech_skills or hum_skills:',
  '            ajouter_titre_section(doc, "Competences cles")',
  '',
  '            if tech_skills:',
  '                p = doc.add_paragraph()',
  '                r = p.add_run("Techniques : ")',
  '                r.bold = True',
  '                r.font.size = Pt(10)',
  '                p.add_run(", ".join(tech_skills))',
  '                p.paragraph_format.space_after = Pt(2)',
  '',
  '            if hum_skills:',
  '                p = doc.add_paragraph()',
  '                r = p.add_run("Humaines : ")',
  '                r.bold = True',
  '                r.font.size = Pt(10)',
  '                p.add_run(", ".join(hum_skills))',
  '                p.paragraph_format.space_after = Pt(2)',
  '',
  '        # ============================================================',
  '        # EXPERIENCES (METHODE STAR)',
  '        # ============================================================',
  '        experiences = data.get("experiences", [])',
  '        if experiences:',
  '            ajouter_titre_section(doc, "Experiences professionnelles")',
  '',
  '            for exp in experiences:',
  '                # Ligne 1 : Poste + Entreprise',
  '                p = doc.add_paragraph()',
  '                p.paragraph_format.space_before = Pt(6)',
  '                p.paragraph_format.space_after = Pt(2)',
  '',
  '                poste = exp.get("poste", "")',
  '                entreprise = exp.get("entreprise", "")',
  '                lieu = exp.get("lieu", "")',
  '                periode = exp.get("periode", "")',
  '',
  '                r_poste = p.add_run(poste)',
  '                r_poste.bold = True',
  '                r_poste.font.size = Pt(11)',
  '                r_poste.font.color.rgb = COULEUR_PRIMAIRE',
  '',
  '                if entreprise:',
  '                    r_sep = p.add_run(" — ")',
  '                    r_sep.font.size = Pt(10)',
  '                    r_ent = p.add_run(entreprise)',
  '                    r_ent.italic = True',
  '                    r_ent.font.size = Pt(10)',
  '',
  '                if lieu or periode:',
  '                    details_parts = [x for x in [lieu, periode] if x]',
  '                    r_details = p.add_run(" (" + ", ".join(details_parts) + ")")',
  '                    r_details.italic = True',
  '                    r_details.font.size = Pt(9)',
  '                    r_details.font.color.rgb = COULEUR_SECONDAIRE',
  '',
  '                # Contexte (Situation / Tache)',
  '                situation = exp.get("situation_tache", "")',
  '                if situation:',
  '                    p_ctx = doc.add_paragraph()',
  '                    p_ctx.paragraph_format.left_indent = Pt(10)',
  '                    p_ctx.paragraph_format.space_after = Pt(2)',
  '                    r_label = p_ctx.add_run("[Contexte] ")',
  '                    r_label.bold = True',
  '                    r_label.font.size = Pt(9)',
  '                    r_ctx = p_ctx.add_run(situation)',
  '                    r_ctx.font.size = Pt(9)',
  '',
  '                # Actions menees (puces)',
  '                actions = exp.get("actions_menees", [])',
  '                for action in actions:',
  '                    p_action = doc.add_paragraph(style="List Bullet")',
  '                    p_action.paragraph_format.left_indent = Pt(20)',
  '                    p_action.paragraph_format.space_after = Pt(1)',
  '                    r_action = p_action.add_run(action)',
  '                    r_action.font.size = Pt(9)',
  '',
  '                # Resultats chiffres',
  '                resultats = exp.get("resultats_quantifiables", "")',
  '                if resultats:',
  '                    p_res = doc.add_paragraph()',
  '                    p_res.paragraph_format.left_indent = Pt(10)',
  '                    p_res.paragraph_format.space_after = Pt(4)',
  '                    r_label = p_res.add_run("[Impact] ")',
  '                    r_label.bold = True',
  '                    r_label.font.size = Pt(9)',
  '                    r_label.font.color.rgb = COULEUR_PRIMAIRE',
  '                    r_res = p_res.add_run(resultats)',
  '                    r_res.font.size = Pt(9)',
  '',
  '        # ============================================================',
  '        # FORMATIONS',
  '        # ============================================================',
  '        formations = data.get("formations", [])',
  '        if formations:',
  '            ajouter_titre_section(doc, "Formation")',
  '',
  '            for f in formations:',
  '                p = doc.add_paragraph(style="List Bullet")',
  '                p.paragraph_format.left_indent = Pt(10)',
  '                p.paragraph_format.space_after = Pt(1)',
  '',
  '                diplome = f.get("diplome", "")',
  '                etablissement = f.get("etablissement", "")',
  '                annee = f.get("annee", "")',
  '',
  '                r_dip = p.add_run(diplome)',
  '                r_dip.bold = True',
  '                r_dip.font.size = Pt(9)',
  '',
  '                if etablissement:',
  '                    r_et = p.add_run(f" — {etablissement}")',
  '                    r_et.font.size = Pt(9)',
  '',
  '                if annee:',
  '                    r_an = p.add_run(f" ({annee})")',
  '                    r_an.italic = True',
  '                    r_an.font.size = Pt(9)',
  '',
  '        # ============================================================',
  '        # PROJETS',
  '        # ============================================================',
  '        projets = data.get("projets", [])',
  '        if projets:',
  '            ajouter_titre_section(doc, "Projets")',
  '',
  '            for proj in projets:',
  '                p = doc.add_paragraph(style="List Bullet")',
  '                p.paragraph_format.left_indent = Pt(10)',
  '                p.paragraph_format.space_after = Pt(1)',
  '',
  '                nom = proj.get("nom", "")',
  '                description = proj.get("description", "")',
  '                technos = proj.get("technologies", [])',
  '',
  '                r_nom = p.add_run(nom)',
  '                r_nom.bold = True',
  '                r_nom.font.size = Pt(9)',
  '',
  '                if description:',
  '                    r_desc = p.add_run(f" : {description}")',
  '                    r_desc.font.size = Pt(9)',
  '',
  '                if technos:',
  '                    r_tech = p.add_run(f" [{", ".join(technos)}]")',
  '                    r_tech.italic = True',
  '                    r_tech.font.size = Pt(8)',
  '',
  '        # ============================================================',
  '        # LANGUES + CENTRES D INTERET',
  '        # ============================================================',
  '        langues = data.get("langues", [])',
  '        centres = data.get("centres_interet", [])',
  '',
  '        if langues or centres:',
  '            ajouter_titre_section(doc, "Informations complementaires")',
  '',
  '            if langues:',
  '                p = doc.add_paragraph()',
  '                r = p.add_run("Langues : ")',
  '                r.bold = True',
  '                r.font.size = Pt(9)',
  '                p.add_run(", ".join(langues)).font.size = Pt(9)',
  '                p.paragraph_format.space_after = Pt(2)',
  '',
  '            if centres:',
  '                p = doc.add_paragraph()',
  '                r = p.add_run("Centres d interet : ")',
  '                r.bold = True',
  '                r.font.size = Pt(9)',
  '                p.add_run(", ".join(centres)).font.size = Pt(9)',
  '',
  '        logger.info(',
  '            "word_cv_built",',
  '            nom=nom_complet,',
  '            nb_experiences=len(experiences),',
  '            nb_formations=len(formations),',
  '            country=locale.get("country", "unknown"),',
  '        )',
  '',
  '        return doc',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 3a terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/generation/__init__.py');
console.log('    - backend/app/services/generation/base.py');
console.log('    - backend/app/services/generation/style.py');
console.log('    - backend/app/services/generation/word_cv.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Verifier que les fichiers existent :');
console.log('     dir backend\\app\\services\\generation');
console.log('');
console.log('  2. Tester l import Python :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('     python -c "from app.services.generation.word_cv import WordCVGenerator; print(\\"OK\\")"');
console.log('');
console.log('  3. Generer un CV de test :');
console.log('     python -c "from app.services.generation.word_cv import WordCVGenerator; g = WordCVGenerator(); data = {\\"coordonnees\\": {\\"nom_complet\\": \\"Jean Dupont\\", \\"email\\": \\"jean@example.com\\", \\"telephone\\": \\"0600000000\\", \\"adresse\\": \\"Paris\\", \\"liens\\": []}, \\"titre_professionnel\\": \\"Developpeur Python\\", \\"accroche\\": \\"Expert en developpement backend.\\", \\"competences_techniques\\": [\\"Python\\", \\"FastAPI\\"], \\"competences_humaines\\": [\\"Autonomie\\"], \\"experiences\\": [], \\"formations\\": [], \\"projets\\": [], \\"langues\\": [\\"Francais\\"], \\"centres_interet\\": []}; print(g.generate(data, {}, \\"test_cv.docx\\"))"');
console.log('');
console.log('  Prochaine etape : setup-phase3b.js (Word Lettre + Guide + Relance)');
console.log('');