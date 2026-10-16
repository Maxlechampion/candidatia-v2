"""Modeles Pydantic : Payment."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    """Payload de creation d un paiement."""
    user_id: str
    provider: str
    provider_transaction_id: str
    amount: float
    currency: str = "XOF"
    credits_added: int = 0
    plan_purchased: Optional[str] = None
    status: str = "pending"
    metadata: Dict[str, Any] = {}


class Payment(BaseModel):
    """Paiement complet (depuis la DB)."""
    id: str
    user_id: str
    provider: str
    provider_transaction_id: Optional[str] = None
    amount: float
    currency: str
    credits_added: int = 0
    plan_purchased: Optional[str] = None
    status: str = "pending"
    metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
