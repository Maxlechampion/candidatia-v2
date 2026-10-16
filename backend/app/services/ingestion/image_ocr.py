"""Extracteur image via OCR (Tesseract)."""

import io

from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.image_ocr")


class ImageOCRExtractor(DocumentExtractor):
    name = "image_ocr"
    extensions = ["png", "jpg", "jpeg", "tiff", "tif", "bmp", "webp"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        try:
            import pytesseract
            from PIL import Image

            img = Image.open(io.BytesIO(content_bytes))
            text = pytesseract.image_to_string(img, lang="fra+eng")
            return text
        except ImportError as e:
            logger.warning("ocr_missing_deps", error=str(e))
            return ""
        except Exception as e:
            logger.warning("ocr_failed", error=str(e))
            return ""
