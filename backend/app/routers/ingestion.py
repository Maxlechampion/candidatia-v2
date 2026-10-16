"""Router /api/ingest — Point d entree unique pour l ingestion."""

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import get_settings
from app.core.errors import IngestionError
from app.core.logging import get_logger
from app.services.ingestion.detector import detect_content_type
from app.services.ingestion.service import get_ingestion_service
from app.services.language.detector import detect_language, get_language_name
from app.services.language.locale_map import get_locale_conventions

logger = get_logger("router.ingestion")
router = APIRouter(prefix="/api", tags=["ingestion"])


@router.post("/ingest", summary="Ingestion d un fichier ou texte brut")
async def ingest(
    fichier: Optional[UploadFile] = File(None),
    texte: Optional[str] = Form(None),
    content_type_hint: Optional[str] = Form(None),
):
    """
    Ingere un document (fichier ou texte brut) et retourne :
    - le texte nettoye
    - la langue detectee
    - le type de contenu (cv / offre / inconnu)
    - les conventions culturelles associees
    """
    settings = get_settings()
    service = get_ingestion_service()

    # Validation : au moins un des deux
    if not fichier and not texte:
        raise HTTPException(
            status_code=400,
            detail="Fournir soit un fichier soit un texte.",
        )

    # 1. Extraction
    if fichier:
        content_bytes = await fichier.read()

        # Verification taille
        max_bytes = settings.max_file_size_mb * 1024 * 1024
        if len(content_bytes) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux (max {settings.max_file_size_mb} MB).",
            )

        try:
            extracted = service.extract_from_bytes(content_bytes, fichier.filename or "unknown")
        except IngestionError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)

        source = "file"
        filename = fichier.filename
    else:
        try:
            extracted = service.extract_from_text(texte)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        source = "text"
        filename = None

    # 2. Detection langue
    detected_language = detect_language(extracted)
    language_name = get_language_name(detected_language)

    # 3. Detection type de contenu
    if content_type_hint in ("cv", "offre"):
        detected_type = content_type_hint
        confidence = 1.0
    else:
        detected_type, confidence = detect_content_type(extracted)

    # 4. Conventions culturelles
    locale_conventions = get_locale_conventions(detected_language)

    logger.info(
        "ingestion_success",
        source=source,
        filename=filename,
        text_length=len(extracted),
        language=detected_language,
        content_type=detected_type,
        confidence=confidence,
    )

    return {
        "status": "ok",
        "source": source,
        "filename": filename,
        "text": extracted,
        "text_length": len(extracted),
        "language": {
            "code": detected_language,
            "name": language_name,
        },
        "content_type": {
            "type": detected_type,
            "confidence": confidence,
        },
        "locale": locale_conventions,
    }
