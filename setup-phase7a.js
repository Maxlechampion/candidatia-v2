#!/usr/bin/env node
/**
 * setup-phase7a.js — CandidatIA
 * Phase 7a : Structure Next.js 14 + Tailwind + i18n
 *
 * Crée dans frontend/ :
 *   - package.json, tsconfig.json, tailwind.config.ts, postcss.config.js
 *   - next.config.js, .env.local.example, .gitignore
 *   - app/layout.tsx, app/[locale]/layout.tsx, app/[locale]/page.tsx
 *   - app/globals.css
 *   - middleware.ts, i18n.ts
 *   - messages/fr.json, messages/en.json
 *   - lib/api.ts, lib/supabase.ts, lib/store.ts
 *
 * Usage : node setup-phase7a.js
 * Prérequis : Node.js 20+, npm installé
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

logHeader('CandidatIA — Setup Phase 7a : Next.js 14 + Tailwind + i18n');

if (!fs.existsSync(path.join(ROOT, 'backend', 'app', 'main.py'))) {
  console.error('');
  console.error('  ERREUR : Le backend est introuvable.');
  console.error('  Execute ce script depuis la racine du projet (candidatia/).');
  console.error('');
  process.exit(1);
}

console.log('  Racine du projet : ' + ROOT);
console.log('  Frontend : ' + FRONTEND);

// ============================================================
// 1. PACKAGE.JSON
// ============================================================

logStep('1. package.json');

writeLines('package.json', [
  '{',
  '  "name": "candidatia-frontend",',
  '  "version": "0.1.0",',
  '  "private": true,',
  '  "scripts": {',
  '    "dev": "next dev",',
  '    "build": "next build",',
  '    "start": "next start",',
  '    "lint": "next lint",',
  '    "type-check": "tsc --noEmit"',
  '  },',
  '  "dependencies": {',
  '    "next": "14.2.15",',
  '    "react": "18.3.1",',
  '    "react-dom": "18.3.1",',
  '    "next-intl": "3.20.0",',
  '    "zustand": "5.0.0",',
  '    "axios": "1.7.7",',
  '    "@supabase/supabase-js": "2.45.4",',
  '    "clsx": "2.1.1",',
  '    "tailwind-merge": "2.5.4",',
  '    "lucide-react": "0.454.0"',
  '  },',
  '  "devDependencies": {',
  '    "typescript": "5.6.3",',
  '    "@types/node": "22.8.1",',
  '    "@types/react": "18.3.12",',
  '    "@types/react-dom": "18.3.1",',
  '    "autoprefixer": "10.4.20",',
  '    "postcss": "8.4.47",',
  '    "tailwindcss": "3.4.14",',
  '    "eslint": "8.57.1",',
  '    "eslint-config-next": "14.2.15"',
  '  }',
  '}',
]);

// ============================================================
// 2. TSCONFIG.JSON
// ============================================================

logStep('2. tsconfig.json');

writeLines('tsconfig.json', [
  '{',
  '  "compilerOptions": {',
  '    "target": "ES2017",',
  '    "lib": ["dom", "dom.iterable", "esnext"],',
  '    "allowJs": true,',
  '    "skipLibCheck": true,',
  '    "strict": true,',
  '    "noEmit": true,',
  '    "esModuleInterop": true,',
  '    "module": "esnext",',
  '    "moduleResolution": "bundler",',
  '    "resolveJsonModule": true,',
  '    "isolatedModules": true,',
  '    "jsx": "preserve",',
  '    "incremental": true,',
  '    "plugins": [{ "name": "next" }],',
  '    "paths": {',
  '      "@/*": ["./*"]',
  '    }',
  '  },',
  '  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],',
  '  "exclude": ["node_modules"]',
  '}',
]);

// ============================================================
// 3. TAILWIND
// ============================================================

logStep('3. tailwind.config.ts + postcss.config.js');

writeLines('tailwind.config.ts', [
  'import type { Config } from "tailwindcss";',
  '',
  'const config: Config = {',
  '  content: [',
  '    "./app/**/*.{js,ts,jsx,tsx,mdx}",',
  '    "./components/**/*.{js,ts,jsx,tsx,mdx}",',
  '  ],',
  '  theme: {',
  '    extend: {',
  '      colors: {',
  '        primary: {',
  '          50: "#eef2ff",',
  '          100: "#e0e7ff",',
  '          500: "#6366f1",',
  '          600: "#4f46e5",',
  '          700: "#4338ca",',
  '          900: "#312e81",',
  '        },',
  '        dark: "#1e1b4b",',
  '      },',
  '      fontFamily: {',
  '        sans: ["var(--font-inter)", "system-ui", "sans-serif"],',
  '      },',
  '    },',
  '  },',
  '  plugins: [],',
  '};',
  '',
  'export default config;',
]);

writeLines('postcss.config.js', [
  'module.exports = {',
  '  plugins: {',
  '    tailwindcss: {},',
  '    autoprefixer: {},',
  '  },',
  '};',
]);

// ============================================================
// 4. NEXT CONFIG + ENV
// ============================================================

logStep('4. next.config.js + .env.local.example');

writeLines('next.config.js', [
  'const createNextIntlPlugin = require("next-intl/plugin");',
  '',
  'const withNextIntl = createNextIntlPlugin("./i18n.ts");',
  '',
  '/** @type {import("next").NextConfig} */',
  'const nextConfig = {',
  '  reactStrictMode: true,',
  '  images: {',
  '    remotePatterns: [',
  '      { protocol: "https", hostname: "**" },',
  '    ],',
  '  },',
  '};',
  '',
  'module.exports = withNextIntl(nextConfig);',
]);

writeLines('.env.local.example', [
  '# URL du backend FastAPI',
  'NEXT_PUBLIC_API_URL=http://localhost:8000',
  '',
  '# Supabase (optionnel)',
  'NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...',
]);

// ============================================================
// 5. GITIGNORE
// ============================================================

logStep('5. .gitignore');

writeLines('.gitignore', [
  'node_modules/',
  '.next/',
  'out/',
  'build/',
  'dist/',
  '',
  '.env',
  '.env.local',
  '.env*.local',
  '!.env.local.example',
  '',
  '.DS_Store',
  '*.pem',
  'npm-debug.log*',
  'yarn-error.log*',
  '.vercel',
  '.turbo',
  '*.tsbuildinfo',
  'next-env.d.ts',
]);

// ============================================================
// 6. I18N
// ============================================================

logStep('6. i18n.ts + middleware.ts');

writeLines('i18n.ts', [
  'import { getRequestConfig } from "next-intl/server";',
  '',
  'export default getRequestConfig(async ({ locale }) => ({',
  '  messages: (await import(`./messages/${locale}.json`)).default,',
  '}));',
]);

writeLines('middleware.ts', [
  'import createMiddleware from "next-intl/middleware";',
  '',
  'export default createMiddleware({',
  '  locales: ["fr", "en"],',
  '  defaultLocale: "fr",',
  '  localePrefix: "as-needed",',
  '});',
  '',
  'export const config = {',
  '  matcher: ["/((?!api|_next|_vercel|.*\\\\..*).*)"],',
  '};',
]);

// ============================================================
// 7. MESSAGES
// ============================================================

logStep('7. messages/fr.json + en.json');

writeLines('messages/fr.json', [
  '{',
  '  "common": {',
  '    "app_name": "CandidatIA",',
  '    "loading": "Chargement...",',
  '    "error": "Une erreur est survenue",',
  '    "success": "Succes",',
  '    "cancel": "Annuler",',
  '    "confirm": "Confirmer",',
  '    "save": "Enregistrer",',
  '    "delete": "Supprimer"',
  '  },',
  '  "landing": {',
  '    "hero_title": "Generez votre pack de candidature en 1 clic",',
  '    "hero_subtitle": "CV optimise, lettre de motivation et guide d entretien, tous generes par IA en quelques secondes.",',
  '    "cta_primary": "Commencer gratuitement",',
  '    "cta_secondary": "Voir une demo",',
  '    "features_title": "Tout ce dont vous avez besoin pour reussir",',
  '    "feature_cv_title": "CV methode STAR",',
  '    "feature_cv_desc": "Un CV structure avec la methode STAR pour valoriser vos realisations chiffrees.",',
  '    "feature_lettre_title": "Lettre de motivation",',
  '    "feature_lettre_desc": "Une lettre personnalisee et adaptee a la culture de chaque entreprise.",',
  '    "feature_guide_title": "Guide d entretien",',
  '    "feature_guide_desc": "Preparez vos entretiens avec des questions probables et des strategies de reponse."',
  '  },',
  '  "auth": {',
  '    "login": "Connexion",',
  '    "register": "Inscription",',
  '    "logout": "Deconnexion",',
  '    "email": "Email",',
  '    "password": "Mot de passe",',
  '    "full_name": "Nom complet",',
  '    "login_cta": "Se connecter",',
  '    "register_cta": "Creer un compte"',
  '  },',
  '  "dashboard": {',
  '    "title": "Tableau de bord",',
  '    "generate": "Generer un pack",',
  '    "history": "Historique",',
  '    "relances": "Relances",',
  '    "billing": "Paiement",',
  '    "credits": "Credits restants"',
  '  }',
  '}',
]);

writeLines('messages/en.json', [
  '{',
  '  "common": {',
  '    "app_name": "CandidatIA",',
  '    "loading": "Loading...",',
  '    "error": "An error occurred",',
  '    "success": "Success",',
  '    "cancel": "Cancel",',
  '    "confirm": "Confirm",',
  '    "save": "Save",',
  '    "delete": "Delete"',
  '  },',
  '  "landing": {',
  '    "hero_title": "Generate your complete application pack in one click",',
  '    "hero_subtitle": "Optimized resume, cover letter, and interview guide, all AI-generated in seconds.",',
  '    "cta_primary": "Start for free",',
  '    "cta_secondary": "See a demo",',
  '    "features_title": "Everything you need to succeed",',
  '    "feature_cv_title": "STAR method resume",',
  '    "feature_cv_desc": "A structured resume using the STAR method to highlight your quantified achievements.",',
  '    "feature_lettre_title": "Cover letter",',
  '    "feature_lettre_desc": "A personalized letter tailored to each company culture.",',
  '    "feature_guide_title": "Interview guide",',
  '    "feature_guide_desc": "Prepare your interviews with likely questions and answer strategies."',
  '  },',
  '  "auth": {',
  '    "login": "Login",',
  '    "register": "Sign up",',
  '    "logout": "Logout",',
  '    "email": "Email",',
  '    "password": "Password",',
  '    "full_name": "Full name",',
  '    "login_cta": "Sign in",',
  '    "register_cta": "Create account"',
  '  },',
  '  "dashboard": {',
  '    "title": "Dashboard",',
  '    "generate": "Generate a pack",',
  '    "history": "History",',
  '    "relances": "Follow-ups",',
  '    "billing": "Billing",',
  '    "credits": "Remaining credits"',
  '  }',
  '}',
]);

// ============================================================
// 8. GLOBALS CSS
// ============================================================

logStep('8. app/globals.css');

writeLines('app/globals.css', [
  '@tailwind base;',
  '@tailwind components;',
  '@tailwind utilities;',
  '',
  ':root {',
  '  --font-inter: system-ui, -apple-system, sans-serif;',
  '}',
  '',
  'html,',
  'body {',
  '  max-width: 100vw;',
  '  overflow-x: hidden;',
  '  background-color: #f8fafc;',
  '  color: #334155;',
  '}',
  '',
  '* {',
  '  box-sizing: border-box;',
  '}',
  '',
  'a {',
  '  color: inherit;',
  '  text-decoration: none;',
  '}',
  '',
  '.container-main {',
  '  max-width: 1200px;',
  '  margin: 0 auto;',
  '  padding: 0 1rem;',
  '}',
]);

// ============================================================
// 9. LAYOUT RACINE
// ============================================================

logStep('9. app/layout.tsx (racine)');

writeLines('app/layout.tsx', [
  'import type { Metadata } from "next";',
  'import { Inter } from "next/font/google";',
  'import "./globals.css";',
  '',
  'const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });',
  '',
  'export const metadata: Metadata = {',
  '  title: "CandidatIA - Generez votre pack de candidature en 1 clic",',
  '  description: "CV optimise, lettre de motivation et guide d entretien generes par IA.",',
  '};',
  '',
  'export default function RootLayout({',
  '  children,',
  '}: {',
  '  children: React.ReactNode;',
  '}) {',
  '  return children;',
  '}',
]);

// ============================================================
// 10. LAYOUT [locale]
// ============================================================

logStep('10. app/[locale]/layout.tsx');

writeLines('app/[locale]/layout.tsx', [
  'import { NextIntlClientProvider } from "next-intl";',
  'import { getMessages } from "next-intl/server";',
  'import { notFound } from "next/navigation";',
  '',
  'const locales = ["fr", "en"];',
  '',
  'export function generateStaticParams() {',
  '  return locales.map((locale) => ({ locale }));',
  '}',
  '',
  'export default async function LocaleLayout({',
  '  children,',
  '  params: { locale },',
  '}: {',
  '  children: React.ReactNode;',
  '  params: { locale: string };',
  '}) {',
  '  if (!locales.includes(locale as any)) {',
  '    notFound();',
  '  }',
  '',
  '  const messages = await getMessages();',
  '',
  '  return (',
  '    <html lang={locale}>',
  '      <body>',
  '        <NextIntlClientProvider messages={messages}>',
  '          {children}',
  '        </NextIntlClientProvider>',
  '      </body>',
  '    </html>',
  '  );',
  '}',
]);

// ============================================================
// 11. PAGE ACCUEIL
// ============================================================

logStep('11. app/[locale]/page.tsx (landing)');

writeLines('app/[locale]/page.tsx', [
  'import { useTranslations } from "next-intl";',
  'import Link from "next/link";',
  '',
  'export default function HomePage() {',
  '  const t = useTranslations("landing");',
  '',
  '  return (',
  '    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">',
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
  '      <section className="container-main py-20 text-center">',
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
  '            href="/demo"',
  '            className="px-6 py-3 text-base font-semibold text-primary-600 bg-white border-2 border-primary-100 rounded-lg hover:border-primary-300 transition"',
  '          >',
  '            {t("cta_secondary")}',
  '          </Link>',
  '        </div>',
  '      </section>',
  '',
  '      <section className="container-main py-16">',
  '        <h2 className="text-3xl font-bold text-dark text-center mb-12">',
  '          {t("features_title")}',
  '        </h2>',
  '        <div className="grid md:grid-cols-3 gap-6">',
  '          {[',
  '            { title: t("feature_cv_title"), desc: t("feature_cv_desc") },',
  '            { title: t("feature_lettre_title"), desc: t("feature_lettre_desc") },',
  '            { title: t("feature_guide_title"), desc: t("feature_guide_desc") },',
  '          ].map((feature, i) => (',
  '            <div',
  '              key={i}',
  '              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition"',
  '            >',
  '              <h3 className="text-lg font-bold text-dark mb-3">{feature.title}</h3>',
  '              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>',
  '            </div>',
  '          ))}',
  '        </div>',
  '      </section>',
  '',
  '      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">',
  '        <p>&copy; 2026 CandidatIA. Tous droits reserves.</p>',
  '      </footer>',
  '    </main>',
  '  );',
  '}',
]);

// ============================================================
// 12. LIB API
// ============================================================

logStep('12. lib/api.ts (client HTTP)');

writeLines('lib/api.ts', [
  'import axios from "axios";',
  '',
  'const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";',
  '',
  'export const api = axios.create({',
  '  baseURL: API_URL,',
  '  timeout: 120000,',
  '  headers: {',
  '    "Content-Type": "application/json",',
  '  },',
  '});',
  '',
  'api.interceptors.request.use((config) => {',
  '  if (typeof window !== "undefined") {',
  '    const token = localStorage.getItem("candidatia_token");',
  '    if (token) {',
  '      config.headers.Authorization = `Bearer ${token}`;',
  '    }',
  '  }',
  '  return config;',
  '});',
  '',
  'api.interceptors.response.use(',
  '  (response) => response,',
  '  (error) => {',
  '    if (error.response?.status === 401 && typeof window !== "undefined") {',
  '      localStorage.removeItem("candidatia_token");',
  '      if (!window.location.pathname.includes("/login")) {',
  '        window.location.href = "/login";',
  '      }',
  '    }',
  '    return Promise.reject(error);',
  '  }',
  ');',
  '',
  'export interface User {',
  '  id: string;',
  '  email: string;',
  '  full_name?: string;',
  '  credits: number;',
  '  plan: string;',
  '  preferred_locale: string;',
  '}',
  '',
  'export interface AuthResponse {',
  '  access_token: string;',
  '  token_type: string;',
  '  user: User;',
  '}',
  '',
  'export interface Plan {',
  '  code: string;',
  '  name: string;',
  '  price_eur: number;',
  '  price_xof: number;',
  '  credits: number;',
  '  features: string[];',
  '}',
]);

// ============================================================
// 13. LIB SUPABASE
// ============================================================

logStep('13. lib/supabase.ts');

writeLines('lib/supabase.ts', [
  'import { createClient } from "@supabase/supabase-js";',
  '',
  'const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";',
  'const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";',
  '',
  'export const supabase = supabaseUrl && supabaseAnonKey',
  '  ? createClient(supabaseUrl, supabaseAnonKey)',
  '  : null;',
]);

// ============================================================
// 14. LIB STORE
// ============================================================

logStep('14. lib/store.ts (Zustand)');

writeLines('lib/store.ts', [
  'import { create } from "zustand";',
  'import type { User } from "./api";',
  '',
  'interface AuthState {',
  '  user: User | null;',
  '  token: string | null;',
  '  isAuthenticated: boolean;',
  '  setAuth: (user: User, token: string) => void;',
  '  clearAuth: () => void;',
  '  hydrate: () => void;',
  '}',
  '',
  'export const useAuthStore = create<AuthState>((set) => ({',
  '  user: null,',
  '  token: null,',
  '  isAuthenticated: false,',
  '',
  '  setAuth: (user, token) => {',
  '    if (typeof window !== "undefined") {',
  '      localStorage.setItem("candidatia_token", token);',
  '      localStorage.setItem("candidatia_user", JSON.stringify(user));',
  '    }',
  '    set({ user, token, isAuthenticated: true });',
  '  },',
  '',
  '  clearAuth: () => {',
  '    if (typeof window !== "undefined") {',
  '      localStorage.removeItem("candidatia_token");',
  '      localStorage.removeItem("candidatia_user");',
  '    }',
  '    set({ user: null, token: null, isAuthenticated: false });',
  '  },',
  '',
  '  hydrate: () => {',
  '    if (typeof window === "undefined") return;',
  '    const token = localStorage.getItem("candidatia_token");',
  '    const userStr = localStorage.getItem("candidatia_user");',
  '    if (token && userStr) {',
  '      try {',
  '        const user = JSON.parse(userStr) as User;',
  '        set({ user, token, isAuthenticated: true });',
  '      } catch {',
  '        // ignore',
  '      }',
  '    }',
  '  },',
  '}));',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 7a terminee avec succes');

console.log('  Structure frontend creee dans : ' + FRONTEND);
console.log('');
console.log('  PROCHAINES ETAPES :');
console.log('');
console.log('  1. Aller dans le dossier frontend :');
console.log('     cd frontend');
console.log('');
console.log('  2. Installer les dependances (2-3 minutes) :');
console.log('     npm install');
console.log('');
console.log('  3. Copier le fichier env :');
console.log('     copy .env.local.example .env.local');
console.log('');
console.log('  4. Lancer le serveur de dev :');
console.log('     npm run dev');
console.log('');
console.log('  5. Ouvrir dans le navigateur :');
console.log('     http://localhost:3000');
console.log('');
console.log('  Tu verras la landing page CandidatIA !');
console.log('');
console.log('  Prochaine etape : setup-phase7b.js (Auth pages)');
console.log('');