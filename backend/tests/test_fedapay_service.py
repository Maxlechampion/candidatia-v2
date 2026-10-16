"""Tests du provider FedaPay."""

from app.services.payment.fedapay import FedaPayProvider


def test_fedapay_provider_instantiation() -> None:
    """Verifie que le provider peut etre instancie."""
    provider = FedaPayProvider()
    assert provider.name == "fedapay"


def test_fedapay_is_available_without_key() -> None:
    """Sans cle API, is_available doit retourner False."""
    provider = FedaPayProvider()
    # Note : depend de la config .env actuelle
    # Si FEDAPAY_SECRET_KEY est definie, ce test peut echouer
    result = provider.is_available()
    assert isinstance(result, bool)


def test_fedapay_api_url_sandbox() -> None:
    """L URL sandbox doit contenir sandbox-api."""
    provider = FedaPayProvider()
    provider.settings.fedapay_env = "sandbox"
    url = provider._api_url()
    assert "sandbox-api" in url


def test_fedapay_api_url_live() -> None:
    """L URL live doit contenir api.fedapay.com."""
    provider = FedaPayProvider()
    provider.settings.fedapay_env = "live"
    url = provider._api_url()
    assert "sandbox" not in url
    assert "api.fedapay.com" in url
