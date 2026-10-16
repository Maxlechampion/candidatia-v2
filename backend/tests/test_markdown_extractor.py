"""Tests de l extracteur Markdown."""

from app.services.ingestion.markdown import MarkdownExtractor


def test_markdown_removes_headers() -> None:
    extractor = MarkdownExtractor()
    content = b"# Titre\n\n## Sous-titre\n\nParagraphe normal."
    result = extractor.safe_extract(content, "test.md")
    assert "Titre" in result
    assert "Sous-titre" in result
    assert "#" not in result


def test_markdown_removes_bold() -> None:
    extractor = MarkdownExtractor()
    content = b"Ceci est **important** et _aussi_."
    result = extractor.safe_extract(content, "test.md")
    assert "**" not in result
    assert "important" in result
    assert "aussi" in result


def test_markdown_removes_links() -> None:
    extractor = MarkdownExtractor()
    content = b"Voir [Google](https://google.com) pour plus."
    result = extractor.safe_extract(content, "test.md")
    assert "[" not in result
    assert "Google" in result
    assert "https://" not in result


def test_markdown_removes_code_blocks() -> None:
    extractor = MarkdownExtractor()
    content = b"Voici du code:\n```python\nprint(1)\n```\nFin."
    result = extractor.safe_extract(content, "test.md")
    assert "print(1)" not in result
    assert "Voici" in result


def test_markdown_removes_list_markers() -> None:
    extractor = MarkdownExtractor()
    content = b"- Item 1\n- Item 2\n1. Numero 1\n2. Numero 2"
    result = extractor.safe_extract(content, "test.md")
    assert "Item 1" in result
    assert "- Item" not in result


def test_markdown_extensions() -> None:
    extractor = MarkdownExtractor()
    assert "md" in extractor.extensions
    assert "markdown" in extractor.extensions


def test_markdown_can_handle() -> None:
    extractor = MarkdownExtractor()
    assert extractor.can_handle("test.md") is True
    assert extractor.can_handle("test.markdown") is True
    assert extractor.can_handle("test.txt") is False
