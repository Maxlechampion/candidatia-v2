#!/usr/bin/env node
/**
 * setup-phase2a.js — CandidatIA
 * Phase 2a : Services d'ingestion multi-format
 *
 * Crée :
 *   - backend/app/services/ingestion/base.py
 *   - backend/app/services/ingestion/pdf.py
 *   - backend/app/services/ingestion/docx.py
 *   - backend/app/services/ingestion/odt.py
 *   - backend/app/services/ingestion/rtf.py
 *   - backend/app/services/ingestion/html.py
 *   - backend/app/services/ingestion/markdown.py
 *   - backend/app/services/ingestion/image_ocr.py
 *   - backend/app/services/ingestion/text_raw.py
 *   - backend/app/services/ingestion/detector.py
 *   - backend/app/services/ingestion/service.py
 *
 * Usage : node setup-phase2a.js
 * Prérequis : avoir exécuté setup-phase0.js et setup-phase1.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ============================================================
// UTILITAIRES
// ============================================================

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, lines.join('\n') + '\n', 'utf-8');
  console.log('  OK  ' + relPath);
}

function logHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
  console.log('');
}

function logStep(step) {
  console.log('');
  console.log('> ' + step);
}

// ============================================================
// VÉRIFICATIONS
// ============================================================

logHeader('CandidatIA — Setup Phase 2a : Services ingestion');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'ingestion'))) {
  console.error('');
  console.error('  ERREUR : Le dossier backend/app/services/ingestion est introuvable.');
  console.error('  Execute d abord setup-phase0.js et setup-phase1.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. BASE — interface abstraite
// ============================================================

logStep('1. base.py (interface abstraite)');

writeLines('backend/app/services/ingestion/base.py', [
  '"""Interface abstraite de tout extracteur de document."""',
  '',
  'from abc import ABC, abstractmethod',
  '',
  'from app.core.errors import IngestionError',
  '',
  '',
  'class DocumentExtractor(ABC):',
  '    """Classe abstraite pour un extracteur de document."""',
  '',
  '    name: str = "base"',
  '    extensions: list = []',
  '',
  '    @abstractmethod',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        """Extrait le texte brut depuis les octets du fichier."""',
  '        ...',
  '',
  '    def can_handle(self, filename: str) -> bool:',
  '        """Retourne True si l extracteur gere l extension du fichier."""',
  '        if "." not in filename:',
  '            return False',
  '        ext = filename.rsplit(".", 1)[-1].lower()',
  '        return ext in self.extensions',
  '',
  '    def safe_extract(self, content_bytes: bytes, filename: str) -> str:',
  '        """Point d entree public. Gere les erreurs et le nettoyage."""',
  '        try:',
  '            text = self.extract(content_bytes, filename)',
  '        except IngestionError:',
  '            raise',
  '        except Exception as e:',
  '            raise IngestionError(',
  '                message=f"Erreur extraction {self.name}: {str(e)}",',
  '                details={"extractor": self.name, "filename": filename},',
  '            ) from e',
  '',
  '        cleaned = self._clean(text)',
  '        if not cleaned:',
  '            raise IngestionError(',
  '                message=f"Le fichier {filename} est vide ou illisible.",',
  '                details={"extractor": self.name, "filename": filename},',
  '            )',
  '        return cleaned',
  '',
  '    @staticmethod',
  '    def _clean(text: str) -> str:',
  '        """Nettoyage de base."""',
  '        if not text:',
  '            return ""',
  '        lines = [line.rstrip() for line in text.splitlines()]',
  '        lines = [line for line in lines if line.strip()]',
  '        return "\\n".join(lines).strip()',
]);

// ============================================================
// 2. PDF
// ============================================================

logStep('2. pdf.py (pypdf + pdfplumber + OCR fallback)');

writeLines('backend/app/services/ingestion/pdf.py', [
  '"""Extracteur PDF (pypdf + pdfplumber + OCR fallback)."""',
  '',
  'import io',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.pdf")',
  '',
  '',
  'class PDFExtractor(DocumentExtractor):',
  '    name = "pdf"',
  '    extensions = ["pdf"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        text = self._extract_pypdf(content_bytes)',
  '',
  '        if not text or len(text.strip()) < 50:',
  '            logger.info("pdf_fallback_pdfplumber", filename=filename)',
  '            text = self._extract_pdfplumber(content_bytes)',
  '',
  '        if not text or len(text.strip()) < 50:',
  '            logger.info("pdf_fallback_ocr", filename=filename)',
  '            text = self._extract_ocr(content_bytes)',
  '',
  '        return text',
  '',
  '    @staticmethod',
  '    def _extract_pypdf(content_bytes: bytes) -> str:',
  '        try:',
  '            import pypdf',
  '            reader = pypdf.PdfReader(io.BytesIO(content_bytes))',
  '            pages = []',
  '            for page in reader.pages:',
  '                page_text = page.extract_text()',
  '                if page_text:',
  '                    pages.append(page_text)',
  '            return "\\n".join(pages)',
  '        except Exception as e:',
  '            logger.warning("pypdf_failed", error=str(e))',
  '            return ""',
  '',
  '    @staticmethod',
  '    def _extract_pdfplumber(content_bytes: bytes) -> str:',
  '        try:',
  '            import pdfplumber',
  '            pages = []',
  '            with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:',
  '                for page in pdf.pages:',
  '                    page_text = page.extract_text()',
  '                    if page_text:',
  '                        pages.append(page_text)',
  '            return "\\n".join(pages)',
  '        except Exception as e:',
  '            logger.warning("pdfplumber_failed", error=str(e))',
  '            return ""',
  '',
  '    @staticmethod',
  '    def _extract_ocr(content_bytes: bytes) -> str:',
  '        """OCR de secours pour PDF scannes (necessite PyMuPDF optionnel)."""',
  '        try:',
  '            import fitz',
  '            import pytesseract',
  '            from PIL import Image',
  '',
  '            doc = fitz.open(stream=content_bytes, filetype="pdf")',
  '            texts = []',
  '            for page in doc:',
  '                pix = page.get_pixmap()',
  '                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)',
  '                page_text = pytesseract.image_to_string(img, lang="fra+eng")',
  '                if page_text:',
  '                    texts.append(page_text)',
  '            return "\\n".join(texts)',
  '        except ImportError:',
  '            logger.warning("ocr_not_available")',
  '            return ""',
  '        except Exception as e:',
  '            logger.warning("ocr_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 3. DOCX
// ============================================================

logStep('3. docx.py (python-docx + docx2txt fallback)');

writeLines('backend/app/services/ingestion/docx.py', [
  '"""Extracteur Word .docx (python-docx + docx2txt)."""',
  '',
  'import io',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.docx")',
  '',
  '',
  'class DOCXExtractor(DocumentExtractor):',
  '    name = "docx"',
  '    extensions = ["docx"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        text = self._extract_python_docx(content_bytes)',
  '',
  '        if not text or len(text.strip()) < 20:',
  '            logger.info("docx_fallback_docx2txt", filename=filename)',
  '            text = self._extract_docx2txt(content_bytes)',
  '',
  '        return text',
  '',
  '    @staticmethod',
  '    def _extract_python_docx(content_bytes: bytes) -> str:',
  '        try:',
  '            from docx import Document',
  '            doc = Document(io.BytesIO(content_bytes))',
  '            parts = []',
  '            for para in doc.paragraphs:',
  '                if para.text.strip():',
  '                    parts.append(para.text)',
  '            for table in doc.tables:',
  '                for row in table.rows:',
  '                    cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]',
  '                    if cells:',
  '                        parts.append(" | ".join(cells))',
  '            return "\\n".join(parts)',
  '        except Exception as e:',
  '            logger.warning("python_docx_failed", error=str(e))',
  '            return ""',
  '',
  '    @staticmethod',
  '    def _extract_docx2txt(content_bytes: bytes) -> str:',
  '        try:',
  '            import docx2txt',
  '            return docx2txt.process(io.BytesIO(content_bytes))',
  '        except Exception as e:',
  '            logger.warning("docx2txt_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 4. ODT
// ============================================================

logStep('4. odt.py (odfpy)');

writeLines('backend/app/services/ingestion/odt.py', [
  '"""Extracteur OpenDocument .odt (odfpy)."""',
  '',
  'import io',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.odt")',
  '',
  '',
  'class ODTExtractor(DocumentExtractor):',
  '    name = "odt"',
  '    extensions = ["odt"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        try:',
  '            from odf import teletype',
  '            from odf.opendocument import load',
  '            from odf.text import P',
  '',
  '            doc = load(io.BytesIO(content_bytes))',
  '            paragraphs = doc.getElementsByType(P)',
  '            parts = []',
  '            for p in paragraphs:',
  '                text = teletype.extractText(p)',
  '                if text.strip():',
  '                    parts.append(text)',
  '            return "\\n".join(parts)',
  '        except Exception as e:',
  '            logger.warning("odt_extract_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 5. RTF
// ============================================================

logStep('5. rtf.py (striprtf)');

writeLines('backend/app/services/ingestion/rtf.py', [
  '"""Extracteur RTF (striprtf)."""',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.rtf")',
  '',
  '',
  'class RTFExtractor(DocumentExtractor):',
  '    name = "rtf"',
  '    extensions = ["rtf"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        try:',
  '            from striprtf.striprtf import rtf_to_text',
  '            raw = content_bytes.decode("utf-8", errors="ignore")',
  '            return rtf_to_text(raw)',
  '        except Exception as e:',
  '            logger.warning("rtf_extract_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 6. HTML
// ============================================================

logStep('6. html.py (BeautifulSoup)');

writeLines('backend/app/services/ingestion/html.py', [
  '"""Extracteur HTML (BeautifulSoup)."""',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.html")',
  '',
  '',
  'class HTMLExtractor(DocumentExtractor):',
  '    name = "html"',
  '    extensions = ["html", "htm"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        try:',
  '            from bs4 import BeautifulSoup',
  '            raw = content_bytes.decode("utf-8", errors="ignore")',
  '            soup = BeautifulSoup(raw, "html.parser")',
  '',
  '            for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):',
  '                tag.decompose()',
  '',
  '            return soup.get_text(separator="\\n", strip=True)',
  '        except Exception as e:',
  '            logger.warning("html_extract_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 7. MARKDOWN
// ============================================================

logStep('7. markdown.py (nettoyage balisage)');

writeLines('backend/app/services/ingestion/markdown.py', [
  '"""Extracteur Markdown (nettoyage du balisage)."""',
  '',
  'import re',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.markdown")',
  '',
  '',
  'class MarkdownExtractor(DocumentExtractor):',
  '    name = "markdown"',
  '    extensions = ["md", "markdown"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        try:',
  '            raw = content_bytes.decode("utf-8", errors="ignore")',
  '',
  '            # Suppression des blocs de code',
  '            raw = re.sub(r"```.*?```", "", raw, flags=re.DOTALL)',
  '            raw = re.sub(r"`[^`]+`", "", raw)',
  '',
  '            # Liens Markdown [texte](url) -> texte',
  '            raw = re.sub(r"\\[([^\\]]+)\\]\\([^\\)]+\\)", r"\\1", raw)',
  '',
  '            # Titres, gras, italique',
  '            raw = re.sub(r"^#{1,6}\\s*", "", raw, flags=re.MULTILINE)',
  '            raw = re.sub(r"\\*\\*(.+?)\\*\\*", r"\\1", raw)',
  '            raw = re.sub(r"\\*(.+?)\\*", r"\\1", raw)',
  '            raw = re.sub(r"__(.+?)__", r"\\1", raw)',
  '            raw = re.sub(r"_(.+?)_", r"\\1", raw)',
  '',
  '            # Listes',
  '            raw = re.sub(r"^\\s*[-*+]\\s+", "", raw, flags=re.MULTILINE)',
  '            raw = re.sub(r"^\\s*\\d+\\.\\s+", "", raw, flags=re.MULTILINE)',
  '',
  '            # Separateurs',
  '            raw = re.sub(r"^[-=]{3,}$", "", raw, flags=re.MULTILINE)',
  '',
  '            return raw',
  '        except Exception as e:',
  '            logger.warning("markdown_extract_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 8. IMAGE OCR
// ============================================================

logStep('8. image_ocr.py (Tesseract OCR)');

writeLines('backend/app/services/ingestion/image_ocr.py', [
  '"""Extracteur image via OCR (Tesseract)."""',
  '',
  'import io',
  '',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  '',
  'logger = get_logger("ingestion.image_ocr")',
  '',
  '',
  'class ImageOCRExtractor(DocumentExtractor):',
  '    name = "image_ocr"',
  '    extensions = ["png", "jpg", "jpeg", "tiff", "tif", "bmp", "webp"]',
  '',
  '    def extract(self, content_bytes: bytes, filename: str) -> str:',
  '        try:',
  '            import pytesseract',
  '            from PIL import Image',
  '',
  '            img = Image.open(io.BytesIO(content_bytes))',
  '            text = pytesseract.image_to_string(img, lang="fra+eng")',
  '            return text',
  '        except ImportError as e:',
  '            logger.warning("ocr_missing_deps", error=str(e))',
  '            return ""',
  '        except Exception as e:',
  '            logger.warning("ocr_failed", error=str(e))',
  '            return ""',
]);

// ============================================================
// 9. TEXTE BRUT
// ============================================================

logStep('9. text_raw.py (nettoyage texte colle)');

writeLines('backend/app/services/ingestion/text_raw.py', [
  '"""Nettoyage du texte brut colle par l utilisateur."""',
  '',
  'import re',
  '',
  '',
  'def clean_raw_text(text: str) -> str:',
  '    """Nettoie un texte brut : normalise les espaces et sauts de ligne."""',
  '    if not text:',
  '        return ""',
  '',
  '    # Normalisation des retours chariot',
  '    text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")',
  '',
  '    # Remplacement des tabulations par des espaces',
  '    text = text.replace("\\t", " ")',
  '',
  '    # Suppression des espaces multiples',
  '    text = re.sub(r"[ ]{2,}", " ", text)',
  '',
  '    # Suppression des lignes vides multiples',
  '    text = re.sub(r"\\n{3,}", "\\n\\n", text)',
  '',
  '    return text.strip()',
  '',
  '',
  'class TextRawExtractor:',
  '    """Extracteur pour le texte brut (pas de fichier)."""',
  '',
  '    name = "text_raw"',
  '',
  '    def extract(self, text: str) -> str:',
  '        cleaned = clean_raw_text(text)',
  '        if not cleaned:',
  '            raise ValueError("Le texte fourni est vide.")',
  '        return cleaned',
]);

// ============================================================
// 10. DÉTECTEUR DE TYPE DE CONTENU
// ============================================================

logStep('10. detector.py (CV vs offre)');

writeLines('backend/app/services/ingestion/detector.py', [
  '"""Detection automatique du type de contenu (CV vs offre d emploi)."""',
  '',
  'from typing import Dict, Tuple',
  '',
  '',
  'CV_KEYWORDS: Dict[str, int] = {',
  '    "experience professionnelle": 5,',
  '    "experiences professionnelles": 5,',
  '    "formation": 3,',
  '    "formations": 3,',
  '    "competences": 4,',
  '    "competences techniques": 5,',
  '    "competences humaines": 4,',
  '    "langues": 2,',
  '    "centres d interet": 3,',
  '    "loisirs": 2,',
  '    "profil": 2,',
  '    "diplome": 3,',
  '    "master": 2,',
  '    "licence": 2,',
  '    "baccalaureat": 2,',
  '    "curriculum vitae": 5,',
  '    "cv": 3,',
  '    "parcours professionnel": 4,',
  '    "references": 2,',
  '    "missions": 2,',
  '    "poste occupe": 3,',
  '}',
  '',
  'OFFRE_KEYWORDS: Dict[str, int] = {',
  '    "nous recherchons": 5,',
  '    "nous recrutons": 5,',
  '    "rejoignez": 4,',
  '    "rejoindre notre equipe": 5,',
  '    "poste a pourvoir": 5,',
  '    "profil recherche": 5,',
  '    "missions principales": 4,',
  '    "vos missions": 4,',
  '    "votre mission": 4,',
  '    "ce que nous offrons": 4,',
  '    "avantages": 2,',
  '    "cdi": 3,',
  '    "cdd": 3,',
  '    "stage": 2,',
  '    "alternance": 2,',
  '    "freelance": 2,',
  '    "salaire": 3,',
  '    "remuneration": 3,',
  '    "package": 2,',
  '    "poste base": 3,',
  '    "lieu du poste": 4,',
  '    "date de debut": 3,',
  '    "candidature": 2,',
  '    "cv et lettre de motivation": 3,',
  '    "lettre de motivation": 2,',
  '    "entreprise recrute": 4,',
  '    "societe recrute": 4,',
  '    "groupe recrute": 4,',
  '    "candidater": 3,',
  '    "postuler": 3,',
  '    "offre d emploi": 5,',
  '}',
  '',
  '',
  'def _normalize(text: str) -> str:',
  '    """Normalise pour la recherche de mots-cles (retire les accents)."""',
  '    text = text.lower()',
  '    text = text.replace("\\u00e9", "e").replace("\\u00e8", "e").replace("\\u00ea", "e")',
  '    text = text.replace("\\u00e0", "a").replace("\\u00e2", "a")',
  '    text = text.replace("\\u00ee", "i").replace("\\u00ef", "i")',
  '    text = text.replace("\\u00f4", "o").replace("\\u00f9", "u").replace("\\u00fb", "u")',
  '    text = text.replace("\\u00e7", "c")',
  '    text = text.replace("\\u0027", " ")',
  '    return text',
  '',
  '',
  'def detect_content_type(text: str) -> Tuple[str, float]:',
  '    """',
  '    Detecte si le texte est un CV ou une offre d emploi.',
  '',
  '    Retourne : (type, confidence)',
  '      - type : "cv" | "offre" | "inconnu"',
  '      - confidence : score de 0.0 a 1.0',
  '    """',
  '    if not text or len(text.strip()) < 50:',
  '        return ("inconnu", 0.0)',
  '',
  '    normalized = _normalize(text)',
  '',
  '    cv_score = sum(weight for kw, weight in CV_KEYWORDS.items() if kw in normalized)',
  '    offre_score = sum(weight for kw, weight in OFFRE_KEYWORDS.items() if kw in normalized)',
  '',
  '    total = cv_score + offre_score',
  '    if total == 0:',
  '        return ("inconnu", 0.0)',
  '',
  '    if cv_score > offre_score:',
  '        confidence = cv_score / total',
  '        return ("cv", round(confidence, 2))',
  '    elif offre_score > cv_score:',
  '        confidence = offre_score / total',
  '        return ("offre", round(confidence, 2))',
  '    else:',
  '        return ("inconnu", 0.0)',
]);

// ============================================================
// 11. SERVICE (orchestrateur)
// ============================================================

logStep('11. service.py (orchestrateur d ingestion)');

writeLines('backend/app/services/ingestion/service.py', [
  '"""Service d ingestion : route automatiquement vers le bon extracteur."""',
  '',
  'from typing import List, Optional',
  '',
  'from app.core.errors import IngestionError',
  'from app.core.logging import get_logger',
  'from app.services.ingestion.base import DocumentExtractor',
  'from app.services.ingestion.docx import DOCXExtractor',
  'from app.services.ingestion.html import HTMLExtractor',
  'from app.services.ingestion.image_ocr import ImageOCRExtractor',
  'from app.services.ingestion.markdown import MarkdownExtractor',
  'from app.services.ingestion.odt import ODTExtractor',
  'from app.services.ingestion.pdf import PDFExtractor',
  'from app.services.ingestion.rtf import RTFExtractor',
  'from app.services.ingestion.text_raw import TextRawExtractor',
  '',
  'logger = get_logger("ingestion.service")',
  '',
  '',
  'class IngestionService:',
  '    """Service principal d ingestion."""',
  '',
  '    def __init__(self) -> None:',
  '        self._extractors: List[DocumentExtractor] = [',
  '            PDFExtractor(),',
  '            DOCXExtractor(),',
  '            ODTExtractor(),',
  '            RTFExtractor(),',
  '            HTMLExtractor(),',
  '            MarkdownExtractor(),',
  '            ImageOCRExtractor(),',
  '        ]',
  '        self._text_extractor = TextRawExtractor()',
  '',
  '    def extract_from_bytes(self, content_bytes: bytes, filename: str) -> str:',
  '        """Extrait le texte depuis un fichier binaire."""',
  '        if not content_bytes:',
  '            raise IngestionError(',
  '                message="Le fichier est vide.",',
  '                details={"filename": filename},',
  '            )',
  '',
  '        if not filename or "." not in filename:',
  '            raise IngestionError(',
  '                message="Nom de fichier invalide (extension manquante).",',
  '                details={"filename": filename},',
  '            )',
  '',
  '        for extractor in self._extractors:',
  '            if extractor.can_handle(filename):',
  '                logger.info(',
  '                    "extractor_selected",',
  '                    extractor=extractor.name,',
  '                    filename=filename,',
  '                )',
  '                return extractor.safe_extract(content_bytes, filename)',
  '',
  '        ext = filename.rsplit(".", 1)[-1].lower()',
  '        raise IngestionError(',
  '            message=f"Format .{ext} non supporte.",',
  '            details={',
  '                "filename": filename,',
  '                "supported": [e for ext in self._extractors for e in ext.extensions],',
  '            },',
  '        )',
  '',
  '    def extract_from_text(self, text: str) -> str:',
  '        """Nettoie et retourne un texte brut colle par l utilisateur."""',
  '        return self._text_extractor.extract(text)',
  '',
  '',
  '# Singleton',
  '_ingestion_service: Optional[IngestionService] = None',
  '',
  '',
  'def get_ingestion_service() -> IngestionService:',
  '    global _ingestion_service',
  '    if _ingestion_service is None:',
  '        _ingestion_service = IngestionService()',
  '    return _ingestion_service',
]);

// ============================================================
// 12. MISE À JOUR __init__.py
// ============================================================

logStep('12. Mise a jour __init__.py');

writeLines('backend/app/services/ingestion/__init__.py', [
  '"""Services d ingestion de documents (multi-format)."""',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 2a terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/ingestion/base.py');
console.log('    - backend/app/services/ingestion/pdf.py');
console.log('    - backend/app/services/ingestion/docx.py');
console.log('    - backend/app/services/ingestion/odt.py');
console.log('    - backend/app/services/ingestion/rtf.py');
console.log('    - backend/app/services/ingestion/html.py');
console.log('    - backend/app/services/ingestion/markdown.py');
console.log('    - backend/app/services/ingestion/image_ocr.py');
console.log('    - backend/app/services/ingestion/text_raw.py');
console.log('    - backend/app/services/ingestion/detector.py');
console.log('    - backend/app/services/ingestion/service.py');
console.log('    - backend/app/services/ingestion/__init__.py');
console.log('');
console.log('  Verification rapide :');
console.log('    dir backend\\app\\services\\ingestion');
console.log('    # Doit afficher 12 fichiers .py');
console.log('');
console.log('  Prochaine etape : setup-phase2b.js (services de langue)');
console.log('');