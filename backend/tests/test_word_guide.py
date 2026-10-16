"""Tests du generateur Word Guide (structure enrichie 8 phases)."""

import os

import pytest

from app.services.generation.word_guide import WordGuideGenerator


@pytest.fixture
def guide_data():
    """Fixture avec la structure complete du guide enrichi."""
    return {
        "titre_poste": "Developpeur Python Senior",
        "nom_entreprise": "TechCorp",
        "synthese_strategique": {
            "pitch_30s": "Je suis un dev backend avec 8 ans d experience.",
            "trois_forces_a_valoriser": [
                "Expertise Python",
                "Leadership",
                "Delivery",
            ],
            "trois_faiblesses_a_gerer": [
                {
                    "faiblesse": "Perfectionnisme",
                    "parade": "Je priorise avec impact business",
                },
            ],
        },
        "checklist_preparation": {
            "logistique": ["Tester la visio", "3 copies du CV"],
            "recherche_entreprise": ["Actualites recentes", "Concurrents"],
        },
        "defis_cles_entreprise": ["Refonte microservices", "Scalabilite 10x"],
        "phases_entretien": [
            {
                "phase_numero": 2,
                "phase_nom": "Introduction",
                "duree_estimee": "5 min",
                "objectif_recruteur": "Verifier votre aisance",
                "questions_probables": [
                    {
                        "question": "Parlez-moi de vous",
                        "intention_recruteur": "Tester la synthese",
                        "strategie_reponse": "Methode Passe/Present/Futur",
                        "exemple_reponse_cadre": "Je suis developpeur avec 8 ans d experience...",
                    },
                ],
            },
            {
                "phase_numero": 3,
                "phase_nom": "Parcours et motivation",
                "duree_estimee": "15 min",
                "objectif_recruteur": "Comprendre votre coherence",
                "questions_probables": [
                    {
                        "question": "Pourquoi ce poste ?",
                        "intention_recruteur": "Verifier la motivation",
                        "strategie_reponse": "Relier votre parcours aux enjeux",
                        "exemple_reponse_cadre": "Votre projet m interesse car...",
                    },
                ],
            },
        ],
        "questions_piege_et_pression": [
            {
                "question": "Quelle est votre faiblesse ?",
                "ce_quil_cherche_vraiment": "Lucidite",
                "parade_tactique": "Choisir une faiblesse non bloquante",
                "exemple_reponse_cadre": "Le perfectionnisme...",
            },
        ],
        "questions_a_poser_par_interlocuteur": {
            "rh": ["Culture d entreprise ?"],
            "manager_technique": ["Defis techniques ?"],
            "dirigeant": ["Vision a 3 ans ?"],
        },
        "cloture_et_negociation": {
            "strategie_salariale": "Donner une fourchette basee sur le marche",
            "reponse_quand_commencer": "Preavis de 2 mois",
            "erreurs_a_eviter": ["Ne pas critiquer ses anciens employeurs"],
            "question_de_cloture": "Y a-t-il un point a approfondir ?",
        },
    }


def test_guide_generates_file(guide_data, tmp_path):
    """Verifie qu'un guide complet genere bien un fichier Word."""
    from app.core.config import get_settings

    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    gen = WordGuideGenerator()
    path = gen.generate(guide_data, {"country": "FR"}, "test_guide.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0


def test_guide_with_no_questions(tmp_path):
    """Verifie que le generateur ne plante pas si des sections sont vides."""
    from app.core.config import get_settings

    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    data = {
        "titre_poste": "Test",
        "nom_entreprise": "Test",
        "defis_cles_entreprise": [],
        "phases_entretien": [],
        "questions_piege_et_pression": [],
        "questions_a_poser_par_interlocuteur": {},
        "cloture_et_negociation": {},
    }

    gen = WordGuideGenerator()
    path = gen.generate(data, {}, "test_guide_empty.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0


def test_guide_with_minimal_data(tmp_path):
    """Verifie qu'un guide avec seulement le titre genere quand meme."""
    from app.core.config import get_settings

    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    data = {
        "titre_poste": "Dev",
        "nom_entreprise": "Corp",
    }

    gen = WordGuideGenerator()
    path = gen.generate(data, {}, "test_guide_minimal.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0