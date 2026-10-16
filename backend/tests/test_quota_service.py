"""Tests du service de quotas."""

from app.services.auth.quota_service import PLAN_QUOTAS, get_quota_info


def test_plan_quotas_defined() -> None:
    assert "free" in PLAN_QUOTAS
    assert "essentiel" in PLAN_QUOTAS
    assert "pro" in PLAN_QUOTAS
    assert "carriere" in PLAN_QUOTAS


def test_free_plan_quota() -> None:
    assert PLAN_QUOTAS["free"]["monthly_credits"] == 1
    assert PLAN_QUOTAS["free"]["price_eur"] == 0


def test_pro_plan_quota() -> None:
    assert PLAN_QUOTAS["pro"]["monthly_credits"] == 30
    assert PLAN_QUOTAS["pro"]["price_eur"] == 14.99
