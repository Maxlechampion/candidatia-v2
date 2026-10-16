"""Tests du module de reparation JSON."""

import pytest

from app.core.errors import AIProviderError
from app.services.ai.json_repair import parse_json_safely


def test_parse_simple_json() -> None:
    result = parse_json_safely('{"a": 1, "b": 2}')
    assert result == {"a": 1, "b": 2}


def test_parse_json_with_markdown_fences() -> None:
    raw = "```json\n{\"a\": 1}\n```"
    result = parse_json_safely(raw)
    assert result == {"a": 1}


def test_parse_truncated_json_repairs() -> None:
    raw = '{"a": 1, "b": [1, 2, 3'
    result = parse_json_safely(raw)
    assert result["a"] == 1
    assert result["b"] == [1, 2, 3]


def test_parse_empty_raises() -> None:
    with pytest.raises(AIProviderError):
        parse_json_safely("")


def test_parse_invalid_raises() -> None:
    with pytest.raises(AIProviderError):
        parse_json_safely("not a json at all")
