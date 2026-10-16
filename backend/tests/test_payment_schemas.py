"""Tests des schemas de paiement."""

import pytest

from app.services.payment.schemas import (
    PaymentIntent,
    PaymentProviderName,
    PaymentResult,
    PaymentStatus,
    WebhookPayload,
)


def test_payment_intent_valid() -> None:
    intent = PaymentIntent(
        user_id="user-123",
        amount=5000.0,
        currency="XOF",
        plan_code="essentiel",
        credits_to_add=5,
    )
    assert intent.amount == 5000.0
    assert intent.currency == "XOF"
    assert intent.credits_to_add == 5


def test_payment_intent_negative_amount_raises() -> None:
    with pytest.raises(Exception):
        PaymentIntent(
            user_id="user-123",
            amount=-100,
            plan_code="essentiel",
            credits_to_add=5,
        )


def test_payment_result_valid() -> None:
    result = PaymentResult(
        provider=PaymentProviderName.FEDAPAY,
        provider_transaction_id="txn-123",
        checkout_url="https://process.fedapay.com/abc",
        status=PaymentStatus.PENDING,
        amount=5000.0,
        currency="XOF",
    )
    assert result.provider == PaymentProviderName.FEDAPAY
    assert result.status == PaymentStatus.PENDING


def test_webhook_payload_valid() -> None:
    payload = WebhookPayload(
        provider=PaymentProviderName.FEDAPAY,
        provider_transaction_id="txn-456",
        status=PaymentStatus.SUCCESS,
        amount=5000.0,
        currency="XOF",
        metadata={"user_id": "user-123"},
    )
    assert payload.status == PaymentStatus.SUCCESS
    assert payload.metadata["user_id"] == "user-123"


def test_payment_status_enum_values() -> None:
    assert PaymentStatus.PENDING.value == "pending"
    assert PaymentStatus.SUCCESS.value == "success"
    assert PaymentStatus.FAILED.value == "failed"


def test_payment_provider_enum_values() -> None:
    assert PaymentProviderName.FEDAPAY.value == "fedapay"
    assert PaymentProviderName.FLUTTERWAVE.value == "flutterwave"
    assert PaymentProviderName.RAENEST.value == "raenest"
