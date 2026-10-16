"""
Generateur Word : Brouillon de relance apres candidature (multilingue).

Format email professionnel court, a envoyer manuellement par l utilisateur.
"""

from typing import Any, Dict

from docx import Document
from docx.shared import Pt

from app.core.logging import get_logger
from app.services.generation.base import DocumentGenerator
from app.services.generation.style import (
    COULEUR_PRIMAIRE,
    ajouter_paragraphe,
    configurer_marges,
    configurer_style_normal,
)

logger = get_logger("generation.word_relance")


# ============================================================
# TRADUCTIONS DES TITRES PAR LANGUE
# ============================================================

RELANCE_TITLES = {
    "fr": {
        "main_title": "BROUILLON DE RELANCE",
        "company": "Entreprise",
        "job": "Poste",
        "delay": "Relance apres",
        "days": "jours",
    },
    "en": {
        "main_title": "FOLLOW-UP DRAFT",
        "company": "Company",
        "job": "Position",
        "delay": "Follow-up after",
        "days": "days",
    },
    "es": {
        "main_title": "BORRADOR DE SEGUIMIENTO",
        "company": "Empresa",
        "job": "Puesto",
        "delay": "Seguimiento despues de",
        "days": "dias",
    },
    "de": {
        "main_title": "NACHSCHREIBEN-ENTWURF",
        "company": "Unternehmen",
        "job": "Position",
        "delay": "Nachfassen nach",
        "days": "Tagen",
    },
}


def _get_relance_titles(locale: Dict[str, Any]) -> Dict[str, str]:
    """Retourne les titres selon la langue (fallback sur l anglais)."""
    language_code = "en"

    if locale:
        for key in ("language_code", "language", "code"):
            if key in locale and locale[key]:
                language_code = str(locale[key]).lower()
                break

    return RELANCE_TITLES.get(language_code, RELANCE_TITLES["en"])


class WordRelanceGenerator(DocumentGenerator):
    name = "word_relance"

    def build(self, data: Dict[str, Any], locale: Dict[str, Any]) -> Document:
        titles = _get_relance_titles(locale)

        doc = Document()
        configurer_marges(doc, top=1.0, bottom=1.0, left=1.0, right=1.0)
        configurer_style_normal(doc, taille=11)

        # En-tete
        ajouter_paragraphe(
            doc,
            titles["main_title"],
            taille=14,
            gras=True,
            couleur=COULEUR_PRIMAIRE,
            espace_apres=12,
        )

        # Metadata
        company = data.get("company_name", "")
        job = data.get("job_title", "")
        wait_days = data.get("wait_days", 7)

        ajouter_paragraphe(doc, f"{titles['company']} : {company}", taille=10, espace_apres=2)
        ajouter_paragraphe(doc, f"{titles['job']} : {job}", taille=10, espace_apres=2)
        ajouter_paragraphe(
            doc,
            f"{titles['delay']} : {wait_days} {titles['days']}",
            taille=10,
            italique=True,
            espace_apres=16,
        )

        # Objet
        p = doc.add_paragraph()
        r = p.add_run("Objet : ")
        r.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = COULEUR_PRIMAIRE
        objet = data.get("subject", f"Relance concernant ma candidature au poste de {job}")
        p.add_run(objet).font.size = Pt(11)
        p.paragraph_format.space_after = Pt(16)

        # Corps
        corps = data.get("body", "")
        if corps:
            for para in corps.split("\n\n"):
                if para.strip():
                    p = doc.add_paragraph()
                    r = p.add_run(para.strip())
                    r.font.size = Pt(11)
                    p.paragraph_format.space_after = Pt(10)
                    p.paragraph_format.line_spacing = 1.15

        # Signature
        signature = data.get("signature", "")
        if signature:
            ajouter_paragraphe(doc, "", taille=11)
            for ligne in signature.split("\n"):
                ajouter_paragraphe(doc, ligne, taille=11, espace_apres=0)

        logger.info(
            "word_relance_built",
            company=company,
            job=job,
            wait_days=wait_days,
            language_code=locale.get("language_code", "en") if locale else "en",
        )

        return doc