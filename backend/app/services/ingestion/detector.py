"""Detection automatique du type de contenu (CV vs offre d emploi)."""

from typing import Dict, Tuple


CV_KEYWORDS: Dict[str, int] = {
    "experience professionnelle": 5,
    "experiences professionnelles": 5,
    "formation": 3,
    "formations": 3,
    "competences": 4,
    "competences techniques": 5,
    "competences humaines": 4,
    "langues": 2,
    "centres d interet": 3,
    "loisirs": 2,
    "profil": 2,
    "diplome": 3,
    "master": 2,
    "licence": 2,
    "baccalaureat": 2,
    "curriculum vitae": 5,
    "cv": 3,
    "parcours professionnel": 4,
    "references": 2,
    "missions": 2,
    "poste occupe": 3,
}

OFFRE_KEYWORDS: Dict[str, int] = {
    "nous recherchons": 5,
    "nous recrutons": 5,
    "rejoignez": 4,
    "rejoindre notre equipe": 5,
    "poste a pourvoir": 5,
    "profil recherche": 5,
    "missions principales": 4,
    "vos missions": 4,
    "votre mission": 4,
    "ce que nous offrons": 4,
    "avantages": 2,
    "cdi": 3,
    "cdd": 3,
    "stage": 2,
    "alternance": 2,
    "freelance": 2,
    "salaire": 3,
    "remuneration": 3,
    "package": 2,
    "poste base": 3,
    "lieu du poste": 4,
    "date de debut": 3,
    "candidature": 2,
    "cv et lettre de motivation": 3,
    "lettre de motivation": 2,
    "entreprise recrute": 4,
    "societe recrute": 4,
    "groupe recrute": 4,
    "candidater": 3,
    "postuler": 3,
    "offre d emploi": 5,
}


def _normalize(text: str) -> str:
    """Normalise pour la recherche de mots-cles (retire les accents)."""
    text = text.lower()
    text = text.replace("\u00e9", "e").replace("\u00e8", "e").replace("\u00ea", "e")
    text = text.replace("\u00e0", "a").replace("\u00e2", "a")
    text = text.replace("\u00ee", "i").replace("\u00ef", "i")
    text = text.replace("\u00f4", "o").replace("\u00f9", "u").replace("\u00fb", "u")
    text = text.replace("\u00e7", "c")
    text = text.replace("\u0027", " ")
    return text


def detect_content_type(text: str) -> Tuple[str, float]:
    """
    Detecte si le texte est un CV ou une offre d emploi.

    Retourne : (type, confidence)
      - type : "cv" | "offre" | "inconnu"
      - confidence : score de 0.0 a 1.0
    """
    if not text or len(text.strip()) < 50:
        return ("inconnu", 0.0)

    normalized = _normalize(text)

    cv_score = sum(weight for kw, weight in CV_KEYWORDS.items() if kw in normalized)
    offre_score = sum(weight for kw, weight in OFFRE_KEYWORDS.items() if kw in normalized)

    total = cv_score + offre_score
    if total == 0:
        return ("inconnu", 0.0)

    if cv_score > offre_score:
        confidence = cv_score / total
        return ("cv", round(confidence, 2))
    elif offre_score > cv_score:
        confidence = offre_score / total
        return ("offre", round(confidence, 2))
    else:
        return ("inconnu", 0.0)
