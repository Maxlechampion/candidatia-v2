"""Tests du generateur Word Relance."""

import os

import pytest

from app.services.generation.word_relance import WordRelanceGenerator


@pytest.fixture
def relance_data():
    return {
        "company_name": "TechCorp",
        "job_title": "Developpeur Python Senior",
        "wait_days": 7,
        "subject": "Relance candidature",
        "body": "Bonjour,\n\nJe me permets de revenir vers vous.\n\nCordialement.",
        "signature": "Jean Dupont\n+33 6 00 00 00 00",
    }


def test_relance_generates_file(relance_data, tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    gen = WordRelanceGenerator()
    path = gen.generate(relance_data, {"country": "FR"}, "test_relance.docx")

    assert os.path.exists(path)
    assert os.path.getsize(path) > 0


def test_relance_with_empty_body(tmp_path):
    from app.core.config import get_settings
    settings = get_settings()
    settings.local_storage_path = str(tmp_path)

    data = {
        "company_name": "Test",
        "job_title": "Test",
        "wait_days": 7,
        "subject": "Test",
        "body": "",
        "signature": "",
    }

    gen = WordRelanceGenerator()
    path = gen.generate(data, {}, "test_relance_empty.docx")

    assert os.path.exists(path)
