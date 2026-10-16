"""Tests du detecteur de langue."""

from app.services.language.detector import (
    detect_language,
    get_language_name,
    is_supported,
)


def test_detect_french() -> None:
    text = (
        "Bonjour, je suis un developpeur passionne par les nouvelles "
        "technologies et j aime creer des applications web modernes."
    )
    assert detect_language(text) == "fr"


def test_detect_english() -> None:
    text = (
        "Hello, I am a passionate developer who loves building web "
        "applications and solving complex problems every day."
    )
    assert detect_language(text) == "en"


def test_detect_spanish() -> None:
    text = (
        "Hola, soy un desarrollador apasionado por las nuevas "
        "tecnologias y me encanta crear aplicaciones web modernas."
    )
    assert detect_language(text) == "es"


def test_detect_short_text_returns_default() -> None:
    assert detect_language("hi") == "en"
    assert detect_language("") == "en"


def test_detect_custom_default() -> None:
    assert detect_language("short", default="fr") == "fr"


def test_get_language_name() -> None:
    assert get_language_name("fr") == "Francais"
    assert get_language_name("en") == "English"
    assert get_language_name("es") == "Espanol"


def test_get_language_name_unknown() -> None:
    assert get_language_name("xx") == "XX"


def test_is_supported() -> None:
    assert is_supported("fr") is True
    assert is_supported("en") is True
    assert is_supported("xx") is False
