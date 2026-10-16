#!/usr/bin/env node
/**
 * setup-phase6c.js — CandidatIA
 * Phase 6c : Service email Brevo + templates
 *
 * Crée :
 *   - backend/app/services/email/__init__.py
 *   - backend/app/services/email/brevo_client.py
 *   - backend/app/services/email/templates.py
 *   - backend/app/services/email/service.py
 *   - backend/tests/test_email_service.py
 *
 * Usage : node setup-phase6c.js
 * Prérequis : avoir exécuté setup-phase6b.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, lines.join('\n') + '\n', 'utf-8');
  console.log('  OK  ' + relPath);
}

function logHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
  console.log('');
}

function logStep(step) {
  console.log('');
  console.log('> ' + step);
}

logHeader('CandidatIA — Setup Phase 6c : Service email Brevo');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'routers', 'relance.py'))) {
  console.error('');
  console.error('  ERREUR : routers/relance.py introuvable.');
  console.error('  Execute d abord setup-phase6b.js.');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);

// ============================================================
// 1. EMAIL __init__
// ============================================================

logStep('1. email/__init__.py');

writeLines('backend/app/services/email/__init__.py', [
  '"""Service email via Brevo."""',
  '',
  'from app.services.email.service import (',
  '    send_email,',
  '    send_relance_reminder,',
  '    send_welcome_email,',
  ')',
  '',
  '__all__ = [',
  '    "send_email",',
  '    "send_relance_reminder",',
  '    "send_welcome_email",',
  ']',
]);

// ============================================================
// 2. BREVO CLIENT
// ============================================================

logStep('2. email/brevo_client.py');

writeLines('backend/app/services/email/brevo_client.py', [
  '"""Client HTTP pour l API Brevo (ex-Sendinblue)."""',
  '',
  'from typing import Any, Dict, List, Optional',
  '',
  'import httpx',
  '',
  'from app.core.config import get_settings',
  'from app.core.errors import AppError',
  'from app.core.logging import get_logger',
  '',
  'logger = get_logger("email.brevo")',
  '',
  '',
  'BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"',
  '',
  '',
  'class EmailError(AppError):',
  '    status_code = 502',
  '    error_code = "EMAIL_ERROR"',
  '    message = "Erreur lors de l envoi de l email."',
  '',
  '',
  'class BrevoClient:',
  '    """Client HTTP pour Brevo."""',
  '',
  '    def __init__(self) -> None:',
  '        self.settings = get_settings()',
  '',
  '    def is_available(self) -> bool:',
  '        """Verifie si Brevo est configure."""',
  '        return bool(self.settings.brevo_api_key)',
  '',
  '    def _headers(self) -> Dict[str, str]:',
  '        return {',
  '            "api-key": self.settings.brevo_api_key,',
  '            "Content-Type": "application/json",',
  '            "Accept": "application/json",',
  '        }',
  '',
  '    def send(',
  '        self,',
  '        to_email: str,',
  '        to_name: str,',
  '        subject: str,',
  '        html_content: str,',
  '        text_content: Optional[str] = None,',
  '        tags: Optional[List[str]] = None,',
  '    ) -> Dict[str, Any]:',
  '        """Envoie un email via Brevo."""',
  '        if not self.is_available():',
  '            logger.warning("brevo_not_configured")',
  '            raise EmailError(',
  '                message="Brevo n est pas configure (BREVO_API_KEY manquant).",',
  '                details={"to": to_email},',
  '            )',
  '',
  '        payload: Dict[str, Any] = {',
  '            "sender": {',
  '                "email": self.settings.brevo_sender_email,',
  '                "name": self.settings.brevo_sender_name,',
  '            },',
  '            "to": [{"email": to_email, "name": to_name}],',
  '            "subject": subject,',
  '            "htmlContent": html_content,',
  '        }',
  '',
  '        if text_content:',
  '            payload["textContent"] = text_content',
  '',
  '        if tags:',
  '            payload["tags"] = tags',
  '',
  '        logger.info(',
  '            "brevo_send_attempt",',
  '            to=to_email,',
  '            subject=subject[:60],',
  '        )',
  '',
  '        try:',
  '            with httpx.Client(timeout=30) as client:',
  '                response = client.post(',
  '                    BREVO_API_URL,',
  '                    headers=self._headers(),',
  '                    json=payload,',
  '                )',
  '',
  '                if response.status_code not in (200, 201, 202):',
  '                    logger.error(',
  '                        "brevo_send_failed",',
  '                        status=response.status_code,',
  '                        body=response.text[:500],',
  '                    )',
  '                    raise EmailError(',
  '                        message=f"Brevo a refuse l envoi ({response.status_code}).",',
  '                        details={',
  '                            "status": response.status_code,',
  '                            "body": response.text[:200],',
  '                        },',
  '                    )',
  '',
  '                result = response.json() if response.text else {}',
  '                logger.info("brevo_send_success", to=to_email, message_id=result.get("messageId"))',
  '                return result',
  '',
  '        except httpx.HTTPError as e:',
  '            logger.exception("brevo_http_error", error=str(e))',
  '            raise EmailError(',
  '                message=f"Erreur reseau Brevo : {str(e)}",',
  '                details={"error": str(e)},',
  '            ) from e',
  '',
  '',
  '# Singleton',
  '_brevo_client: Optional[BrevoClient] = None',
  '',
  '',
  'def get_brevo_client() -> BrevoClient:',
  '    global _brevo_client',
  '    if _brevo_client is None:',
  '        _brevo_client = BrevoClient()',
  '    return _brevo_client',
]);

// ============================================================
// 3. TEMPLATES
// ============================================================

logStep('3. email/templates.py');

writeLines('backend/app/services/email/templates.py', [
  '"""Templates HTML pour les emails CandidatIA."""',
  '',
  'from typing import Any, Dict',
  '',
  '',
  'def base_template(content_html: str, title: str = "CandidatIA") -> str:',
  '    """Template HTML de base avec styling CandidatIA."""',
  '    return f"""',
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '    <meta charset="UTF-8">',
  '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '    <title>{title}</title>',
  '</head>',
  '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc;">',
  '    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">',
  '        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">',
  '            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Candidat<span style="color: #a5b4fc;">IA</span></h1>',
  '        </div>',
  '        <div style="background: white; padding: 30px 25px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">',
  '            {content_html}',
  '        </div>',
  '        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">',
  '            <p style="margin: 0;">CandidatIA — Generez votre pack de candidature en 1 clic</p>',
  '            <p style="margin: 8px 0 0 0;">',
  '                <a href="https://candidatia.com" style="color: #4f46e5; text-decoration: none;">candidatia.com</a>',
  '            </p>',
  '        </div>',
  '    </div>',
  '</body>',
  '</html>',
  '"""',
  '',
  '',
  'def relance_reminder_template(',
  '    user_name: str,',
  '    company_name: str,',
  '    job_title: str,',
  '    scheduled_date: str,',
  '    email_draft: str,',
  ') -> str:',
  '    """Template pour le rappel de relance."""',
  '    content = f"""',
  '    <h2 style="color: #1e1b4b; margin-top: 0;">Bonjour {user_name},</h2>',
  '',
  '    <p>C\'est le moment de relancer votre candidature !</p>',
  '',
  '    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">',
  '        <p style="margin: 0; font-weight: bold; color: #1e1b4b;">Poste : {job_title}</p>',
  '        <p style="margin: 5px 0 0 0; color: #64748b;">Entreprise : {company_name}</p>',
  '        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">Programme le : {scheduled_date}</p>',
  '    </div>',
  '',
  '    <p>Nous avons prepare un brouillon de relance pour vous. Vous pouvez l\'adapter et l\'envoyer depuis votre boite email.</p>',
  '',
  '    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">',
  '        <h3 style="color: #1e1b4b; margin-top: 0; font-size: 14px;">Votre brouillon de relance :</h3>',
  '        <div style="color: #334155; white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.6;">{email_draft}</div>',
  '    </div>',
  '',
  '    <p style="text-align: center; margin: 30px 0;">',
  '        <a href="https://candidatia.com/dashboard/relances" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">',
  '            Voir mes relances',
  '        </a>',
  '    </p>',
  '',
  '    <p style="color: #64748b; font-size: 13px;">Une fois la relance envoyee, pensez a la marquer comme "Envoyee" dans votre tableau de bord.</p>',
  '',
  '    <p style="margin-bottom: 0;">Bonne chance pour votre candidature !<br>L\'equipe CandidatIA</p>',
  '    """',
  '    return base_template(content, title=f"Relance : {job_title} chez {company_name}")',
  '',
  '',
  'def welcome_template(user_name: str) -> str:',
  '    """Template pour l email de bienvenue."""',
  '    content = f"""',
  '    <h2 style="color: #1e1b4b; margin-top: 0;">Bienvenue {user_name} !</h2>',
  '',
  '    <p>Merci de rejoindre CandidatIA, la plateforme qui genere votre pack de candidature complet en 1 clic.</p>',
  '',
  '    <p>Vous beneficiez actuellement du plan gratuit avec <strong>1 pack offert</strong>.</p>',
  '',
  '    <h3 style="color: #1e1b4b; font-size: 16px;">Ce que vous pouvez faire :</h3>',
  '    <ul style="color: #334155;">',
  '        <li>Generer votre CV au format STAR</li>',
  '        <li>Rediger votre lettre de motivation personnalisee</li>',
  '        <li>Preparer votre entretien avec notre guide IA</li>',
  '        <li>Programmer des relances automatiques</li>',
  '    </ul>',
  '',
  '    <p style="text-align: center; margin: 30px 0;">',
  '        <a href="https://candidatia.com/dashboard/generate" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">',
  '            Generer mon premier pack',
  '        </a>',
  '    </p>',
  '',
  '    <p style="margin-bottom: 0;">A bientot,<br>L\'equipe CandidatIA</p>',
  '    """',
  '    return base_template(content, title="Bienvenue sur CandidatIA")',
]);

// ============================================================
// 4. SERVICE
// ============================================================

logStep('4. email/service.py');

writeLines('backend/app/services/email/service.py', [
  '"""Service email de haut niveau."""',
  '',
  'from typing import Any, Dict, Optional',
  '',
  'from app.core.logging import get_logger',
  'from app.services.email.brevo_client import EmailError, get_brevo_client',
  'from app.services.email.templates import (',
  '    relance_reminder_template,',
  '    welcome_template,',
  ')',
  '',
  'logger = get_logger("email.service")',
  '',
  '',
  'def send_email(',
  '    to_email: str,',
  '    to_name: str,',
  '    subject: str,',
  '    html_content: str,',
  '    text_content: Optional[str] = None,',
  '    tags: Optional[list] = None,',
  ') -> Dict[str, Any]:',
  '    """Envoie un email (wrapper haut niveau)."""',
  '    client = get_brevo_client()',
  '    return client.send(',
  '        to_email=to_email,',
  '        to_name=to_name,',
  '        subject=subject,',
  '        html_content=html_content,',
  '        text_content=text_content,',
  '        tags=tags,',
  '    )',
  '',
  '',
  'def send_relance_reminder(',
  '    to_email: str,',
  '    user_name: str,',
  '    company_name: str,',
  '    job_title: str,',
  '    scheduled_date: str,',
  '    email_draft: str,',
  ') -> Dict[str, Any]:',
  '    """Envoie un rappel de relance."""',
  '    html = relance_reminder_template(',
  '        user_name=user_name,',
  '        company_name=company_name,',
  '        job_title=job_title,',
  '        scheduled_date=scheduled_date,',
  '        email_draft=email_draft,',
  '    )',
  '',
  '    subject = f"Relance : {job_title} chez {company_name}"',
  '',
  '    logger.info(',
  '        "relance_reminder_sending",',
  '        to=to_email,',
  '        company=company_name,',
  '        job=job_title,',
  '    )',
  '',
  '    return send_email(',
  '        to_email=to_email,',
  '        to_name=user_name,',
  '        subject=subject,',
  '        html_content=html,',
  '        tags=["relance", "reminder"],',
  '    )',
  '',
  '',
  'def send_welcome_email(to_email: str, user_name: str) -> Dict[str, Any]:',
  '    """Envoie un email de bienvenue."""',
  '    html = welcome_template(user_name=user_name)',
  '',
  '    logger.info("welcome_email_sending", to=to_email)',
  '',
  '    return send_email(',
  '        to_email=to_email,',
  '        to_name=user_name,',
  '        subject="Bienvenue sur CandidatIA",',
  '        html_content=html,',
  '        tags=["welcome"],',
  '    )',
]);

// ============================================================
// 5. TESTS
// ============================================================

logStep('5. tests/test_email_service.py');

writeLines('backend/tests/test_email_service.py', [
  '"""Tests du service email."""',
  '',
  'from app.services.email.brevo_client import BrevoClient, get_brevo_client',
  'from app.services.email.templates import (',
  '    base_template,',
  '    relance_reminder_template,',
  '    welcome_template,',
  ')',
  '',
  '',
  'def test_brevo_client_instantiation() -> None:',
  '    """Le client Brevo peut etre instancie."""',
  '    client = BrevoClient()',
  '    assert client is not None',
  '',
  '',
  'def test_brevo_client_singleton() -> None:',
  '    """Deux appels retournent la meme instance."""',
  '    c1 = get_brevo_client()',
  '    c2 = get_brevo_client()',
  '    assert c1 is c2',
  '',
  '',
  'def test_brevo_is_available_returns_bool() -> None:',
  '    """is_available retourne un booleen."""',
  '    client = BrevoClient()',
  '    result = client.is_available()',
  '    assert isinstance(result, bool)',
  '',
  '',
  'def test_base_template_contains_html() -> None:',
  '    """Le template de base contient du HTML valide."""',
  '    html = base_template("<p>Test</p>")',
  '    assert "<!DOCTYPE html>" in html',
  '    assert "<p>Test</p>" in html',
  '    assert "CandidatIA" in html',
  '',
  '',
  'def test_relance_reminder_template() -> None:',
  '    """Le template de relance contient les infos du poste."""',
  '    html = relance_reminder_template(',
  '        user_name="Jean Dupont",',
  '        company_name="TechCorp",',
  '        job_title="Dev Python",',
  '        scheduled_date="2026-10-15",',
  '        email_draft="Bonjour,\\n\\nJe me permets de...",',
  '    )',
  '    assert "Jean Dupont" in html',
  '    assert "TechCorp" in html',
  '    assert "Dev Python" in html',
  '    assert "2026-10-15" in html',
  '',
  '',
  'def test_welcome_template() -> None:',
  '    """Le template de bienvenue contient le nom."""',
  '    html = welcome_template("Marie Martin")',
  '    assert "Marie Martin" in html',
  '    assert "Bienvenue" in html',
  '    assert "CandidatIA" in html',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 6c terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - backend/app/services/email/__init__.py');
console.log('    - backend/app/services/email/brevo_client.py');
console.log('    - backend/app/services/email/templates.py');
console.log('    - backend/app/services/email/service.py');
console.log('    - backend/tests/test_email_service.py');
console.log('');
console.log('  IMPORTANT : Configurer Brevo dans .env');
console.log('    1. Inscription gratuite : https://www.brevo.com');
console.log('    2. Settings -> SMTP & API -> API Keys');
console.log('    3. Ajouter dans backend/.env :');
console.log('       BREVO_API_KEY=xkeysib-xxx');
console.log('       BREVO_SENDER_EMAIL=votre-email@example.com');
console.log('       BREVO_SENDER_NAME=CandidatIA');
console.log('');
console.log('  TESTS :');
console.log('    cd backend');
console.log('    .\\venv\\Scripts\\Activate.ps1');
console.log('    pytest tests/test_email_service.py -v');
console.log('');
console.log('  Prochaine etape : setup-phase6d.js (Scheduler cron)');
console.log('');