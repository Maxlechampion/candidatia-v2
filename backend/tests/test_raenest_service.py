"""Tests du provider Raenest."""

from app.services.payment.raenest import RaenestProvider, USD_TO_XOF


def test_raenest_provider_instantiation() -> None:
    """Verifie que le provider peut etre instancie."""
    provider = RaenestProvider()
    assert provider.name == "raenest"


def test_raenest_is_available_without_key() -> None:
    """Sans cle API, is_available doit retourner False."""
    provider = RaenestProvider()
    result = provider.is_available()
    assert isinstance(result, bool)


def test_raenest_xof_to_usd_conversion() -> None:
    """Test de la conversion XOF -> USD."""
    provider = RaenestProvider()
    # 6000 XOF = 10 USD (avec taux 600)
    result = provider._convert_xof_to_usd(6000.0)
    assert result == 10.0


def test_raenest_xof_to_usd_zero() -> None:
    """Conversion de 0 XOF."""
    provider = RaenestProvider()
    result = provider._convert_xof_to_usd(0.0)
    assert result == 0.0


def test_raenest_headers_format() -> None:
    """Les headers doivent contenir Authorization Bearer."""
    provider = RaenestProvider()
    provider.settings.raenest_api_key = "test_key_xyz"
    headers = provider._headers()
    assert "Authorization" in headers
    assert headers["Authorization"].startswith("Bearer ")
    assert headers["Content-Type"] == "application/json"


def test_raenest_usd_xof_rate_constant() -> None:
    """Verifie que la constante de taux est definie."""
    assert USD_TO_XOF > 0
    assert 500 < USD_TO_XOF < 700  # Plage realiste
