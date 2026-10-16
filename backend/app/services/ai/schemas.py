"""Schemas Pydantic partages par le moteur IA."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# ============================================================
# SCHEMAS GENERIQUES IA
# ============================================================

class AIMessage(BaseModel):
    """Message individuel dans une conversation."""
    role: str
    content: str


class AIRequest(BaseModel):
    """Requete normalisee vers un provider IA."""
    system_prompt: str
    user_prompt: str
    temperature: float = 0.2
    max_tokens: Optional[int] = None
    response_format_json: bool = True


class AIResponse(BaseModel):
    """Reponse normalisee d un provider IA."""
    content: str
    provider: str
    model: str
    tokens_input: Optional[int] = None
    tokens_output: Optional[int] = None
    latency_ms: int = 0
    raw: Optional[Dict[str, Any]] = None


class AIProviderInfo(BaseModel):
    """Metadonnees d un provider."""
    name: str
    model: str
    available: bool
    priority: int = 0


# ============================================================
# GUIDE D ENTRETIEN - Schemas de validation
# ============================================================

class GuideQuestion(BaseModel):
    """Une question d entretien avec sa strategie et son exemple."""
    question: str
    intention_recruteur: str = ""
    strategie_reponse: str = ""
    exemple_reponse_cadre: str = ""

    class Config:
        extra = "allow"


class GuidePhase(BaseModel):
    """Une phase de l entretien (introduction, parcours, technique, etc.)."""
    phase_numero: int = 0
    phase_nom: str = ""
    duree_estimee: str = ""
    objectif_recruteur: str = ""
    questions_probables: List[GuideQuestion] = []

    class Config:
        extra = "allow"


class GuideFaiblesse(BaseModel):
    """Une faiblesse avec sa parade."""
    faiblesse: str = ""
    parade: str = ""

    class Config:
        extra = "allow"


class GuideSynthese(BaseModel):
    """Synthese strategique du candidat."""
    pitch_30s: str = ""
    trois_forces_a_valoriser: List[str] = []
    trois_faiblesses_a_gerer: List[GuideFaiblesse] = []

    class Config:
        extra = "allow"


class GuideChecklist(BaseModel):
    """Checklist de preparation."""
    logistique: List[str] = []
    recherche_entreprise: List[str] = []

    class Config:
        extra = "allow"


class GuidePiege(BaseModel):
    """Une question piege avec sa parade."""
    question: str = ""
    ce_quil_cherche_vraiment: str = ""
    parade_tactique: str = ""
    exemple_reponse_cadre: str = ""

    class Config:
        extra = "allow"


class GuideQuestionsParInterlocuteur(BaseModel):
    """Questions a poser selon l interlocuteur."""
    rh: List[str] = []
    manager_technique: List[str] = []
    dirigeant: List[str] = []

    class Config:
        extra = "allow"


class GuideCloture(BaseModel):
    """Section cloture et negociation."""
    strategie_salariale: str = ""
    reponse_quand_commencer: str = ""
    erreurs_a_eviter: List[str] = []
    question_de_cloture: str = ""

    class Config:
        extra = "allow"


class GuideData(BaseModel):
    """Structure complete d un guide d entretien."""
    titre_poste: str = "Poste"
    nom_entreprise: str = "Entreprise"
    synthese_strategique: GuideSynthese = GuideSynthese()
    checklist_preparation: GuideChecklist = GuideChecklist()
    defis_cles_entreprise: List[str] = []
    phases_entretien: List[GuidePhase] = []
    questions_piege_et_pression: List[GuidePiege] = []
    questions_a_poser_par_interlocuteur: GuideQuestionsParInterlocuteur = GuideQuestionsParInterlocuteur()
    cloture_et_negociation: GuideCloture = GuideCloture()

    class Config:
        extra = "allow"  # Tolerance : accepte les champs supplementaires de l IA