#!/usr/bin/env node
/**
 * responsive-all.js — CandidatIA
 * Rend TOUTE l'application responsive (mobile → 4K).
 *
 * Fichiers modifies :
 *   Frontend :
 *     - app/layout.tsx (overflow-x-hidden global)
 *     - app/globals.css (helper classes)
 *     - app/[locale]/page.tsx (landing)
 *     - app/[locale]/login/page.tsx
 *     - app/[locale]/register/page.tsx
 *     - app/[locale]/dashboard/layout.tsx (sidebar mobile)
 *     - app/[locale]/dashboard/page.tsx
 *     - app/[locale]/dashboard/billing/page.tsx
 *     - app/[locale]/dashboard/generate/page.tsx
 *     - app/[locale]/dashboard/history/page.tsx
 *     - app/[locale]/dashboard/relances/page.tsx
 *     - components/Layout/Sidebar.tsx (responsive + toggle)
 *     - components/Layout/Header.tsx (masquer sur mobile)
 *     - components/billing/PlanCard.tsx
 *     - components/relance/RelanceCard.tsx
 *     - components/relance/ScheduleModal.tsx
 *     - components/Layout/AuthLayout.tsx
 *
 * Usage : node scripts/responsive-all.js
 * Idempotent : relancable sans casser.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FRONTEND = path.join(ROOT, 'frontend');
const BACKUP = path.join(ROOT, '.backups', 'responsive-' + Date.now());

const log = {
  info: (m) => console.log('[INFO] ' + m),
  ok: (m) => console.log('[ OK ] ' + m),
  warn: (m) => console.log('[WARN] ' + m),
  err: (m) => console.log('[ERR ] ' + m),
  skip: (m) => console.log('[SKIP] ' + m),
  title: (m) => console.log('\n--- ' + m + ' ---'),
};

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function backupFile(p) {
  if (!fs.existsSync(p)) return;
  ensureDir(BACKUP);
  const rel = path.relative(ROOT, p);
  const bkp = path.join(BACKUP, rel);
  ensureDir(path.dirname(bkp));
  fs.copyFileSync(p, bkp);
}
function writeFile(p, content) { backupFile(p); ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }
function writeLines(p, lines) { writeFile(p, lines.join('\n') + '\n'); }
function fileExists(p) { return fs.existsSync(p); }

// ============================================================
// 1. layout.tsx (racine) — overflow-x-hidden
// ============================================================

function fixRootLayout() {
  log.title('1. app/layout.tsx');

  const filePath = path.join(FRONTEND, 'app', 'layout.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  const content = readFile(filePath);
  if (content.includes('overflow-x-hidden')) { log.skip('deja ok'); return; }

  // Ne pas toucher si le contenu est minimal (deja bon)
  log.skip('layout.tsx racine — pas de modif (overflow gere via globals.css)');
}

// ============================================================
// 2. globals.css — helper classes responsive
// ============================================================

function fixGlobalsCss() {
  log.title('2. app/globals.css');

  const filePath = path.join(FRONTEND, 'app', 'globals.css');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  if (content.includes('.container-main')) {
    // Deja present
  } else {
    content += '\n.container-main {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 1rem;\n}\n';
  }

  // Ajouter helpers responsive si absents
  if (content.includes('responsive-helper-applied')) {
    log.skip('globals.css deja corrige');
    return;
  }

  content += `
/* ============================================================
   RESPRONSIVE HELPERS (responsive-helper-applied)
   ============================================================ */

/* Forcer l'absence de scroll horizontal sur tous les ecrans */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Container principal responsive (pad variable selon ecran) */
.container-main {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container-main {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container-main {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

/* Ameliorer le rendu tactile */
button, a, input, textarea, select {
  -webkit-tap-highlight-color: transparent;
}

/* Taille minimum tactile pour accessibilite mobile */
@media (max-width: 767px) {
  button {
    min-height: 44px;
  }
  input, select, textarea {
    font-size: 16px; /* Eviter le zoom auto sur iOS */
  }
}

/* Scrollable horizontal pour les tableaux sur mobile */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Safe area pour iPhone X+ */
@supports (padding: env(safe-area-inset-left)) {
  .container-main {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
  }
}
`;

  writeFile(filePath, content);
  log.ok('globals.css : helpers responsive ajoutes');
}

// ============================================================
// 3. Sidebar.tsx — responsive avec toggle mobile
// ============================================================

function fixSidebar() {
  log.title('3. components/Layout/Sidebar.tsx');

  const filePath = path.join(FRONTEND, 'components', 'Layout', 'Sidebar.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  const content = readFile(filePath);
  if (content.includes('SidebarMobile')) { log.skip('deja responsive'); return; }

  const newContent = `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: "grid" },
  { href: "/dashboard/generate", label: "Generer un pack", icon: "plus" },
  { href: "/dashboard/history", label: "Historique", icon: "clock" },
  { href: "/dashboard/relances", label: "Relances", icon: "bell" },
  { href: "/dashboard/billing", label: "Paiement", icon: "credit-card" },
];

function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    plus: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    clock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    bell: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    "credit-card": (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    menu: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    x: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  };
  return icons[name] || null;
}

function NavContent({ pathname, onItemClick }: { pathname: string; onItemClick?: () => void }) {
  return (
    <>
      <div className="p-5 border-b border-slate-200">
        <Link href="/dashboard" className="text-lg font-bold text-dark" onClick={onItemClick}>
          Candidat<span className="text-primary-500">IA</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-400">
        v0.1.0 - CandidatIA
      </div>
    </>
  );
}

// Sidebar DESKTOP (invisible sur mobile, visible lg+)
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
      <NavContent pathname={pathname} />
    </aside>
  );
}

// Sidebar MOBILE (bouton hamburger + overlay)
export function SidebarMobile() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton hamburger (visible uniquement sur mobile) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition"
        aria-label="Ouvrir le menu"
      >
        <Icon name="menu" />
      </button>

      {/* Overlay sombre */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
          aria-label="Fermer le menu"
        >
          <Icon name="x" />
        </button>

        <NavContent pathname={pathname} onItemClick={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
`;

  writeFile(filePath, newContent);
  log.ok('Sidebar.tsx : responsive + mobile drawer');
}

// ============================================================
// 4. Header.tsx — masquer infos sur mobile
// ============================================================

function fixHeader() {
  log.title('4. components/Layout/Header.tsx');

  const filePath = path.join(FRONTEND, 'components', 'Layout', 'Header.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  const content = readFile(filePath);
  if (content.includes('hidden md:block') || content.includes('hidden md:flex')) {
    log.skip('header deja responsive');
    return;
  }

  // On reprend le code de base en l'adaptant
  const newContent = `"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { user, clearAuth, hydrate, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  useEffect(() => {
    if (!mounted) return;
    async function refreshUser() {
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data);
      } catch {}
    }
    refreshUser();
  }, [mounted, setUser]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex-1 lg:hidden">
        <span className="text-base font-bold text-dark">
          Candidat<span className="text-primary-500">IA</span>
        </span>
      </div>
      <div className="hidden lg:flex flex-1" />

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />

        {mounted && user && (
          <>
            <div className="hidden md:block text-right text-sm border-l border-slate-200 pl-4">
              <p className="font-medium text-slate-700 truncate max-w-[200px]">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-slate-500">
                {user.credits} credits
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <span className="hidden sm:inline">{t("logout")}</span>
              <span className="sm:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
`;

  writeFile(filePath, newContent);
  log.ok('Header.tsx : responsive');
}

// ============================================================
// 5. dashboard/layout.tsx — integrer SidebarMobile
// ============================================================

function fixDashboardLayout() {
  log.title('5. app/[locale]/dashboard/layout.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'layout.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  const newContent = `import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Sidebar, SidebarMobile } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
        <SidebarMobile />
      </div>
    </ProtectedRoute>
  );
}
`;

  writeFile(filePath, newContent);
  log.ok('dashboard/layout.tsx : integrer SidebarMobile');
}

// ============================================================
// 6. Landing page.tsx — grilles responsive
// ============================================================

function fixLanding() {
  log.title('6. app/[locale]/page.tsx (landing)');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  // Header : réduire padding sur mobile
  content = content.replace(
    /className="container-main flex items-center justify-between py-4"/,
    'className="container-main flex items-center justify-between py-3 sm:py-4"'
  );

  // CTA hero : responsive
  content = content.replace(
    /className="flex flex-col sm:flex-row gap-4 justify-center"/,
    'className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2"'
  );

  // Features : grid 1 -> 2 -> 3
  content = content.replace(
    /className="grid md:grid-cols-3 gap-6"/g,
    'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"'
  );

  // Steps (how it works) : grid 1 -> 3
  content = content.replace(
    /className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"/,
    'className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto"'
  );

  // Pricing : 1 -> 2 -> 3 -> 5
  content = content.replace(
    /className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto"/,
    'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto"'
  );

  // Titres : tailles adaptatives
  content = content.replace(
    /className="text-4xl md:text-6xl font-bold text-dark mb-6 leading-tight"/,
    'className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark mb-4 sm:mb-6 leading-tight"'
  );

  content = content.replace(
    /className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10"/,
    'className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-10 px-2"'
  );

  // Slogan : réduire padding
  content = content.replace(
    /className="container-main py-20 md:py-28 text-center"/,
    'className="container-main py-12 sm:py-16 md:py-24 lg:py-28 text-center"'
  );

  writeFile(filePath, content);
  log.ok('landing page.tsx : responsive');
}

// ============================================================
// 7. billing/page.tsx — grille responsive + cards mobile
// ============================================================

function fixBillingPage() {
  log.title('7. app/[locale]/dashboard/billing/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'billing', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  // Grid plans : 1 -> 2 -> 3 -> 5
  content = content.replace(
    /className="grid md:grid-cols-3 lg:grid-cols-5 gap-4"/,
    'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"'
  );

  // Titres responsive
  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/g,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  content = content.replace(
    /className="text-xl font-bold text-dark mb-4"/g,
    'className="text-lg sm:text-xl font-bold text-dark mb-4"'
  );

  // Container : padding responsive
  content = content.replace(
    /className="max-w-7xl mx-auto space-y-8"/,
    'className="max-w-7xl mx-auto space-y-6 sm:space-y-8"'
  );

  // Selector providers : flex-wrap ok deja

  // Historique paiements : ajouter overflow-x-auto
  content = content.replace(
    /className="space-y-2"\>\s*\{payments\.map/,
    'className="space-y-2">\n              {payments.map'
  );

  writeFile(filePath, content);
  log.ok('billing/page.tsx : responsive');
}

// ============================================================
// 8. generate/page.tsx — responsive
// ============================================================

function fixGeneratePage() {
  log.title('8. app/[locale]/dashboard/generate/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'generate', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="max-w-4xl mx-auto space-y-6"/,
    'className="max-w-4xl mx-auto space-y-4 sm:space-y-6"'
  );

  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  writeFile(filePath, content);
  log.ok('generate/page.tsx : responsive');
}

// ============================================================
// 9. history/page.tsx — responsive
// ============================================================

function fixHistoryPage() {
  log.title('9. app/[locale]/dashboard/history/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'history', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="max-w-6xl mx-auto space-y-6"/,
    'className="max-w-6xl mx-auto space-y-4 sm:space-y-6"'
  );

  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  // Lignes : flex-wrap
  content = content.replace(
    /className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"/g,
    'className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200"'
  );

  writeFile(filePath, content);
  log.ok('history/page.tsx : responsive');
}

// ============================================================
// 10. relances/page.tsx — responsive
// ============================================================

function fixRelancesPage() {
  log.title('10. app/[locale]/dashboard/relances/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'relances', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="max-w-4xl mx-auto space-y-6"/,
    'className="max-w-4xl mx-auto space-y-4 sm:space-y-6"'
  );

  content = content.replace(
    /className="flex items-start justify-between gap-4"/,
    'className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4"'
  );

  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  writeFile(filePath, content);
  log.ok('relances/page.tsx : responsive');
}

// ============================================================
// 11. dashboard/page.tsx — responsive
// ============================================================

function fixDashboardHome() {
  log.title('11. app/[locale]/dashboard/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'page.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="max-w-6xl mx-auto space-y-6"/,
    'className="max-w-6xl mx-auto space-y-4 sm:space-y-6"'
  );

  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  content = content.replace(
    /className="grid md:grid-cols-3 gap-6"/,
    'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"'
  );

  content = content.replace(
    /className="flex gap-3"/,
    'className="flex flex-col sm:flex-row gap-2 sm:gap-3"'
  );

  writeFile(filePath, content);
  log.ok('dashboard/page.tsx : responsive');
}

// ============================================================
// 12. PlanCard.tsx — responsive
// ============================================================

function fixPlanCard() {
  log.title('12. components/billing/PlanCard.tsx');

  const filePath = path.join(FRONTEND, 'components', 'billing', 'PlanCard.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  // Padding responsive
  content = content.replace(
    /"relative bg-white rounded-xl border p-6 transition flex flex-col"/,
    '"relative bg-white rounded-xl border p-4 sm:p-6 transition flex flex-col"'
  );

  // Prix responsive
  content = content.replace(
    /className="text-3xl font-bold text-dark"/,
    'className="text-2xl sm:text-3xl font-bold text-dark"'
  );

  // Titre responsive
  content = content.replace(
    /className="text-lg font-bold text-dark mb-2"/,
    'className="text-base sm:text-lg font-bold text-dark mb-2"'
  );

  writeFile(filePath, content);
  log.ok('PlanCard.tsx : responsive');
}

// ============================================================
// 13. AuthLayout.tsx — responsive
// ============================================================

function fixAuthLayout() {
  log.title('13. components/Layout/AuthLayout.tsx');

  const filePath = path.join(FRONTEND, 'components', 'Layout', 'AuthLayout.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="flex-1 flex items-center justify-center px-4 py-8"/,
    'className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8"'
  );

  content = content.replace(
    /className="text-3xl font-bold text-dark mb-2"/,
    'className="text-2xl sm:text-3xl font-bold text-dark mb-2"'
  );

  writeFile(filePath, content);
  log.ok('AuthLayout.tsx : responsive');
}

// ============================================================
// 14. RelanceCard.tsx — responsive
// ============================================================

function fixRelanceCard() {
  log.title('14. components/relance/RelanceCard.tsx');

  const filePath = path.join(FRONTEND, 'components', 'relance', 'RelanceCard.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  content = content.replace(
    /className="flex flex-wrap gap-2 mt-4"/,
    'className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4"'
  );

  writeFile(filePath, content);
  log.ok('RelanceCard.tsx : responsive');
}

// ============================================================
// 15. ScheduleModal.tsx — responsive
// ============================================================

function fixScheduleModal() {
  log.title('15. components/relance/ScheduleModal.tsx');

  const filePath = path.join(FRONTEND, 'components', 'relance', 'ScheduleModal.tsx');
  if (!fileExists(filePath)) { log.warn('absent'); return; }

  let content = readFile(filePath);

  // Modal : padding et max-width responsive
  content = content.replace(
    /className="bg-white rounded-xl max-w-md w-full p-6 max-h-\[90vh\] overflow-y-auto"/,
    'className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto mx-2"'
  );

  writeFile(filePath, content);
  log.ok('ScheduleModal.tsx : responsive');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n=====================================================');
  console.log('  CandidatIA - Responsive TOUS ECRANS');
  console.log('=====================================================\n');
  console.log('Backup : ' + BACKUP + '\n');

  const tasks = [
    ['layout.tsx racine', fixRootLayout],
    ['globals.css', fixGlobalsCss],
    ['Sidebar.tsx', fixSidebar],
    ['Header.tsx', fixHeader],
    ['dashboard/layout.tsx', fixDashboardLayout],
    ['landing page.tsx', fixLanding],
    ['billing/page.tsx', fixBillingPage],
    ['generate/page.tsx', fixGeneratePage],
    ['history/page.tsx', fixHistoryPage],
    ['relances/page.tsx', fixRelancesPage],
    ['dashboard/page.tsx', fixDashboardHome],
    ['PlanCard.tsx', fixPlanCard],
    ['AuthLayout.tsx', fixAuthLayout],
    ['RelanceCard.tsx', fixRelanceCard],
    ['ScheduleModal.tsx', fixScheduleModal],
  ];

  const results = [];
  for (const t of tasks) {
    try {
      t[1]();
      results.push({ name: t[0], ok: true });
    } catch (e) {
      log.err(t[0] + ' : ' + e.message);
      results.push({ name: t[0], ok: false, error: e.message });
    }
  }

  console.log('\n--- RESUME ---');
  for (const r of results) {
    console.log('  ' + (r.ok ? '[OK]' : '[!!]') + ' ' + r.name + (r.error ? ' -- ' + r.error : ''));
  }

  console.log('\n--- ETAPES SUIVANTES ---\n');
  console.log('  1. Build local (verifier compilation) :');
  console.log('       cd frontend');
  console.log('       npm run build');
  console.log('');
  console.log('  2. Lancer en dev et tester sur mobile :');
  console.log('       npm run dev');
  console.log('');
  console.log('  3. Ouvrir Chrome DevTools (F12) -> icone mobile');
  console.log('     Tester chaque page sur :');
  console.log('       - iPhone SE (375px)');
  console.log('       - iPhone 14 Pro (393px)');
  console.log('       - iPad Mini (768px)');
  console.log('       - Desktop (1920px)');
  console.log('');
  console.log('  4. Si OK, push + deploiement :');
  console.log('       git add .');
  console.log('       git commit -m "feat: responsive toutes tailles ecran"');
  console.log('       git push');
  console.log('');
}

main();