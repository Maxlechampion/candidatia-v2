"""Schemas Pydantic pour le service de relance."""

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RelanceStatus(str, Enum):
    """Statuts possibles d une relance."""
    PENDING = "pending"       # Programmee, en attente
    REMINDED = "reminded"     # Rappel envoye a l utilisateur
    SENT = "sent"             # L utilisateur a envoye la relance
    CANCELLED = "cancelled"   # Annulee par l utilisateur


class RelanceSchedule(BaseModel):
    """Payload pour programmer une relance."""
    user_id: str
    generation_id: Optional[str] = None
    company_name: str
    job_title: str
    wait_days: int = Field(7, ge=1, le=90, description="Jours avant relance (1-90)")
    language: str = "fr"


class RelanceResponse(BaseModel):
    """Reponse d une relance."""
    id: str
    user_id: str
    generation_id: Optional[str] = None
    company_name: str
    job_title: str
    wait_days: int
    scheduled_date: date
    email_draft: str
    language: str
    status: str
    created_at: Optional[datetime] = None
    reminded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
