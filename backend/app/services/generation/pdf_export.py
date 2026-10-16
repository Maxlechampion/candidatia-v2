"""
Conversion Word -> PDF.

Strategie en cascade :
  1. LibreOffice headless (si installe) - meilleure fidelite
  2. docx2pdf (Windows uniquement, si Word installe)
  3. Fallback : retourne None (le Word reste disponible)

Sur les environnements de production Linux, LibreOffice est installe via apt.
Sur Windows, on utilise docx2pdf si Word est present.
"""

import os
import platform
import shutil
import subprocess
from typing import Optional

from app.core.logging import get_logger

logger = get_logger("generation.pdf_export")


def _chercher_libreoffice() -> Optional[str]:
    """Cherche LibreOffice sur le systeme."""
    candidats = [
        "soffice",
        "libreoffice",
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ]

    for c in candidats:
        chemin = shutil.which(c)
        if chemin:
            return chemin
        if os.path.exists(c):
            return c

    return None


def _convertir_via_libreoffice(docx_path: str, output_dir: str) -> Optional[str]:
    """Convertit un .docx en PDF via LibreOffice headless."""
    soffice = _chercher_libreoffice()
    if not soffice:
        return None

    try:
        subprocess.run(
            [
                soffice,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                output_dir,
                docx_path,
            ],
            check=True,
            capture_output=True,
            timeout=60,
        )

        base_name = os.path.splitext(os.path.basename(docx_path))[0]
        pdf_path = os.path.join(output_dir, base_name + ".pdf")

        if os.path.exists(pdf_path):
            return pdf_path

        return None

    except subprocess.TimeoutExpired:
        logger.warning("libreoffice_timeout", file=docx_path)
        return None
    except subprocess.CalledProcessError as e:
        logger.warning("libreoffice_error", file=docx_path, error=e.stderr.decode("utf-8", errors="ignore")[:200])
        return None
    except Exception as e:
        logger.warning("libreoffice_unexpected", file=docx_path, error=str(e))
        return None


def _convertir_via_docx2pdf(docx_path: str, output_dir: str) -> Optional[str]:
    """Convertit un .docx en PDF via docx2pdf (Windows/Mac uniquement)."""
    if platform.system() not in ("Windows", "Darwin"):
        return None

    try:
        from docx2pdf import convert
        base_name = os.path.splitext(os.path.basename(docx_path))[0]
        pdf_path = os.path.join(output_dir, base_name + ".pdf")
        convert(docx_path, pdf_path)

        if os.path.exists(pdf_path):
            return pdf_path
        return None

    except ImportError:
        logger.debug("docx2pdf_not_installed")
        return None
    except Exception as e:
        logger.warning("docx2pdf_error", file=docx_path, error=str(e))
        return None


def convertir_en_pdf(docx_path: str, output_dir: Optional[str] = None) -> Optional[str]:
    """
    Convertit un fichier .docx en PDF.

    Retourne le chemin du PDF genere, ou None si aucune methode n a fonctionne.
    """
    if not os.path.exists(docx_path):
        logger.warning("docx_not_found", path=docx_path)
        return None

    if output_dir is None:
        output_dir = os.path.dirname(docx_path)

    os.makedirs(output_dir, exist_ok=True)

    # 1. LibreOffice
    pdf = _convertir_via_libreoffice(docx_path, output_dir)
    if pdf:
        logger.info("pdf_generated_libreoffice", docx=docx_path, pdf=pdf)
        return pdf

    # 2. docx2pdf
    pdf = _convertir_via_docx2pdf(docx_path, output_dir)
    if pdf:
        logger.info("pdf_generated_docx2pdf", docx=docx_path, pdf=pdf)
        return pdf

    logger.warning("pdf_conversion_failed_no_method", docx=docx_path)
    return None


def pdf_disponible() -> bool:
    """Indique si au moins une methode de conversion est disponible."""
    if _chercher_libreoffice():
        return True

    if platform.system() in ("Windows", "Darwin"):
        try:
            import docx2pdf  # noqa: F401
            return True
        except ImportError:
            pass

    return False
