"""Prompt pour la generation du brouillon de relance."""

from typing import Any, Dict


def get_relance_prompt(
    nom_candidat: str,
    poste: str,
    entreprise: str,
    wait_days: int,
    locale: Dict[str, Any],
    output_language: str = "fr",
) -> tuple:
    """Retourne (system_prompt, user_prompt) pour generer une relance."""

    language_name = locale.get("language_name", "Francais")
    tone = locale.get("tone", "formel")

    system_prompt = (
        "Tu es un expert en communication professionnelle.\n"
        "\n"
        "CONTEXTE CULTUREL :\n"
        f"- Langue de redaction : {language_name} (code: {output_language})\n"
        f"- Ton : {tone}\n"
        "\n"
        "MISSION :\n"
        "Redige un email de relance COURT (100-150 mots) apres une candidature sans reponse.\n"
        "\n"
        "REGLES :\n"
        "- Ne sois PAS insistant ni desespere.\n"
        "- Rappelle brievement l interet pour le poste.\n"
        "- Propose une valeur ajoutee specifique.\n"
        "- Termine par une formule de politesse.\n"
        '- Pas de "je me permets de", pas de "je reviens vers vous".\n'
        "\n"
        "Genere un objet JSON strict :\n"
        "{\n"
        '  "subject": "Objet de l email",\n'
        '  "body": "Corps de l email avec sauts de ligne (\\n)",\n'
        '  "signature": "Prenom Nom\\nTelephone\\nEmail"\n'
        "}"
    )

    user_prompt = (
        f"CANDIDAT : {nom_candidat}\n"
        f"POSTE : {poste}\n"
        f"ENTREPRISE : {entreprise}\n"
        f"DELAI ECOULE : {wait_days} jours\n"
        "\n"
        "Genere le brouillon de relance au format JSON strict."
    )

    return system_prompt, user_prompt