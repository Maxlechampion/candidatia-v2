"""Tests du validateur et enrichisseur de guide."""

from app.services.ai.guide_validator import validate_and_enrich_guide


def test_validate_complete_guide_returns_unchanged() -> None:
    """Un guide complet passe sans modification majeure."""
    guide = {
        "titre_poste": "Dev",
        "nom_entreprise": "Corp",
        "synthese_strategique": {
            "pitch_30s": "Pitch existant",
            "trois_forces_a_valoriser": ["F1"],
            "trois_faiblesses_a_gerer": [{"faiblesse": "X", "parade": "Y"}],
        },
        "checklist_preparation": {
            "logistique": ["Item"],
            "recherche_entreprise": ["Item"],
        },
        "defis_cles_entreprise": ["Defi 1"],
        "phases_entretien": [
            {"phase_numero": 2, "phase_nom": "Intro", "questions_probables": []},
            {"phase_numero": 3, "phase_nom": "Parcours", "questions_probables": []},
        ],
        "questions_piege_et_pression": [{"question": "Q"}],
        "questions_a_poser_par_interlocuteur": {"rh": ["Q1"], "manager_technique": [], "dirigeant": []},
        "cloture_et_negociation": {"strategie_salariale": "X"},
    }
    result = validate_and_enrich_guide(guide, "Jean Dupont")
    assert result["titre_poste"] == "Dev"
    assert result["synthese_strategique"]["pitch_30s"] == "Pitch existant"


def test_validate_empty_guide_enriches_all_sections() -> None:
    """Un guide vide est entierement comble."""
    result = validate_and_enrich_guide({}, "Jean Dupont")
    assert result["synthese_strategique"]["pitch_30s"]
    assert len(result["synthese_strategique"]["trois_forces_a_valoriser"]) == 3
    assert len(result["phases_entretien"]) >= 2
    assert len(result["questions_piege_et_pression"]) >= 3
    assert result["cloture_et_negociation"]["strategie_salariale"]


def test_validate_missing_synthese_adds_fallback() -> None:
    """Une synthese manquante est comblee."""
    guide = {"titre_poste": "Dev", "nom_entreprise": "Corp"}
    result = validate_and_enrich_guide(guide, "Marie")
    assert "Marie" in result["synthese_strategique"]["pitch_30s"]


def test_validate_invalid_type_does_not_crash() -> None:
    """Un input non-dict ne crashe pas."""
    result = validate_and_enrich_guide("not a dict")  # type: ignore
    assert isinstance(result, dict)