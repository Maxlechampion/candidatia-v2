"""Detection de la langue source d un texte (langdetect)."""

from app.core.logging import get_logger

logger = get_logger("language.detector")


SUPPORTED_LANGUAGES = {
    "fr": "Francais",
    "en": "English",
    "es": "Espanol",
    "pt": "Portugues",
    "de": "Deutsch",
    "it": "Italiano",
    "nl": "Nederlands",
    "ar": "Arabic",
    "zh-cn": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ru": "Russian",
    "tr": "Turkish",
    "hi": "Hindi",
    "wo": "Wolof",
    "sw": "Swahili",
}


def detect_language(text: str, default: str = "en") -> str:
    """
    Detecte la langue d un texte. Retourne un code ISO 639-1.

    Si la langue detectee n est pas dans SUPPORTED_LANGUAGES,
    retourne la langue par defaut (anglais).
    """
    if not text or len(text.strip()) < 20:
        return default

    try:
        from langdetect import detect, DetectorFactory
        DetectorFactory.seed = 0  # Resultats deterministes

        code = detect(text)
        code = code.lower()

        # Normalisation du chinois (zh, zh-cn, zh-tw -> zh-cn)
        if code in ("zh", "zh-cn", "zh-tw"):
            return "zh-cn"

        # Si la langue est supportee, on la retourne
        if code in SUPPORTED_LANGUAGES:
            return code

        # Sinon fallback sur la langue par defaut
        logger.info("language_unsupported_fallback", detected=code, fallback=default)
        return default

    except Exception as e:
        logger.warning("language_detection_failed", error=str(e))
        return default


def get_language_name(code: str) -> str:
    """Retourne le nom lisible d une langue a partir de son code."""
    return SUPPORTED_LANGUAGES.get(code.lower(), code.upper())


def is_supported(code: str) -> bool:
    """Verifie si une langue est supportee."""
    return code.lower() in SUPPORTED_LANGUAGES
