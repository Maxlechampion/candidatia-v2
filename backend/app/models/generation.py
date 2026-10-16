"""Modeles Pydantic : Generation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class GenerationCreate(BaseModel):
    """Payload de creation d une generation."""
    user_id: str
    input_profile_hash: str
    input_offer_hash: str
    output_language: str = "fr"
    score_matching: Optional[int] = None
    cv_path: Optional[str] = None
    lettre_path: Optional[str] = None
    guide_path: Optional[str] = None
    zip_path: Optional[str] = None
    credits_consumed: int = 1


class Generation(BaseModel):
    """Generation complete (depuis la DB)."""
    id: str
    user_id: str
    input_profile_hash: str
    input_offer_hash: str
    output_language: str
    score_matching: Optional[int] = None
    cv_path: Optional[str] = None
    lettre_path: Optional[str] = None
    guide_path: Optional[str] = None
    zip_path: Optional[str] = None
    credits_consumed: int = 1
    status: str = "completed"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
