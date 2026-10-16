#!/usr/bin/env node
/**
 * setup-phase7e.js — CandidatIA
 * Phase 7e : Landing complete + Legal + Polish + Vercel config
 *
 * Cree dans frontend/ :
 *   - app/[locale]/page.tsx (landing enrichie - remplace)
 *   - app/[locale]/not-found.tsx (404)
 *   - app/[locale]/legal/terms/page.tsx
 *   - app/[locale]/legal/privacy/page.tsx
 *   - app/[locale]/legal/cookies/page.tsx
 *   - components/ui/Toast.tsx
 *   - components/ui/Spinner.tsx
 *   - components/Layout/LandingFooter.tsx
 *   - vercel.json
 *   - DEPLOYMENT.md
 *
 * Usage : node setup-phase7e.js
 * Pre-requis : setup-phase7d.js execute
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

logHeader('CandidatIA - Setup Phase 7e : Landing + Legal + Polish');

if (!fs.existsSync(path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'billing', 'page.tsx'))) {
  console.error('');
  console.error('  ERREUR : Phase 7d non executee.');
  console.error('');
  process.exit(1);
}

console.log('  Frontend : ' + FRONTEND);

// ============================================================
// 1. TOAST
// ============================================================

logStep('1. components/ui/Toast.tsx');

writeLines('components/ui/Toast.tsx', [
  '"use client";',
  '',
  'import { createContext, useContext, useState, ReactNode } from "react";',
  'import { cn } from "@/lib/utils";',
  '',
  'type ToastType = "success" | "error" | "info";',
  '',
  'interface Toast {',
  '  id: number;',
  '  message: string;',
  '  type: ToastType;',
  '}',
  '',
  'interface ToastContextValue {',
  '  showToast: (message: string, type?: ToastType) => void;',
  '}',
  '',
  'const ToastContext = createContext<ToastContextValue | null>(null);',
  '',
  'export function ToastProvider({ children }: { children: ReactNode }) {',
  '  const [toasts, setToasts] = useState<Toast[]>([]);',
  '',
  '  function showToast(message: string, type: ToastType = "info") {',
  '    const id = Date.now();',
  '    setToasts((prev) => [...prev, { id, message, type }]);',
  '',
  '    setTimeout(() => {',
  '      setToasts((prev) => prev.filter((t) => t.id !== id));',
  '    }, 5000);',
  '  }',
  '',
  '  return (',
  '    <ToastContext.Provider value={{ showToast }}>',
  '      {children}',
  '      <div className="fixed bottom-4 right-4 z-[100] space-y-2">',
  '        {toasts.map((toast) => (',
  '          <div',
  '            key={toast.id}',
  '            className={cn(',
  '              "px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm",',
  '              toast.type === "success" && "bg-emerald-600 text-white",',
  '              toast.type === "error" && "bg-red-600 text-white",',
  '              toast.type === "info" && "bg-slate-800 text-white",',
  '            )}',
  '          >',
  '            {toast.message}',
  '          </div>',
  '        ))}',
  '      </div>',
  '    </ToastContext.Provider>',
  '  );',
  '}',
  '',
  'export function useToast() {',
  '  const ctx = useContext(ToastContext);',
  '  if (!ctx) {',
  '    return { showToast: () => {} };',
  '  }',
  '  return ctx;',
  '}',
]);

// ============================================================
// 2. SPINNER
// ============================================================

logStep('2. components/ui/Spinner.tsx');

writeLines('components/ui/Spinner.tsx', [
  'import { cn } from "@/lib/utils";',
  '',
  'export function Spinner({ className }: { className?: string }) {',
  '  return (',
  '    <span',
  '      className={cn(',
  '        "inline-block w-5 h-5 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin",',
  '        className,',
  '      )}',
  '    />',
  '  );',
  '}',
  '',
  'export function FullPageSpinner() {',
  '  return (',
  '    <div className="min-h-screen flex items-center justify-center">',
  '      <Spinner className="w-8 h-8" />',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 3. LANDING FOOTER
// ============================================================

logStep('3. components/Layout/LandingFooter.tsx');

writeLines('components/Layout/LandingFooter.tsx', [
  'import Link from "next/link";',
  '',
  'export function LandingFooter() {',
  '  return (',
  '    <footer className="border-t border-slate-200 bg-white">',
  '      <div className="container-main py-12">',
  '        <div className="grid md:grid-cols-4 gap-8">',
  '          <div>',
  '            <div className="text-lg font-bold text-dark mb-4">',
  '              Candidat<span className="text-primary-500">IA</span>',
  '            </div>',
  '            <p className="text-sm text-slate-500">',
  '              Generez votre pack de candidature complet en 1 clic grace a l IA.',
  '            </p>',
  '          </div>',
  '',
  '          <div>',
  '            <h4 className="font-bold text-dark mb-4 text-sm">Produit</h4>',
  '            <ul className="space-y-2 text-sm text-slate-500">',
  '              <li><Link href="/#features" className="hover:text-primary-600">Fonctionnalites</Link></li>',
  '              <li><Link href="/#pricing" className="hover:text-primary-600">Tarifs</Link></li>',
  '              <li><Link href="/#how" className="hover:text-primary-600">Comment ca marche</Link></li>',
  '              <li><Link href="/register" className="hover:text-primary-600">Essai gratuit</Link></li>',
  '            </ul>',
  '          </div>',
  '',
  '          <div>',
  '            <h4 className="font-bold text-dark mb-4 text-sm">Legal</h4>',
  '            <ul className="space-y-2 text-sm text-slate-500">',
  '              <li><Link href="/legal/terms" className="hover:text-primary-600">Conditions d utilisation</Link></li>',
  '              <li><Link href="/legal/privacy" className="hover:text-primary-600">Confidentialite</Link></li>',
  '              <li><Link href="/legal/cookies" className="hover:text-primary-600">Cookies</Link></li>',
  '            </ul>',
  '          </div>',
  '',
  '          <div>',
  '            <h4 className="font-bold text-dark mb-4 text-sm">Contact</h4>',
  '            <ul className="space-y-2 text-sm text-slate-500">',
  '              <li><a href="mailto:contact@candidatia.com" className="hover:text-primary-600">contact@candidatia.com</a></li>',
  '              <li><a href="https://twitter.com/candidatia" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">Twitter</a></li>',
  '              <li><a href="https://linkedin.com/company/candidatia" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">LinkedIn</a></li>',
  '            </ul>',
  '          </div>',
  '        </div>',
  '',
  '        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">',
  '          <p>&copy; 2026 CandidatIA. Tous droits reserves.</p>',
  '        </div>',
  '      </div>',
  '    </footer>',
  '  );',
  '}',
]);

// ============================================================
// 4. LANDING PAGE (nouvelle version)
// ============================================================

logStep('4. app/[locale]/page.tsx (landing enrichie)');

writeLines('app/[locale]/page.tsx', [
  'import { useTranslations } from "next-intl";',
  'import Link from "next/link";',
  'import { LandingFooter } from "@/components/Layout/LandingFooter";',
  '',
  'export default function HomePage() {',
  '  const t = useTranslations("landing");',
  '',
  '  return (',
  '    <main className="min-h-screen bg-white">',
  '      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">',
  '        <div className="container-main flex items-center justify-between py-4">',
  '          <div className="text-xl font-bold text-dark">',
  '            Candidat<span className="text-primary-500">IA</span>',
  '          </div>',
  '          <nav className="flex items-center gap-3">',
  '            <Link',
  '              href="/login"',
  '              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 transition"',
  '            >',
  '              Connexion',
  '            </Link>',
  '            <Link',
  '              href="/register"',
  '              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"',
  '            >',
  '              Inscription',
  '            </Link>',
  '          </nav>',
  '        </div>',
  '      </header>',
  '',
  '      <section className="container-main py-20 md:py-28 text-center">',
  '        <span className="inline-block px-3 py-1 text-xs font-bold text-primary-700 bg-primary-50 rounded-full mb-6">',
  '          NOUVEAU - Generateur de packs IA',
  '        </span>',
  '        <h1 className="text-4xl md:text-6xl font-bold text-dark mb-6 leading-tight">',
  '          {t("hero_title")}',
  '        </h1>',
  '        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">',
  '          {t("hero_subtitle")}',
  '        </p>',
  '        <div className="flex flex-col sm:flex-row gap-4 justify-center">',
  '          <Link',
  '            href="/register"',
  '            className="px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"',
  '          >',
  '            {t("cta_primary")}',
  '          </Link>',
  '          <Link',
  '            href="#how"',
  '            className="px-6 py-3 text-base font-semibold text-primary-600 bg-white border-2 border-primary-100 rounded-lg hover:border-primary-300 transition"',
  '          >',
  '            {t("cta_secondary")}',
  '          </Link>',
  '        </div>',
  '',
  '        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500">',
  '          <div className="flex items-center gap-2">',
  '            <span className="text-emerald-500">OK</span> Sans carte bancaire',
  '          </div>',
  '          <div className="flex items-center gap-2">',
  '            <span className="text-emerald-500">OK</span> 1 pack offert',
  '          </div>',
  '          <div className="flex items-center gap-2">',
  '            <span className="text-emerald-500">OK</span> Resultats en 30 secondes',
  '          </div>',
  '        </div>',
  '      </section>',
  '',
  '      <section id="features" className="container-main py-16 md:py-24">',
  '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
  '          {t("features_title")}',
  '        </h2>',
  '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
  '          Tout ce dont vous avez besoin pour reussir votre candidature,',
  '          dans un seul pack genere automatiquement.',
  '        </p>',
  '',
  '        <div className="grid md:grid-cols-3 gap-6">',
  '          {[',
  '            { title: t("feature_cv_title"), desc: t("feature_cv_desc"), icon: "[CV]" },',
  '            { title: t("feature_lettre_title"), desc: t("feature_lettre_desc"), icon: "[Lettre]" },',
  '            { title: t("feature_guide_title"), desc: t("feature_guide_desc"), icon: "[Guide]" },',
  '          ].map((feature, i) => (',
  '            <div',
  '              key={i}',
  '              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition"',
  '            >',
  '              <div className="text-lg font-bold text-primary-600 mb-4">{feature.icon}</div>',
  '              <h3 className="text-lg font-bold text-dark mb-3">{feature.title}</h3>',
  '              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>',
  '            </div>',
  '          ))}',
  '        </div>',
  '      </section>',
  '',
  '      <section id="how" className="bg-slate-50 py-16 md:py-24">',
  '        <div className="container-main">',
  '          <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-12">',
  '            Comment ca marche ?',
  '          </h2>',
  '',
  '          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">',
  '            {[',
  '              { step: "1", title: "Uploadez votre profil", desc: "CV, LinkedIn ou texte brut. Nous acceptons tous les formats." },',
  '              { step: "2", title: "Ajoutez l offre cible", desc: "Collez l offre d emploi ou uploadez le PDF." },',
  '              { step: "3", title: "Recevez votre pack", desc: "CV optimise, lettre personnalisee et guide d entretien en 30 secondes." },',
  '            ].map((item, i) => (',
  '              <div key={i} className="text-center">',
  '                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">',
  '                  {item.step}',
  '                </div>',
  '                <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>',
  '                <p className="text-slate-600 text-sm">{item.desc}</p>',
  '              </div>',
  '            ))}',
  '          </div>',
  '        </div>',
  '      </section>',
  '',
  '      <section id="pricing" className="container-main py-16 md:py-24">',
  '        <h2 className="text-3xl md:text-4xl font-bold text-dark text-center mb-4">',
  '          Tarifs simples et transparents',
  '        </h2>',
  '        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">',
  '          Commencez gratuitement, payez seulement quand vous en avez besoin.',
  '        </p>',
  '',
  '        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">',
  '          {[',
  '            {',
  '              name: "Decouverte",',
  '              price: "0",',
  '              features: ["1 pack offert", "CV + Lettre + Guide", "Sans engagement"],',
  '              cta: "Commencer gratuitement",',
  '              highlighted: false,',
  '            },',
  '            {',
  '              name: "Essentiel",',
  '              price: "4.99",',
  '              features: ["5 packs", "Sans filigrane", "Support email"],',
  '              cta: "Choisir Essentiel",',
  '              highlighted: false,',
  '            },',
  '            {',
  '              name: "Pro",',
  '              price: "14.99",',
  '              features: ["30 packs/mois", "Simulateur entretien", "Suivi candidatures", "Support prioritaire"],',
  '              cta: "Choisir Pro",',
  '              highlighted: true,',
  '            },',
  '          ].map((plan, i) => (',
  '            <div',
  '              key={i}',
  '              className={`relative p-6 rounded-xl border-2 ${',
  '                plan.highlighted ? "border-primary-500 shadow-lg" : "border-slate-200"',
  '              }`}',
  '            >',
  '              {plan.highlighted && (',
  '                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold text-white bg-primary-600 rounded-full">',
  '                  POPULAIRE',
  '                </span>',
  '              )}',
  '              <h3 className="text-lg font-bold text-dark mb-2">{plan.name}</h3>',
  '              <div className="mb-4">',
  '                <span className="text-4xl font-bold text-dark">{plan.price}</span>',
  '                <span className="text-slate-500 ml-1">EUR</span>',
  '              </div>',
  '              <ul className="space-y-2 mb-6">',
  '                {plan.features.map((f, j) => (',
  '                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600">',
  '                    <span className="text-emerald-500">-</span>',
  '                    <span>{f}</span>',
  '                  </li>',
  '                ))}',
  '              </ul>',
  '              <Link',
  '                href="/register"',
  '                className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition ${',
  '                  plan.highlighted',
  '                    ? "bg-primary-600 text-white hover:bg-primary-700"',
  '                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"',
  '                }`}',
  '              >',
  '                {plan.cta}',
  '              </Link>',
  '            </div>',
  '          ))}',
  '        </div>',
  '      </section>',
  '',
  '      <section className="bg-gradient-to-br from-dark to-primary-900 py-16 md:py-24">',
  '        <div className="container-main text-center">',
  '          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">',
  '            Pret a decrocher votre prochain emploi ?',
  '          </h2>',
  '          <p className="text-primary-100 max-w-2xl mx-auto mb-8">',
  '            Rejoignez des milliers de candidats qui ont optimise leur candidature avec CandidatIA.',
  '          </p>',
  '          <Link',
  '            href="/register"',
  '            className="inline-block px-8 py-3 text-base font-semibold text-primary-700 bg-white rounded-lg hover:bg-primary-50 transition"',
  '          >',
  '            Generer mon premier pack gratuit',
  '          </Link>',
  '        </div>',
  '      </section>',
  '',
  '      <LandingFooter />',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 5. 404 PAGE
// ============================================================

logStep('5. app/[locale]/not-found.tsx');

writeLines('app/[locale]/not-found.tsx', [
  'import Link from "next/link";',
  '',
  'export default function NotFound() {',
  '  return (',
  '    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4">',
  '      <div className="text-center max-w-md">',
  '        <div className="text-8xl font-bold text-primary-600 mb-4">404</div>',
  '        <h1 className="text-2xl font-bold text-dark mb-4">Page introuvable</h1>',
  '        <p className="text-slate-600 mb-8">',
  '          La page que vous cherchez n existe pas ou a ete deplacee.',
  '        </p>',
  '        <Link',
  '          href="/"',
  '          className="inline-block px-6 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"',
  '        >',
  '          Retour a l accueil',
  '        </Link>',
  '      </div>',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 6. PAGES LEGALES
// ============================================================

logStep('6. Pages legales (terms, privacy, cookies)');

function legalPageContent(title, contentLines) {
  return [
    'import Link from "next/link";',
    '',
    'export default function LegalPage() {',
    '  return (',
    '    <main className="min-h-screen bg-white">',
    '      <header className="border-b border-slate-200 bg-white">',
    '        <div className="container-main flex items-center justify-between py-4">',
    '          <Link href="/" className="text-xl font-bold text-dark">',
    '            Candidat<span className="text-primary-500">IA</span>',
    '          </Link>',
    '          <Link href="/" className="text-sm text-slate-600 hover:text-primary-600">',
    '            Retour a l accueil',
    '          </Link>',
    '        </div>',
    '      </header>',
    '',
    '      <article className="container-main max-w-3xl py-12">',
    `        <h1 className="text-3xl font-bold text-dark mb-8">${title}</h1>`,
    '        <div className="space-y-6 text-slate-600 leading-relaxed">',
    ...contentLines.map((l) => `          ${l}`),
    '        </div>',
    '',
    '        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">',
    '          Derniere mise a jour : 1er octobre 2026',
    '        </div>',
    '      </article>',
    '    </main>',
    '  );',
    '}',
  ];
}

writeLines('app/[locale]/legal/terms/page.tsx', legalPageContent(
  "Conditions d utilisation",
  [
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">1. Acceptation des conditions</h2>',
    '<p>En accedant a CandidatIA, vous acceptez les presentes conditions d utilisation. Si vous n acceptez pas ces conditions, veuillez ne pas utiliser nos services.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">2. Description du service</h2>',
    '<p>CandidatIA est un service de generation automatique de documents de candidature (CV, lettre de motivation, guide d entretien) a l aide de l intelligence artificielle.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">3. Compte utilisateur</h2>',
    '<p>Vous etes responsable de la confidentialite de vos identifiants et de toutes les activites effectuees sous votre compte.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">4. Paiements</h2>',
    '<p>Les paiements sont traites via FedaPay (Mobile Money), Flutterwave (cartes bancaires) et Raenest (crypto). Les credits achetes ne sont pas remboursables.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">5. Propriete intellectuelle</h2>',
    '<p>Les documents generes vous appartiennent. Le code source et la marque CandidatIA sont proteges.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">6. Limitation de responsabilite</h2>',
    '<p>CandidatIA fournit un service tel quel. Nous ne garantissons pas l obtention d un emploi.</p>',
  ]
));

writeLines('app/[locale]/legal/privacy/page.tsx', legalPageContent(
  "Politique de confidentialite",
  [
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">1. Donnees collectees</h2>',
    '<p>Nous collectons : email, nom, mot de passe (hache), et contenus uploades (CV, offres d emploi).</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">2. Utilisation des donnees</h2>',
    '<p>Vos donnees servent uniquement a : generer vos documents, assurer votre authentification, traiter les paiements, et ameliorer le service.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">3. Partage avec des tiers</h2>',
    '<p>Nous partageons vos donnees avec : Supabase (stockage), Brevo (emails), FedaPay/Flutterwave/Raenest (paiements), et les fournisseurs d IA (Groq, Google).</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">4. Vos droits (RGPD)</h2>',
    '<p>Vous avez le droit d acceder, corriger, exporter ou supprimer vos donnees. Contactez-nous a contact@candidatia.com.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">5. Securite</h2>',
    '<p>Vos mots de passe sont haches (bcrypt). Les communications sont chiffrees (HTTPS/TLS).</p>',
  ]
));

writeLines('app/[locale]/legal/cookies/page.tsx', legalPageContent(
  "Politique de cookies",
  [
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">1. Qu est-ce qu un cookie ?</h2>',
    '<p>Un cookie est un petit fichier texte stocke sur votre appareil pour ameliorer votre experience.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">2. Cookies utilises</h2>',
    '<p><strong>Cookies essentiels</strong> : authentification (JWT), preferences de langue. <strong>Cookies analytiques</strong> : mesure d audience anonyme.</p>',
    '<h2 className="text-xl font-bold text-dark mt-8 mb-4">3. Gerer les cookies</h2>',
    '<p>Vous pouvez desactiver les cookies dans les parametres de votre navigateur. Certains cookies sont necessaires au fonctionnement du service.</p>',
  ]
));

// ============================================================
// 7. VERCEL CONFIG
// ============================================================

logStep('7. vercel.json + DEPLOYMENT.md');

writeLines('vercel.json', [
  '{',
  '  "$schema": "https://openapi.vercel.sh/vercel.json",',
  '  "framework": "nextjs",',
  '  "buildCommand": "npm run build",',
  '  "devCommand": "npm run dev",',
  '  "installCommand": "npm install",',
  '  "regions": ["cdg1"],',
  '  "headers": [',
  '    {',
  '      "source": "/(.*)",',
  '      "headers": [',
  '        { "key": "X-Content-Type-Options", "value": "nosniff" },',
  '        { "key": "X-Frame-Options", "value": "DENY" },',
  '        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }',
  '      ]',
  '    }',
  '  ]',
  '}',
]);

writeLines('DEPLOYMENT.md', [
  '# Deploiement CandidatIA - Frontend',
  '',
  '## Pre-requis',
  '',
  '- Compte Vercel gratuit (https://vercel.com)',
  '- Backend deja deploye (voir backend/DEPLOYMENT.md)',
  '',
  '## Etapes',
  '',
  '### 1. Preparer le projet',
  '',
  '```bash',
  'cd frontend',
  'npm install',
  'npm run build',
  '```',
  '',
  '### 2. Installer Vercel CLI',
  '',
  '```bash',
  'npm install -g vercel',
  '```',
  '',
  '### 3. Se connecter',
  '',
  '```bash',
  'vercel login',
  '```',
  '',
  '### 4. Deployer en preview',
  '',
  '```bash',
  'vercel',
  '```',
  '',
  '### 5. Configurer les variables d environnement',
  '',
  'Dans le dashboard Vercel > Settings > Environment Variables :',
  '',
  '- `NEXT_PUBLIC_API_URL` = URL backend Render (ex: `https://candidatia-backend.onrender.com`)',
  '- `NEXT_PUBLIC_SUPABASE_URL` = URL Supabase',
  '- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = cle anon Supabase',
  '',
  '### 6. Deployer en production',
  '',
  '```bash',
  'vercel --prod',
  '```',
  '',
  '## Domaine personnalise (optionnel)',
  '',
  '1. Vercel > Settings > Domains',
  '2. Ajouter ton domaine',
  '3. Configurer les DNS chez ton registraire',
]);

// ============================================================
// RESUME
// ============================================================

logHeader('Phase 7e terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - frontend/components/ui/Toast.tsx');
console.log('    - frontend/components/ui/Spinner.tsx');
console.log('    - frontend/components/Layout/LandingFooter.tsx');
console.log('    - frontend/app/[locale]/page.tsx (landing enrichie)');
console.log('    - frontend/app/[locale]/not-found.tsx');
console.log('    - frontend/app/[locale]/legal/terms/page.tsx');
console.log('    - frontend/app/[locale]/legal/privacy/page.tsx');
console.log('    - frontend/app/[locale]/legal/cookies/page.tsx');
console.log('    - frontend/vercel.json');
console.log('    - frontend/DEPLOYMENT.md');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Redemarrer le frontend :');
console.log('     cd frontend');
console.log('     npm run dev');
console.log('');
console.log('  2. Ouvrir dans le navigateur :');
console.log('     http://localhost:3000            (landing enrichie)');
console.log('     http://localhost:3000/legal/terms');
console.log('     http://localhost:3000/legal/privacy');
console.log('     http://localhost:3000/legal/cookies');
console.log('     http://localhost:3000/inexistant (page 404)');
console.log('');
console.log('  PHASE 7 COMPLETE !');
console.log('');
console.log('  Prochaine etape : Phase 8 (Deploiement production)');
console.log('');