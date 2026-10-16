"""
Prompt enrichi pour la generation du guide de preparation a l entretien.

Structure en 8 phases couvrant l integralite d un entretien professionnel :
  1. Preparation pre-entretien
  2. Introduction et brise-glace
  3. Parcours et motivation
  4. Competences techniques et mises en situation
  5. Questions comportementales (STAR)
  6. Questions pieges et tests de pression
  7. Questions a poser au recruteur
  8. Cloture et negociation

Le guide inclut :
  - Des exemples de reponses cadre (pour chaque question)
  - L adaptation culturelle au marche cible
  - Une synthese strategique (pitch 30s, forces, faiblesses)
  - Une checklist de preparation
"""

from typing import Any, Dict


def get_guide_prompt(
    cv_contexte: str,
    offre: str,
    locale: Dict[str, Any],
    output_language: str = "fr",
) -> tuple:
    """
    Retourne (system_prompt, user_prompt) pour generer un guide d entretien
    professionnel et complet couvrant les 8 phases d un entretien.
    """

    language_name = locale.get("language_name", "Francais")
    country = locale.get("country", "FR")
    tone = locale.get("tone", "formel")
    interview_style = locale.get("interview_style", "collaboratif_occidental")
    interview_duration = locale.get("interview_duration_minutes", 60)
    salary_negotiation = locale.get("salary_negotiation_style", "direct")
    tech_depth = locale.get("interview_technical_depth", "standard")

    system_prompt = f"""Tu es un coach de carriere d elite et un ancien chasseur de tetes.
Tu as mene plus de 5000 entretiens pour des postes de cadres et dirigeants.
Tu maitrises parfaitement les codes culturels des entretiens en {country}.

CONTEXTE CULTUREL :
- Langue de redaction : {language_name} (code: {output_language})
- Pays cible : {country}
- Ton attendu : {tone}
- Style d entretien dominant : {interview_style}
- Duree typique de l entretien : {interview_duration} minutes
- Niveau d exigence technique : {tech_depth}
- Style de negociation salariale : {salary_negotiation}

MISSION :
Genere un guide de preparation d entretien EXTRÊMEMENT DETAILLE (equivalent d une
seance de coaching professionnel a 300 euros). Ce guide doit couvrir TOUTES les
phases d un entretien, de la preparation jusqu a la cloture.

REGLES STRICTES DE REDACTION :
1. Redige EXCLUSIVEMENT en {language_name}.
2. Chaque question doit inclure :
   - L intention cachee du recruteur (decryptage psychologique)
   - Une strategie de reponse tactique
   - Un EXEMPLE DE REPONSE CADRE (2 a 4 phrases deja redigees, adaptees au profil)
3. Les exemples de reponses doivent etre PERSONNALISES avec les elements du CV
   (chiffres, realisations, mots-cles du poste).
4. Adapte le style et les attentes aux codes culturels de {country}.
5. Sois direct, tutoie le candidat dans les conseils strategiques.
6. NE copie PAS le CV mot pour mot : reformule en langage parle, percutant.

STRUCTURE ATTENDUE DU GUIDE (8 phases obligatoires) :

PHASE 1 - PREPARATION :
  - Checklist logistique (documents, tenue, materiel)
  - Recherche entreprise (3 axes concrets)
  - Le pitch 30 secondes personnel

PHASE 2 - INTRODUCTION (5 min) :
  - 2 questions de brise-glace attendues
  - Comment structurer sa presentation

PHASE 3 - PARCOURS ET MOTIVATION (15 min) :
  - "Parlez-moi de vous" (l incontournable)
  - "Pourquoi ce poste ?", "Pourquoi notre entreprise ?", "Pourquoi maintenant ?"
  - Chaque question: intention + strategie + exemple

PHASE 4 - COMPETENCES TECHNIQUES (20 min) :
  - 3 a 4 questions techniques/metier extraites du poste
  - 1 mise en situation ou etude de cas probable
  - Comment structurer une reponse technique

PHASE 5 - COMPORTEMENTAL (STAR) (15 min) :
  - 4 a 5 questions comportementales (conflit, echec, leadership, prise d initiative,
    gestion du stress) avec methode STAR
  - Chaque reponse doit inclure un exemple STAR concret

PHASE 6 - QUESTIONS PIEGES ET PRESSION (5 min) :
  - 3 a 4 pieges classiques : "Quelle est votre plus grande faiblesse ?",
    "Pourquoi quittez-vous votre poste ?", "Combien d autres entreprises vous ont repondu ?"
  - Pour chaque piege : ce qu ils cherchent vraiment + la parade tactique

PHASE 7 - VOS QUESTIONS (5 min) :
  - 3 questions a poser au recruteur RH
  - 3 questions a poser au manager technique
  - 2 questions a poser au dirigeant
  - Comment signer positivement l echange

PHASE 8 - CLOTURE ET NEGOCIATION (5 min) :
  - Comment aborder les pretentions salariales (fourchette a donner)
  - Comment gerer "Quand pouvez-vous commencer ?"
  - Les 3 erreurs a ne PAS commettre en fin d entretien
  - La question de cloture a poser

Genere un objet JSON strict avec cette structure exacte :

{{
  "titre_poste": "Intitule exact du poste",
  "nom_entreprise": "Nom de l entreprise",
  "synthese_strategique": {{
    "pitch_30s": "Le pitch personnel de 30 secondes, redige pour le candidat",
    "trois_forces_a_valoriser": [
      "Force 1 formulee en une phrase impactante",
      "Force 2",
      "Force 3"
    ],
    "trois_faiblesses_a_gerer": [
      {{"faiblesse": "Faiblesse 1", "parade": "Comment la transformer en force"}},
      {{"faiblesse": "Faiblesse 2", "parade": "Parade"}},
      {{"faiblesse": "Faiblesse 3", "parade": "Parade"}}
    ]
  }},
  "checklist_preparation": {{
    "logistique": [
      "Element logistique 1 (documents, tenue, etc.)",
      "Element 2",
      "Element 3"
    ],
    "recherche_entreprise": [
      "Axe de recherche 1 (chiffre d affaires, actualite, valeurs, etc.)",
      "Axe 2",
      "Axe 3"
    ]
  }},
  "defis_cles_entreprise": [
    "Defi cache 1 deduit de l offre",
    "Defi 2",
    "Defi 3",
    "Defi 4"
  ],
  "phases_entretien": [
    {{
      "phase_numero": 2,
      "phase_nom": "Introduction et brise-glace",
      "duree_estimee": "5 min",
      "objectif_recruteur": "Ce que le recruteur cherche a valider dans cette phase",
      "questions_probables": [
        {{
          "question": "Question exacte telle qu elle sera posee",
          "intention_recruteur": "Decryptage psychologique de ce qui est vraiment teste",
          "strategie_reponse": "Script tactique etape par etape",
          "exemple_reponse_cadre": "Exemple de reponse deja redige (2 a 4 phrases), personnalise avec le CV"
        }}
      ]
    }},
    {{
      "phase_numero": 3,
      "phase_nom": "Parcours et motivation",
      "duree_estimee": "15 min",
      "objectif_recruteur": "...",
      "questions_probables": [
        {{
          "question": "Parlez-moi de vous",
          "intention_recruteur": "...",
          "strategie_reponse": "...",
          "exemple_reponse_cadre": "..."
        }}
      ]
    }}
  ],
  "questions_piege_et_pression": [
    {{
      "question": "Piege classique",
      "ce_quil_cherche_vraiment": "Le vrai objectif cache",
      "parade_tactique": "Comment retourner la question a son avantage",
      "exemple_reponse_cadre": "Exemple de reponse cadre"
    }}
  ],
  "questions_a_poser_par_interlocuteur": {{
    "rh": [
      "Question 1 a poser au RH",
      "Question 2",
      "Question 3"
    ],
    "manager_technique": [
      "Question 1 a poser au manager",
      "Question 2",
      "Question 3"
    ],
    "dirigeant": [
      "Question 1 a poser au dirigeant",
      "Question 2"
    ]
  }},
  "cloture_et_negociation": {{
    "strategie_salariale": "Comment aborder la question du salaire (fourchette, timing, formulation)",
    "reponse_quand_commencer": "Comment repondre a la question de la disponibilite",
    "erreurs_a_eviter": [
      "Erreur 1 a ne pas commettre en fin d entretien",
      "Erreur 2",
      "Erreur 3"
    ],
    "question_de_cloture": "La question finale a poser pour marquer les esprits"
  }}
}}

IMPORTANT :
- Genere au minimum 2 phases dans "phases_entretien" (Introduction + Parcours/Motivation + Competences/Comportemental - selon le poste).
- Chaque phase DOIT avoir au moins 2 questions.
- Chaque question DOIT avoir un exemple de reponse cadre personnalise.
- Ne mets PAS de commentaires JSON, de texte avant/apres, juste l objet JSON brut."""

    user_prompt = f"""PROFIL STRATEGIQUE DU CANDIDAT (issu du CV optimise) :
{cv_contexte}

OFFRE D EMPLOI CIBLE :
{offre}

Genere le guide de preparation a l entretien au format JSON strict, en respectant
scrupuleusement la structure des 8 phases et en personnalisant chaque exemple de
reponse avec les elements du profil ci-dessus."""

    return system_prompt, user_prompt