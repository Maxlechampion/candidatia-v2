"""Tests du mapping langue -> conventions culturelles."""

from app.services.language.locale_map import (
    get_locale_conventions,
    list_supported_locales,
)


def test_french_conventions() -> None:
    conv = get_locale_conventions("fr")
    assert conv["country"] == "FR"
    assert conv["cv_include_photo"] is True
    assert conv["cv_max_pages"] == 1
    assert conv["letter_format"] == "epistolaire_traditionnel"


def test_english_conventions() -> None:
    conv = get_locale_conventions("en")
    assert conv["country"] == "US"
    assert conv["cv_include_photo"] is False
    assert conv["cv_max_pages"] == 1
    assert conv["letter_format"] == "cover_letter_american"


def test_german_conventions() -> None:
    conv = get_locale_conventions("de")
    assert conv["country"] == "DE"
    assert conv["cv_include_photo"] is True
    assert conv["date_format"] == "DD.MM.YYYY"


def test_japanese_conventions() -> None:
    conv = get_locale_conventions("ja")
    assert conv["country"] == "JP"
    assert conv["cv_include_photo"] is True
    assert conv["cv_include_age"] is True
    assert conv["letter_format"] == "rirekisho_shokumu"


def test_arabic_conventions() -> None:
    conv = get_locale_conventions("ar")
    assert conv["country"] == "AE"
    assert conv["cv_include_marital_status"] is True


def test_unknown_language_fallback() -> None:
    conv = get_locale_conventions("xx")
    assert conv["country"] == "US"
    assert conv["letter_format"] == "cover_letter_american"


def test_case_insensitive() -> None:
    conv1 = get_locale_conventions("FR")
    conv2 = get_locale_conventions("fr")
    assert conv1 == conv2


def test_list_supported_locales() -> None:
    locales = list_supported_locales()
    assert "fr" in locales
    assert "en" in locales
    assert "es" in locales
    assert "zh-cn" in locales
    assert len(locales) >= 15
