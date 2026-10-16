"""Tests du service d ingestion."""

import pytest

from app.core.errors import IngestionError
from app.services.ingestion.service import IngestionService, get_ingestion_service


def test_extract_from_text() -> None:
    service = IngestionService()
    result = service.extract_from_text("  Hello    world  ")
    assert result == "Hello world"


def test_extract_from_bytes_empty_raises() -> None:
    service = IngestionService()
    with pytest.raises(IngestionError):
        service.extract_from_bytes(b"", "test.pdf")


def test_extract_from_bytes_no_extension_raises() -> None:
    service = IngestionService()
    with pytest.raises(IngestionError):
        service.extract_from_bytes(b"content", "noextension")


def test_extract_from_bytes_unsupported_raises() -> None:
    service = IngestionService()
    with pytest.raises(IngestionError):
        service.extract_from_bytes(b"content", "test.xyz")


def test_extract_markdown_works() -> None:
    service = IngestionService()
    content = b"# Titre\nContenu normal."
    result = service.extract_from_bytes(content, "test.md")
    assert "Titre" in result
    assert "Contenu normal" in result


def test_extract_html_works() -> None:
    service = IngestionService()
    content = b"<html><body><h1>Titre</h1><p>Paragraphe</p></body></html>"
    result = service.extract_from_bytes(content, "test.html")
    assert "Titre" in result
    assert "Paragraphe" in result


def test_singleton_returns_same_instance() -> None:
    s1 = get_ingestion_service()
    s2 = get_ingestion_service()
    assert s1 is s2


def test_extract_from_bytes_case_insensitive_extension() -> None:
    service = IngestionService()
    content = b"# Titre\nContenu."
    result = service.extract_from_bytes(content, "test.MD")
    assert "Titre" in result
