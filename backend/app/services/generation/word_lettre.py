"""
Generateur Word : Lettre de motivation.

Format epistolaire traditionnel adapte a la culture cible.
Le contenu du corps est fourni par l IA (4 paragraphes style AIDA).
"""

from typing import Any, Dict

from docx import Document
from docx.shared import Pt

from app.core.logging import get_logger
from app.services.generation.base import DocumentGenerator
from app.services.generation.style import (
    ALIGN_DROITE,
    ALIGN_JUSTIFIE,
    COULEUR_PRIMAIRE,
    ajouter_paragraphe,
    configurer_marges,
    configurer_style_normal,
)

logger = get_logger("generation.word_lettre")

# Traductions des titres lettre par langue
LETTRE_TITLES = {
    "fr": {"object_label": "Objet : "},
    "en": {"object_label": "Subject: "},
    "es": {"object_label": "Asunto: "},
    "de": {"object_label": "Betreff: "},
}


def _get_lettre_titles(locale: dict) -> dict:
    language_code = "en"
    if locale:
        for key in ("language_code", "language", "code"):
            if key in locale and locale[key]:
                language_code = str(locale[key]).lower()
                break
    return LETTRE_TITLES.get(language_code, LETTRE_TITLES["en"])



class WordLettreGenerator(DocumentGenerator):
    name = "word_lettre"

    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:
        doc = Document()
        configurer_marges(doc, top=1.0, bottom=1.0, left=1.0, right=1.0)
        configurer_style_normal(doc, taille=11)

        # ============================================================
        # EN-TETE EXPEDITEUR
        # ============================================================
        expediteur = data.get("expediteur", "")
        if expediteur:
            for ligne in expediteur.split("\n"):
                ajouter_paragraphe(doc, ligne, taille=10, espace_apres=0)

        # Espace
        for _ in range(2):
            ajouter_paragraphe(doc, "", taille=11)

        # ============================================================
        # DESTINATAIRE
        # ============================================================
        destinataire = data.get("destinataire", "")
        if destinataire:
            for ligne in destinataire.split("\n"):
                ajouter_paragraphe(doc, ligne, taille=10, alignement=ALIGN_DROITE, espace_apres=0)

        # Espace
        for _ in range(2):
            ajouter_paragraphe(doc, "", taille=11)

        # ============================================================
        # LIEU ET DATE
        # ============================================================
        lieu_date = data.get("lieu_date", "")
        if lieu_date:
            ajouter_paragraphe(doc, lieu_date, taille=10, alignement=ALIGN_DROITE, espace_apres=12)

        # ============================================================
        # OBJET
        # ============================================================
        objet = data.get("objet", "")
        if objet:
            p = doc.add_paragraph()
            titles = _get_lettre_titles(locale)
            r = p.add_run(titles["object_label"])
            r.bold = True
            r.font.size = Pt(11)
            r.font.color.rgb = COULEUR_PRIMAIRE
            r_obj = p.add_run(objet)
            r_obj.bold = True
            r_obj.font.size = Pt(11)
            p.paragraph_format.space_after = Pt(18)

        # ============================================================
        # CORPS DE LA LETTRE
        # ============================================================
        corps = data.get("corps_paragraphes", [])
        for para in corps:
            p = doc.add_paragraph()
            r = p.add_run(para)
            r.font.size = Pt(11)
            p.alignment = ALIGN_JUSTIFIE
            p.paragraph_format.space_after = Pt(12)
            p.paragraph_format.line_spacing = 1.15

        # ============================================================
        # SIGNATURE
        # ============================================================
        if corps:
            ajouter_paragraphe(doc, "", taille=11)
            expediteur_nom = expediteur.split("\n")[0] if expediteur else ""
            if expediteur_nom:
                ajouter_paragraphe(
                    doc,
                    expediteur_nom,
                    taille=11,
                    gras=True,
                    alignement=ALIGN_DROITE,
                )

        logger.info(
            "word_lettre_built",
            nb_paragraphes=len(corps),
            country=locale.get("country", "unknown"),
            format=locale.get("letter_format", "unknown"),
        )

        return doc
