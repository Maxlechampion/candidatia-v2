#!/usr/bin/env node
/**
 * setup-phase7c.js — CandidatIA
 * Phase 7c : Dashboard + Générateur + Historique
 *
 * Crée dans frontend/ :
 *   - components/Layout/DashboardLayout.tsx
 *   - components/Layout/Sidebar.tsx
 *   - components/Layout/Header.tsx
 *   - components/Layout/ProtectedRoute.tsx
 *   - app/[locale]/dashboard/layout.tsx
 *   - app/[locale]/dashboard/page.tsx
 *   - app/[locale]/dashboard/generate/page.tsx
 *   - app/[locale]/dashboard/history/page.tsx
 *
 * Usage : node setup-phase7c.js
 * Prérequis : avoir exécuté setup-phase7b.js
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

logHeader('CandidatIA — Setup Phase 7c : Dashboard + Generateur');

if (!fs.existsSync(path.join(FRONTEND, 'app', '[locale]', 'login', 'page.tsx'))) {
  console.error('');
  console.error('  ERREUR : Les pages Auth sont introuvables.');
  console.error('  Execute d abord setup-phase7b.js.');
  console.error('');
  process.exit(1);
}

console.log('  Frontend : ' + FRONTEND);

// ============================================================
// 1. PROTECTED ROUTE
// ============================================================

logStep('1. components/Layout/ProtectedRoute.tsx');

writeLines('components/Layout/ProtectedRoute.tsx', [
  '"use client";',
  '',
  'import { useEffect } from "react";',
  'import { useRouter } from "next/navigation";',
  'import { useAuthStore } from "@/lib/store";',
  '',
  'export function ProtectedRoute({ children }: { children: React.ReactNode }) {',
  '  const router = useRouter();',
  '  const { isAuthenticated, hydrate } = useAuthStore();',
  '',
  '  useEffect(() => {',
  '    hydrate();',
  '  }, [hydrate]);',
  '',
  '  useEffect(() => {',
  '    const token = typeof window !== "undefined"',
  '      ? localStorage.getItem("candidatia_token")',
  '      : null;',
  '',
  '    if (!token) {',
  '      router.replace("/login");',
  '    }',
  '  }, [router, isAuthenticated]);',
  '',
  '  return <>{children}</>;',
  '}',
]);

// ============================================================
// 2. SIDEBAR
// ============================================================

logStep('2. components/Layout/Sidebar.tsx');

writeLines('components/Layout/Sidebar.tsx', [
  '"use client";',
  '',
  'import Link from "next/link";',
  'import { usePathname } from "next/navigation";',
  'import { cn } from "@/lib/utils";',
  '',
  'const navItems = [',
  '  { href: "/dashboard", label: "Tableau de bord", icon: "grid" },',
  '  { href: "/dashboard/generate", label: "Generer un pack", icon: "plus" },',
  '  { href: "/dashboard/history", label: "Historique", icon: "clock" },',
  '  { href: "/dashboard/relances", label: "Relances", icon: "bell" },',
  '  { href: "/dashboard/billing", label: "Paiement", icon: "credit-card" },',
  '];',
  '',
  'function Icon({ name }: { name: string }) {',
  '  const icons: Record<string, JSX.Element> = {',
  '    grid: (',
  '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '        <rect x="3" y="3" width="7" height="7" />',
  '        <rect x="14" y="3" width="7" height="7" />',
  '        <rect x="14" y="14" width="7" height="7" />',
  '        <rect x="3" y="14" width="7" height="7" />',
  '      </svg>',
  '    ),',
  '    plus: (',
  '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '        <line x1="12" y1="5" x2="12" y2="19" />',
  '        <line x1="5" y1="12" x2="19" y2="12" />',
  '      </svg>',
  '    ),',
  '    clock: (',
  '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '        <circle cx="12" cy="12" r="10" />',
  '        <polyline points="12 6 12 12 16 14" />',
  '      </svg>',
  '    ),',
  '    bell: (',
  '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />',
  '        <path d="M13.73 21a2 2 0 0 1-3.46 0" />',
  '      </svg>',
  '    ),',
  '    "credit-card": (',
  '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />',
  '        <line x1="1" y1="10" x2="23" y2="10" />',
  '      </svg>',
  '    ),',
  '  };',
  '  return icons[name] || null;',
  '}',
  '',
  'export function Sidebar() {',
  '  const pathname = usePathname();',
  '',
  '  return (',
  '    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">',
  '      <div className="p-5 border-b border-slate-200">',
  '        <Link href="/dashboard" className="text-lg font-bold text-dark">',
  '          Candidat<span className="text-primary-500">IA</span>',
  '        </Link>',
  '      </div>',
  '',
  '      <nav className="flex-1 p-3 space-y-1">',
  '        {navItems.map((item) => {',
  '          const isActive = pathname === item.href;',
  '          return (',
  '            <Link',
  '              key={item.href}',
  '              href={item.href}',
  '              className={cn(',
  '                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",',
  '                isActive',
  '                  ? "bg-primary-50 text-primary-700"',
  '                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"',
  '              )}',
  '            >',
  '              <Icon name={item.icon} />',
  '              <span>{item.label}</span>',
  '            </Link>',
  '          );',
  '        })}',
  '      </nav>',
  '',
  '      <div className="p-4 border-t border-slate-200 text-xs text-slate-400">',
  '        v0.1.0 - CandidatIA',
  '      </div>',
  '    </aside>',
  '  );',
  '}',
]);

// ============================================================
// 3. HEADER (Dashboard)
// ============================================================

logStep('3. components/Layout/Header.tsx');

writeLines('components/Layout/Header.tsx', [
  '"use client";',
  '',
  'import { useEffect, useState } from "react";',
  'import { useRouter } from "next/navigation";',
  'import { useAuthStore } from "@/lib/store";',
  'import { Button } from "@/components/ui/Button";',
  '',
  'export function Header() {',
  '  const router = useRouter();',
  '  const { user, clearAuth, hydrate } = useAuthStore();',
  '  const [mounted, setMounted] = useState(false);',
  '',
  '  useEffect(() => {',
  '    hydrate();',
  '    setMounted(true);',
  '  }, [hydrate]);',
  '',
  '  function handleLogout() {',
  '    clearAuth();',
  '    router.push("/login");',
  '  }',
  '',
  '  return (',
  '    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">',
  '      <div className="flex-1" />',
  '',
  '      <div className="flex items-center gap-4">',
  '        {mounted && user && (',
  '          <>',
  '            <div className="text-right text-sm">',
  '              <p className="font-medium text-slate-700">',
  '                {user.full_name || user.email}',
  '              </p>',
  '              <p className="text-xs text-slate-500">',
  '                {user.credits} credits - Plan {user.plan}',
  '              </p>',
  '            </div>',
  '            <Button variant="ghost" size="sm" onClick={handleLogout}>',
  '              Deconnexion',
  '            </Button>',
  '          </>',
  '        )}',
  '      </div>',
  '    </header>',
  '  );',
  '}',
]);

// ============================================================
// 4. DASHBOARD LAYOUT
// ============================================================

logStep('4. app/[locale]/dashboard/layout.tsx');

writeLines('app/[locale]/dashboard/layout.tsx', [
  'import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";',
  'import { Sidebar } from "@/components/Layout/Sidebar";',
  'import { Header } from "@/components/Layout/Header";',
  '',
  'export default function DashboardLayout({',
  '  children,',
  '}: {',
  '  children: React.ReactNode;',
  '}) {',
  '  return (',
  '    <ProtectedRoute>',
  '      <div className="min-h-screen flex bg-slate-50">',
  '        <Sidebar />',
  '        <div className="flex-1 flex flex-col">',
  '          <Header />',
  '          <main className="flex-1 p-6 overflow-y-auto">{children}</main>',
  '        </div>',
  '      </div>',
  '    </ProtectedRoute>',
  '  );',
  '}',
]);

// ============================================================
// 5. DASHBOARD HOME
// ============================================================

logStep('5. app/[locale]/dashboard/page.tsx');

writeLines('app/[locale]/dashboard/page.tsx', [
  '"use client";',
  '',
  'import { useEffect, useState } from "react";',
  'import Link from "next/link";',
  'import { api } from "@/lib/api";',
  'import { useAuthStore } from "@/lib/store";',
  'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";',
  'import { Button } from "@/components/ui/Button";',
  '',
  'interface Stats {',
  '  total_generations: number;',
  '  average_score: number;',
  '  credits_remaining: number;',
  '  plan: string;',
  '}',
  '',
  'export default function DashboardHome() {',
  '  const { user } = useAuthStore();',
  '  const [stats, setStats] = useState<Stats | null>(null);',
  '  const [loading, setLoading] = useState(true);',
  '',
  '  useEffect(() => {',
  '    async function load() {',
  '      try {',
  '        const { data } = await api.get<Stats>("/api/generations/stats");',
  '        setStats(data);',
  '      } catch (err) {',
  '        console.error(err);',
  '      } finally {',
  '        setLoading(false);',
  '      }',
  '    }',
  '    load();',
  '  }, []);',
  '',
  '  return (',
  '    <div className="max-w-6xl mx-auto space-y-6">',
  '      <div>',
  '        <h1 className="text-3xl font-bold text-dark mb-2">',
  '          Bonjour {user?.full_name || "!"}',
  '        </h1>',
  '        <p className="text-slate-600">',
  '          Pret a generer votre prochain pack de candidature ?',
  '        </p>',
  '      </div>',
  '',
  '      <div className="grid md:grid-cols-3 gap-6">',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle className="text-sm font-medium text-slate-500">',
  '              Packs generes',
  '            </CardTitle>',
  '          </CardHeader>',
  '          <CardContent>',
  '            <p className="text-3xl font-bold text-dark">',
  '              {loading ? "..." : stats?.total_generations ?? 0}',
  '            </p>',
  '          </CardContent>',
  '        </Card>',
  '',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle className="text-sm font-medium text-slate-500">',
  '              Score moyen',
  '            </CardTitle>',
  '          </CardHeader>',
  '          <CardContent>',
  '            <p className="text-3xl font-bold text-dark">',
  '              {loading ? "..." : stats?.average_score ?? 0}',
  '              <span className="text-base text-slate-400 font-normal">/100</span>',
  '            </p>',
  '          </CardContent>',
  '        </Card>',
  '',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle className="text-sm font-medium text-slate-500">',
  '              Credits restants',
  '            </CardTitle>',
  '          </CardHeader>',
  '          <CardContent>',
  '            <p className="text-3xl font-bold text-dark">',
  '              {loading ? "..." : stats?.credits_remaining ?? 0}',
  '            </p>',
  '            <p className="text-xs text-slate-500 mt-1">',
  '              Plan {stats?.plan ?? "free"}',
  '            </p>',
  '          </CardContent>',
  '        </Card>',
  '      </div>',
  '',
  '      <Card>',
  '        <CardHeader>',
  '          <CardTitle>Actions rapides</CardTitle>',
  '        </CardHeader>',
  '        <CardContent className="flex gap-3">',
  '          <Link href="/dashboard/generate">',
  '            <Button>Generer un nouveau pack</Button>',
  '          </Link>',
  '          <Link href="/dashboard/history">',
  '            <Button variant="outline">Voir l\'historique</Button>',
  '          </Link>',
  '        </CardContent>',
  '      </Card>',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 6. GENERATE PAGE
// ============================================================

logStep('6. app/[locale]/dashboard/generate/page.tsx');

writeLines('app/[locale]/dashboard/generate/page.tsx', [
  '"use client";',
  '',
  'import { useState, ChangeEvent, FormEvent } from "react";',
  'import { useRouter } from "next/navigation";',
  'import { api } from "@/lib/api";',
  'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";',
  'import { Button } from "@/components/ui/Button";',
  'import { Input } from "@/components/ui/Input";',
  'import { Alert } from "@/components/ui/Alert";',
  '',
  'const LANGUAGES = [',
  '  { code: "fr", label: "Francais" },',
  '  { code: "en", label: "English" },',
  '  { code: "es", label: "Espanol" },',
  '  { code: "de", label: "Deutsch" },',
  '  { code: "pt", label: "Portugues" },',
  '  { code: "ar", label: "Arabic" },',
  '];',
  '',
  'export default function GeneratePage() {',
  '  const router = useRouter();',
  '',
  '  const [profilTexte, setProfilTexte] = useState("");',
  '  const [offreTexte, setOffreTexte] = useState("");',
  '  const [profilFile, setProfilFile] = useState<File | null>(null);',
  '  const [offreFile, setOffreFile] = useState<File | null>(null);',
  '  const [language, setLanguage] = useState("fr");',
  '  const [loading, setLoading] = useState(false);',
  '  const [error, setError] = useState("");',
  '',
  '  function handleProfilFile(e: ChangeEvent<HTMLInputElement>) {',
  '    if (e.target.files?.[0]) setProfilFile(e.target.files[0]);',
  '  }',
  '',
  '  function handleOffreFile(e: ChangeEvent<HTMLInputElement>) {',
  '    if (e.target.files?.[0]) setOffreFile(e.target.files[0]);',
  '  }',
  '',
  '  async function handleSubmit(e: FormEvent) {',
  '    e.preventDefault();',
  '    setError("");',
  '',
  '    if (!profilFile && !profilTexte) {',
  '      setError("Fournissez votre profil (fichier ou texte).");',
  '      return;',
  '    }',
  '    if (!offreFile && !offreTexte) {',
  '      setError("Fournissez l\'offre d\'emploi (fichier ou texte).");',
  '      return;',
  '    }',
  '',
  '    setLoading(true);',
  '',
  '    try {',
  '      const formData = new FormData();',
  '',
  '      if (profilFile) formData.append("fichier_profil", profilFile);',
  '      if (profilTexte) formData.append("texte_profil", profilTexte);',
  '      if (offreFile) formData.append("fichier_offre", offreFile);',
  '      if (offreTexte) formData.append("texte_offre", offreTexte);',
  '',
  '      formData.append("output_language", language);',
  '      formData.append("inclure_relance", "false");',
  '',
  '      const response = await api.post("/api/generate", formData, {',
  '        headers: { "Content-Type": "multipart/form-data" },',
  '        responseType: "blob",',
  '      });',
  '',
  '      // Telecharger le ZIP',
  '      const blob = new Blob([response.data], { type: "application/zip" });',
  '      const url = window.URL.createObjectURL(blob);',
  '      const a = document.createElement("a");',
  '      a.href = url;',
  '      a.download = "Pack_Candidature_IA.zip";',
  '      document.body.appendChild(a);',
  '      a.click();',
  '      a.remove();',
  '      window.URL.revokeObjectURL(url);',
  '',
  '      router.push("/dashboard/history");',
  '    } catch (err: any) {',
  '      const message =',
  '        err.response?.data?.detail ||',
  '        "Erreur lors de la generation.";',
  '      setError(message);',
  '    } finally {',
  '      setLoading(false);',
  '    }',
  '  }',
  '',
  '  return (',
  '    <div className="max-w-4xl mx-auto space-y-6">',
  '      <div>',
  '        <h1 className="text-3xl font-bold text-dark mb-2">Generer un pack</h1>',
  '        <p className="text-slate-600">',
  '          Uploadez votre profil et l\'offre d\'emploi pour generer un pack complet.',
  '        </p>',
  '      </div>',
  '',
  '      <form onSubmit={handleSubmit} className="space-y-6">',
  '        {error && <Alert variant="error">{error}</Alert>}',
  '',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle>1. Votre profil</CardTitle>',
  '          </CardHeader>',
  '          <CardContent className="space-y-4">',
  '            <div>',
  '              <label className="block text-sm font-medium text-slate-700 mb-2">',
  '                Fichier (PDF, DOCX, TXT)',
  '              </label>',
  '              <input',
  '                type="file"',
  '                accept=".pdf,.docx,.txt,.md"',
  '                onChange={handleProfilFile}',
  '                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"',
  '              />',
  '              {profilFile && (',
  '                <p className="mt-2 text-xs text-emerald-600">',
  '                  Fichier selectionne : {profilFile.name}',
  '                </p>',
  '              )}',
  '            </div>',
  '',
  '            <div className="text-center text-sm text-slate-400">OU</div>',
  '',
  '            <div>',
  '              <label className="block text-sm font-medium text-slate-700 mb-2">',
  '                Texte brut',
  '              </label>',
  '              <textarea',
  '                value={profilTexte}',
  '                onChange={(e) => setProfilTexte(e.target.value)}',
  '                placeholder="Collez ici votre CV ou profil..."',
  '                rows={6}',
  '                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"',
  '              />',
  '            </div>',
  '          </CardContent>',
  '        </Card>',
  '',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle>2. L\'offre d\'emploi</CardTitle>',
  '          </CardHeader>',
  '          <CardContent className="space-y-4">',
  '            <div>',
  '              <label className="block text-sm font-medium text-slate-700 mb-2">',
  '                Fichier (PDF, DOCX, TXT)',
  '              </label>',
  '              <input',
  '                type="file"',
  '                accept=".pdf,.docx,.txt,.md"',
  '                onChange={handleOffreFile}',
  '                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"',
  '              />',
  '              {offreFile && (',
  '                <p className="mt-2 text-xs text-emerald-600">',
  '                  Fichier selectionne : {offreFile.name}',
  '                </p>',
  '              )}',
  '            </div>',
  '',
  '            <div className="text-center text-sm text-slate-400">OU</div>',
  '',
  '            <div>',
  '              <label className="block text-sm font-medium text-slate-700 mb-2">',
  '                Texte brut',
  '              </label>',
  '              <textarea',
  '                value={offreTexte}',
  '                onChange={(e) => setOffreTexte(e.target.value)}',
  '                placeholder="Collez ici l\'offre d\'emploi..."',
  '                rows={6}',
  '                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"',
  '              />',
  '            </div>',
  '          </CardContent>',
  '        </Card>',
  '',
  '        <Card>',
  '          <CardHeader>',
  '            <CardTitle>3. Langue de generation</CardTitle>',
  '          </CardHeader>',
  '          <CardContent>',
  '            <select',
  '              value={language}',
  '              onChange={(e) => setLanguage(e.target.value)}',
  '              className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"',
  '            >',
  '              {LANGUAGES.map((l) => (',
  '                <option key={l.code} value={l.code}>',
  '                  {l.label}',
  '                </option>',
  '              ))}',
  '            </select>',
  '          </CardContent>',
  '        </Card>',
  '',
  '        <div className="flex justify-end">',
  '          <Button type="submit" loading={loading} size="lg">',
  '            {loading ? "Generation en cours..." : "Generer mon pack"}',
  '          </Button>',
  '        </div>',
  '',
  '        {loading && (',
  '          <Alert variant="info">',
  '            Generation IA en cours... Cela peut prendre 30 a 60 secondes.',
  '          </Alert>',
  '        )}',
  '      </form>',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// 7. HISTORY PAGE
// ============================================================

logStep('7. app/[locale]/dashboard/history/page.tsx');

writeLines('app/[locale]/dashboard/history/page.tsx', [
  '"use client";',
  '',
  'import { useEffect, useState } from "react";',
  'import { api } from "@/lib/api";',
  'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";',
  'import { Alert } from "@/components/ui/Alert";',
  '',
  'interface Generation {',
  '  id: string;',
  '  output_language: string;',
  '  score_matching: number | null;',
  '  status: string;',
  '  created_at: string;',
  '}',
  '',
  'export default function HistoryPage() {',
  '  const [generations, setGenerations] = useState<Generation[]>([]);',
  '  const [loading, setLoading] = useState(true);',
  '  const [error, setError] = useState("");',
  '',
  '  useEffect(() => {',
  '    async function load() {',
  '      try {',
  '        const { data } = await api.get<Generation[]>("/api/generations");',
  '        setGenerations(data);',
  '      } catch (err: any) {',
  '        setError(err.response?.data?.detail || "Erreur de chargement.");',
  '      } finally {',
  '        setLoading(false);',
  '      }',
  '    }',
  '    load();',
  '  }, []);',
  '',
  '  return (',
  '    <div className="max-w-6xl mx-auto space-y-6">',
  '      <div>',
  '        <h1 className="text-3xl font-bold text-dark mb-2">Historique</h1>',
  '        <p className="text-slate-600">Tous vos packs de candidature generes.</p>',
  '      </div>',
  '',
  '      {error && <Alert variant="error">{error}</Alert>}',
  '',
  '      <Card>',
  '        <CardHeader>',
  '          <CardTitle>{generations.length} pack(s) genere(s)</CardTitle>',
  '        </CardHeader>',
  '        <CardContent>',
  '          {loading ? (',
  '            <p className="text-slate-500 text-sm">Chargement...</p>',
  '          ) : generations.length === 0 ? (',
  '            <div className="text-center py-8 text-slate-500">',
  '              <p className="mb-2">Aucun pack genere pour le moment.</p>',
  '              <p className="text-sm">',
  '                Rendez-vous dans "Generer un pack" pour commencer.',
  '              </p>',
  '            </div>',
  '          ) : (',
  '            <div className="space-y-3">',
  '              {generations.map((gen) => (',
  '                <div',
  '                  key={gen.id}',
  '                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"',
  '                >',
  '                  <div>',
  '                    <p className="font-medium text-slate-700">',
  '                      Pack en {gen.output_language.toUpperCase()}',
  '                    </p>',
  '                    <p className="text-xs text-slate-500">',
  '                      {new Date(gen.created_at).toLocaleString("fr-FR")}',
  '                    </p>',
  '                  </div>',
  '                  <div className="text-right">',
  '                    {gen.score_matching && (',
  '                      <p className="text-sm font-bold text-primary-600">',
  '                        Score : {gen.score_matching}/100',
  '                      </p>',
  '                    )}',
  '                    <p className="text-xs text-slate-500">{gen.status}</p>',
  '                  </div>',
  '                </div>',
  '              ))}',
  '            </div>',
  '          )}',
  '        </CardContent>',
  '      </Card>',
  '    </div>',
  '  );',
  '}',
]);

// ============================================================
// RÉSUMÉ
// ============================================================

logHeader('Phase 7c terminee avec succes');

console.log('  Fichiers crees :');
console.log('    - frontend/components/Layout/ProtectedRoute.tsx');
console.log('    - frontend/components/Layout/Sidebar.tsx');
console.log('    - frontend/components/Layout/Header.tsx');
console.log('    - frontend/app/[locale]/dashboard/layout.tsx');
console.log('    - frontend/app/[locale]/dashboard/page.tsx');
console.log('    - frontend/app/[locale]/dashboard/generate/page.tsx');
console.log('    - frontend/app/[locale]/dashboard/history/page.tsx');
console.log('');
console.log('  VERIFICATION :');
console.log('');
console.log('  1. Next.js va recharger automatiquement.');
console.log('');
console.log('  2. Connecte-toi puis ouvre :');
console.log('     http://localhost:3000/dashboard');
console.log('     http://localhost:3000/dashboard/generate');
console.log('     http://localhost:3000/dashboard/history');
console.log('');
console.log('  Prochaine etape : setup-phase7d.js (Relances + Paiement)');
console.log('');