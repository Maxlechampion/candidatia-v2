"""Schemas Pydantic pour le module paiement."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PaymentProviderName(str, Enum):
    """Noms des providers de paiement supportes."""
    FEDAPAY = "fedapay"
    FLUTTERWAVE = "flutterwave"
    RAENEST = "raenest"


class PaymentStatus(str, Enum):
    """Statuts possibles d un paiement."""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentIntent(BaseModel):
    """Intention de paiement (creation d une session)."""
    user_id: str
    amount: float = Field(..., gt=0)
    currency: str = "XOF"
    plan_code: str
    credits_to_add: int = Field(..., ge=0)
    description: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    locale: str = "fr"
    metadata: Dict[str, Any] = {}


class PaymentResult(BaseModel):
    """Resultat d une creation de session de paiement."""
    provider: PaymentProviderName
    provider_transaction_id: str
    checkout_url: str
    status: PaymentStatus
    amount: float
    currency: str
    raw_response: Optional[Dict[str, Any]] = None


class WebhookPayload(BaseModel):
    """Payload normalise d un webhook provider."""
    provider: PaymentProviderName
    provider_transaction_id: str
    status: PaymentStatus
    amount: Optional[float] = None
    currency: Optional[str] = None
    metadata: Dict[str, Any] = {}
    raw: Optional[Dict[str, Any]] = None


class PaymentRecord(BaseModel):
    """Enregistrement de paiement en DB."""
    id: Optional[str] = None
    user_id: str
    provider: str
    provider_transaction_id: str
    amount: float
    currency: str
    credits_added: int = 0
    plan_purchased: Optional[str] = None
    status: str = "pending"
    metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None


class PlanInfo(BaseModel):
    """Informations d un plan tarifaire."""
    code: str
    name: str
    price_eur: float
    credits: int
    description: str = ""
    
# ============================================================
# GUIDE D ENTRETIEN - Schemas de validation
# ============================================================

class GuideQuestion(BaseModel):
    """Une question d entretien avec sa strategie."""
    question: str
    intention_recruteur: str = ""
    strategie_reponse: str = ""
    exemple_reponse_cadre: str = ""


class GuidePhase(BaseModel):
    """Une phase de l entretien (introduction, parcours, technique, etc.)."""
    phase_numero: int
    phase_nom: str
    duree_estimee: str = ""
    objectif_recruteur: str = ""
    questions_probables: list[GuideQuestion] = []


class GuideFaiblesse(BaseModel):
    """Une faiblesse avec sa parade."""
    faiblesse: str
    parade: str = ""


class GuideSynthese(BaseModel):
    """Synthese strategique du candidat."""
    pitch_30s: str = ""
    trois_forces_a_valoriser: list[str] = []
    trois_faiblesses_a_gerer: list[GuideFaiblesse] = []


class GuideChecklist(BaseModel):
    """Checklist de preparation."""
    logistique: list[str] = []
    recherche_entreprise: list[str] = []


class GuidePiege(BaseModel):
    """Une question piege avec sa parade."""
    question: str
    ce_quil_cherche_vraiment: str = ""
    parade_tactique: str = ""
    exemple_reponse_cadre: str = ""


class GuideQuestionsParInterlocuteur(BaseModel):
    """Questions a poser selon l interlocuteur."""
    rh: list[str] = []
    manager_technique: list[str] = []
    dirigeant: list[str] = []


class GuideCloture(BaseModel):
    """Section cloture et negociation."""
    strategie_salariale: str = ""
    reponse_quand_commencer: str = ""
    erreurs_a_eviter: list[str] = []
    question_de_cloture: str = ""


class GuideData(BaseModel):
    """Structure complete d un guide d entretien."""
    titre_poste: str = "Poste"
    nom_entreprise: str = "Entreprise"
    synthese_strategique: GuideSynthese = GuideSynthese()
    checklist_preparation: GuideChecklist = GuideChecklist()
    defis_cles_entreprise: list[str] = []
    phases_entretien: list[GuidePhase] = []
    questions_piege_et_pression: list[GuidePiege] = []
    questions_a_poser_par_interlocuteur: GuideQuestionsParInterlocuteur = GuideQuestionsParInterlocuteur()
    cloture_et_negociation: GuideCloture = GuideCloture()

class Config:
    extra = "allow"  # Tolerance : accepte les champs supplementaires de l IA
