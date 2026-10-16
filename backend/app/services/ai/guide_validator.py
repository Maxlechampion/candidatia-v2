"""
Validateur et enrichisseur de guide d entretien.

Objectif : garantir qu un guide genere par l IA contient TOUTES les sections
attendues, meme si le provider IA en a oublie une partie (troncature, hallucination).

Strategie :
  1. Valide la structure via Pydantic (GuideData)
  2. Si une section critique manque, on l enrichit avec un template generique
     personnalise avec les donnees disponibles (nom du candidat, poste, etc.)
  3. Log un avertissement pour le monitoring
"""

from typing import Any, Dict, List

from app.core.logging import get_logger

logger = get_logger("ai.guide_validator")


# ============================================================
# TEMPLATES DE FALLBACK
# ============================================================

def _fallback_synthese(nom_candidat: str, poste: str) -> Dict[str, Any]:
    """Synthese de secours si l IA a oublie la section."""
    return {
        "pitch_30s": (
            f"Je suis {nom_candidat}, professionnel experimente qui vise le poste de "
            f"{poste}. Mon parcours m a permis de developper une expertise solide "
            f"et une capacite d adaptation prouvee. Aujourd hui, je cherche a "
            f"mettre mes competences au service d une entreprise ambitieuse."
        ),
        "trois_forces_a_valoriser": [
            "Expertise technique alignee avec les exigences du poste",
            "Capacite prouvee a livrer des resultats mesurables",
            "Adaptabilite et intelligence relationnelle",
        ],
        "trois_faiblesses_a_gerer": [
            {
                "faiblesse": "Perfectionnisme excessif",
                "parade": "J apprends a prioriser et a livrer en iterant",
            },
            {
                "faiblesse": "Impatience face aux processus lents",
                "parade": "J ai developpe une methodologie de patience structuree",
            },
            {
                "faiblesse": "Difficulte a deleguer",
                "parade": "Je monte mes equipes en competence progressivement",
            },
        ],
    }


def _fallback_checklist() -> Dict[str, Any]:
    """Checklist de secours."""
    return {
        "logistique": [
            "Verifier l adresse et le moyen de transport (arriver 15 min en avance)",
            "Preparer 3 copies papier du CV + lettre de motivation",
            "Tenue professionnelle adaptee a la culture de l entreprise",
            "Tester le materiel si entretien visio (camera, micro, connexion)",
        ],
        "recherche_entreprise": [
            "Etudier le dernier rapport annuel ou les actualites recentes",
            "Identifier les 3 concurrents principaux et la position de l entreprise",
            "Analyser les valeurs affichees et les comparer a votre vecu",
        ],
    }


def _fallback_phases(nom_candidat: str, poste: str, entreprise: str) -> List[Dict[str, Any]]:
    """Retourne 3 phases par defaut si l IA a completement oublie cette section."""
    return [
        {
            "phase_numero": 2,
            "phase_nom": "Introduction et brise-glace",
            "duree_estimee": "5 min",
            "objectif_recruteur": "Verifier votre aisance relationnelle et votre preparation.",
            "questions_probables": [
                {
                    "question": "Pouvez-vous vous presenter en quelques minutes ?",
                    "intention_recruteur": "Evaluer votre capacite a synthetiser votre parcours sans digresser.",
                    "strategie_reponse": "Utilisez la methode Passe/Present/Futur. Commencez par une phrase d accroche impactante.",
                    "exemple_reponse_cadre": (
                        f"Je suis {nom_candidat}, avec un parcours centre sur l excellence. "
                        f"Aujourd hui, je vise le poste de {poste} chez {entreprise} "
                        f"car mon experience correspond parfaitement aux enjeux decrits."
                    ),
                },
            ],
        },
        {
            "phase_numero": 3,
            "phase_nom": "Parcours et motivation",
            "duree_estimee": "15 min",
            "objectif_recruteur": "Comprendre votre coherence professionnelle et votre interet reel.",
            "questions_probables": [
                {
                    "question": "Pourquoi souhaitez-vous rejoindre notre entreprise ?",
                    "intention_recruteur": "Verifier que vous avez fait vos recherches et que votre motivation est authentique.",
                    "strategie_reponse": "Citez 1 element concret (projet, actualite, valeur) et reliez-le a votre parcours.",
                    "exemple_reponse_cadre": (
                        f"{entreprise} m interesse pour son positionnement unique sur le marche. "
                        f"Mon experience me permettrait de contribuer rapidement a vos objectifs."
                    ),
                },
                {
                    "question": "Pourquoi quittez-vous votre poste actuel ?",
                    "intention_recruteur": "Detecter un probleme de comportement ou une fuite.",
                    "strategie_reponse": "Restez factuel et positif. Parlez de projet, pas de conflit.",
                    "exemple_reponse_cadre": (
                        "Je suis en quete d un nouveau defi qui correspond davantage a mes "
                        "ambitions de croissance. Mon poste actuel m a beaucoup appris, "
                        "mais je souhaite evoluer vers de nouveaux enjeux."
                    ),
                },
            ],
        },
        {
            "phase_numero": 5,
            "phase_nom": "Questions comportementales (methode STAR)",
            "duree_estimee": "15 min",
            "objectif_recruteur": "Verifier vos comportements en situation reelle.",
            "questions_probables": [
                {
                    "question": "Racontez-moi une situation ou vous avez du gerer un conflit.",
                    "intention_recruteur": "Evaluer votre intelligence relationnelle et votre maturite.",
                    "strategie_reponse": "Utilisez STAR : Situation, Tache, Action, Resultat. Terminez par un apprentissage.",
                    "exemple_reponse_cadre": (
                        "Dans mon poste precedent, une tension est apparue avec un collegue sur "
                        "la priorisation d un livrable. J ai organise une reunion en tete-a-tete "
                        "pour comprendre ses contraintes, puis nous avons trouve un compromis. "
                        "Le projet a ete livre dans les delais."
                    ),
                },
            ],
        },
    ]


def _fallback_pieges() -> List[Dict[str, Any]]:
    """Questions pieges de secours."""
    return [
        {
            "question": "Quelle est votre plus grande faiblesse ?",
            "ce_quil_cherche_vraiment": "Verifier votre lucidite et votre capacite de progression.",
            "parade_tactique": "Choisissez une faiblesse reelle mais non-bloquante. Terminez toujours par la parade mise en place.",
            "exemple_reponse_cadre": (
                "J ai tendance a vouloir tout controler. J ai appris a prioriser et a "
                "faire confiance a mon equipe, ce qui a ameliore notre efficacite collective."
            ),
        },
        {
            "question": "Pourquoi devrions-nous vous embaucher plutot qu un autre candidat ?",
            "ce_quil_cherche_vraiment": "Tester votre confiance en vous sans arrogance.",
            "parade_tactique": "Soyez factuel : citez 2 forces differenciantes liees au poste.",
            "exemple_reponse_cadre": (
                "Je combine une expertise technique rare et une capacite prouvee a "
                "livrer sous pression. Mon bilan parle pour moi."
            ),
        },
        {
            "question": "Combien de temps pensez-vous rester chez nous ?",
            "ce_quil_cherche_vraiment": "Evaluer votre stabilite et votre engagement.",
            "parade_tactique": "Ne donnez PAS de duree en annees. Parlez de projet et d alignement.",
            "exemple_reponse_cadre": (
                "Aussi longtemps que nous serons alignes sur des defis ambitieux. "
                "Je m investis quand je crois au projet."
            ),
        },
    ]


def _fallback_questions_interlocuteur() -> Dict[str, List[str]]:
    """Questions a poser par interlocuteur - fallback."""
    return {
        "rh": [
            "Comment decrivez-vous la culture d entreprise ?",
            "Quelles sont les etapes suivantes du processus de recrutement ?",
            "Quels sont les criteres de reussite a 6 mois sur ce poste ?",
        ],
        "manager_technique": [
            "Quels sont les principaux defis techniques du poste actuellement ?",
            "Comment se structure l equipe et quelles sont ses methodologies ?",
            "Quelles sont les priorites de la roadmap pour l annee ?",
        ],
        "dirigeant": [
            "Quelle est votre vision strategique a 3 ans ?",
            "Comment mesurez-vous la contribution de ce poste aux objectifs ?",
        ],
    }


def _fallback_cloture() -> Dict[str, Any]:
    """Section cloture - fallback."""
    return {
        "strategie_salariale": (
            "Ne donnez JAMAIS un chiffre unique. Donnez une fourchette basee sur le "
            "marche (consultez Glassdoor, Welcome to the Jungle, les grilles de votre "
            "secteur). Positionnez-vous sur le milieu-haut de la fourchette si votre "
            "experience le justifie. Terminez en reorientant vers la valeur apportee."
        ),
        "reponse_quand_commencer": (
            "Annoncez un preavis realiste sans dramatiser. Si negociation, proposez "
            "un demarrage progressif (temps partiel, contractuel d abord)."
        ),
        "erreurs_a_eviter": [
            "Ne pas relancer la negociation salariale apres accord",
            "Ne pas critiquer ses anciens employeurs",
            "Ne pas quitter l entretien sans avoir clarifie les prochaines etapes",
        ],
        "question_de_cloture": (
            "Y a-t-il un point dans mon profil que vous souhaiteriez approfondir ?"
        ),
    }


# ============================================================
# VALIDATEUR PRINCIPAL
# ============================================================

def validate_and_enrich_guide(
    guide_data: Any,
    nom_candidat: str = "Candidat",
) -> Dict[str, Any]:
    """
    Valide et enrichit un guide d entretien genere par l IA.

    - Verifie la presence des sections obligatoires
    - Comble les sections manquantes ou vides par des templates
    - Retourne le guide valide et enrichi
    """
    # Securite : si l input n'est pas un dict, on le remplace par un dict vide
    if not isinstance(guide_data, dict):
        logger.error("guide_data_not_dict", type=type(guide_data).__name__)
        guide_data = {}

    poste = guide_data.get("titre_poste", "Poste")
    entreprise = guide_data.get("nom_entreprise", "Entreprise")

    enriched = dict(guide_data)

    # --- Synthese strategique ---
    synthese = enriched.get("synthese_strategique") or {}
    if not synthese.get("pitch_30s"):
        logger.warning("guide_missing_synthese")
        synthese = _fallback_synthese(nom_candidat, poste)
    else:
        if not synthese.get("trois_forces_a_valoriser"):
            synthese["trois_forces_a_valoriser"] = _fallback_synthese(
                nom_candidat, poste
            )["trois_forces_a_valoriser"]
        if not synthese.get("trois_faiblesses_a_gerer"):
            synthese["trois_faiblesses_a_gerer"] = _fallback_synthese(
                nom_candidat, poste
            )["trois_faiblesses_a_gerer"]
    enriched["synthese_strategique"] = synthese

    # --- Checklist ---
    checklist = enriched.get("checklist_preparation") or {}
    if not checklist.get("logistique") and not checklist.get("recherche_entreprise"):
        logger.warning("guide_missing_checklist")
        checklist = _fallback_checklist()
    enriched["checklist_preparation"] = checklist

    # --- Defis ---
    if not enriched.get("defis_cles_entreprise"):
        logger.warning("guide_missing_defis")
        enriched["defis_cles_entreprise"] = [
            "Enjeu cache 1 : a preciser apres analyse de l offre",
            "Enjeu cache 2 : a preciser",
        ]

    # --- Phases (CRITIQUE : bug corrige ici) ---
    phases = enriched.get("phases_entretien") or []
    if not isinstance(phases, list):
        phases = []
    if len(phases) < 2:
        logger.warning("guide_missing_phases", count=len(phases))
        phases = _fallback_phases(nom_candidat, poste, entreprise)
    # Assurer que chaque phase est bien un dict avec des questions
    for phase in phases:
        if isinstance(phase, dict):
            if not phase.get("questions_probables"):
                phase["questions_probables"] = []
    enriched["phases_entretien"] = phases  # ← Assignation correcte

    # --- Pieges ---
    pieges = enriched.get("questions_piege_et_pression") or []
    if not pieges or len(pieges) < 1:
        logger.warning("guide_missing_pieges")
        pieges = _fallback_pieges()
    enriched["questions_piege_et_pression"] = pieges

    # --- Questions a poser ---
    questions_par_int = enriched.get("questions_a_poser_par_interlocuteur") or {}
    if not any(questions_par_int.get(k) for k in ("rh", "manager_technique", "dirigeant")):
        logger.warning("guide_missing_questions_interlocuteur")
        questions_par_int = _fallback_questions_interlocuteur()
    enriched["questions_a_poser_par_interlocuteur"] = questions_par_int

    # --- Cloture ---
    cloture = enriched.get("cloture_et_negociation") or {}
    if not cloture.get("strategie_salariale"):
        logger.warning("guide_missing_cloture")
        cloture = _fallback_cloture()
    enriched["cloture_et_negociation"] = cloture

    # --- Validation finale via Pydantic (log seulement) ---
    try:
        from app.services.ai.schemas import GuideData
        validated = GuideData(**enriched)
        result = validated.model_dump()
        logger.info(
            "guide_validated",
            nb_phases=len(result.get("phases_entretien", [])),
            nb_pieges=len(result.get("questions_piege_et_pression", [])),
            has_synthese=bool(result.get("synthese_strategique", {}).get("pitch_30s")),
        )
        return result
    except Exception as e:
        logger.warning("guide_pydantic_validation_failed", error=str(e))
        # On retourne le guide enrichi brut meme si Pydantic rale
        return enriched