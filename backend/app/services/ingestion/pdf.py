"""Extracteur PDF (pypdf + pdfplumber + OCR fallback via Tesseract)."""

import io
import os

from app.core.errors import IngestionError
from app.core.logging import get_logger
from app.services.ingestion.base import DocumentExtractor

logger = get_logger("ingestion.pdf")


# Seuil minimum de caracteres pour considerer l'extraction comme reussie
MIN_TEXT_LENGTH = 50


class PDFExtractor(DocumentExtractor):
    """Extracteur PDF multi-strategies.

    Ordre de tentative :
      1. pypdf         - rapide, fonctionne sur PDFs textuels
      2. pdfplumber    - plus robuste pour PDFs complexes
      3. OCR Tesseract - pour PDFs scannes (images)
    """

    name = "pdf"
    extensions = ["pdf"]

    def extract(self, content_bytes: bytes, filename: str) -> str:
        """Extrait le texte d'un PDF avec fallback en cascade."""

        # ---- 1. Tentative pypdf ----
        text = self._extract_pypdf(content_bytes)

        # ---- 2. Tentative pdfplumber ----
        if not self._is_valid(text):
            logger.info("pdf_fallback_pdfplumber", filename=filename)
            text = self._extract_pdfplumber(content_bytes)

        # ---- 3. Tentative OCR ----
        if not self._is_valid(text):
            logger.info("pdf_fallback_ocr", filename=filename)
            text = self._extract_ocr(content_bytes)

        # ---- 4. Echec explicite ----
        if not self._is_valid(text):
            raise IngestionError(
                message=(
                    f"Impossible d'extraire du texte depuis '{filename}'. "
                    "Le PDF est probablement un scan (image) non lisible par OCR, "
                    "ou il est protege / corrompu. "
                    "Solutions : (1) utilisez un PDF avec du texte selectionnable, "
                    "(2) copiez-collez le texte directement, "
                    "(3) verifiez que Tesseract OCR est bien installe."
                ),
                details={
                    "filename": filename,
                    "text_length": len(text.strip()) if text else 0,
                    "min_required": MIN_TEXT_LENGTH,
                },
            )

        return text

    @staticmethod
    def _is_valid(text: str | None) -> bool:
        """Verifie si le texte est suffisant."""
        return bool(text) and len(text.strip()) >= MIN_TEXT_LENGTH

    @staticmethod
    def _extract_pypdf(content_bytes: bytes) -> str:
        """Extraction rapide via pypdf."""
        try:
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            return "\n".join(pages)
        except Exception as e:
            logger.warning("pypdf_failed", error=str(e))
            return ""

    @staticmethod
    def _extract_pdfplumber(content_bytes: bytes) -> str:
        """Extraction plus robuste via pdfplumber."""
        try:
            import pdfplumber

            pages = []
            with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        pages.append(page_text)
            return "\n".join(pages)
        except Exception as e:
            logger.warning("pdfplumber_failed", error=str(e))
            return ""

    @staticmethod
    def _extract_ocr(content_bytes: bytes) -> str:
        """OCR via Tesseract + PyMuPDF (pour PDFs scannes)."""
        try:
            # Import PyMuPDF : nouvelle API (pymupdf) d'abord, fallback sur fitz ancien
            try:
                import pymupdf  # PyMuPDF 1.24+ (API moderne)
            except ImportError:
                import fitz as pymupdf  # Fallback pour anciennes versions

            import pytesseract
            from PIL import Image

            # Configuration du chemin Tesseract depuis .env
            tesseract_cmd = os.getenv("TESSERACT_CMD")
            if tesseract_cmd and os.path.exists(tesseract_cmd):
                pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
                logger.info("tesseract_configured", path=tesseract_cmd)
            else:
                logger.info("tesseract_using_path_default")

            # Conversion PDF -> images -> OCR
            doc = pymupdf.open(stream=content_bytes, filetype="pdf")
            logger.info("ocr_starting", nb_pages=len(doc))

            texts = []
            for i, page in enumerate(doc):
                try:
                    # Rendu de la page en image (DPI 200 = bon compromis qualite/vitesse)
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                    # OCR avec francais + anglais
                    page_text = pytesseract.image_to_string(img, lang="fra+eng")

                    if page_text and page_text.strip():
                        texts.append(page_text.strip())

                    logger.info(
                        "ocr_page_done",
                        page=i + 1,
                        chars=len(page_text) if page_text else 0,
                    )
                except Exception as page_err:
                    logger.warning(
                        "ocr_page_failed",
                        page=i + 1,
                        error=str(page_err),
                    )
                    continue

            full_text = "\n".join(texts)
            logger.info(
                "ocr_completed",
                total_pages=len(doc),
                total_chars=len(full_text),
            )
            return full_text

        except ImportError as e:
            logger.warning(
                "ocr_missing_deps",
                error=str(e),
                hint="Installez pytesseract et pymupdf : pip install pytesseract pymupdf",
            )
            return ""
        except Exception as e:
            logger.warning("ocr_failed", error=str(e))
            return ""