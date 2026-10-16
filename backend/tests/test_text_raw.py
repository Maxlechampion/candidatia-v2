"""Tests du nettoyage de texte brut."""

import pytest

from app.services.ingestion.text_raw import TextRawExtractor, clean_raw_text


def test_clean_removes_multiple_spaces() -> None:
    assert clean_raw_text("hello    world") == "hello world"


def test_clean_removes_multiple_newlines() -> None:
    result = clean_raw_text("a\n\n\n\nb")
    assert "\n\n\n" not in result
    assert result == "a\n\nb"


def test_clean_handles_crlf() -> None:
    result = clean_raw_text("a\r\nb")
    assert "\r" not in result
    assert result == "a\nb"


def test_clean_handles_tabs() -> None:
    result = clean_raw_text("a\tb")
    assert "\t" not in result


def test_clean_empty_returns_empty() -> None:
    assert clean_raw_text("") == ""
    assert clean_raw_text("   ") == ""


def test_extractor_valid_text() -> None:
    extractor = TextRawExtractor()
    result = extractor.extract("  Bonjour    le monde  ")
    assert result == "Bonjour le monde"


def test_extractor_empty_raises() -> None:
    extractor = TextRawExtractor()
    with pytest.raises(ValueError):
        extractor.extract("")


def test_extractor_whitespace_only_raises() -> None:
    extractor = TextRawExtractor()
    with pytest.raises(ValueError):
        extractor.extract("   \n\n  ")
