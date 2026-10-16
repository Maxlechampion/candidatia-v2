"""Extracteur Markdown (nettoyage du balisage)."""

import re

from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.markdown")


class MarkdownExtractor(DocumentExtractor):
    name = "markdown"
    extensions = ["md", "markdown"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        try:
            raw = content_bytes.decode("utf-8", errors="ignore")

            # Suppression des blocs de code
            raw = re.sub(r"```.*?```", "", raw, flags=re.DOTALL)
            raw = re.sub(r"`[^`]+`", "", raw)

            # Liens Markdown [texte](url) -> texte
            raw = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", raw)

            # Titres, gras, italique
            raw = re.sub(r"^#{1,6}\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\*\*(.+?)\*\*", r"\1", raw)
            raw = re.sub(r"\*(.+?)\*", r"\1", raw)
            raw = re.sub(r"__(.+?)__", r"\1", raw)
            raw = re.sub(r"_(.+?)_", r"\1", raw)

            # Listes
            raw = re.sub(r"^\s*[-*+]\s+", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"^\s*\d+\.\s+", "", raw, flags=re.MULTILINE)

            # Separateurs
            raw = re.sub(r"^[-=]{3,}$", "", raw, flags=re.MULTILINE)

            return raw
        except Exception as e:
            logger.warning("markdown_extract_failed", error=str(e))
            return ""
