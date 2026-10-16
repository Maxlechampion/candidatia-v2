"""
Mapping langue -> conventions culturelles du marche cible.

Determine comment un CV / une lettre doit etre formate selon
le pays ou la culture cible.

Inclut egalement les conventions d entretien :
  - interview_style : style dominant (collaboratif, direct, hierarchique, etc.)
  - interview_duration_minutes : duree typique d un 1er entretien
  - salary_negotiation_style : comment aborder la question salariale
  - interview_technical_depth : niveau d exigence technique attendu
"""

from typing import Any, Dict


LOCALE_CONVENTIONS: Dict[str, Dict[str, Any]] = {
    "fr": {
        "language_code": "fr",
        "country": "FR",
        "language_name": "Francais",
        "cv_max_pages": 1,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "epistolaire_traditionnel",
        "letter_max_words": 400,
        "date_format": "DD/MM/YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "collaboratif_occidental",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "en": {
        "language_code": "en",
        "country": "US",
        "language_name": "English",
        "cv_max_pages": 1,
        "cv_include_photo": False,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "cover_letter_american",
        "letter_max_words": 350,
        "date_format": "MM/DD/YYYY",
        "tone": "direct_professionnel",
        # --- Conventions d entretien ---
        "interview_style": "direct_anglo_saxon",
        "interview_duration_minutes": 45,
        "salary_negotiation_style": "direct",
        "interview_technical_depth": "eleve",
    },
    "es": {
        "language_code": "es",
        "country": "ES",
        "language_name": "Espanol",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "carta_presentacion",
        "letter_max_words": 400,
        "date_format": "DD/MM/YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "pt": {
        "language_code": "pt",
        "country": "PT",
        "language_name": "Portugues",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "carta_apresentacao",
        "letter_max_words": 400,
        "date_format": "DD/MM/YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "de": {
        "language_code": "de",
        "country": "DE",
        "language_name": "Deutsch",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "anschreiben_formel",
        "letter_max_words": 450,
        "date_format": "DD.MM.YYYY",
        "tone": "tres_formel",
        # --- Conventions d entretien ---
        "interview_style": "structure_et_formel",
        "interview_duration_minutes": 75,
        "salary_negotiation_style": "tres_indirect",
        "interview_technical_depth": "eleve",
    },
    "it": {
        "language_code": "it",
        "country": "IT",
        "language_name": "Italiano",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "lettera_presentazione",
        "letter_max_words": 400,
        "date_format": "DD/MM/YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "nl": {
        "language_code": "nl",
        "country": "NL",
        "language_name": "Nederlands",
        "cv_max_pages": 2,
        "cv_include_photo": False,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "sollicitatiebrief",
        "letter_max_words": 350,
        "date_format": "DD-MM-YYYY",
        "tone": "direct_professionnel",
        # --- Conventions d entretien ---
        "interview_style": "direct_anglo_saxon",
        "interview_duration_minutes": 45,
        "salary_negotiation_style": "direct",
        "interview_technical_depth": "standard",
    },
    "ar": {
        "language_code": "ar",
        "country": "AE",
        "language_name": "Arabic",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": True,
        "letter_format": "cover_letter_bilingue",
        "letter_max_words": 350,
        "date_format": "DD/MM/YYYY",
        "tone": "formel_respectueux",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "zh-cn": {
        "language_code": "zh-cn",
        "country": "CN",
        "language_name": "Chinese (Simplified)",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": True,
        "letter_format": "cover_letter_asiatique",
        "letter_max_words": 300,
        "date_format": "YYYY-MM-DD",
        "tone": "humble_respectueux",
        # --- Conventions d entretien ---
        "interview_style": "hierarchique_respectueux",
        "interview_duration_minutes": 75,
        "salary_negotiation_style": "jamais_aborde_directement",
        "interview_technical_depth": "eleve",
    },
    "ja": {
        "language_code": "ja",
        "country": "JP",
        "language_name": "Japanese",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": False,
        "letter_format": "rirekisho_shokumu",
        "letter_max_words": 300,
        "date_format": "YYYY-MM-DD",
        "tone": "tres_formel_respectueux",
        # --- Conventions d entretien ---
        "interview_style": "hierarchique_respectueux",
        "interview_duration_minutes": 90,
        "salary_negotiation_style": "jamais_aborde_directement",
        "interview_technical_depth": "standard",
    },
    "ko": {
        "language_code": "ko",
        "country": "KR",
        "language_name": "Korean",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": False,
        "letter_format": "jagisoseo",
        "letter_max_words": 350,
        "date_format": "YYYY-MM-DD",
        "tone": "formel_respectueux",
        # --- Conventions d entretien ---
        "interview_style": "hierarchique_respectueux",
        "interview_duration_minutes": 75,
        "salary_negotiation_style": "jamais_aborde_directement",
        "interview_technical_depth": "eleve",
    },
    "ru": {
        "language_code": "ru",
        "country": "RU",
        "language_name": "Russian",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": False,
        "letter_format": "soprovoditelnoe_pismo",
        "letter_max_words": 400,
        "date_format": "DD.MM.YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "structure_et_formel",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "eleve",
    },
    "tr": {
        "language_code": "tr",
        "country": "TR",
        "language_name": "Turkish",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "ozel_letter",
        "letter_max_words": 400,
        "date_format": "DD.MM.YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "hi": {
        "language_code": "hi",
        "country": "IN",
        "language_name": "Hindi",
        "cv_max_pages": 2,
        "cv_include_photo": True,
        "cv_include_age": True,
        "cv_include_marital_status": True,
        "letter_format": "cover_letter_indien",
        "letter_max_words": 350,
        "date_format": "DD/MM/YYYY",
        "tone": "formel_respectueux",
        # --- Conventions d entretien ---
        "interview_style": "hierarchique_respectueux",
        "interview_duration_minutes": 60,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
    "wo": {
        "language_code": "wo",
        "country": "SN",
        "language_name": "Wolof",
        "cv_max_pages": 1,
        "cv_include_photo": True,
        "cv_include_age": False,
        "cv_include_marital_status": False,
        "letter_format": "lettre_francophone",
        "letter_max_words": 350,
        "date_format": "DD/MM/YYYY",
        "tone": "formel",
        # --- Conventions d entretien ---
        "interview_style": "relationnel_chaleureux",
        "interview_duration_minutes": 45,
        "salary_negotiation_style": "indirect",
        "interview_technical_depth": "standard",
    },
}


DEFAULT_LOCALE: Dict[str, Any] = {
    "country": "US",
    "language_name": "English",
    "cv_max_pages": 1,
    "cv_include_photo": False,
    "cv_include_age": False,
    "cv_include_marital_status": False,
    "letter_format": "cover_letter_american",
    "letter_max_words": 350,
    "date_format": "MM/DD/YYYY",
    "tone": "direct_professionnel",
    # --- Conventions d entretien (par defaut) ---
    "interview_style": "collaboratif_occidental",
    "interview_duration_minutes": 60,
    "salary_negotiation_style": "direct",
    "interview_technical_depth": "standard",
}


def get_locale_conventions(language_code: str) -> Dict[str, Any]:
    """Retourne les conventions culturelles pour une langue donnee."""
    code = language_code.lower().strip()
    return LOCALE_CONVENTIONS.get(code, DEFAULT_LOCALE)


def list_supported_locales() -> list:
    """Retourne la liste des codes de langue supportes."""
    return list(LOCALE_CONVENTIONS.keys())