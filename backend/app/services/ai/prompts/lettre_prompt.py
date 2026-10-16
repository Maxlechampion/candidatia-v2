"""Prompt pour la generation de la lettre de motivation."""

from typing import Any, Dict


def get_lettre_prompt(
    cv_contexte: str,
    offre: str,
    locale: Dict[str, Any],
    output_language: str = "fr",
) -> tuple:
    """Retourne (system_prompt, user_prompt) pour generer une lettre."""

    language_name = locale.get("language_name", "Francais")
    letter_format = locale.get("letter_format", "epistolaire_traditionnel")
    letter_max_words = locale.get("letter_max_words", 400)
    tone = locale.get("tone", "formel")

    system_prompt = (
        "Tu es un copywriter d elite specialise dans les lettres d influence professionnelle.\n"
        "\n"
        "CONTEXTE CULTUREL :\n"
        f"- Langue de redaction : {language_name} (code: {output_language})\n"
        f"- Format attendu : {letter_format}\n"
        f"- Longueur max : {letter_max_words} mots\n"
        f"- Ton : {tone}\n"
        "\n"
        "ELIMINE tous les cliches :\n"
        '- "Je me permets de..."\n'
        '- "Actuellement a la recherche..."\n'
        '- "Je suis motive et dynamique..."\n'
        "\n"
        "STRUCTURE NARRATIVE (AIDA adapte RH) :\n"
        "- Paragraphe 1 (ACCROCHE) : entre dans le vif. Cite un defi majeur de l entreprise.\n"
        "- Paragraphe 2 (INTERET) : comprehension fine du secteur. Parle d eux, pas de toi.\n"
        "- Paragraphe 3 (SYNERGIE) : pont entre tes realisations STAR chiffrees et leurs besoins.\n"
        "- Paragraphe 4 (ACTION) : demande d entretien + formule de politesse.\n"
        "\n"
        "Genere un objet JSON strict :\n"
        "{\n"
        '  "expediteur": "Prenom Nom\\nAdresse\\nTelephone\\nEmail",\n'
        '  "destinataire": "A l attention du Responsable Recrutement\\nEntreprise\\nAdresse",\n'
        '  "lieu_date": "Fait a [Ville], le [Date du jour]",\n'
        '  "objet": "Candidature au poste de [Intitule] - Ref: [Si presente]",\n'
        '  "corps_paragraphes": [\n'
        '    "Texte accroche disruptive",\n'
        '    "Texte analyse entreprise",\n'
        '    "Texte preuve par les faits",\n'
        '    "Demande entretien et formule de politesse"\n'
        "  ]\n"
        "}"
    )

    user_prompt = (
        "CONTEXTE STRATEGIQUE DU CV :\n"
        f"{cv_contexte}\n"
        "\n"
        "OFFRE D EMPLOI CIBLE :\n"
        f"{offre}\n"
        "\n"
        "Genere la lettre de motivation au format JSON strict."
    )

    return system_prompt, user_prompt