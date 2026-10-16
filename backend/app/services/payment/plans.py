"""
Definition des plans tarifaires CandidatIA - PRICING-v2

5 plans B2C. Le plan free applique un filigrane.
"""
from typing import Any, Dict, List, Optional


PLANS: Dict[str, Dict[str, Any]] = {
    "free": {
        "code": "free",
        "name": "Decouverte",
        "description": "Testez CandidatIA avec 1 pack offert",
        "price_xof": 0,
        "price_eur": 0,
        "price_usd": 0,
        "credits": 1,
        "is_free": True,
        "features": [
            "1 pack unique",
            "CV + Lettre + Guide",
            "Filigrane CandidatIA",
            "Sans engagement",
        ],
        "highlight": False,
    },
    "express": {
        "code": "express",
        "name": "Express",
        "description": "1 pack sans filigrane pour une candidature ciblee",
        "price_xof": 2000,
        "price_eur": 3.00,
        "price_usd": 3.50,
        "credits": 1,
        "is_free": False,
        "features": [
            "1 pack de candidature",
            "Sans filigrane",
            "CV methode STAR",
            "Lettre personnalisee",
        ],
        "highlight": False,
    },
    "active": {
        "code": "active",
        "name": "Candidature Active",
        "description": "5 packs pour une recherche active",
        "price_xof": 5000,
        "price_eur": 7.50,
        "price_usd": 8.50,
        "credits": 5,
        "is_free": False,
        "features": [
            "5 packs de candidature",
            "Sans filigrane",
            "Guide d entretien enrichi",
            "Relances automatiques",
        ],
        "highlight": True,
    },
    "intensive": {
        "code": "intensive",
        "name": "Recherche Intensive",
        "description": "15 packs pour une recherche soutenue",
        "price_xof": 12000,
        "price_eur": 18.00,
        "price_usd": 20.00,
        "credits": 15,
        "is_free": False,
        "features": [
            "15 packs de candidature",
            "Sans filigrane",
            "Guide d entretien enrichi",
            "Relances automatiques",
            "Coaching IA",
        ],
        "highlight": False,
    },
    "pro_unlimited": {
        "code": "pro_unlimited",
        "name": "Pro Illimite",
        "description": "Packs illimites + coaching premium (mensuel)",
        "price_xof": 15000,
        "price_eur": 22.00,
        "price_usd": 25.00,
        "credits": 999999,
        "is_free": False,
        "features": [
            "Packs illimites",
            "Coaching IA premium",
            "Guide enrichi 8 phases",
            "Support VIP",
        ],
        "highlight": False,
    },
}


def list_plans() -> List[Dict[str, Any]]:
    """Retourne la liste de tous les plans."""
    return list(PLANS.values())


def get_plan(code: str) -> Optional[Dict[str, Any]]:
    """Retourne un plan par son code, ou None."""
    return PLANS.get(code.lower())


def get_price_for_provider(plan_code: str, provider_name: str) -> float:
    """Retourne le prix d un plan pour un provider donne."""
    plan_code = plan_code.lower()
    provider_name = provider_name.lower()

    if plan_code not in PLANS:
        raise ValueError(f"Plan inconnu : {plan_code}")

    plan = PLANS[plan_code]

    if provider_name == "fedapay":
        return float(plan["price_xof"])
    if provider_name == "flutterwave":
        return float(plan["price_eur"])
    if provider_name == "raenest":
        return float(plan["price_usd"])

    raise ValueError(f"Provider inconnu : {provider_name}")


def get_currency_for_provider(provider_name: str) -> str:
    """Retourne la devise utilisee par un provider."""
    provider_name = provider_name.lower()
    mapping = {
        "fedapay": "XOF",
        "flutterwave": "EUR",
        "raenest": "USD",
    }
    currency = mapping.get(provider_name)
    if not currency:
        raise ValueError(f"Devise inconnue pour provider : {provider_name}")
    return currency


def format_price(amount: float, currency: str) -> str:
    """Formate un prix pour affichage."""
    currency = currency.upper()
    if currency == "XOF":
        return f"{int(amount):,}".replace(",", " ") + " FCFA"
    if currency == "USD":
        return "$" + f"{amount:.2f}"
    if currency == "EUR":
        return f"{amount:.2f} EUR"
    return f"{amount:.2f} {currency}"
