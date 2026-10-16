"""
Utilitaire de reparation JSON.

Les modeles gratuits coupent parfois leur reponse avant la fin. Ce module
tente de reparer un JSON tronque en fermant les accolades/crochets ouverts.
"""

import json
import re
from typing import Any, Dict

from app.core.errors import AIProviderError
from app.core.logging import get_logger

logger = get_logger("ai.json_repair")


def _strip_markdown_fences(text: str) -> str:
    """Retire les fences Markdown."""
    text = text.strip()

    if text.startswith("```json"):
        text = text.split("```json", 1)[1]
    elif text.startswith("```"):
        text = text.split("```", 1)[1]

    if "```" in text:
        text = text.split("```", 1)[0]

    return text.strip()


def _close_unbalanced(text: str) -> str:
    """Ferme les accolades et crochets ouverts."""
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")

    if open_brackets > 0:
        text += "]" * open_brackets
    if open_braces > 0:
        text += "}" * open_braces

    return text


def _remove_trailing_commas(text: str) -> str:
    """Retire les virgules finales avant } ou ]."""
    text = re.sub(r",\s*}", "}", text)
    text = re.sub(r",\s*]", "]", text)
    return text


def parse_json_safely(raw: str) -> Dict[str, Any]:
    """Tente de parser un JSON brut, avec reparation automatique."""
    if not raw or not raw.strip():
        raise AIProviderError(message="Reponse IA vide.")

    cleaned = _strip_markdown_fences(raw)

    # Tentative directe
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Tentative apres fermeture des structures ouvertes
    repaired = _close_unbalanced(cleaned)
    repaired = _remove_trailing_commas(repaired)

    try:
        return json.loads(repaired)
    except json.JSONDecodeError as e:
        logger.warning(
            "json_repair_failed",
            error=str(e),
            preview=cleaned[:200],
        )
        raise AIProviderError(
            message="Impossible de parser la reponse IA en JSON.",
            details={"error": str(e), "preview": cleaned[:200]},
        ) from e
