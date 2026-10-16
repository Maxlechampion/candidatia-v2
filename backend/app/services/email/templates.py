"""Templates HTML pour les emails CandidatIA."""

from typing import Any, Dict


def base_template(content_html: str, title: str = "CandidatIA") -> str:
    """Template HTML de base avec styling CandidatIA."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Candidat<span style="color: #a5b4fc;">IA</span></h1>
        </div>
        <div style="background: white; padding: 30px 25px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            {content_html}
        </div>
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">CandidatIA — Generez votre pack de candidature en 1 clic</p>
            <p style="margin: 8px 0 0 0;">
                <a href="https://candidatia.com" style="color: #4f46e5; text-decoration: none;">candidatia.com</a>
            </p>
        </div>
    </div>
</body>
</html>
"""


def relance_reminder_template(
    user_name: str,
    company_name: str,
    job_title: str,
    scheduled_date: str,
    email_draft: str,
) -> str:
    """Template pour le rappel de relance."""
    content = f"""
    <h2 style="color: #1e1b4b; margin-top: 0;">Bonjour {user_name},</h2>

    <p>C'est le moment de relancer votre candidature !</p>

    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
        <p style="margin: 0; font-weight: bold; color: #1e1b4b;">Poste : {job_title}</p>
        <p style="margin: 5px 0 0 0; color: #64748b;">Entreprise : {company_name}</p>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">Programme le : {scheduled_date}</p>
    </div>

    <p>Nous avons prepare un brouillon de relance pour vous. Vous pouvez l'adapter et l'envoyer depuis votre boite email.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="color: #1e1b4b; margin-top: 0; font-size: 14px;">Votre brouillon de relance :</h3>
        <div style="color: #334155; white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.6;">{email_draft}</div>
    </div>

    <p style="text-align: center; margin: 30px 0;">
        <a href="https://candidatia.com/dashboard/relances" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Voir mes relances
        </a>
    </p>

    <p style="color: #64748b; font-size: 13px;">Une fois la relance envoyee, pensez a la marquer comme "Envoyee" dans votre tableau de bord.</p>

    <p style="margin-bottom: 0;">Bonne chance pour votre candidature !<br>L'equipe CandidatIA</p>
    """
    return base_template(content, title=f"Relance : {job_title} chez {company_name}")


def welcome_template(user_name: str) -> str:
    """Template pour l email de bienvenue."""
    content = f"""
    <h2 style="color: #1e1b4b; margin-top: 0;">Bienvenue {user_name} !</h2>

    <p>Merci de rejoindre CandidatIA, la plateforme qui genere votre pack de candidature complet en 1 clic.</p>

    <p>Vous beneficiez actuellement du plan gratuit avec <strong>1 pack offert</strong>.</p>

    <h3 style="color: #1e1b4b; font-size: 16px;">Ce que vous pouvez faire :</h3>
    <ul style="color: #334155;">
        <li>Generer votre CV au format STAR</li>
        <li>Rediger votre lettre de motivation personnalisee</li>
        <li>Preparer votre entretien avec notre guide IA</li>
        <li>Programmer des relances automatiques</li>
    </ul>

    <p style="text-align: center; margin: 30px 0;">
        <a href="https://candidatia.com/dashboard/generate" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Generer mon premier pack
        </a>
    </p>

    <p style="margin-bottom: 0;">A bientot,<br>L'equipe CandidatIA</p>
    """
    return base_template(content, title="Bienvenue sur CandidatIA")
