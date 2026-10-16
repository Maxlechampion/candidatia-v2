"""Modeles Pydantic : AILog."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AILog(BaseModel):
    """Log d appel IA."""
    id: Optional[str] = None
    provider: str
    model: str
    prompt_hash: str
    tokens_input: Optional[int] = None
    tokens_output: Optional[int] = None
    latency_ms: Optional[int] = None
    success: bool = True
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
