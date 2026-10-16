#!/usr/bin/env node
/**
 * export-project.js
 * -----------------
 * Extrait l'arborescence complète du projet + le contenu de chaque fichier
 * dans un seul fichier texte structuré.
 *
 * Usage :
 *   node scripts/export-project.js
 *
 * Sortie :
 *   project-export.txt  (à la racine du projet)
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// CONFIGURATION
// ============================================================

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "project-export.txt");

// Dossiers à IGNORER (récursivement)
const IGNORE_DIRS = [
  "node_modules",
  "venv",
  ".venv",
  "__pycache__",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  ".turbo",
  ".swc",
  "coverage",
  ".backups",
  ".vercel",
  ".render",
];

// Fichiers à IGNORER
const IGNORE_FILES = [
  ".DS_Store",
  "Thumbs.db",
  "*.pyc",
  "*.pyo",
  "*.log",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "poetry.lock",
  "Pipfile.lock",
  "project-export.txt",
];

// Extensions à TRAITER (fichiers texte uniquement)
const TEXT_EXTENSIONS = [
  ".py", ".pyi",
  ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx",
  ".json", ".jsonc",
  ".md", ".mdx",
  ".html", ".htm",
  ".css", ".scss", ".sass", ".less",
  ".yml", ".yaml",
  ".toml", ".ini", ".cfg",
  ".env", ".env.example",
  ".txt",
  ".sql",
  ".sh", ".bash", ".zsh",
  ".ps1", ".bat", ".cmd",
  ".vue", ".svelte",
  ".dockerfile",
  ".gitignore", ".dockerignore", ".eslintignore",
];

// Taille max d'un fichier à inclure (en octets) — évite les gros binaires déguisés
const MAX_FILE_SIZE = 200 * 1024; // 200 KB

// ============================================================
// UTILITAIRES
// ============================================================

function shouldIgnoreDir(name) {
  return IGNORE_DIRS.includes(name);
}

function shouldIgnoreFile(name) {
  if (IGNORE_FILES.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      return regex.test(name);
    }
    return pattern === name;
  })) {
    return true;
  }
  return false;
}

function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (TEXT_EXTENSIONS.includes(ext)) return true;
  // Fichiers sans extension (ex: Dockerfile, .env)
  if (!ext && !filename.startsWith(".")) return false;
  // Fichiers cachés avec extension
  return false;
}

function readFileContent(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) {
      return `[FICHIER TROP GROS - ${(stat.size / 1024).toFixed(1)} KB > 200 KB]`;
    }
    const content = fs.readFileSync(filePath, "utf8");
    // Vérifier que c'est bien du texte (pas de caractères binaires)
    if (content.includes("\0")) {
      return "[FICHIER BINAIRE - NON AFFICHÉ]";
    }
    return content;
  } catch (e) {
    return `[ERREUR DE LECTURE : ${e.message}]`;
  }
}

// ============================================================
// ARBORESCENCE
// ============================================================

function buildTree(dir, prefix = "", isLast = true, depth = 0) {
  if (depth > 10) return []; // Sécurité profondeur max
  const lines = [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  // Trier : dossiers d'abord, puis fichiers
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const filtered = entries.filter((entry) => {
    if (entry.isDirectory()) return !shouldIgnoreDir(entry.name);
    return !shouldIgnoreFile(entry.name);
  });

  filtered.forEach((entry, index) => {
    const isLastEntry = index === filtered.length - 1;
    const connector = isLastEntry ? "└── " : "├── ";
    const newPrefix = prefix + (isLastEntry ? "    " : "│   ");

    if (entry.isDirectory()) {
      lines.push(`${prefix}${connector}📁 ${entry.name}/`);
      lines.push(...buildTree(path.join(dir, entry.name), newPrefix, isLastEntry, depth + 1));
    } else {
      lines.push(`${prefix}${connector}📄 ${entry.name}`);
    }
  });

  return lines;
}

// ============================================================
// PARCOURS DES FICHIERS
// ============================================================

function walkFiles(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) {
        walkFiles(fullPath, files);
      }
    } else {
      if (!shouldIgnoreFile(entry.name) && isTextFile(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[35m║  CandidatIA — Export complet du projet              ║\x1b[0m");
  console.log("\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m\n");

  const startTime = Date.now();

  // 1. Générer l'arborescence
  console.log("\x1b[36m[1/3]\x1b[0m Génération de l'arborescence...");
  const treeLines = buildTree(ROOT);
  const tree = treeLines.join("\n");
  console.log(`      ${treeLines.length} lignes`);

  // 2. Lister tous les fichiers texte
  console.log("\x1b[36m[2/3]\x1b[0m Recherche des fichiers...");
  const files = walkFiles(ROOT);
  console.log(`      ${files.length} fichiers texte trouvés`);

  // 3. Construire le contenu
  console.log("\x1b[36m[3/3]\x1b[0m Lecture des fichiers...");

  const lines = [];

  // Header
  lines.push("═".repeat(80));
  lines.push("  CANDIDATIA — EXPORT COMPLET DU PROJET");
  lines.push("═".repeat(80));
  lines.push("");
  lines.push(`Projet      : CandidatIA`);
  lines.push(`Racine      : ${ROOT}`);
  lines.push(`Date export : ${new Date().toLocaleString("fr-FR")}`);
  lines.push(`Fichiers    : ${files.length}`);
  lines.push("");

  // Arborescence
  lines.push("─".repeat(80));
  lines.push("  ARBORESCENCE DU PROJET");
  lines.push("─".repeat(80));
  lines.push("");
  lines.push(tree);
  lines.push("");

  // Sommaire des fichiers
  lines.push("─".repeat(80));
  lines.push("  SOMMAIRE DES FICHIERS");
  lines.push("─".repeat(80));
  lines.push("");
  files.forEach((file, index) => {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    lines.push(`${String(index + 1).padStart(3)}. ${rel}`);
  });
  lines.push("");

  // Contenu des fichiers
  lines.push("═".repeat(80));
  lines.push("  CONTENU DES FICHIERS");
  lines.push("═".repeat(80));
  lines.push("");

  let currentIndex = 0;
  let errors = 0;
  let skipped = 0;

  for (const file of files) {
    currentIndex++;
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const ext = path.extname(file).toLowerCase().replace(".", "") || "txt";

    if (currentIndex % 20 === 0) {
      process.stdout.write(`      ${currentIndex}/${files.length}...\r`);
    }

    try {
      const content = readFileContent(file);

      lines.push("");
      lines.push("═".repeat(80));
      lines.push(`  FICHIER ${currentIndex}/${files.length} : ${rel}`);
      lines.push("═".repeat(80));
      lines.push(`Chemin  : ${rel}`);
      lines.push(`Type    : ${ext}`);
      lines.push(`Taille  : ${(fs.statSync(file).size / 1024).toFixed(2)} KB`);
      lines.push("─".repeat(80));

      // Délimiteur de code (format Markdown pour lecture facile)
      lines.push("```" + ext);
      lines.push(content);
      lines.push("```");
      lines.push("");

    } catch (e) {
      errors++;
      lines.push("");
      lines.push("═".repeat(80));
      lines.push(`  FICHIER ${currentIndex}/${files.length} : ${rel} (ERREUR)`);
      lines.push("═".repeat(80));
      lines.push(`ERREUR : ${e.message}`);
      lines.push("");
    }
  }

  // Footer
  lines.push("═".repeat(80));
  lines.push("  FIN DE L'EXPORT");
  lines.push("═".repeat(80));
  lines.push("");
  lines.push(`Total fichiers : ${files.length}`);
  lines.push(`Erreurs        : ${errors}`);
  lines.push(`Ignorés        : ${skipped}`);
  lines.push("");

  // Écrire le fichier
  const output = lines.join("\n");
  fs.writeFileSync(OUTPUT_FILE, output, "utf8");

  const stats = fs.statSync(OUTPUT_FILE);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("");
  console.log("\x1b[1m\x1b[32m✅ Export terminé !\x1b[0m");
  console.log("");
  console.log(`📄 Fichier : ${OUTPUT_FILE}`);
  console.log(`📊 Taille  : ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 Fichiers: ${files.length}`);
  console.log(`⏱️  Durée   : ${duration}s`);
  console.log("");
  console.log("\x1b[1m\x1b[33mÉtape suivante :\x1b[0m");
  console.log("  Ouvre project-export.txt et envoie-le-moi");
  console.log("  OU colle son contenu dans un message");
  console.log("");
}

main();