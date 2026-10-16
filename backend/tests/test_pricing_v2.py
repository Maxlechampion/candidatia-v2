"""Tests PRICING-v2 : grille tarifaire 5 plans B2C."""
from app.services.payment.plans import (
    PLANS,
    get_plan,
    get_price_for_provider,
    get_currency_for_provider,
    list_plans,
)
from app.services.auth.quota_service import PLAN_QUOTAS


def test_plans_has_5_b2c():
    """La grille contient exactement 5 plans B2C."""
    assert len(PLANS) == 5
    expected = {"free", "express", "active", "intensive", "pro_unlimited"}
    assert set(PLANS.keys()) == expected


def test_free_plan_is_free():
    """Le plan free est gratuit avec 1 credit."""
    free = PLANS["free"]
    assert free["is_free"] is True
    assert free["credits"] == 1
    assert free["price_eur"] == 0


def test_prices_match_specs():
    """Verifie les prix specifiques."""
    assert PLANS["express"]["price_eur"] == 3.00
    assert PLANS["active"]["price_eur"] == 7.50
    assert PLANS["intensive"]["price_eur"] == 18.00
    assert PLANS["pro_unlimited"]["price_eur"] == 22.00


def test_credits_match_specs():
    """Verifie les credits specifiques."""
    assert PLANS["express"]["credits"] == 1
    assert PLANS["active"]["credits"] == 5
    assert PLANS["intensive"]["credits"] == 15
    assert PLANS["pro_unlimited"]["credits"] >= 999999


def test_price_xof_values():
    """Verifie les prix XOF."""
    assert PLANS["express"]["price_xof"] == 2000
    assert PLANS["active"]["price_xof"] == 5000
    assert PLANS["intensive"]["price_xof"] == 12000
    assert PLANS["pro_unlimited"]["price_xof"] == 15000


def test_get_price_for_provider_fedapay():
    """FedaPay retourne le prix XOF."""
    assert get_price_for_provider("active", "fedapay") == 5000.0


def test_get_price_for_provider_flutterwave():
    """Flutterwave retourne le prix EUR."""
    assert get_price_for_provider("active", "flutterwave") == 7.50


def test_get_price_for_provider_raenest():
    """Raenest retourne le prix USD."""
    assert get_price_for_provider("active", "raenest") == 8.50


def test_currency_per_provider():
    """Verifie les devises par provider."""
    assert get_currency_for_provider("fedapay") == "XOF"
    assert get_currency_for_provider("flutterwave") == "EUR"
    assert get_currency_for_provider("raenest") == "USD"


def test_quota_service_aligns_with_plans():
    """PLAN_QUOTAS doit etre aligne avec PLANS."""
    assert set(PLAN_QUOTAS.keys()) == set(PLANS.keys())
    for code in PLANS:
        assert PLAN_QUOTAS[code]["credits"] == PLANS[code]["credits"]
        assert PLAN_QUOTAS[code]["price_eur"] == PLANS[code]["price_eur"]


def test_only_free_has_is_free_true():
    """Seul le plan free a is_free=True."""
    for code, plan in PLANS.items():
        if code == "free":
            assert plan["is_free"] is True
        else:
            assert plan["is_free"] is False


def test_get_plan_unknown_returns_none():
    """get_plan retourne None pour un code inconnu."""
    assert get_plan("inexistant") is None


def test_list_plans_returns_all():
    """list_plans retourne 5 plans."""
    plans = list_plans()
    assert len(plans) == 5
    codes = [p["code"] for p in plans]
    assert "free" in codes
    assert "pro_unlimited" in codes
