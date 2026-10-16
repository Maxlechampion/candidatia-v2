"""Extracteur RTF (striprtf)."""

from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.rtf")


class RTFExtractor(DocumentExtractor):
    name = "rtf"
    extensions = ["rtf"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        try:
            from striprtf.striprtf import rtf_to_text
            raw = content_bytes.decode("utf-8", errors="ignore")
            return rtf_to_text(raw)
        except Exception as e:
            logger.warning("rtf_extract_failed", error=str(e))
            return ""
