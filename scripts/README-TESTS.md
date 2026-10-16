# Tests CandidatIA - Guide complet

## Vue d'ensemble

Trois niveaux de tests :

| Niveau | Quand | Commande |
|---|---|---|
| **Tests unitaires** | A chaque modif backend | `pytest -m "not integration"` |
| **Pre-deploiement** | Avant chaque push | `.\scripts\pre-deploy-check.ps1` |
| **Smoke test prod** | Apres chaque deploiement | `.\scripts\smoke-test-prod.ps1` |

---

## 1. Tests backend (pytest)

Depuis `backend/` avec le venv active :

```powershell
# Tous les tests (sans integration)
pytest -m "not integration"

# Tests d'integration (avec IA, DB, etc.)
pytest -m integration -v

# Tests avec couverture
pytest -m "not integration" --cov=app --cov-report=term-missing

# Un test specifique
pytest tests/test_api_prefix_consistency.py -v
```

---

## 2. Tests pre-deploiement

**Avant chaque `git push`**, lancer :

```powershell
.\scripts\pre-deploy-check.ps1
```

Ce script verifie :
- Etat Git (changements commites)
- Presence des fichiers critiques
- Coherence des appels API frontend (`/api/` obligatoire)
- Tests backend
- TypeScript check
- Build frontend

**Si tout est OK** : tu peux `git push` en confiance.

---

## 3. Smoke test production

**Apres chaque deploiement**, lancer :

```powershell
.\scripts\smoke-test-prod.ps1
```

Ce script teste :
- Backend Render : health, endpoints publics, endpoints proteges (401)
- Absence du bug `/billing/plans` sans `/api`
- Frontend Vercel : landing, login, register, legal

**Si un test echoue** : le deploiement a un probleme, verifier les dashboards.

---

## 4. Workflow complet recommande

```powershell
# 1. Ecrire le code
# 2. Tester en local (npm run dev + uvicorn app.main:app --reload)
# 3. Pre-deploiement
.\scripts\pre-deploy-check.ps1

# 4. Si OK :
git add .
git commit -m "feat: ..."
git push origin main

# 5. Attendre 2-3 minutes (Vercel + Render deploient)
# 6. Smoke test
.\scripts\smoke-test-prod.ps1
```

---

## 5. Tests speciaux (regression)

### `test_api_prefix_consistency.py`
Verifie que toutes les routes FastAPI utilisent le prefixe `/api/`.
Empeche le bug : `/billing/plans` au lieu de `/api/billing/plans`.

### `test_frontend_api_calls.py`
Verifie que tous les appels API frontend utilisent `/api/`.
Empeche le bug : `api.get("/billing/plans")` au lieu de `/api/billing/plans`.

---

## 6. CI GitHub Actions

A chaque `git push`, GitHub Actions lance automatiquement :
- Tests backend complets
- Tests de coherence des prefixes
- Tests de coherence frontend

Voir `.github/workflows/backend-ci.yml`.

**Si un test CI echoue** : ne pas merger la PR tant que ce n'est pas corrige.

---

## 7. En cas de probleme en production

1. **Vercel** : https://vercel.com/dashboard -> Deployments -> verifier le commit deploye
2. **Render** : https://dashboard.render.com -> Logs -> chercher les erreurs
3. **Cache navigateur** : Ctrl+Shift+Suppr
4. **Redeploy force** : sur Vercel, Deployments -> ... -> Redeploy (decocher "Use existing Build Cache")
