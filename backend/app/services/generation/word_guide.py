"""Generateur Word : Guide de preparation a l entretien (version enrichie).

Genere un document Word de 10-15 pages, structure en 8 phases d entretien
avec mise en forme professionnelle et navigation claire.
"""

from typing import Any, Dict, List

from docx import Document
from docx.enum.text import WD_BREAK
from docx.shared import Pt, RGBColor

from app.core.logging import get_logger
from app.services.generation.base import DocumentGenerator
from app.services.generation.style import (
    ajouter_filigrane_diagonal,
    ALIGN_CENTRE,
    ALIGN_JUSTIFIE,
    COULEUR_PRIMAIRE,
    COULEUR_SECONDAIRE,
    ajouter_paragraphe,
    ajouter_puce,
    ajouter_titre_section,
    configurer_marges,
    configurer_style_normal,
)

logger = get_logger("generation.word_guide")


# ============================================================
# TRADUCTIONS DES TITRES PAR LANGUE
# ============================================================

TITLES = {
    "fr": {
        "main_title": "GUIDE COMPLET DE PREPARATION A L ENTRETIEN",
        "sous_titre": "Strategie, exemples de reponses et plan d action",
        "synthese_title": "SYNTHESE STRATEGIQUE",
        "pitch_label": "Votre pitch 30 secondes :",
        "forces_label": "Vos 3 forces a marteler :",
        "faiblesses_label": "Vos 3 faiblesses et leurs parades :",
        "checklist_title": "CHECKLIST DE PREPARATION",
        "checklist_logistique": "Preparation logistique",
        "checklist_recherche": "Recherche sur l entreprise",
        "defis_title": "ANALYSE DES ENJEUX CACHES DE L ENTREPRISE",
        "defis_intro": "Points sur lesquels insister strategiquement lors de l entretien :",
        "phases_title": "DEROULEMENT DE L ENTRETIEN PAR PHASE",
        "phase_label": "PHASE",
        "duree_label": "Duree estimee",
        "objectif_label": "Objectif du recruteur",
        "question_label": "Question",
        "intention_label": "Ce que le recruteur cherche vraiment :",
        "strategie_label": "Votre strategie gagnante :",
        "exemple_label": "Exemple de reponse cadre :",
        "pieges_title": "QUESTIONS PIEGES ET TESTS DE PRESSION",
        "piege_label": "Piege",
        "ce_quil_cherche": "Ce qu il cherche vraiment :",
        "parade": "Votre parade tactique :",
        "exemple_piege": "Exemple de reponse cadre :",
        "questions_inter_title": "VOS QUESTIONS A POSER",
        "questions_rh": "A poser au recruteur RH",
        "questions_manager": "A poser au manager technique",
        "questions_dirigeant": "A poser au dirigeant",
        "cloture_title": "CLOTURE ET NEGOCIATION",
        "salarial_label": "Strategie salariale",
        "quand_commencer_label": "Reponse a Quand pouvez-vous commencer ?",
        "erreurs_label": "Les 3 erreurs a ne PAS commettre",
        "question_finale_label": "Votre question de cloture :",
        "conclusion_title": "CONCLUSION",
        "conclusion_text": (
            "Vous avez maintenant entre les mains l integralite de la strategie "
            "pour reussir cet entretien. Relisez ce guide la veille, repetez votre "
            "pitch 30 secondes a voix haute, et arrivez prepare, confiant et authentique. "
            "Bonne chance !"
        ),
    },
    "en": {
        "main_title": "COMPLETE INTERVIEW PREPARATION GUIDE",
        "sous_titre": "Strategy, sample answers and action plan",
        "synthese_title": "STRATEGIC SUMMARY",
        "pitch_label": "Your 30-second pitch:",
        "forces_label": "Your 3 key strengths to emphasize:",
        "faiblesses_label": "Your 3 weaknesses and how to handle them:",
        "checklist_title": "PREPARATION CHECKLIST",
        "checklist_logistique": "Logistics",
        "checklist_recherche": "Company research",
        "defis_title": "ANALYSIS OF THE COMPANY S HIDDEN CHALLENGES",
        "defis_intro": "Points to strategically emphasize during the interview:",
        "phases_title": "INTERVIEW BREAKDOWN BY PHASE",
        "phase_label": "PHASE",
        "duree_label": "Estimated duration",
        "objectif_label": "Recruiter objective",
        "question_label": "Question",
        "intention_label": "What the recruiter is really looking for:",
        "strategie_label": "Your winning strategy:",
        "exemple_label": "Sample answer framework:",
        "pieges_title": "TRICKY QUESTIONS AND PRESSURE TESTS",
        "piege_label": "Trap",
        "ce_quil_cherche": "What they are really after:",
        "parade": "Your tactical counter:",
        "exemple_piege": "Sample answer framework:",
        "questions_inter_title": "YOUR QUESTIONS TO ASK",
        "questions_rh": "Ask the HR recruiter",
        "questions_manager": "Ask the technical manager",
        "questions_dirigeant": "Ask the executive",
        "cloture_title": "CLOSING AND NEGOTIATION",
        "salarial_label": "Salary strategy",
        "quand_commencer_label": "Answer to When can you start?",
        "erreurs_label": "The 3 mistakes to AVOID",
        "question_finale_label": "Your closing question:",
        "conclusion_title": "CONCLUSION",
        "conclusion_text": (
            "You now have the complete strategy to succeed in this interview. "
            "Reread this guide the day before, rehearse your 30-second pitch aloud, "
            "and walk in prepared, confident and authentic. Good luck!"
        ),
    },
}


def _get_titles(locale: Dict[str, Any]) -> Dict[str, str]:
    """Retourne les titres selon la langue (fallback sur l anglais)."""
    language_code = "en"
    if locale:
        for key in ("language_code", "language", "code"):
            if key in locale and locale[key]:
                language_code = str(locale[key]).lower()
                break
    return TITLES.get(language_code, TITLES["en"])


# ============================================================
# HELPERS DE MISE EN FORME
# ============================================================

def _ajouter_saut_de_page(doc: Document) -> None:
    """Ajoute un saut de page."""
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def _ajouter_encadre(doc: Document, titre: str, contenu: str, couleur_fond: str = "F1F5F9") -> None:
    """Ajoute un bloc visuellement distinct (simule un encadre)."""
    # Titre
    p_titre = doc.add_paragraph()
    p_titre.paragraph_format.space_before = Pt(8)
    p_titre.paragraph_format.space_after = Pt(3)
    r = p_titre.add_run(titre)
    r.bold = True
    r.italic = True
    r.font.size = Pt(10)
    r.font.color.rgb = COULEUR_PRIMAIRE

    # Contenu
    p_contenu = doc.add_paragraph()
    p_contenu.paragraph_format.left_indent = Pt(10)
    p_contenu.paragraph_format.space_after = Pt(6)
    r2 = p_contenu.add_run(contenu)
    r2.font.size = Pt(10)
    r2.italic = False


def _ajouter_question_bloc(
    doc: Document,
    numero: int,
    question: str,
    intention: str,
    strategie: str,
    exemple: str,
    titles: Dict[str, str],
) -> None:
    """Ajoute un bloc complet pour une question (question + analyse + strategie + exemple)."""
    # 1. La question
    p_q = doc.add_paragraph()
    p_q.paragraph_format.space_before = Pt(10)
    p_q.paragraph_format.space_after = Pt(4)
    r_q = p_q.add_run(f"{titles['question_label']} {numero} : ")
    r_q.bold = True
    r_q.font.size = Pt(11)
    r_q.font.color.rgb = COULEUR_PRIMAIRE
    r_qt = p_q.add_run(question)
    r_qt.bold = True
    r_qt.font.size = Pt(11)

    # 2. Intention du recruteur
    if intention:
        _ajouter_encadre(doc, titles["intention_label"], intention)

    # 3. Strategie
    if strategie:
        p_s = doc.add_paragraph()
        p_s.paragraph_format.left_indent = Pt(10)
        p_s.paragraph_format.space_after = Pt(3)
        r_l = p_s.add_run(titles["strategie_label"] + " ")
        r_l.bold = True
        r_l.font.size = Pt(10)
        r_l.font.color.rgb = COULEUR_PRIMAIRE
        r_s = p_s.add_run(strategie)
        r_s.font.size = Pt(10)

    # 4. Exemple de reponse cadre (encadre gris)
    if exemple:
        _ajouter_encadre(doc, titles["exemple_label"], exemple)


# ============================================================
# GENERATEUR
# ============================================================



class WordGuideGenerator(DocumentGenerator):
    name = "word_guide"

    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:
        titles = _get_titles(locale)

        doc = Document()
        configurer_marges(doc, top=0.9, bottom=0.9, left=0.9, right=0.9)
        configurer_style_normal(doc, taille=10)

        titre_poste = data.get("titre_poste", "Poste")
        nom_entreprise = data.get("nom_entreprise", "Entreprise")

        # ============================================================
        # PAGE DE COUVERTURE
        # ============================================================
        for _ in range(4):
            ajouter_paragraphe(doc, "", taille=11)

        p = doc.add_paragraph()
        r = p.add_run(titles["main_title"])
        r.bold = True
        r.font.size = Pt(22)
        r.font.color.rgb = COULEUR_PRIMAIRE
        p.alignment = ALIGN_CENTRE

        p2 = doc.add_paragraph()
        r2 = p2.add_run(f"{titre_poste} — {nom_entreprise}")
        r2.bold = True
        r2.font.size = Pt(14)
        r2.font.color.rgb = COULEUR_SECONDAIRE
        p2.alignment = ALIGN_CENTRE
        p2.paragraph_format.space_after = Pt(8)

        p3 = doc.add_paragraph()
        r3 = p3.add_run(titles["sous_titre"])
        r3.italic = True
        r3.font.size = Pt(11)
        r3.font.color.rgb = COULEUR_SECONDAIRE
        p3.alignment = ALIGN_CENTRE

        _ajouter_saut_de_page(doc)

        # ============================================================
        # 1. SYNTHESE STRATEGIQUE
        # ============================================================
        synthese = data.get("synthese_strategique", {}) or {}
        if synthese:
            ajouter_titre_section(doc, titles["synthese_title"])

            # Pitch 30s
            pitch = synthese.get("pitch_30s", "")
            if pitch:
                _ajouter_encadre(doc, titles["pitch_label"], pitch)

            # Forces
            forces = synthese.get("trois_forces_a_valoriser", [])
            if forces:
                ajouter_paragraphe(
                    doc,
                    titles["forces_label"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_avant=8,
                    espace_apres=4,
                )
                for f in forces:
                    ajouter_puce(doc, f, indent=0.2)

            # Faiblesses + parades
            faiblesses = synthese.get("trois_faiblesses_a_gerer", [])
            if faiblesses:
                ajouter_paragraphe(
                    doc,
                    titles["faiblesses_label"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_avant=8,
                    espace_apres=4,
                )
                for item in faiblesses:
                    if isinstance(item, dict):
                        p_f = doc.add_paragraph(style="List Bullet")
                        p_f.paragraph_format.left_indent = Pt(20)
                        r_f = p_f.add_run(item.get("faiblesse", ""))
                        r_f.bold = True
                        r_f.font.size = Pt(10)
                        r_p = p_f.add_run(f" → {item.get('parade', '')}")
                        r_p.font.size = Pt(10)
                        r_p.italic = True

        # ============================================================
        # 2. CHECKLIST DE PREPARATION
        # ============================================================
        checklist = data.get("checklist_preparation", {}) or {}
        logistique = checklist.get("logistique", [])
        recherche = checklist.get("recherche_entreprise", [])

        if logistique or recherche:
            ajouter_titre_section(doc, titles["checklist_title"])

            if logistique:
                ajouter_paragraphe(
                    doc,
                    titles["checklist_logistique"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_apres=4,
                )
                for item in logistique:
                    ajouter_puce(doc, item, indent=0.2)

            if recherche:
                ajouter_paragraphe(
                    doc,
                    titles["checklist_recherche"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_avant=8,
                    espace_apres=4,
                )
                for item in recherche:
                    ajouter_puce(doc, item, indent=0.2)

        # ============================================================
        # 3. ENJEUX CACHES DE L ENTREPRISE
        # ============================================================
        defis = data.get("defis_cles_entreprise", [])
        if defis:
            ajouter_titre_section(doc, titles["defis_title"])
            ajouter_paragraphe(
                doc,
                titles["defis_intro"],
                taille=10,
                italique=True,
                espace_apres=6,
            )
            for d in defis:
                ajouter_puce(doc, d, indent=0.2)

        _ajouter_saut_de_page(doc)

        # ============================================================
        # 4. DEROULEMENT PAR PHASE
        # ============================================================
        phases = data.get("phases_entretien", [])
        if phases:
            ajouter_titre_section(doc, titles["phases_title"])

            for phase in phases:
                if not isinstance(phase, dict):
                    continue

                num = phase.get("phase_numero", 0)
                nom = phase.get("phase_nom", "")
                duree = phase.get("duree_estimee", "")
                objectif = phase.get("objectif_recruteur", "")
                questions = phase.get("questions_probables", [])

                # Titre de la phase
                p_phase = doc.add_paragraph()
                p_phase.paragraph_format.space_before = Pt(14)
                p_phase.paragraph_format.space_after = Pt(4)
                r_p = p_phase.add_run(f"{titles['phase_label']} {num} — {nom}")
                r_p.bold = True
                r_p.font.size = Pt(13)
                r_p.font.color.rgb = COULEUR_PRIMAIRE

                # Meta (duree + objectif)
                if duree:
                    p_meta = doc.add_paragraph()
                    p_meta.paragraph_format.space_after = Pt(3)
                    r_m = p_meta.add_run(f"{titles['duree_label']} : {duree}")
                    r_m.italic = True
                    r_m.font.size = Pt(9)
                    r_m.font.color.rgb = COULEUR_SECONDAIRE

                if objectif:
                    _ajouter_encadre(doc, titles["objectif_label"], objectif)

                # Questions
                for i, q in enumerate(questions, 1):
                    if not isinstance(q, dict):
                        continue
                    _ajouter_question_bloc(
                        doc,
                        i,
                        q.get("question", ""),
                        q.get("intention_recruteur", ""),
                        q.get("strategie_reponse", ""),
                        q.get("exemple_reponse_cadre", ""),
                        titles,
                    )

            _ajouter_saut_de_page(doc)

        # ============================================================
        # 5. QUESTIONS PIEGES
        # ============================================================
        pieges = data.get("questions_piege_et_pression", [])
        if pieges:
            ajouter_titre_section(doc, titles["pieges_title"])

            for i, piege in enumerate(pieges, 1):
                if not isinstance(piege, dict):
                    continue

                # Question
                p_q = doc.add_paragraph()
                p_q.paragraph_format.space_before = Pt(10)
                p_q.paragraph_format.space_after = Pt(3)
                r_q = p_q.add_run(f"{titles['piege_label']} {i} : ")
                r_q.bold = True
                r_q.font.size = Pt(11)
                r_q.font.color.rgb = COULEUR_PRIMAIRE
                r_qt = p_q.add_run(piege.get("question", ""))
                r_qt.bold = True
                r_qt.font.size = Pt(11)

                # Ce qu'il cherche
                if piege.get("ce_quil_cherche_vraiment"):
                    _ajouter_encadre(doc, titles["ce_quil_cherche"], piege["ce_quil_cherche_vraiment"])

                # Parade
                if piege.get("parade_tactique"):
                    p_par = doc.add_paragraph()
                    p_par.paragraph_format.left_indent = Pt(10)
                    p_par.paragraph_format.space_after = Pt(3)
                    r_pl = p_par.add_run(titles["parade"] + " ")
                    r_pl.bold = True
                    r_pl.font.size = Pt(10)
                    r_pl.font.color.rgb = COULEUR_PRIMAIRE
                    r_pv = p_par.add_run(piege["parade_tactique"])
                    r_pv.font.size = Pt(10)

                # Exemple
                if piege.get("exemple_reponse_cadre"):
                    _ajouter_encadre(doc, titles["exemple_piege"], piege["exemple_reponse_cadre"])

        # ============================================================
        # 6. QUESTIONS A POSER PAR INTERLOCUTEUR
        # ============================================================
        questions_inter = data.get("questions_a_poser_par_interlocuteur", {}) or {}
        rh_q = questions_inter.get("rh", [])
        manager_q = questions_inter.get("manager_technique", [])
        dirigeant_q = questions_inter.get("dirigeant", [])

        if rh_q or manager_q or dirigeant_q:
            _ajouter_saut_de_page(doc)
            ajouter_titre_section(doc, titles["questions_inter_title"])

            def _ajouter_section_questions(titre: str, questions: List[str]) -> None:
                if not questions:
                    return
                ajouter_paragraphe(
                    doc,
                    titre,
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_avant=8,
                    espace_apres=4,
                )
                for q in questions:
                    ajouter_puce(doc, q, indent=0.2)

            _ajouter_section_questions(titles["questions_rh"], rh_q)
            _ajouter_section_questions(titles["questions_manager"], manager_q)
            _ajouter_section_questions(titles["questions_dirigeant"], dirigeant_q)

        # ============================================================
        # 7. CLOTURE ET NEGOCIATION
        # ============================================================
        cloture = data.get("cloture_et_negociation", {}) or {}
        if cloture:
            _ajouter_saut_de_page(doc)
            ajouter_titre_section(doc, titles["cloture_title"])

            if cloture.get("strategie_salariale"):
                ajouter_paragraphe(
                    doc,
                    titles["salarial_label"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_apres=3,
                )
                ajouter_paragraphe(
                    doc,
                    cloture["strategie_salariale"],
                    taille=10,
                    alignement=ALIGN_JUSTIFIE,
                    espace_apres=8,
                )

            if cloture.get("reponse_quand_commencer"):
                ajouter_paragraphe(
                    doc,
                    titles["quand_commencer_label"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_apres=3,
                )
                ajouter_paragraphe(
                    doc,
                    cloture["reponse_quand_commencer"],
                    taille=10,
                    alignement=ALIGN_JUSTIFIE,
                    espace_apres=8,
                )

            erreurs = cloture.get("erreurs_a_eviter", [])
            if erreurs:
                ajouter_paragraphe(
                    doc,
                    titles["erreurs_label"],
                    taille=10,
                    gras=True,
                    couleur=COULEUR_PRIMAIRE,
                    espace_apres=4,
                )
                for e in erreurs:
                    ajouter_puce(doc, e, indent=0.2)

            if cloture.get("question_de_cloture"):
                _ajouter_encadre(doc, titles["question_finale_label"], cloture["question_de_cloture"])

        # ============================================================
        # 8. CONCLUSION
        # ============================================================
        _ajouter_saut_de_page(doc)
        ajouter_titre_section(doc, titles["conclusion_title"])
        ajouter_paragraphe(
            doc,
            titles["conclusion_text"],
            taille=11,
            alignement=ALIGN_JUSTIFIE,
            italique=True,
            espace_apres=10,
        )

        logger.info(
            "word_guide_built_v2",
            poste=titre_poste,
            entreprise=nom_entreprise,
            nb_phases=len(phases),
            nb_pieges=len(pieges),
            has_synthese=bool(synthese),
        )

        # Filigrane pour les utilisateurs gratuits
        if locale.get("apply_watermark", False):
            ajouter_filigrane_diagonal(doc, "CandidatIA - Genere gratuitement - candidatia.com", taille_pt=60, opacite="0.15")

        return doc