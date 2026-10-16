"""Tests du generateur Word Lettre."""

import os

import pytest

from app.services.generation.word_lettre import WordLettreGenerator


@pytest.fixture
def lettre_data():
    return {
        "expediteur": "Jean Dupont\n12 rue de la Paix\nParis\njean@example.com",
        "destinataire": "TechCorp\n50 avenue de la Republique\nParis",
        "lieu_date": "Fait a Paris, le 29/09/2026",
        "objet": "Candidature Developpeur Python",
        "corps_paragraphes": [
            "Madame, Monsieur,",
            "Votre projet m interesse vivement.",
            "Mon experience correspond parfaitement.",
            "Cordialement,",
        ],
    }


def test_lettre_generates_file(lettre_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    gen = WordLettreGenerator()
    path = gen.generate(lettre_data, {"country": "FR"}, "test_lettre.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0


def test_lettre_with_empty_body(tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    data = {
        "expediteur": "Test",
        "destinataire": "Test",
        "lieu_date": "Fait a X",
        "objet": "Test",
        "corps_paragraphes": [],
    }

    gen = WordLettreGenerator()
    path = gen.generate(data, {}, "test_empty.docx")

    assert os.path.exists(path)
