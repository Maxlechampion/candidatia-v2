"""Tests du PackBuilder."""

import os
import zipfile

import pytest

from app.services.generation.pack_builder import PackBuilder


@pytest.fixture
def minimal_data():
    cv = {
        "coordonnees": {"nom_complet": "Test User", "email": "", "telephone": "", "adresse": "", "liens": []},
        "titre_professionnel": "Dev",
        "accroche": "Expert",
        "competences_techniques": [],
        "competences_humaines": [],
        "experiences": [],
        "formations": [],
        "projets": [],
        "langues": [],
        "centres_interet": [],
    }
    lettre = {
        "expediteur": "Test",
        "destinataire": "Test",
        "lieu_date": "Fait a X",
        "objet": "Test",
        "corps_paragraphes": ["Test body"],
    }
    guide = {
        "titre_poste": "Dev",
        "nom_entreprise": "Corp",
        "defis_cles_entreprise": ["Defi 1"],
        "questions_probables": [],
        "questions_a_poser": ["Q1"],
    }
    return cv, lettre, guide


def test_pack_builder_creates_zip(minimal_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    cv, lettre, guide = minimal_data
    builder = PackBuilder()
    result = builder.build_pack(
        cv_data=cv,
        lettre_data=lettre,
        guide_data=guide,
        locale={"country": "FR"},
        pack_name="TestPack",
    )

    assert os.path.exists(result["zip_path"])
    assert os.path.getsize(result["zip_path"]) > 0
    assert len(result["documents"]) >= 3


def test_pack_builder_zip_contains_docx(minimal_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    cv, lettre, guide = minimal_data
    builder = PackBuilder()
    result = builder.build_pack(
        cv_data=cv,
        lettre_data=lettre,
        guide_data=guide,
        locale={},
        pack_name="TestZip",
    )

    with zipfile.ZipFile(result["zip_path"], "r") as zf:
        names = zf.namelist()
        assert any(n.endswith(".docx") for n in names)
        assert len([n for n in names if n.endswith(".docx")]) >= 3


def test_pack_builder_with_relance(minimal_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    cv, lettre, guide = minimal_data
    relance = {
        "company_name": "Corp",
        "job_title": "Dev",
        "wait_days": 7,
        "subject": "Relance",
        "body": "Body",
        "signature": "Me",
    }

    builder = PackBuilder()
    result = builder.build_pack(
        cv_data=cv,
        lettre_data=lettre,
        guide_data=guide,
        relance_data=relance,
        locale={},
        pack_name="TestRelance",
    )

    assert result["relance_path"] is not None
    with zipfile.ZipFile(result["zip_path"], "r") as zf:
        names = zf.namelist()
        assert any("Relance" in n for n in names)
