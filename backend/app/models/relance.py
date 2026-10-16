"""Modeles Pydantic : Relance."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class RelanceCreate(BaseModel):
    """Payload de creation d une relance."""
    user_id: str
    generation_id: Optional[str] = None
    company_name: str
    job_title: str
    wait_days: int = 7
    scheduled_date: date
    email_draft: str
    language: str = "fr"


class Relance(BaseModel):
    """Relance complete (depuis la DB)."""
    id: str
    user_id: str
    generation_id: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    wait_days: int = 7
    scheduled_date: date
    email_draft: Optional[str] = None
    language: str = "fr"
    status: str = "pending"
    created_at: Optional[datetime] = None
    reminded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
