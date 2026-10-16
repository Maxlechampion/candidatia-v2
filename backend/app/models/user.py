"""Modeles Pydantic : User."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Champs communs."""
    email: EmailStr
    full_name: Optional[str] = None
    preferred_locale: str = "fr"
    country_code: Optional[str] = None


class UserCreate(UserBase):
    """Payload de creation d utilisateur."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Payload de mise a jour."""
    full_name: Optional[str] = None
    preferred_locale: Optional[str] = None
    country_code: Optional[str] = None


class User(UserBase):
    """Utilisateur complet (depuis la DB)."""
    id: str
    credits: int = 0
    plan: str = "free"
    is_free_tier: bool = True
    email_verified: bool = False
    fedapay_customer_id: Optional[str] = None
    flutterwave_customer_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
