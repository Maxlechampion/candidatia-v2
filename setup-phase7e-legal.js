#!/usr/bin/env node
/**
 * setup-phase7e-legal.js — CandidatIA
 * Génère les pages légales conformes au Code du numérique du Bénin
 *
 * Crée :
 *   - frontend/app/[locale]/legal/terms/page.tsx       (CGU)
 *   - frontend/app/[locale]/legal/privacy/page.tsx     (Politique de confidentialité)
 *   - frontend/app/[locale]/legal/cookies/page.tsx     (Politique de cookies)
 *   - frontend/components/Legal/CookieBanner.tsx       (Bandeau cookies)
 *
 * Modifie :
 *   - frontend/app/[locale]/layout.tsx                 (intégration CookieBanner)
 *
 * Usage : node setup-phase7e-legal.js
 * Prérequis : setup-phase7e.js exécuté
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FRONTEND = path.join(ROOT, 'frontend');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeLines(relPath, lines) {
  const fullPath = path.join(FRONTEND, relPath);
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

logHeader('CandidatIA - Génération des pages légales (Code du numérique du Bénin)');

if (!fs.existsSync(FRONTEND)) {
  console.error('');
  console.error('  ERREUR : dossier frontend/ introuvable.');
  console.error('  Exécute ce script depuis la racine du projet.');
  console.error('');
  process.exit(1);
}

console.log('  Frontend : ' + FRONTEND);

// ============================================================
// 1. CGU - Conditions Générales d'Utilisation
// ============================================================

logStep('1. CGU - Conditions Générales d\'Utilisation');

writeLines('app/[locale]/legal/terms/page.tsx', [
  'import Link from "next/link";',
  '',
  'export default function TermsPage() {',
  '  return (',
  '    <main className="min-h-screen bg-white">',
  '      <header className="border-b border-slate-200 bg-white">',
  '        <div className="container-main flex items-center justify-between py-4">',
  '          <Link href="/" className="text-xl font-bold text-dark">',
  '            Candidat<span className="text-primary-500">IA</span>',
  '          </Link>',
  '          <Link href="/" className="text-sm text-slate-600 hover:text-primary-600">',
  '            Retour à l\'accueil',
  '          </Link>',
  '        </div>',
  '      </header>',
  '',
  '      <article className="container-main max-w-3xl py-12">',
  '        <h1 className="text-3xl font-bold text-dark mb-2">',
  '          Conditions Générales d\'Utilisation',
  '        </h1>',
  '        <p className="text-sm text-slate-500 mb-8">',
  '          Dernière mise à jour : 1er octobre 2026',
  '        </p>',
  '',
  '        <div className="space-y-6 text-slate-600 leading-relaxed">',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 1 – Objet et acceptation',
  '            </h2>',
  '            <p>',
  '              Les présentes Conditions Générales d\'Utilisation (« CGU ») régissent',
  '              l\'accès et l\'utilisation de la plateforme CandidatIA, accessible à',
  '              l\'adresse https://candidatia.com (le « Service »), éditée par',
  '              CandidatIA, dont le siège est situé au Bénin.',
  '            </p>',
  '            <p className="mt-2">',
  '              En créant un compte ou en utilisant le Service, l\'utilisateur accepte',
  '              sans réserve les présentes CGU, conformément à la loi n° 2017-20 du',
  '              20 avril 2018 portant Code du numérique en République du Bénin.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 2 – Description du Service',
  '            </h2>',
  '            <p>',
  '              CandidatIA est un service en ligne de génération automatique de',
  '              documents de candidature assistée par intelligence artificielle.',
  '              Il permet à l\'utilisateur de générer :',
  '            </p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li>Un curriculum vitae (CV) optimisé</li>',
  '              <li>Une lettre de motivation personnalisée</li>',
  '              <li>Un guide de préparation à l\'entretien</li>',
  '              <li>Des brouillons de relance</li>',
  '            </ul>',
  '            <p className="mt-2">',
  '              Le Service ne garantit en aucun cas l\'obtention d\'un emploi',
  '              ou d\'un entretien.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 3 – Compte utilisateur',
  '            </h2>',
  '            <p>',
  '              L\'accès au Service nécessite la création d\'un compte.',
  '              L\'utilisateur s\'engage à fournir des informations exactes et à jour,',
  '              et à préserver la confidentialité de ses identifiants de connexion.',
  '            </p>',
  '            <p className="mt-2">',
  '              Toute activité effectuée depuis le compte de l\'utilisateur est',
  '              réputée effectuée par ce dernier.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 4 – Prix et paiement',
  '            </h2>',
  '            <p>',
  '              Les prix des différents plans sont indiqués en francs CFA (XOF)',
  '              sur la page Tarifs. Le paiement peut être effectué par les moyens',
  '              suivants :',
  '            </p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li>Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) via FedaPay</li>',
  '              <li>Carte bancaire (Visa, Mastercard) via Flutterwave</li>',
  '              <li>Cryptomonnaies stables (USDT, USDC) via Raenest</li>',
  '            </ul>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 5 – Droit de rétractation',
  '            </h2>',
  '            <p>',
  '              Conformément aux articles 347 et 348 du Code du numérique, le',
  '              consommateur dispose d\'un délai de <strong>quinze (15) jours',
  '              ouvrables</strong> pour exercer son droit de rétractation, sans',
  '              avoir à justifier sa décision.',
  '            </p>',
  '            <p className="mt-2">',
  '              <strong>Exception :</strong> Conformément à l\'article 354 du Code',
  '              du numérique, le droit de rétractation est perdu lorsque le service',
  '              a été fourni dans sa totalité. Les contenus numériques (CV, lettre,',
  '              guide) générés et téléchargés ne sont pas éligibles au droit de',
  '              rétractation.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 6 – Propriété intellectuelle',
  '            </h2>',
  '            <p>',
  '              Les documents générés par le Service appartiennent à l\'utilisateur.',
  '              Le code source, la marque CandidatIA et l\'ensemble des éléments',
  '              techniques de la plateforme sont la propriété exclusive de CandidatIA.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 7 – Responsabilité contractuelle',
  '            </h2>',
  '            <p>',
  '              Conformément à l\'article 329 du Code du numérique, CandidatIA est',
  '              responsable de plein droit de la bonne exécution des obligations',
  '              résultant des présentes CGU, sauf preuve que l\'inexécution est',
  '              imputable à l\'utilisateur, à un tiers, ou à un cas de force majeure.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 8 – Communications commerciales',
  '            </h2>',
  '            <p>',
  '              Conformément aux articles 330 à 332 du Code du numérique, toute',
  '              prospection directe par courrier électronique est soumise au',
  '              consentement préalable et exprès de l\'utilisateur.',
  '            </p>',
  '            <p className="mt-2">',
  '              L\'utilisateur peut retirer son consentement à tout moment. Toute',
  '              communication commerciale comportera la mention « Publicité » de',
  '              manière claire et lisible.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 9 – Droit applicable et juridiction',
  '            </h2>',
  '            <p>',
  '              Les présentes CGU sont soumises au droit béninois. Tout litige',
  '              relatif à leur interprétation ou à leur exécution relève de la',
  '              compétence exclusive des tribunaux de Cotonou.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              Article 10 – Modification des CGU',
  '            </h2>',
  '            <p>',
  '              CandidatIA se réserve le droit de modifier les présentes CGU à tout',
  '              moment. Les utilisateurs seront informés par email au moins 15 jours',
  '              avant l\'entrée en vigueur des modifications.',
  '            </p>',
  '          </section>',
  '',
  '        </div>',
  '',
  '        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">',
  '          <p>CandidatIA – Déclaration APDP n° [à compléter après déclaration]</p>',
  '          <p className="mt-1">Pour toute question : contact@candidatia.com</p>',
  '        </div>',
  '      </article>',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 2. Privacy Policy
// ============================================================

logStep('2. Politique de Confidentialité');

writeLines('app/[locale]/legal/privacy/page.tsx', [
  'import Link from "next/link";',
  '',
  'export default function PrivacyPage() {',
  '  return (',
  '    <main className="min-h-screen bg-white">',
  '      <header className="border-b border-slate-200 bg-white">',
  '        <div className="container-main flex items-center justify-between py-4">',
  '          <Link href="/" className="text-xl font-bold text-dark">',
  '            Candidat<span className="text-primary-500">IA</span>',
  '          </Link>',
  '          <Link href="/" className="text-sm text-slate-600 hover:text-primary-600">',
  '            Retour à l\'accueil',
  '          </Link>',
  '        </div>',
  '      </header>',
  '',
  '      <article className="container-main max-w-3xl py-12">',
  '        <h1 className="text-3xl font-bold text-dark mb-2">',
  '          Politique de Confidentialité',
  '        </h1>',
  '        <p className="text-sm text-slate-500 mb-8">',
  '          Dernière mise à jour : 1er octobre 2026',
  '        </p>',
  '',
  '        <div className="space-y-6 text-slate-600 leading-relaxed">',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              1. Responsable du traitement',
  '            </h2>',
  '            <p>',
  '              Le responsable du traitement des données personnelles collectées',
  '              via la plateforme CandidatIA est :',
  '            </p>',
  '            <p className="mt-2">',
  '              <strong>CandidatIA</strong><br />',
  '              Adresse : [à compléter], Bénin<br />',
  '              Email : contact@candidatia.com',
  '            </p>',
  '            <p className="mt-2">',
  '              Conformément à la loi n° 2017-20 portant Code du numérique,',
  '              CandidatIA a effectué une déclaration auprès de l\'Autorité de',
  '              Protection des Données Personnelles (APDP) sous le numéro',
  '              [à compléter après déclaration].',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              2. Données collectées',
  '            </h2>',
  '            <p>Nous collectons les catégories de données suivantes :</p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li><strong>Données d\'identité :</strong> nom complet, adresse email</li>',
  '              <li><strong>Données professionnelles :</strong> contenu du CV, expériences, formations, compétences</li>',
  '              <li><strong>Données de paiement :</strong> historique des transactions (nous ne stockons pas les numéros de carte)</li>',
  '              <li><strong>Données de connexion :</strong> adresse IP, journaux de connexion</li>',
  '            </ul>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              3. Finalités du traitement',
  '            </h2>',
  '            <p>Vos données sont traitées pour les finalités suivantes :</p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li>Génération des documents de candidature (CV, lettre, guide)</li>',
  '              <li>Gestion de votre compte utilisateur</li>',
  '              <li>Traitement des paiements et gestion des crédits</li>',
  '              <li>Envoi de communications transactionnelles (confirmations, rappels)</li>',
  '              <li>Amélioration du Service</li>',
  '            </ul>',
  '            <p className="mt-2">',
  '              Conformément à l\'article 383 du Code du numérique, ces finalités',
  '              sont déterminées, explicites et légitimes.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              4. Destinataires des données',
  '            </h2>',
  '            <p>',
  '              Vos données peuvent être transmises aux sous-traitants suivants,',
  '              dans la stricte mesure nécessaire à l\'exécution de leurs missions :',
  '            </p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li><strong>Supabase</strong> (base de données) – hébergement sécurisé</li>',
  '              <li><strong>Brevo</strong> (envoi d\'emails transactionnels)</li>',
  '              <li><strong>FedaPay, Flutterwave, Raenest</strong> (traitement des paiements)</li>',
  '              <li><strong>Groq, Google</strong> (fournisseurs d\'intelligence artificielle)</li>',
  '            </ul>',
  '            <p className="mt-2">',
  '              Certains de ces sous-traitants sont situés hors du Bénin. Ces',
  '              transferts sont encadrés conformément aux articles 391 et suivants',
  '              du Code du numérique, qui exigent un niveau de protection équivalent.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              5. Durée de conservation',
  '            </h2>',
  '            <p>',
  '              Conformément à l\'article 383.6 du Code du numérique, vos données',
  '              sont conservées pour une durée limitée à celle nécessaire à',
  '              l\'atteinte des finalités :',
  '            </p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li><strong>Données de compte :</strong> supprimées dans les 30 jours suivant la désinscription</li>',
  '              <li><strong>Données transactionnelles :</strong> conservées pendant la durée légale obligatoire (10 ans)</li>',
  '              <li><strong>Cookies :</strong> durée maximale de 13 mois</li>',
  '            </ul>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              6. Vos droits',
  '            </h2>',
  '            <p>',
  '              Conformément aux articles 437 à 448 du Code du numérique, vous',
  '              disposez des droits suivants :',
  '            </p>',
  '',
  '            <div className="mt-4 space-y-4">',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">Droit d\'accès</h3>',
  '                <p className="text-sm">',
  '                  Vous pouvez demander à consulter l\'intégralité des données vous',
  '                  concernant. Le responsable du traitement doit répondre dans un',
  '                  délai maximum de <strong>soixante (60) jours</strong>.',
  '                </p>',
  '              </div>',
  '',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">Droit d\'opposition</h3>',
  '                <p className="text-sm">',
  '                  Vous pouvez vous opposer, gratuitement et sans justification, à',
  '                  ce que vos données soient utilisées à des fins de prospection',
  '                  commerciale. Le responsable du traitement doit répondre dans un',
  '                  délai maximum de <strong>trente (30) jours</strong>.',
  '                </p>',
  '              </div>',
  '',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">Droit de rectification et de suppression</h3>',
  '                <p className="text-sm">',
  '                  Vous pouvez demander la correction ou la suppression de vos',
  '                  données inexactes, incomplètes ou dont la collecte est interdite.',
  '                  Le responsable du traitement doit répondre dans un délai maximum',
  '                  de <strong>quarante-cinq (45) jours</strong>.',
  '                </p>',
  '              </div>',
  '',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">Droit à la portabilité</h3>',
  '                <p className="text-sm">',
  '                  Vous pouvez recevoir vos données dans un format structuré,',
  '                  couramment utilisé et lisible par machine, et les transmettre',
  '                  à un autre responsable de traitement.',
  '                </p>',
  '              </div>',
  '            </div>',
  '',
  '            <p className="mt-4">',
  '              Pour exercer ces droits, adressez une demande écrite, datée et',
  '              signée à : <strong>contact@candidatia.com</strong>, accompagnée',
  '              d\'une copie de votre pièce d\'identité.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">7. Sécurité</h2>',
  '            <p>',
  '              Conformément à l\'article 426 du Code du numérique, CandidatIA met',
  '              en œuvre les mesures techniques et organisationnelles suivantes :',
  '            </p>',
  '            <ul className="list-disc pl-6 mt-2 space-y-1">',
  '              <li>Chiffrement des mots de passe (bcrypt)</li>',
  '              <li>Chiffrement des communications (HTTPS/TLS)</li>',
  '              <li>Contrôle d\'accès aux données personnelles</li>',
  '              <li>Surveillance des violations de données</li>',
  '            </ul>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">8. Réclamation</h2>',
  '            <p>',
  '              Si vous estimez que vos droits ne sont pas respectés, vous pouvez',
  '              introduire une réclamation auprès de l\'Autorité de Protection des',
  '              Données Personnelles (APDP) du Bénin :',
  '            </p>',
  '            <p className="mt-2">',
  '              APDP – Rue 6.076, Aidjèdo, Immeuble El MARZOUK Joël, Cotonou<br />',
  '              Téléphone : (+229) 21 32 57 88<br />',
  '              Email : contact@apdp.bj<br />',
  '              Site : www.apdp.bj',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              9. Modification de la politique',
  '            </h2>',
  '            <p>',
  '              La présente politique peut être modifiée à tout moment. Les',
  '              utilisateurs seront informés par email de toute modification',
  '              substantielle au moins 15 jours avant son entrée en vigueur.',
  '            </p>',
  '          </section>',
  '',
  '        </div>',
  '',
  '        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">',
  '          <p>CandidatIA – Déclaration APDP n° [à compléter après déclaration]</p>',
  '        </div>',
  '      </article>',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 3. Politique de cookies
// ============================================================

logStep('3. Politique de Cookies');

writeLines('app/[locale]/legal/cookies/page.tsx', [
  'import Link from "next/link";',
  '',
  'export default function CookiesPage() {',
  '  return (',
  '    <main className="min-h-screen bg-white">',
  '      <header className="border-b border-slate-200 bg-white">',
  '        <div className="container-main flex items-center justify-between py-4">',
  '          <Link href="/" className="text-xl font-bold text-dark">',
  '            Candidat<span className="text-primary-500">IA</span>',
  '          </Link>',
  '          <Link href="/" className="text-sm text-slate-600 hover:text-primary-600">',
  '            Retour à l\'accueil',
  '          </Link>',
  '        </div>',
  '      </header>',
  '',
  '      <article className="container-main max-w-3xl py-12">',
  '        <h1 className="text-3xl font-bold text-dark mb-2">',
  '          Politique de Cookies',
  '        </h1>',
  '        <p className="text-sm text-slate-500 mb-8">',
  '          Dernière mise à jour : 1er octobre 2026',
  '        </p>',
  '',
  '        <div className="space-y-6 text-slate-600 leading-relaxed">',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              1. Qu\'est-ce qu\'un cookie ?',
  '            </h2>',
  '            <p>',
  '              Un cookie est un petit fichier texte déposé sur votre appareil',
  '              lors de la visite d\'un site web. Il permet de conserver des',
  '              informations relatives à votre navigation.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              2. Cookies utilisés sur CandidatIA',
  '            </h2>',
  '            <div className="space-y-4 mt-4">',
  '',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">',
  '                  Cookies essentiels',
  '                </h3>',
  '                <p className="text-sm">',
  '                  Nécessaires au fonctionnement du Service. Ils permettent',
  '                  l\'authentification (jeton JWT), la gestion de session et la',
  '                  mémorisation de la langue préférée. Ces cookies ne peuvent',
  '                  pas être désactivés.',
  '                </p>',
  '              </div>',
  '',
  '              <div className="bg-slate-50 p-4 rounded-lg">',
  '                <h3 className="font-semibold text-dark mb-2">',
  '                  Cookies analytiques',
  '                </h3>',
  '                <p className="text-sm">',
  '                  Utilisés pour mesurer l\'audience de manière anonyme et',
  '                  améliorer le Service. Vous pouvez les refuser sans impact',
  '                  sur votre navigation.',
  '                </p>',
  '              </div>',
  '',
  '            </div>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              3. Durée de conservation',
  '            </h2>',
  '            <p>',
  '              Conformément aux recommandations de l\'APDP, la durée de vie des',
  '              cookies n\'excède pas treize (13) mois.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              4. Gérer vos préférences',
  '            </h2>',
  '            <p>',
  '              Vous pouvez à tout moment modifier vos préférences en matière de',
  '              cookies via le bandeau qui s\'affiche lors de votre première',
  '              visite, ou en configurant votre navigateur.',
  '            </p>',
  '          </section>',
  '',
  '          <section>',
  '            <h2 className="text-xl font-bold text-dark mb-3">',
  '              5. Plus d\'informations',
  '            </h2>',
  '            <p>',
  '              Pour toute question relative à notre utilisation des cookies,',
  '              contactez-nous à : <strong>contact@candidatia.com</strong>.',
  '            </p>',
  '          </section>',
  '',
  '        </div>',
  '      </article>',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 4. Cookie Banner
// ============================================================

logStep('4. Bandeau de consentement aux cookies');

writeLines('components/Legal/CookieBanner.tsx', [
  '"use client";',
  '',
  'import { useEffect, useState } from "react";',
  'import Link from "next/link";',
  'import { Button } from "@/components/ui/Button";',
  '',
  'const STORAGE_KEY = "candidatia_cookie_consent";',
  '',
  'export function CookieBanner() {',
  '  const [visible, setVisible] = useState(false);',
  '',
  '  useEffect(() => {',
  '    if (typeof window === "undefined") return;',
  '    const consent = localStorage.getItem(STORAGE_KEY);',
  '    if (!consent) {',
  '      setVisible(true);',
  '    }',
  '  }, []);',
  '',
  '  function acceptAll() {',
  '    localStorage.setItem(STORAGE_KEY, JSON.stringify({',
  '      essential: true,',
  '      analytics: true,',
  '      date: new Date().toISOString(),',
  '    }));',
  '    setVisible(false);',
  '  }',
  '',
  '  function acceptEssentialOnly() {',
  '    localStorage.setItem(STORAGE_KEY, JSON.stringify({',
  '      essential: true,',
  '      analytics: false,',
  '      date: new Date().toISOString(),',
  '    }));',
  '    setVisible(false);',
  '  }',
  '',
  '  if (!visible) return null;',
  '',
  '  return (',
  '    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-slate-200 shadow-lg">',
  '      <div className="container-main py-4 flex flex-col md:flex-row items-start md:items-center gap-4">',
  '        <div className="flex-1 text-sm text-slate-600">',
  '          <p className="font-medium text-dark mb-1">',
  '            Nous respectons votre vie privée',
  '          </p>',
  '          <p>',
  '            Nous utilisons des cookies pour assurer le fonctionnement du',
  '            Service et, avec votre accord, pour mesurer son audience. Vous',
  '            pouvez accepter tous les cookies ou uniquement ceux nécessaires. ',
  '            <Link href="/legal/cookies" className="text-primary-600 hover:underline">',
  '              En savoir plus',
  '            </Link>',
  '          </p>',
  '        </div>',
  '        <div className="flex gap-2 shrink-0">',
  '          <Button variant="outline" size="sm" onClick={acceptEssentialOnly}>',
  '            Essentiels uniquement',
  '          </Button>',
  '          <Button size="sm" onClick={acceptAll}>',
  '            Tout accepter',
  '          </Button>',
  '        </div>',
  '      </div>',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 5. Intégration CookieBanner dans layout
// ============================================================

logStep('5. Intégration du CookieBanner dans le layout');

const layoutPath = path.join(FRONTEND, 'app', '[locale]', 'layout.tsx');

if (!fs.existsSync(layoutPath)) {
  console.log('  WARN  layout.tsx introuvable');
} else {
  let layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  // Ajouter l'import s'il n'existe pas
  if (!layoutContent.includes('CookieBanner')) {
    layoutContent = layoutContent.replace(
      /^(import[^\n]*\n)+/m,
      (match) => match + 'import { CookieBanner } from "@/components/Legal/CookieBanner";\n'
    );

    // Ajouter le composant avant </body>
    layoutContent = layoutContent.replace(
      /<\/body>/,
      '        <CookieBanner />\n      </body>'
    );

    fs.writeFileSync(layoutPath, layoutContent, 'utf-8');
    console.log('  OK    layout.tsx mis à jour');
  } else {
    console.log('  SKIP  layout.tsx déjà à jour');
  }
}

// ============================================================
// RESUME
// ============================================================

logHeader('Pages légales générées avec succès');

console.log('  Fichiers créés / mis à jour :');
console.log('    - frontend/app/[locale]/legal/terms/page.tsx');
console.log('    - frontend/app/[locale]/legal/privacy/page.tsx');
console.log('    - frontend/app/[locale]/legal/cookies/page.tsx');
console.log('    - frontend/components/Legal/CookieBanner.tsx');
console.log('    - frontend/app/[locale]/layout.tsx (mis à jour)');
console.log('');
console.log('  ACTIONS DE CONFORMITÉ RESTANTES :');
console.log('');
console.log('  1. Compléter les informations manquantes :');
console.log('     - Adresse du siège social (dans privacy/page.tsx)');
console.log('     - Numéro de déclaration APDP (après déclaration)');
console.log('');
console.log('  2. Effectuer la déclaration APDP :');
console.log('     https://www.apdp.bj');
console.log('');
console.log('  3. Tenir le registre des activités de traitement (art. 435)');
console.log('');
console.log('  4. Rapport annuel APDP avant le 30 juin (art. 387)');
console.log('');
console.log('  VÉRIFICATION :');
console.log('    http://localhost:3000/legal/terms');
console.log('    http://localhost:3000/legal/privacy');
console.log('    http://localhost:3000/legal/cookies');
console.log('');