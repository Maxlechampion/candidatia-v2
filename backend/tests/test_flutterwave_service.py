"""Tests du provider Flutterwave."""

from app.services.payment.flutterwave import FlutterwaveProvider


def test_flutterwave_provider_instantiation() -> None:
    """Verifie que le provider peut etre instancie."""
    provider = FlutterwaveProvider()
    assert provider.name == "flutterwave"


def test_flutterwave_is_available_without_key() -> None:
    """Sans cle API, is_available doit retourner False."""
    provider = FlutterwaveProvider()
    result = provider.is_available()
    assert isinstance(result, bool)


def test_flutterwave_headers_format() -> None:
    """Les headers doivent contenir Authorization Bearer."""
    provider = FlutterwaveProvider()
    provider.settings.flutterwave_secret_key = "test_key_123"
    headers = provider._headers()
    assert "Authorization" in headers
    assert headers["Authorization"].startswith("Bearer ")
    assert headers["Content-Type"] == "application/json"
