# Scripts CandidatIA

Ce dossier contient les scripts d'automatisation du projet.

## `setup/`

Scripts Node.js qui ont servi à construire le projet phase par phase.

| Script | Phase | Contenu |
|---|---|---|
| `setup-phase1.js` | 1 | Moteur IA multi-provider |
| `setup-phase2a.js` | 2a | Services d'ingestion |
| `setup-phase2b.js` | 2b | Services de langue |
| `setup-phase2c.js` | 2c | Router /api/ingest |
| `setup-phase2d.js` | 2d | Tests ingestion |
| `setup-phase3a.js` | 3a | Styles + Word CV |
| `setup-phase3b.js` | 3b | Word Lettre + Guide + Relance |
| `setup-phase3c.js` | 3c | PDF + Pack builder |
| `setup-phase3d.js` | 3d | Prompts IA + Router /api/generate |
| `setup-phase3e.js` | 3e | Tests génération |
| `setup-phase4a.js` | 4a | Client Supabase + schéma DB |
| `setup-phase4b.js` | 4b | Service Auth (bcrypt + JWT) |
| `setup-phase4c.js` | 4c | Middleware JWT + protection routes |
| `setup-phase4d.js` | 4d | Routers auth + generations + quota |
| `setup-phase4e.js` | 4e | Tests intégration auth |
| `setup-phase5a.js` | 5a | Interface paiement + FedaPay |
| `setup-phase5b.js` | 5b | Flutterwave |
| `setup-phase5c.js` | 5c | Raenest |
| `setup-phase5d.js` | 5d | Orchestrateur paiement + billing |
| `setup-phase5e.js` | 5e | Tests intégration paiement |
| `setup-phase6a.js` | 6a | Service de relance |
| `setup-phase6b.js` | 6b | Router /api/relance |
| `setup-phase6c.js` | 6c | Service email Brevo |
| `setup-phase6d.js` | 6d | Scheduler cron |
| `setup-phase6e.js` | 6e | Tests intégration relance |
| `setup-phase7a.js` | 7a | Structure Next.js 14 |
| ... | | |

**Ces scripts sont conservés comme historique du projet.** Ils ne doivent pas être réexécutés sur un projet existant (ils écraseraient les fichiers).

## `tools/`

Scripts utilitaires (backup, migration, monitoring).

À venir :
- `backup-db.ps1` — Sauvegarde Supabase
- `reset-db.ps1` — Réinitialisation DB
- `test-api.ps1` — Test rapide de l'API

## Usage

**Réinitialiser le projet complet** (à éviter) :
```powershell
# Dans un dossier vide
mkdir candidatia-new
cd candidatia-new
node ../scripts/setup/setup-phase1.js
node ../scripts/setup/setup-phase2a.js
# ...