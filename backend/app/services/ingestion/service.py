"""Service d ingestion : route automatiquement vers le bon extracteur."""

from typing import List, Optional

from app.core.errors import IngestionError
from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor
from app.services.ingestion.docx import DOCXExtractor
from app.services.ingestion.html import HTMLExtractor
from app.services.ingestion.image_ocr import ImageOCRExtractor
from app.services.ingestion.markdown import MarkdownExtractor
from app.services.ingestion.odt import ODTExtractor
from app.services.ingestion.pdf import PDFExtractor
from app.services.ingestion.rtf import RTFExtractor
from app.services.ingestion.text_raw import TextRawExtractor

logger = get_logger("ingestion.service")


class IngestionService:
    """Service principal d ingestion."""

    def __init__(self) -> None:
        self._extractors: List[DocumentExtractor] = [
            PDFExtractor(),
            DOCXExtractor(),
            ODTExtractor(),
            RTFExtractor(),
            HTMLExtractor(),
            MarkdownExtractor(),
            ImageOCRExtractor(),
        ]
        self._text_extractor = TextRawExtractor()

    def extract_from_bytes(self, content_bytes: bytes, filename: str) -> str:
        """Extrait le texte depuis un fichier binaire."""
        if not content_bytes:
            raise IngestionError(
                message="Le fichier est vide.",
                details={"filename": filename},
            )

        if not filename or "." not in filename:
            raise IngestionError(
                message="Nom de fichier invalide (extension manquante).",
                details={"filename": filename},
            )

        for extractor in self._extractors:
            if extractor.can_handle(filename):
                logger.info(
                    "extractor_selected",
                    extractor=extractor.name,
                    filename=filename,
                )
                return extractor.safe_extract(content_bytes, filename)

        ext = filename.rsplit(".", 1)[-1].lower()
        raise IngestionError(
            message=f"Format .{ext} non supporte.",
            details={
                "filename": filename,
                "supported": [e for ext in self._extractors for e in ext.extensions],
            },
        )

    def extract_from_text(self, text: str) -> str:
        """Nettoie et retourne un texte brut colle par l utilisateur."""
        return self._text_extractor.extract(text)


# Singleton
_ingestion_service: Optional[IngestionService] = None


def get_ingestion_service() -> IngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = IngestionService()
    return _ingestion_service
