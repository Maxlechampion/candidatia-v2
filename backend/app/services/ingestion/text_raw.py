"""Nettoyage du texte brut colle par l utilisateur."""

import re


def clean_raw_text(text: str) -> str:
    """Nettoie un texte brut : normalise les espaces et sauts de ligne."""
    if not text:
        return ""

    # Normalisation des retours chariot
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remplacement des tabulations par des espaces
    text = text.replace("\t", " ")

    # Suppression des espaces multiples
    text = re.sub(r"[ ]{2,}", " ", text)

    # Suppression des lignes vides multiples
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


class TextRawExtractor:
    """Extracteur pour le texte brut (pas de fichier)."""

    name = "text_raw"

    def extract(self, text: str) -> str:
        cleaned = clean_raw_text(text)
        if not cleaned:
            raise ValueError("Le texte fourni est vide.")
        return cleaned
