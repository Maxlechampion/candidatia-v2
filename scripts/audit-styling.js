#!/usr/bin/env node
/**
 * audit-styling.js
 * ----------------
 * Audit + correction automatique de la mise en forme.
 *
 * Vérifie :
 *   - app/layout.tsx              -> import globals.css + structure
 *   - app/[locale]/layout.tsx     -> structure + NextIntlClientProvider
 *   - tailwind.config.ts          -> content paths
 *   - app/globals.css             -> directives Tailwind
 *   - components/ui/*.tsx         -> imports React corrects
 *   - tsconfig.json               -> paths
 *   - next.config.js              -> plugin next-intl
 *
 * Usage :
 *   node scripts/audit-styling.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const BACKUP_DIR = path.join(ROOT, ".backups", `audit-styling-${Date.now()}`);

const log = {
  info: (m) => console.log(`\x1b[36m[INFO]\x1b[0m ${m}`),
  ok: (m) => console.log(`\x1b[32m[ OK ]\x1b[0m ${m}`),
  warn: (m) => console.log(`\x1b[33m[WARN]\x1b[0m ${m}`),
  err: (m) => console.log(`\x1b[31m[ERR ]\x1b[0m ${m}`),
  skip: (m) => console.log(`\x1b[90m[SKIP]\x1b[0m ${m}`),
  title: (m) => console.log(`\n\x1b[1m\x1b[35m━━━ ${m} ━━━\x1b[0m`),
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backupFile(absPath) {
  if (!fs.existsSync(absPath)) return;
  ensureDir(BACKUP_DIR);
  const rel = path.relative(ROOT, absPath);
  const backupPath = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(absPath, backupPath);
}

function writeFile(relPath, content) {
  const absPath = path.join(FRONTEND, relPath);
  backupFile(absPath);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, content, "utf8");
  log.ok(`Écrit : ${relPath}`);
}

function readFile(relPath) {
  const absPath = path.join(FRONTEND, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, "utf8");
}

// ============================================================
// 1. app/layout.tsx
// ============================================================

function auditAppLayout() {
  log.title("1. app/layout.tsx");

  const rel = "app/layout.tsx";
  const content = readFile(rel);
  const expectedImport = 'import "./globals.css";';

  if (!content) {
    log.warn("Manquant — création");
  } else if (content.includes(expectedImport)) {
    log.skip("Import globals.css déjà présent");
    return;
  }

  const newContent = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CandidatIA - Generez votre pack de candidature en 1 clic",
  description:
    "CV optimise, lettre de motivation et guide d'entretien generes par IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note : <html> et <body> sont fournis par app/[locale]/layout.tsx
  return children;
}
`;

  writeFile(rel, newContent);
}

// ============================================================
// 2. app/[locale]/layout.tsx
// ============================================================

function auditLocaleLayout() {
  log.title("2. app/[locale]/layout.tsx");

  const rel = "app/[locale]/layout.tsx";
  const content = readFile(rel);

  if (!content) {
    log.warn("Manquant — skip (vérifier manuellement)");
    return;
  }

  const hasHtml = content.includes("<html") && content.includes("<body");
  const hasNextIntl = content.includes("NextIntlClientProvider");
  const hasSetLocale = content.includes("unstable_setRequestLocale") || content.includes("setRequestLocale");
  const hasStaticParams = content.includes("generateStaticParams");

  log.info(`<html>/<body> : ${hasHtml ? "OK" : "MANQUANT"}`);
  log.info(`NextIntlClientProvider : ${hasNextIntl ? "OK" : "MANQUANT"}`);
  log.info(`setRequestLocale : ${hasSetLocale ? "OK" : "MANQUANT"}`);
  log.info(`generateStaticParams : ${hasStaticParams ? "OK" : "MANQUANT"}`);

  if (hasHtml && hasNextIntl && hasSetLocale && hasStaticParams) {
    log.skip("Layout [locale] OK");
    return;
  }

  // Réécriture complète
  const newContent = `import { unstable_setRequestLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/Legal/CookieBanner";

const locales = ["fr", "en"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
`;

  writeFile(rel, newContent);
}

// ============================================================
// 3. tailwind.config.ts
// ============================================================

function auditTailwindConfig() {
  log.title("3. tailwind.config.ts");

  const rel = "tailwind.config.ts";
  const content = readFile(rel);

  if (!content) {
    log.warn("Manquant — skip");
    return;
  }

  const hasApp = content.includes("./app/**/*");
  const hasComponents = content.includes("./components/**/*");

  log.info(`content "./app/**/*" : ${hasApp ? "OK" : "MANQUANT"}`);
  log.info(`content "./components/**/*" : ${hasComponents ? "OK" : "MANQUANT"}`);

  if (hasApp && hasComponents) {
    log.skip("Config Tailwind OK");
    return;
  }

  const newContent = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#312e81",
        },
        dark: "#1e1b4b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
`;

  writeFile(rel, newContent);
}

// ============================================================
// 4. app/globals.css
// ============================================================

function auditGlobalsCss() {
  log.title("4. app/globals.css");

  const rel = "app/globals.css";
  const content = readFile(rel);

  if (!content) {
    log.warn("Manquant — création");
  } else if (content.includes("@tailwind base")) {
    log.skip("Directives Tailwind déjà présentes");
    return;
  }

  const newContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: system-ui, -apple-system, sans-serif;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  background-color: #f8fafc;
  color: #334155;
}

* {
  box-sizing: border-box;
}

a {
  color: inherit;
  text-decoration: none;
}

.container-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
`;

  writeFile(rel, newContent);
}

// ============================================================
// 5. tsconfig.json
// ============================================================

function auditTsConfig() {
  log.title("5. tsconfig.json");

  const rel = "tsconfig.json";
  const content = readFile(rel);

  if (!content) {
    log.warn("Manquant — création");
  } else {
    try {
      const json = JSON.parse(content);
      const paths = json.compilerOptions?.paths?.["@/*"];
      const include = json.include || [];

      log.info(`paths "@/*" : ${paths ? JSON.stringify(paths) : "MANQUANT"}`);
      log.info(`include : ${include.join(", ")}`);

      if (paths && paths.includes("./*")) {
        log.skip("tsconfig.json OK");
        return;
      }
    } catch (e) {
      log.err("tsconfig.json invalide : " + e.message);
    }
  }

  const newContent = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  writeFile(rel, newContent);
}

// ============================================================
// 6. next.config.js
// ============================================================

function auditNextConfig() {
  log.title("6. next.config.js");

  const rel = "next.config.js";
  const content = readFile(rel);

  if (!content) {
    log.warn("Manquant — création");
  } else if (content.includes("createNextIntlPlugin")) {
    const i18nMatch = content.match(/createNextIntlPlugin\(["']([^"']+)["']\)/);
    const i18nPath = i18nMatch ? i18nMatch[1] : "?";
    log.info(`createNextIntlPlugin("${i18nPath}")`);

    // Vérifier que le fichier i18n existe
    const i18nAbs = path.join(FRONTEND, i18nPath.replace("./", ""));
    if (fs.existsSync(i18nAbs)) {
      log.skip("next.config.js OK");
      return;
    } else {
      log.warn(`Fichier i18n introuvable : ${i18nPath}`);
    }
  }

  const newContent = `const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
`;

  writeFile(rel, newContent);
}

// ============================================================
// 7. components/ui/*.tsx — vérifier imports React
// ============================================================

function auditUiComponents() {
  log.title("7. components/ui/*.tsx");

  const uiDir = path.join(FRONTEND, "components", "ui");
  if (!fs.existsSync(uiDir)) {
    log.err("Dossier components/ui introuvable");
    return;
  }

  const files = fs.readdirSync(uiDir).filter((f) => f.endsWith(".tsx"));
  log.info(`${files.length} fichiers trouvés : ${files.join(", ")}`);

  // Vérifier que Button.tsx et Card.tsx existent
  const required = ["Button.tsx", "Card.tsx", "Alert.tsx", "Input.tsx"];
  for (const f of required) {
    const abs = path.join(uiDir, f);
    if (!fs.existsSync(abs)) {
      log.err(`MANQUANT : components/ui/${f}`);
    } else {
      log.ok(`components/ui/${f}`);
    }
  }
}

// ============================================================
// 8. Uniformiser les imports @/components/ui/*
// ============================================================

function auditImports() {
  log.title("8. Uniformisation des imports");

  const dirsToScan = [
    path.join(FRONTEND, "app"),
    path.join(FRONTEND, "components"),
  ];

  let fixedCount = 0;

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        walk(full);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        let content = fs.readFileSync(full, "utf8");
        let modified = false;

        // Uniformiser Button (majuscule)
        if (content.match(/@\/components\/ui\/button["']/)) {
          content = content.replace(/@\/components\/ui\/button/g, "@/components/ui/Button");
          modified = true;
        }

        // Uniformiser Card (majuscule)
        if (content.match(/@\/components\/ui\/card["']/)) {
          content = content.replace(/@\/components\/ui\/card/g, "@/components/ui/Card");
          modified = true;
        }

        if (modified) {
          backupFile(full);
          fs.writeFileSync(full, content, "utf8");
          log.ok(`Corrigé : ${path.relative(FRONTEND, full)}`);
          fixedCount++;
        }
      }
    }
  }

  for (const d of dirsToScan) {
    walk(d);
  }

  if (fixedCount === 0) {
    log.skip("Aucun import à corriger");
  }
}

// ============================================================
// 9. Vérifier que les layouts n'importent pas le CSS en double
// ============================================================

function checkDuplicateCssImport() {
  log.title("9. Vérification import CSS en double");

  const layouts = [
    "app/layout.tsx",
    "app/[locale]/layout.tsx",
  ];

  let found = 0;
  for (const rel of layouts) {
    const content = readFile(rel);
    if (content && content.includes('import "./globals.css"')) {
      log.info(`${rel} importe globals.css`);
      found++;
    }
  }

  if (found > 1) {
    log.warn("globals.css importé dans PLUSIEURS layouts — garder UNIQUEMENT dans app/layout.tsx");
  } else if (found === 1) {
    log.ok("globals.css importé une seule fois");
  } else {
    log.warn("globals.css non importé");
  }
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[35m║  CandidatIA — Audit complet de la mise en forme      ║\x1b[0m");
  console.log("\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m");
  console.log(`\nRacine   : ${ROOT}`);
  console.log(`Frontend : ${FRONTEND}`);
  console.log(`Backups  : ${BACKUP_DIR}\n`);

  const startTime = Date.now();
  const tasks = [
    ["1. app/layout.tsx", auditAppLayout],
    ["2. app/[locale]/layout.tsx", auditLocaleLayout],
    ["3. tailwind.config.ts", auditTailwindConfig],
    ["4. app/globals.css", auditGlobalsCss],
    ["5. tsconfig.json", auditTsConfig],
    ["6. next.config.js", auditNextConfig],
    ["7. components/ui", auditUiComponents],
    ["8. imports uniformes", auditImports],
    ["9. CSS doublon", checkDuplicateCssImport],
  ];

  const results = [];
  for (const [name, fn] of tasks) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      log.err(`${name} : ${e.message}`);
      results.push({ name, ok: false, error: e.message });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n\x1b[1m\x1b[35m━━━ RÉSUMÉ ━━━\x1b[0m");
  for (const r of results) {
    const icon = r.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`  ${icon} ${r.name}${r.error ? " — " + r.error : ""}`);
  }

  console.log(`\n\x1b[36mDurée   : ${duration}s\x1b[0m`);
  console.log(`\x1b[36mBackups : ${BACKUP_DIR}\x1b[0m`);

  console.log("\n\x1b[1m\x1b[32m✅ Audit terminé.\x1b[0m\n");
  console.log("\x1b[1m\x1b[33mProchaines étapes :\x1b[0m");
  console.log("  cd frontend");
  console.log("  Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue");
  console.log("  npm run type-check");
  console.log("  npm run build");
  console.log("  npm run dev");
  console.log("");
  console.log("  Puis ouvrir : http://localhost:3000/fr/login");
  console.log("");
}

main();