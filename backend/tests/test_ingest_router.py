"""Tests du router /api/ingest."""

from fastapi.testclient import TestClient


def test_ingest_text_only(client: TestClient) -> None:
    response = client.post(
        "/api/ingest",
        data={
            "texte": (
                "CURRICULUM VITAE Jean Dupont EXPERIENCE PROFESSIONNELLE "
                "Developpeur senior chez TechCorp FORMATION Master "
                "informatique COMPETENCES Python Docker FastAPI"
            ),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["source"] == "text"
    assert data["filename"] is None
    assert "text" in data
    assert "language" in data
    assert "content_type" in data
    assert "locale" in data
    assert data["language"]["code"] in ("fr", "en")


def test_ingest_no_input_returns_400(client: TestClient) -> None:
    response = client.post("/api/ingest")
    assert response.status_code == 400


def test_ingest_with_content_type_hint_cv(client: TestClient) -> None:
    response = client.post(
        "/api/ingest",
        data={
            "texte": "Texte quelconque mais assez long pour etre ingere correctement par notre systeme.",
            "content_type_hint": "cv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content_type"]["type"] == "cv"
    assert data["content_type"]["confidence"] == 1.0


def test_ingest_with_content_type_hint_offre(client: TestClient) -> None:
    response = client.post(
        "/api/ingest",
        data={
            "texte": "Texte quelconque mais assez long pour etre ingere correctement.",
            "content_type_hint": "offre",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content_type"]["type"] == "offre"
    assert data["content_type"]["confidence"] == 1.0


def test_ingest_auto_detect_cv(client: TestClient) -> None:
    text = (
        "CURRICULUM VITAE Jean Dupont EXPERIENCE PROFESSIONNELLE "
        "Developpeur FORMATION Master informatique COMPETENCES "
        "TECHNIQUES Python Docker LANGUES Francais Anglais"
    )
    response = client.post("/api/ingest", data={"texte": text})
    assert response.status_code == 200
    data = response.json()
    assert data["content_type"]["type"] == "cv"


def test_ingest_locale_included(client: TestClient) -> None:
    text = (
        "Bonjour, je suis un developpeur passionne par les nouvelles "
        "technologies et j aime creer des applications web modernes."
    )
    response = client.post("/api/ingest", data={"texte": text})
    assert response.status_code == 200
    data = response.json()
    assert "locale" in data
    assert "country" in data["locale"]
    assert "cv_max_pages" in data["locale"]
