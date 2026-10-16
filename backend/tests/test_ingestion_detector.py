"""Tests du detecteur de type de contenu."""

from app.services.ingestion.detector import detect_content_type


def test_detect_cv() -> None:
    text = """
    CURRICULUM VITAE
    Jean Dupont
    EXPERIENCE PROFESSIONNELLE
    - Developpeur senior chez TechCorp
    FORMATION
    - Master en informatique
    COMPETENCES TECHNIQUES
    - Python, FastAPI, Docker
    LANGUES
    - Francais, Anglais
    CENTRES D INTERET
    - Randonnee
    """
    content_type, confidence = detect_content_type(text)
    assert content_type == "cv"
    assert confidence > 0.5


def test_detect_offre() -> None:
    text = """
    Nous recherchons un developpeur Python
    Rejoignez notre equipe dynamique !
    Profil recherche : 5 ans d experience
    Missions principales : developpement backend
    Ce que nous offrons : CDI, salaire competitif
    Poste base a Paris
    Pour candidater, envoyez votre CV et lettre de motivation.
    """
    content_type, confidence = detect_content_type(text)
    assert content_type == "offre"
    assert confidence > 0.5


def test_detect_inconnu() -> None:
    content_type, confidence = detect_content_type("Bonjour")
    assert content_type == "inconnu"
    assert confidence == 0.0


def test_detect_empty() -> None:
    content_type, confidence = detect_content_type("")
    assert content_type == "inconnu"
    assert confidence == 0.0


def test_detect_handles_accents() -> None:
    text = """
    Nous recherchons un développeur expérimenté
    Rejoignez notre équipe ! Profil recherché. Poste basé à Paris.
    Missions principales : développement. CDI. Salaire attractif.
    """
    content_type, confidence = detect_content_type(text)
    assert content_type == "offre"
    assert confidence > 0.5
