"""
Assembleur de pack de candidature complet.

Genere les 4 documents Word (CV, Lettre, Guide, Relance) + leurs versions PDF,
puis les compresse tous dans un ZIP telechargeable.
"""

import os
import zipfile
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.errors import GenerationError
from app.core.logging import get_logger
from app.services.generation.pdf_export import convertir_en_pdf, pdf_disponible
from app.services.generation.word_cv import WordCVGenerator
from app.services.generation.word_guide import WordGuideGenerator
from app.services.generation.word_lettre import WordLettreGenerator
from app.services.generation.word_relance import WordRelanceGenerator

logger = get_logger("generation.pack_builder")


class PackBuilder:
    """Construit un pack complet : CV + Lettre + Guide (+ Relance) + PDFs + ZIP."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.cv_gen = WordCVGenerator()
        self.lettre_gen = WordLettreGenerator()
        self.guide_gen = WordGuideGenerator()
        self.relance_gen = WordRelanceGenerator()

    def build_pack(
        self,
        cv_data: Dict[str, Any],
        lettre_data: Dict[str, Any],
        guide_data: Dict[str, Any],
        relance_data: Optional[Dict[str, Any]] = None,
        locale: Optional[Dict[str, Any]] = None,
        pack_name: str = "Pack_Candidature_IA",
    ) -> Dict[str, Any]:
        """
        Genere tous les documents et retourne un dict avec :
          - zip_path : chemin du ZIP final
          - documents : liste des chemins de chaque fichier
          - pdf_disponible : booleen
        """
        if locale is None:
            locale = {}

        output_dir = self.settings.local_storage_path
        os.makedirs(output_dir, exist_ok=True)

        fichiers_generes: List[str] = []

        # ============================================================
        # 1. Generation des fichiers Word
        # ============================================================
        try:
            cv_path = self.cv_gen.generate(cv_data, locale, f"{pack_name}_1_CV.docx")
            fichiers_generes.append(cv_path)
            logger.info("cv_generated", path=cv_path)
        except Exception as e:
            raise GenerationError(
                message=f"Erreur generation CV: {str(e)}",
                details={"step": "cv"},
            ) from e

        try:
            lettre_path = self.lettre_gen.generate(lettre_data, locale, f"{pack_name}_2_Lettre.docx")
            fichiers_generes.append(lettre_path)
            logger.info("lettre_generated", path=lettre_path)
        except Exception as e:
            raise GenerationError(
                message=f"Erreur generation Lettre: {str(e)}",
                details={"step": "lettre"},
            ) from e

        try:
            guide_path = self.guide_gen.generate(guide_data, locale, f"{pack_name}_3_Guide.docx")
            fichiers_generes.append(guide_path)
            logger.info("guide_generated", path=guide_path)
        except Exception as e:
            raise GenerationError(
                message=f"Erreur generation Guide: {str(e)}",
                details={"step": "guide"},
            ) from e

        relance_path: Optional[str] = None
        if relance_data:
            try:
                relance_path = self.relance_gen.generate(
                    relance_data, locale, f"{pack_name}_4_Relance.docx"
                )
                fichiers_generes.append(relance_path)
                logger.info("relance_generated", path=relance_path)
            except Exception as e:
                logger.warning("relance_generation_failed", error=str(e))
                relance_path = None

        # ============================================================
        # 2. Conversion PDF (best effort)
        # ============================================================
        pdf_ok = pdf_disponible()
        if pdf_ok:
            for docx_path in list(fichiers_generes):
                try:
                    pdf_path = convertir_en_pdf(docx_path, output_dir)
                    if pdf_path:
                        fichiers_generes.append(pdf_path)
                except Exception as e:
                    logger.warning("pdf_conversion_failed", docx=docx_path, error=str(e))

        # ============================================================
        # 3. Assemblage du ZIP
        # ============================================================
        zip_path = os.path.join(output_dir, f"{pack_name}.zip")

        try:
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in fichiers_generes:
                    if os.path.exists(f):
                        zf.write(f, arcname=os.path.basename(f))
        except Exception as e:
            raise GenerationError(
                message=f"Erreur assemblage ZIP: {str(e)}",
                details={"step": "zip"},
            ) from e

        logger.info(
            "pack_built",
            zip_path=zip_path,
            nb_documents=len(fichiers_generes),
            pdf_ok=pdf_ok,
        )

        return {
            "zip_path": zip_path,
            "documents": fichiers_generes,
            "pdf_disponible": pdf_ok,
            "cv_path": cv_path,
            "lettre_path": lettre_path,
            "guide_path": guide_path,
            "relance_path": relance_path,
        }


# Singleton
_pack_builder: Optional[PackBuilder] = None


def get_pack_builder() -> PackBuilder:
    global _pack_builder
    if _pack_builder is None:
        _pack_builder = PackBuilder()
    return _pack_builder
