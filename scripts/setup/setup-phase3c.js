#!/usr/bin/env node
/**
 * setup-phase3c.js — CandidatIA
 * Phase 3c : PDF export + Pack builder (ZIP)
 *
 * Crée :
 *   - backend/app/services/generation/pdf_export.py
 *   - backend/app/services/generation/pack_builder.py
 *
 * Usage : node setup-phase3c.js
 * Prérequis : avoir exécuté setup-phase3a.js et setup-phase3b.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

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

logHeader('CandidatIA — Setup Phase 3c : PDF + Pack builder');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'services', 'generation', 'word_relance.py'))) {
  console.error('');
  console.error('  ERREUR : Les generateurs Word sont introuvables.');
  console.error('  Execute d abord setup-phase3a.js et setup-phase3b.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. PDF EXPORT
// ============================================================

logStep('1. pdf_export.py (conversion Word -> PDF)');

writeLines('backend/app/services/generation/pdf_export.py', [
  '"""',
  'Conversion Word -> PDF.',
  '',
  'Strategie en cascade :',
  '  1. LibreOffice headless (si installe) - meilleure fidelite',
  '  2. docx2pdf (Windows uniquement, si Word installe)',
  '  3. Fallback : retourne None (le Word reste disponible)',
  '',
  'Sur les environnements de production Linux, LibreOffice est installe via apt.',
  'Sur Windows, on utilise docx2pdf si Word est present.',
  '"""',
  '',
  'import os',
  'import platform',
  'import shutil',
  'import subprocess',
  'from typing import Optional',
  '',
  'from app.core.logging import get_logger',
  '',
  'logger = get_logger("generation.pdf_export")',
  '',
  '',
  'def _chercher_libreoffice() -> Optional[str]:',
  '    """Cherche LibreOffice sur le systeme."""',
  '    candidats = [',
  '        "soffice",',
  '        "libreoffice",',
  '        "/usr/bin/soffice",',
  '        "/usr/bin/libreoffice",',
  '        "C:\\\\Program Files\\\\LibreOffice\\\\program\\\\soffice.exe",',
  '        "C:\\\\Program Files (x86)\\\\LibreOffice\\\\program\\\\soffice.exe",',
  '    ]',
  '',
  '    for c in candidats:',
  '        chemin = shutil.which(c)',
  '        if chemin:',
  '            return chemin',
  '        if os.path.exists(c):',
  '            return c',
  '',
  '    return None',
  '',
  '',
  'def _convertir_via_libreoffice(docx_path: str, output_dir: str) -> Optional[str]:',
  '    """Convertit un .docx en PDF via LibreOffice headless."""',
  '    soffice = _chercher_libreoffice()',
  '    if not soffice:',
  '        return None',
  '',
  '    try:',
  '        subprocess.run(',
  '            [',
  '                soffice,',
  '                "--headless",',
  '                "--convert-to",',
  '                "pdf",',
  '                "--outdir",',
  '                output_dir,',
  '                docx_path,',
  '            ],',
  '            check=True,',
  '            capture_output=True,',
  '            timeout=60,',
  '        )',
  '',
  '        base_name = os.path.splitext(os.path.basename(docx_path))[0]',
  '        pdf_path = os.path.join(output_dir, base_name + ".pdf")',
  '',
  '        if os.path.exists(pdf_path):',
  '            return pdf_path',
  '',
  '        return None',
  '',
  '    except subprocess.TimeoutExpired:',
  '        logger.warning("libreoffice_timeout", file=docx_path)',
  '        return None',
  '    except subprocess.CalledProcessError as e:',
  '        logger.warning("libreoffice_error", file=docx_path, error=e.stderr.decode("utf-8", errors="ignore")[:200])',
  '        return None',
  '    except Exception as e:',
  '        logger.warning("libreoffice_unexpected", file=docx_path, error=str(e))',
  '        return None',
  '',
  '',
  'def _convertir_via_docx2pdf(docx_path: str, output_dir: str) -> Optional[str]:',
  '    """Convertit un .docx en PDF via docx2pdf (Windows/Mac uniquement)."""',
  '    if platform.system() not in ("Windows", "Darwin"):',
  '        return None',
  '',
  '    try:',
  '        from docx2pdf import convert',
  '        base_name = os.path.splitext(os.path.basename(docx_path))[0]',
  '        pdf_path = os.path.join(output_dir, base_name + ".pdf")',
  '        convert(docx_path, pdf_path)',
  '',
  '        if os.path.exists(pdf_path):',
  '            return pdf_path',
  '        return None',
  '',
  '    except ImportError:',
  '        logger.debug("docx2pdf_not_installed")',
  '        return None',
  '    except Exception as e:',
  '        logger.warning("docx2pdf_error", file=docx_path, error=str(e))',
  '        return None',
  '',
  '',
  'def convertir_en_pdf(docx_path: str, output_dir: Optional[str] = None) -> Optional[str]:',
  '    """',
  '    Convertit un fichier .docx en PDF.',
  '',
  '    Retourne le chemin du PDF genere, ou None si aucune methode n a fonctionne.',
  '    """',
  '    if not os.path.exists(docx_path):',
  '        logger.warning("docx_not_found", path=docx_path)',
  '        return None',
  '',
  '    if output_dir is None:',
  '        output_dir = os.path.dirname(docx_path)',
  '',
  '    os.makedirs(output_dir, exist_ok=True)',
  '',
  '    # 1. LibreOffice',
  '    pdf = _convertir_via_libreoffice(docx_path, output_dir)',
  '    if pdf:',
  '        logger.info("pdf_generated_libreoffice", docx=docx_path, pdf=pdf)',
  '        return pdf',
  '',
  '    # 2. docx2pdf',
  '    pdf = _convertir_via_docx2pdf(docx_path, output_dir)',
  '    if pdf:',
  '        logger.info("pdf_generated_docx2pdf", docx=docx_path, pdf=pdf)',
  '        return pdf',
  '',
  '    logger.warning("pdf_conversion_failed_no_method", docx=docx_path)',
  '    return None',
  '',
  '',
  'def pdf_disponible() -> bool:',
  '    """Indique si au moins une methode de conversion est disponible."""',
  '    if _chercher_libreoffice():',
  '        return True',
  '',
  '    if platform.system() in ("Windows", "Darwin"):',
  '        try:',
  '            import docx2pdf  # noqa: F401',
  '            return True',
  '        except ImportError:',
  '            pass',
  '',
  '    return False',
]);

// ============================================================
// 2. PACK BUILDER
// ============================================================

logStep('2. pack_builder.py (assemblage ZIP)');

writeLines('backend/app/services/generation/pack_builder.py', [
  '"""',
  'Assembleur de pack de candidature complet.',
  '',
  'Genere les 4 documents Word (CV, Lettre, Guide, Relance) + leurs versions PDF,',
  'puis les compresse tous dans un ZIP telechargeable.',
  '"""',
  '',
  'import os',
  'import zipfile',
  'from typing import Any, Dict, List, Optional',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import GenerationError',
  'from app.core.logging import get_logger',
  'from app.services.generation.pdf_export import convertir_en_pdf, pdf_disponible',
  'from app.services.generation.word_cv import WordCVGenerator',
  'from app.services.generation.word_guide import WordGuideGenerator',
  'from app.services.generation.word_lettre import WordLettreGenerator',
  'from app.services.generation.word_relance import WordRelanceGenerator',
  '',
  'logger = get_logger("generation.pack_builder")',
  '',
  '',
  'class PackBuilder:',
  '    """Construit un pack complet : CV + Lettre + Guide (+ Relance) + PDFs + ZIP."""',
  '',
  '    def __init__(self) -> None:',
  '        self.settings = get_settings()',
  '        self.cv_gen = WordCVGenerator()',
  '        self.lettre_gen = WordLettreGenerator()',
  '        self.guide_gen = WordGuideGenerator()',
  '        self.relance_gen = WordRelanceGenerator()',
  '',
  '    def build_pack(',
  '        self,',
  '        cv_data: Dict[str, Any],',
  '        lettre_data: Dict[str, Any],',
  '        guide_data: Dict[str, Any],',
  '        relance_data: Optional[Dict[str, Any]] = None,',
  '        locale: Optional[Dict[str, Any]] = None,',
  '        pack_name: str = "Pack_Candidature_IA",',
  '    ) -> Dict[str, Any]:',
  '        """',
  '        Genere tous les documents et retourne un dict avec :',
  '          - zip_path : chemin du ZIP final',
  '          - documents : liste des chemins de chaque fichier',
  '          - pdf_disponible : booleen',
  '        """',
  '        if locale is None:',
  '            locale = {}',
  '',
  '        output_dir = self.settings.local_storage_path',
  '        os.makedirs(output_dir, exist_ok=True)',
  '',
  '        fichiers_generes: List[str] = []',
  '',
  '        # ============================================================',
  '        # 1. Generation des fichiers Word',
  '        # ============================================================',
  '        try:',
  '            cv_path = self.cv_gen.generate(cv_data, locale, f"{pack_name}_1_CV.docx")',
  '            fichiers_generes.append(cv_path)',
  '            logger.info("cv_generated", path=cv_path)',
  '        except Exception as e:',
  '            raise GenerationError(',
  '                message=f"Erreur generation CV: {str(e)}",',
  '                details={"step": "cv"},',
  '            ) from e',
  '',
  '        try:',
  '            lettre_path = self.lettre_gen.generate(lettre_data, locale, f"{pack_name}_2_Lettre.docx")',
  '            fichiers_generes.append(lettre_path)',
  '            logger.info("lettre_generated", path=lettre_path)',
  '        except Exception as e:',
  '            raise GenerationError(',
  '                message=f"Erreur generation Lettre: {str(e)}",',
  '                details={"step": "lettre"},',
  '            ) from e',
  '',
  '        try:',
  '            guide_path = self.guide_gen.generate(guide_data, locale, f"{pack_name}_3_Guide.docx")',
  '            fichiers_generes.append(guide_path)',
  '            logger.info("guide_generated", path=guide_path)',
  '        except Exception as e:',
  '            raise GenerationError(',
  '                message=f"Erreur generation Guide: {str(e)}",',
  '                details={"step": "guide"},',
  '            ) from e',
  '',
  '        relance_path: Optional[str] = None',
  '        if relance_data:',
  '            try:',
  '                relance_path = self.relance_gen.generate(',
  '                    relance_data, locale, f"{pack_name}_4_Relance.docx"',
  '                )',
  '                fichiers_generes.append(relance_path)',
  '                logger.info("relance_generated", path=relance_path)',
  '            except Exception as e:',
  '                logger.warning("relance_generation_failed", error=str(e))',
  '                relance_path = None',
  '',
  '        # ============================================================',
  '        # 2. Conversion PDF (best effort)',
  '        # ============================================================',
  '        pdf_ok = pdf_disponible()',
  '        if pdf_ok:',
  '            for docx_path in list(fichiers_generes):',
  '                try:',
  '                    pdf_path = convertir_en_pdf(docx_path, output_dir)',
  '                    if pdf_path:',
  '                        fichiers_generes.append(pdf_path)',
  '                except Exception as e:',
  '                    logger.warning("pdf_conversion_failed", docx=docx_path, error=str(e))',
  '',
  '        # ============================================================',
  '        # 3. Assemblage du ZIP',
  '        # ============================================================',
  '        zip_path = os.path.join(output_dir, f"{pack_name}.zip")',
  '',
  '        try:',
  '            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:',
  '                for f in fichiers_generes:',
  '                    if os.path.exists(f):',
  '                        zf.write(f, arcname=os.path.basename(f))',
  '        except Exception as e:',
  '            raise GenerationError(',
  '                message=f"Erreur assemblage ZIP: {str(e)}",',
  '                details={"step": "zip"},',
  '            ) from e',
  '',
  '        logger.info(',
  '            "pack_built",',
  '            zip_path=zip_path,',
  '            nb_documents=len(fichiers_generes),',
  '            pdf_ok=pdf_ok,',
  '        )',
  '',
  '        return {',
  '            "zip_path": zip_path,',
  '            "documents": fichiers_generes,',
  '            "pdf_disponible": pdf_ok,',
  '            "cv_path": cv_path,',
  '            "lettre_path": lettre_path,',
  '            "guide_path": guide_path,',
  '            "relance_path": relance_path,',
  '        }',
  '',
  '',
  '# Singleton',
  '_pack_builder: Optional[PackBuilder] = None',
  '',
  '',
  'def get_pack_builder() -> PackBuilder:',
  '    global _pack_builder',
  '    if _pack_builder is None:',
  '        _pack_builder = PackBuilder()',
  '    return _pack_builder',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 3c terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/generation/pdf_export.py');
console.log('    - backend/app/services/generation/pack_builder.py');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Verifier les fichiers :');
console.log('     dir backend\\app\\services\\generation');
console.log('     # Doit afficher 9 fichiers .py');
console.log('');
console.log('  2. Tester les imports :');
console.log('     cd backend');
console.log('     .\\venv\\Scripts\\Activate.ps1');
console.log('     python -c "from app.services.generation.pack_builder import PackBuilder; from app.services.generation.pdf_export import pdf_disponible; print(\\"PDF dispo:\\", pdf_disponible())"');
console.log('');
console.log('  Prochaine etape : setup-phase3d.js (Router /api/generate)');
console.log('');