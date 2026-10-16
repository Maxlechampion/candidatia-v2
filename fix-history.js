#!/usr/bin/env node
/**
 * fix-history.js — CandidatIA
 * ---------------------------
 * Corrige le probleme d'historique des packs generes (affichage "0").
 *
 * Corrections appliquees :
 *   1. backend/app/routers/generation.py
 *      - Ajout helper _hash_content() et _save_generation()
 *      - Appel de _save_generation() avant le return FileResponse
 *
 *   2. backend/app/routers/generations.py
 *      - Enrichissement de list_my_generations (champs utiles uniquement)
 *      - Filtrage des generations terminees dans my_stats
 *
 *   3. frontend/app/[locale]/dashboard/history/page.tsx
 *      - Affichage enrichi (langue, date, score, badge de statut)
 *
 * Le script est IDEMPOTENT : relancable sans casser le code existant.
 * Chaque fichier modifie est sauvegarde dans .backups/fix-history-<timestamp>/
 *
 * Usage : node fix-history.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKUP_DIR = path.join(ROOT, '.backups', `fix-history-${Date.now()}`);

// ============================================================
// UTILITAIRES
// ============================================================

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

function readFile(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf-8');
}

function writeFileSafe(absPath, content) {
  backupFile(absPath);
  fs.writeFileSync(absPath, content, 'utf-8');
}

// ============================================================
// CORRECTION 1 : backend/app/routers/generation.py
// ============================================================

function fixGenerationRouter() {
  log.title('1. backend/app/routers/generation.py');

  const filePath = path.join(BACKEND, 'app', 'routers', 'generation.py');
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return false;
  }

  // ---- 1a. Verifier que hashlib est importe ----
  if (!content.includes('import hashlib')) {
    // Ajouter apres la ligne 'import os'
    content = content.replace(
      /^import os\s*$/m,
      'import hashlib\nimport os'
    );
    log.ok('Import "hashlib" ajoute');
  } else {
    log.skip('Import "hashlib" deja present');
  }

  // ---- 1b. Verifier que Optional est importe ----
  if (!content.match(/from typing import.*Optional/)) {
    content = content.replace(
      /from typing import ([^\n]+)/,
      (match, imports) => {
        if (imports.includes('Optional')) return match;
        return `from typing import ${imports.trim()}, Optional`;
      }
    );
    log.ok('Import "Optional" ajoute');
  } else {
    log.skip('Import "Optional" deja present');
  }

  // ---- 1c. Ajouter les helpers _hash_content et _save_generation ----
  if (content.includes('def _save_generation(')) {
    log.skip('Helper _save_generation deja present');
  } else {
    // Inserer les helpers juste avant la fonction _extraire_entree
    const anchor = 'async def _extraire_entree(';
    const helperCode = `def _hash_content(content: str) -> str:
    """Genere un hash court pour dedupliquer les entrees."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def _save_generation(
    user_id: str,
    cv_data: Dict[str, Any],
    guide_data: Dict[str, Any],
    pack_result: Dict[str, Any],
    output_language: str,
    profil: str,
    offre: str,
) -> Optional[str]:
    """
    Sauvegarde une generation en DB.

    Retourne l ID de la generation creee, ou None si echec.
    """
    try:
        from app.core.database import insert_row

        analyse = cv_data.get("analyse", {})
        score_matching = analyse.get("score_matching")

        generation_data = {
            "user_id": user_id,
            "input_profile_hash": _hash_content(profil),
            "input_offer_hash": _hash_content(offre),
            "output_language": output_language,
            "score_matching": int(score_matching) if score_matching else None,
            "cv_path": pack_result.get("cv_path"),
            "lettre_path": pack_result.get("lettre_path"),
            "guide_path": pack_result.get("guide_path"),
            "zip_path": pack_result.get("zip_path"),
            "credits_consumed": 1,
            "status": "completed",
        }

        row = insert_row("generations", generation_data)
        logger.info(
            "generation_saved",
            user_id=user_id,
            generation_id=row.get("id"),
            score=score_matching,
        )
        return row.get("id")

    except Exception as e:
        logger.exception("generation_save_failed", user_id=user_id, error=str(e))
        return None


`;

    if (content.includes(anchor)) {
      content = content.replace(anchor, helperCode + anchor);
      log.ok('Helpers _hash_content + _save_generation ajoutes');
    } else {
      log.err('Ancre "async def _extraire_entree(" introuvable');
      return false;
    }
  }

  // ---- 1d. Ajouter l'appel _save_generation avant le return FileResponse ----
  if (content.includes('_save_generation(\n        user_id=user_id,')) {
    log.skip('Appel _save_generation deja present');
  } else {
    // Chercher le bloc: zip_path = result["zip_path"] ... return FileResponse
    const returnPattern = /(\s+)(logger\.info\("generate_success"[^\n]*\))(\s+)return FileResponse\(/;

    if (returnPattern.test(content)) {
      const saveCall = `$1# Sauvegarde en DB pour l historique
$1_save_generation(
$1    user_id=user_id,
$1    cv_data=cv_data,
$1    guide_data=guide_data,
$1    pack_result=result,
$1    output_language=output_language,
$1    profil=profil,
$1    offre=offre,
$1)

$1$2$3return FileResponse(`;

      content = content.replace(returnPattern, saveCall);
      log.ok('Appel _save_generation ajoute avant return FileResponse');
    } else {
      // Fallback : chercher uniquement 'return FileResponse(' dans la fonction generate_pack
      const fallbackPattern = /(\s+)(return FileResponse\(\s*\n\s+path=zip_path)/;
      if (fallbackPattern.test(content)) {
        const saveCall = `$1# Sauvegarde en DB pour l historique
$1_save_generation(
$1    user_id=user_id,
$1    cv_data=cv_data,
$1    guide_data=guide_data,
$1    pack_result=result,
$1    output_language=output_language,
$1    profil=profil,
$1    offre=offre,
$1)

$1$2`;
        content = content.replace(fallbackPattern, saveCall);
        log.ok('Appel _save_generation ajoute (fallback)');
      } else {
        log.err('Ancre "return FileResponse" introuvable');
        return false;
      }
    }
  }

  writeFileSafe(filePath, content);
  log.ok('generation.py mis a jour');
  return true;
}

// ============================================================
// CORRECTION 2 : backend/app/routers/generations.py
// ============================================================

function fixGenerationsRouter() {
  log.title('2. backend/app/routers/generations.py');

  const filePath = path.join(BACKEND, 'app', 'routers', 'generations.py');
  let content = readFile(filePath);

  if (!content) {
    log.err(`Fichier introuvable : ${filePath}`);
    return false;
  }

  // ---- 2a. Enrichir list_my_generations ----
  if (content.includes('"has_documents"')) {
    log.skip('list_my_generations deja enrichi');
  } else {
    // Remplacer le corps du try de list_my_generations
    const oldBlock = `    try:
        rows = select_rows(
            "generations",
            filters={"user_id": user["id"]},
            limit=limit,
            order_by="created_at",
            descending=True,
        )
        return rows
    except Exception as e:
        logger.exception("list_generations_failed", user_id=user["id"], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lecture historique.")`;

    const newBlock = `    try:
        rows = select_rows(
            "generations",
            filters={"user_id": user["id"]},
            limit=limit,
            order_by="created_at",
            descending=True,
        )

        # On ne retourne que les champs utiles au frontend
        result = []
        for row in rows:
            result.append({
                "id": row.get("id"),
                "output_language": row.get("output_language", "fr"),
                "score_matching": row.get("score_matching"),
                "status": row.get("status", "completed"),
                "created_at": row.get("created_at"),
                "zip_path": row.get("zip_path"),
                "has_documents": bool(
                    row.get("cv_path") or row.get("lettre_path") or row.get("guide_path")
                ),
            })

        return result
    except Exception as e:
        logger.exception("list_generations_failed", user_id=user["id"], error=str(e))
        raise HTTPException(status_code=500, detail="Erreur lecture historique.")`;

    if (content.includes(oldBlock)) {
      content = content.replace(oldBlock, newBlock);
      log.ok('list_my_generations enrichi');
    } else {
      log.warn('Bloc exact non trouve - recherche par regex');
      // Fallback regex souple
      const regex = /try:\s*\n\s*rows = select_rows\(\s*\n\s*"generations",[\s\S]*?raise HTTPException\(status_code=500, detail="Erreur lecture historique\."\)/;
      if (regex.test(content)) {
        content = content.replace(regex, newBlock);
        log.ok('list_my_generations enrichi (fallback regex)');
      } else {
        log.warn('Impossible de localiser list_my_generations - verif manuelle');
      }
    }
  }

  // ---- 2b. Filtrer les generations terminees dans my_stats ----
  if (content.includes('valid = [r for r in rows if r.get("status") == "completed"]')) {
    log.skip('my_stats deja filtre');
  } else {
    const oldStats = `        rows = select_rows("generations", filters={"user_id": user["id"]})

        total = len(rows)
        scores = [r.get("score_matching") for r in rows if r.get("score_matching")]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0`;

    const newStats = `        rows = select_rows("generations", filters={"user_id": user["id"]})

        # On ne compte que les generations terminees
        valid = [r for r in rows if r.get("status") == "completed"]

        total = len(valid)
        scores = [r.get("score_matching") for r in valid if r.get("score_matching")]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0`;

    if (content.includes(oldStats)) {
      content = content.replace(oldStats, newStats);
      log.ok('my_stats filtre les generations terminees');
    } else {
      log.warn('Bloc my_stats non trouve - verif manuelle recommandee');
    }
  }

  writeFileSafe(filePath, content);
  log.ok('generations.py mis a jour');
  return true;
}

// ============================================================
// CORRECTION 3 : frontend history page
// ============================================================

function fixHistoryPage() {
  log.title('3. frontend/app/[locale]/dashboard/history/page.tsx');

  const filePath = path.join(FRONTEND, 'app', '[locale]', 'dashboard', 'history', 'page.tsx');

  if (!fs.existsSync(filePath)) {
    log.err(`Fichier introuvable : ${filePath}`);
    return false;
  }

  const current = readFile(filePath);

  // On verifie qu'on ne l'a pas deja patche (marqueur)
  if (current && current.includes('LANG_LABELS')) {
    log.skip('history/page.tsx deja enrichi');
    return true;
  }

  const newContent = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface Generation {
  id: string;
  output_language: string;
  score_matching: number | null;
  status: string;
  created_at: string;
  zip_path: string | null;
  has_documents: boolean;
}

const LANG_LABELS: Record<string, string> = {
  fr: "Francais",
  en: "English",
  es: "Espanol",
  de: "Deutsch",
  pt: "Portugues",
  ar: "Arabic",
};

export default function HistoryPage() {
  const t = useTranslations("history");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<Generation[]>("/api/generations");
        setGenerations(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">{t("title")}</h1>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>
            {generations.length} {generations.length === 1 ? "pack" : "packs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-sm">Chargement...</p>
          ) : generations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-2">{t("empty")}</p>
              <p className="text-sm">{t("empty_hint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-700">
                        Pack en{" "}
                        {LANG_LABELS[gen.output_language] ||
                          gen.output_language.toUpperCase()}
                      </p>
                      <span
                        className={\`px-2 py-0.5 text-xs font-medium rounded-full \${
                          gen.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }\`}
                      >
                        {gen.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(gen.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {gen.score_matching && (
                      <div className="mb-1">
                        <span className="text-sm font-bold text-primary-600">
                          {gen.score_matching}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    )}
                    {gen.has_documents && (
                      <span className="text-xs text-slate-500">
                        CV - Lettre - Guide
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;

  writeFileSafe(filePath, newContent);
  log.ok('history/page.tsx enrichi');
  return true;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  CandidatIA - Correction historique des packs       ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');
  console.log(`\nRacine  : ${ROOT}`);
  console.log(`Backups : ${BACKUP_DIR}\n`);

  // Verifications prealables
  if (!fs.existsSync(path.join(BACKEND, 'app', 'routers', 'generation.py'))) {
    console.error('\n\x1b[31m[ERR ] backend/app/routers/generation.py introuvable.\x1b[0m');
    console.error('       Execute ce script depuis la racine du projet (candidatia/).\n');
    process.exit(1);
  }

  const startTime = Date.now();
  const results = [];

  try {
    results.push({ name: 'generation.py', ok: fixGenerationRouter() });
  } catch (e) {
    log.err(`generation.py : ${e.message}`);
    results.push({ name: 'generation.py', ok: false, error: e.message });
  }

  try {
    results.push({ name: 'generations.py', ok: fixGenerationsRouter() });
  } catch (e) {
    log.err(`generations.py : ${e.message}`);
    results.push({ name: 'generations.py', ok: false, error: e.message });
  }

  try {
    results.push({ name: 'history/page.tsx', ok: fixHistoryPage() });
  } catch (e) {
    log.err(`history/page.tsx : ${e.message}`);
    results.push({ name: 'history/page.tsx', ok: false, error: e.message });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\x1b[1m\x1b[35m━━━ RESUME ━━━\x1b[0m');
  for (const r of results) {
    const icon = r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${icon} ${r.name}${r.error ? ' — ' + r.error : ''}`);
  }

  console.log(`\n\x1b[36mDuree   : ${duration}s\x1b[0m`);
  console.log(`\x1b[36mBackups : ${BACKUP_DIR}\x1b[0m`);

  const allOk = results.every((r) => r.ok);

  if (allOk) {
    console.log('\n\x1b[1m\x1b[32m✅ Corrections appliquees avec succes.\x1b[0m\n');
    console.log('\x1b[1m\x1b[33mProchaines etapes :\x1b[0m');
    console.log('  1. Redemarrer uvicorn (obligatoire) :');
    console.log('       cd backend');
    console.log('       .\\venv\\Scripts\\Activate.ps1');
    console.log('       uvicorn app.main:app --reload');
    console.log('');
    console.log('  2. Generer un nouveau pack depuis le frontend.');
    console.log('     Un nouvel enregistrement apparaitra dans la table "generations".');
    console.log('');
    console.log('  3. Recharger :');
    console.log('       http://localhost:3000/fr/dashboard/history');
    console.log('');
    console.log('\x1b[90m  Note : les packs generes AVANT ce correctif restent invisibles');
    console.log('         dans l historique (ils n ont pas ete sauvegardes en DB).');
    console.log('         Les NOUVEAUX packs apparaitront normalement.\x1b[0m');
    console.log('');
  } else {
    console.log('\n\x1b[1m\x1b[33m⚠️  Certaines corrections ont echoue.\x1b[0m');
    console.log('   Verifie manuellement les fichiers concernes.');
    console.log('   Les backups sont disponibles dans :');
    console.log(`   ${BACKUP_DIR}\n`);
  }
}

main();