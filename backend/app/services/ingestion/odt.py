"""Extracteur OpenDocument .odt (odfpy)."""

import io

from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.odt")


class ODTExtractor(DocumentExtractor):
    name = "odt"
    extensions = ["odt"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        try:
            from odf import teletype
            from odf.opendocument import load
            from odf.text import P

            doc = load(io.BytesIO(content_bytes))
            paragraphs = doc.getElementsByType(P)
            parts = []
            for p in paragraphs:
                text = teletype.extractText(p)
                if text.strip():
                    parts.append(text)
            return "\n".join(parts)
        except Exception as e:
            logger.warning("odt_extract_failed", error=str(e))
            return ""
