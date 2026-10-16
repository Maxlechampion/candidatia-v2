#!/usr/bin/env node
/**
 * fix-casing.js
 * -------------
 * Corrige le conflit de casse Windows sur Button.tsx / Card.tsx
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const BACKUP_DIR = path.join(ROOT, ".backups", "fix-casing-" + Date.now());

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backupFile(abs) {
  if (!fs.existsSync(abs)) return;
  ensureDir(BACKUP_DIR);
  const rel = path.relative(ROOT, abs);
  const bak = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(bak));
  fs.copyFileSync(abs, bak);
}

function deleteLowercaseFiles() {
  console.log("");
  console.log("--- 1. Suppression des fichiers en minuscule ---");

  const toDelete = [
    "components/ui/button.tsx",
    "components/ui/card.tsx",
  ];

  for (const rel of toDelete) {
    const abs = path.join(FRONTEND, rel);
    if (fs.existsSync(abs)) {
      backupFile(abs);
      fs.unlinkSync(abs);
      console.log("[ OK ] Supprime : " + rel);
    } else {
      console.log("[SKIP] Absent : " + rel);
    }
  }
}

function fixImports() {
  console.log("");
  console.log("--- 2. Correction des imports ---");

  const dirsToScan = ["app", "components"];
  const replacements = [
    { from: /@\/components\/ui\/button/g, to: "@/components/ui/Button" },
    { from: /@\/components\/ui\/card/g, to: "@/components/ui/Card" },
  ];

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
        for (const pair of replacements) {
          if (pair.from.test(content)) {
            content = content.replace(pair.from, pair.to);
            modified = true;
          }
        }
        if (modified) {
          backupFile(full);
          fs.writeFileSync(full, content, "utf8");
          console.log("[ OK ] " + path.relative(FRONTEND, full));
        }
      }
    }
  }

  for (const d of dirsToScan) {
    walk(path.join(FRONTEND, d));
  }
}

function verify() {
  console.log("");
  console.log("--- 3. Verification ---");

  const checks = [
    "components/ui/Button.tsx",
    "components/ui/Card.tsx",
  ];
  for (const rel of checks) {
    const abs = path.join(FRONTEND, rel);
    if (fs.existsSync(abs)) {
      console.log("[ OK ] " + rel + " present");
    } else {
      console.log("[ERR ] " + rel + " MANQUANT");
    }
  }

  const lowercase = [
    "components/ui/button.tsx",
    "components/ui/card.tsx",
  ];
  for (const rel of lowercase) {
    const abs = path.join(FRONTEND, rel);
    if (fs.existsSync(abs)) {
      console.log("[WARN] " + rel + " existe encore");
    } else {
      console.log("[ OK ] " + rel + " supprime");
    }
  }
}

function main() {
  console.log("");
  console.log("=== CandidatIA - Fix casing Button.tsx / Card.tsx ===");
  console.log("Backups : " + BACKUP_DIR);

  deleteLowercaseFiles();
  fixImports();
  verify();

  console.log("");
  console.log("[ OK ] Correction terminee.");
  console.log("");
  console.log("Prochaines etapes :");
  console.log("  cd frontend");
  console.log("  npm run type-check");
  console.log("  Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue");
  console.log("  npm run build");
  console.log("");
}

main();