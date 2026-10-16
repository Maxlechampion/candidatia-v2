"""Tests du generateur Word CV."""

import os

import pytest

from app.services.generation.word_cv import WordCVGenerator


@pytest.fixture
def cv_data():
    return {
        "coordonnees": {
            "nom_complet": "Jean Dupont",
            "email": "jean@example.com",
            "telephone": "+33 6 00 00 00 00",
            "adresse": "Paris, France",
            "liens": ["linkedin.com/in/jeandupont"],
        },
        "titre_professionnel": "Developpeur Python Senior",
        "accroche": "Expert backend avec 8 ans d experience.",
        "competences_techniques": ["Python", "FastAPI", "Docker"],
        "competences_humaines": ["Autonomie", "Esprit d equipe"],
        "experiences": [
            {
                "poste": "Dev Backend",
                "entreprise": "TechCorp",
                "periode": "2022 - Present",
                "lieu": "Paris",
                "situation_tache": "Refonte monolithique vers microservices.",
                "actions_menees": ["Migration Kubernetes", "CI/CD"],
                "resultats_quantifiables": "+45% performance",
            }
        ],
        "formations": [
            {"diplome": "Master Info", "etablissement": "Paris-Saclay", "annee": "2018", "mention": None}
        ],
        "projets": [
            {"nom": "API OSS", "description": "Auth JWT", "technologies": ["Python"]}
        ],
        "langues": ["Francais (maternelle)", "Anglais (C1)"],
        "centres_interet": ["Open Source"],
    }


def test_cv_generates_file(cv_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    gen = WordCVGenerator()
    path = gen.generate(cv_data, {"country": "FR"}, "test_cv.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0


def test_cv_with_minimal_data(tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    minimal = {
        "coordonnees": {"nom_complet": "Test", "email": "", "telephone": "", "adresse": "", "liens": []},
        "titre_professionnel": "",
        "accroche": "",
        "competences_techniques": [],
        "competences_humaines": [],
        "experiences": [],
        "formations": [],
        "projets": [],
        "langues": [],
        "centres_interet": [],
    }

    gen = WordCVGenerator()
    path = gen.generate(minimal, {}, "test_minimal.docx")

    assert os.path.exists(path)


def test_cv_with_unicode_names(tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    data = {
        "coordonnees": {"nom_complet": "Ahmed Ibn Sina", "email": "a@b.com", "telephone": "+212", "adresse": "Casablanca", "liens": []},
        "titre_professionnel": "Data Scientist",
        "accroche": "Expert",
        "competences_techniques": [],
        "competences_humaines": [],
        "experiences": [],
        "formations": [],
        "projets": [],
        "langues": [],
        "centres_interet": [],
    }

    gen = WordCVGenerator()
    path = gen.generate(data, {}, "test_unicode.docx")

    assert os.path.exists(path)
