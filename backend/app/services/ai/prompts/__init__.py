"""Prompts IA pour la generation de documents de candidature."""

from app.services.ai.prompts.cv_prompt import get_cv_prompt
from app.services.ai.prompts.lettre_prompt import get_lettre_prompt
from app.services.ai.prompts.guide_prompt import get_guide_prompt
from app.services.ai.prompts.relance_prompt import get_relance_prompt

__all__ = [
    "get_cv_prompt",
    "get_lettre_prompt",
    "get_guide_prompt",
    "get_relance_prompt",
]
