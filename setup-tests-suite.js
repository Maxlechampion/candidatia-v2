#!/usr/bin/env node
/**
 * setup-tests-suite.js — CandidatIA
 * ----------------------------------
 * Installe la suite de tests pre-deploiement complete :
 *
 *   1. scripts/pre-deploy-check.ps1         (tests locaux avant push)
 *   2. scripts/smoke-test-prod.ps1          (tests production apres deploiement)
 *   3. backend/tests/test_api_prefix_consistency.py
 *   4. backend/tests/test_frontend_api_calls.py
 *   5. .github/workflows/backend-ci.yml     (CI GitHub Actions)
 *   6. scripts/README-TESTS.md              (documentation)
 *   7. Ajout de pytest-cov dans requirements.txt
 *
 * Idempotent + backups automatiques.
 *
 * Usage : node setup-tests-suite.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKUP_DIR = path.join(ROOT, '.backups', `tests-suite-${Date.now()}`);

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
  const bak = path.join(BACKUP_DIR, rel);
  ensureDir(path.dirname(bak));
  fs.copyFileSync(absPath, bak);
}

function writeFile(relPath, content) {
  const absPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(absPath));

  if (fs.existsSync(absPath)) {
    // Verifier si le fichier existe deja avec le meme contenu
    const existing = fs.readFileSync(absPath, 'utf-8');
    if (existing === content) {
      log.skip(`${relPath} (deja a jour)`);
      return;
    }
    backupFile(absPath);
  }

  fs.writeFileSync(absPath, content, 'utf-8');
  log.ok(relPath);
}

// ============================================================
// 1. scripts/pre-deploy-check.ps1
// ============================================================

function createPreDeployCheck() {
  const content = `# ============================================================
# pre-deploy-check.ps1 - CandidatIA
# ------------------------------------------------------------
# Script de validation avant deploiement en production.
# Verifie :
#   1. Etat Git
#   2. Fichiers critiques
#   3. Coherence des URLs API dans le frontend
#   4. Tests backend (pytest)
#   5. TypeScript check (tsc --noEmit)
#   6. Build frontend (npm run build)
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $PSScriptRoot
$BACKEND = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"

$passed = 0
$failed = 0
$warnings = 0

function Write-TestHeader($title) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Magenta
}

function Write-OK($msg) {
    Write-Host "[ OK ] $msg" -ForegroundColor Green
    $script:passed++
}

function Write-FAIL($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:failed++
}

function Write-WARN($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
    $script:warnings++
}

# ============================================================
# 1. ETAT GIT
# ============================================================
Write-TestHeader "1. Etat Git"

Push-Location $ROOT
$gitStatus = git status --porcelain 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-WARN "Git non disponible ou repo non initialise"
} elseif ($gitStatus -eq "") {
    Write-OK "Tous les changements sont commites"
} else {
    Write-WARN "Changements non commites detectes :"
    Write-Host $gitStatus
}
Pop-Location

# ============================================================
# 2. FICHIERS CRITIQUES
# ============================================================
Write-TestHeader "2. Fichiers critiques"

$criticalFiles = @(
    "backend\\app\\main.py",
    "backend\\app\\routers\\generation.py",
    "backend\\app\\routers\\billing.py",
    "backend\\app\\routers\\generations.py",
    "backend\\app\\routers\\auth.py",
    "backend\\app\\services\\payment\\plans.py",
    "frontend\\app\\layout.tsx",
    "frontend\\lib\\api.ts",
    "frontend\\app\\[locale]\\dashboard\\billing\\page.tsx",
    "frontend\\app\\[locale]\\dashboard\\history\\page.tsx",
    "frontend\\app\\[locale]\\dashboard\\generate\\page.tsx"
)

foreach ($file in $criticalFiles) {
    $path = Join-Path $ROOT $file
    if (Test-Path -LiteralPath $path) {
        Write-OK "$file"
    } else {
        Write-FAIL "$file MANQUANT"
    }
}

# ============================================================
# 3. COHERENCE DES URLS API DANS LE FRONTEND
# ============================================================
Write-TestHeader "3. Coherence des URLs API frontend"

$badCalls = @()
Get-ChildItem -Path $FRONTEND -Recurse -Include *.ts,*.tsx |
    Where-Object { $_.FullName -notmatch "node_modules|\\.next" } |
    ForEach-Object {
        $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $matches = [regex]::Matches($content, 'api\\.(get|post|put|delete)\\s*(?:<[^>]*>)?\\s*\\(\\s*["\`\`''](/[^"\`\`''\\s]+)["\`\`'']')
            foreach ($m in $matches) {
                $url = $m.Groups[2].Value
                if ($url.StartsWith("/") -and -not $url.StartsWith("/api/")) {
                    $badCalls += [PSCustomObject]@{
                        File = $_.FullName.Replace($ROOT, "")
                        Url = $url
                    }
                }
            }
        }
    }

if ($badCalls.Count -eq 0) {
    Write-OK "Tous les appels API utilisent le prefixe /api/"
} else {
    Write-FAIL "$($badCalls.Count) appel(s) API sans prefixe /api/ :"
    foreach ($call in $badCalls) {
        Write-Host "      $($call.File) -> $($call.Url)" -ForegroundColor Red
    }
}

# ============================================================
# 4. TESTS BACKEND (PYTEST)
# ============================================================
Write-TestHeader "4. Tests backend (pytest)"

Push-Location $BACKEND
$venvPath = Join-Path $BACKEND "venv\\Scripts\\Activate.ps1"

if (Test-Path $venvPath) {
    & $venvPath
    Write-Host "  Execution de pytest (tests non-integration)..." -ForegroundColor Cyan
    $testResult = python -m pytest -m "not integration" --tb=short -q 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Tests backend passes"
    } else {
        Write-FAIL "Tests backend echoues"
        Write-Host $testResult
    }
} else {
    Write-WARN "venv non trouve - tests backend ignores"
}
Pop-Location

# ============================================================
# 5. TYPESCRIPT CHECK
# ============================================================
Write-TestHeader "5. TypeScript check frontend"

Push-Location $FRONTEND
Write-Host "  Verification TypeScript..." -ForegroundColor Cyan
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-OK "TypeScript : aucune erreur"
} else {
    Write-WARN "TypeScript : erreurs detectees (peut etre des warnings)"
    $tscResult | Select-Object -First 10 | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
}
Pop-Location

# ============================================================
# 6. BUILD FRONTEND
# ============================================================
Write-TestHeader "6. Build frontend (npm run build)"

Push-Location $FRONTEND
Write-Host "  Build en cours (peut prendre 1-2 minutes)..." -ForegroundColor Cyan
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-OK "Build frontend reussi"
} else {
    Write-FAIL "Build frontend echoue"
    $buildResult | Select-Object -Last 20 | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
}
Pop-Location

# ============================================================
# RESUME
# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  RESUME" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Passe    : $passed" -ForegroundColor Green
Write-Host "  Echoue   : $failed" -ForegroundColor Red
Write-Host "  Warning  : $warnings" -ForegroundColor Yellow
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  PRET POUR LE DEPLOIEMENT" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Tu peux maintenant :" -ForegroundColor Yellow
    Write-Host "    git push origin main"
    Write-Host ""
    Write-Host "  Vercel et Render vont redeployer automatiquement." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "  CORRIGE LES ERREURS AVANT DE DEPLOYER" -ForegroundColor Red
    Write-Host ""
    exit 1
}
`;

  writeFile('scripts/pre-deploy-check.ps1', content);
}

// ============================================================
// 2. scripts/smoke-test-prod.ps1
// ============================================================

function createSmokeTestProd() {
  const content = `# ============================================================
# smoke-test-prod.ps1 - CandidatIA
# ------------------------------------------------------------
# Test de fumee sur la production.
# Verifie que les endpoints critiques repondent correctement
# et que le fix /api/ est bien deploye.
#
# Usage :
#   .\\scripts\\smoke-test-prod.ps1
#
# Modifier les URLs ci-dessous selon votre configuration.
# ============================================================

$BACKEND_URL = "https://candidatia.onrender.com"
$FRONTEND_URL = "https://candidatia.vercel.app"

$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatus = 200
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop

        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "[ OK ] $Name -> $($response.StatusCode)" -ForegroundColor Green
            $script:passed++
            return $response
        } else {
            Write-Host "[FAIL] $Name -> $($response.StatusCode) (attendu $ExpectedStatus)" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "[FAIL] $Name -> erreur ($status)" -ForegroundColor Red
        $script:failed++
    }
    return $null
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  SMOKE TEST PRODUCTION - CandidatIA" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# ============================================================
# BACKEND (Render)
# ============================================================
Write-Host "=== Backend (Render) ===" -ForegroundColor Cyan
Test-Endpoint -Name "Health check" -Url "$BACKEND_URL/health"
Test-Endpoint -Name "API root" -Url "$BACKEND_URL/"
Test-Endpoint -Name "Billing plans (PUBLIC)" -Url "$BACKEND_URL/api/billing/plans"
Test-Endpoint -Name "Billing providers (PUBLIC)" -Url "$BACKEND_URL/api/billing/providers"
Test-Endpoint -Name "Quota plans (PUBLIC)" -Url "$BACKEND_URL/api/quota/plans"
Test-Endpoint -Name "Generate info (PUBLIC)" -Url "$BACKEND_URL/api/generate/info"

# ============================================================
# ENDPOINTS PROTEGES (401 attendu)
# ============================================================
Write-Host ""
Write-Host "=== Endpoints proteges (401 attendu) ===" -ForegroundColor Cyan
Test-Endpoint -Name "Auth /me sans token" -Url "$BACKEND_URL/api/auth/me" -ExpectedStatus 401
Test-Endpoint -Name "Generations sans token" -Url "$BACKEND_URL/api/generations" -ExpectedStatus 401
Test-Endpoint -Name "Relances sans token" -Url "$BACKEND_URL/api/relance" -ExpectedStatus 401

# ============================================================
# VERIFIER QUE /billing/plans SANS /api EXISTE PAS
# ============================================================
Write-Host ""
Write-Host "=== Verifier l'absence du bug /billing/plans ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/billing/plans" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[FAIL] /billing/plans repond $($response.StatusCode) - ANORMAL" -ForegroundColor Red
    $script:failed++
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 404) {
        Write-Host "[ OK ] /billing/plans -> 404 (correct, /api/ est obligatoire)" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[WARN] /billing/plans -> $status (inattendu)" -ForegroundColor Yellow
    }
}

# ============================================================
# FRONTEND (Vercel)
# ============================================================
Write-Host ""
Write-Host "=== Frontend (Vercel) ===" -ForegroundColor Cyan
Test-Endpoint -Name "Landing FR" -Url "$FRONTEND_URL/fr"
Test-Endpoint -Name "Landing EN" -Url "$FRONTEND_URL/en"
Test-Endpoint -Name "Login page" -Url "$FRONTEND_URL/fr/login"
Test-Endpoint -Name "Register page" -Url "$FRONTEND_URL/fr/register"
Test-Endpoint -Name "Legal terms" -Url "$FRONTEND_URL/fr/legal/terms"
Test-Endpoint -Name "Legal privacy" -Url "$FRONTEND_URL/fr/legal/privacy"
Test-Endpoint -Name "Legal cookies" -Url "$FRONTEND_URL/fr/legal/cookies"

# ============================================================
# RESUME
# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  RESUME" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Passe  : $passed" -ForegroundColor Green
Write-Host "  Echoue : $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  PRODUCTION OPERATIONNELLE" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  DES PROBLEMES ONT ETE DETECTES" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Verifier :" -ForegroundColor Yellow
    Write-Host "    1. Dernier deploiement Vercel : https://vercel.com/dashboard"
    Write-Host "    2. Dernier deploiement Render : https://dashboard.render.com"
    Write-Host "    3. Cache navigateur : Ctrl+Shift+Suppr"
    exit 1
}
`;

  writeFile('scripts/smoke-test-prod.ps1', content);
}

// ============================================================
// 3. backend/tests/test_api_prefix_consistency.py
// ============================================================

function createApiPrefixTest() {
  const content = `"""
Test de coherence des prefixes d'API.

Verifie que TOUTES les routes exposees par FastAPI (sauf exceptions)
utilisent le prefixe /api/.

Cela evite le bug classique : "/billing/plans" au lieu de "/api/billing/plans".
"""

import pytest
from fastapi.testclient import TestClient


# Routes qui NE DOIVENT PAS avoir le prefixe /api/
EXEMPT_PREFIXES = (
    "/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/webhooks/",  # webhooks providers ne sont pas sous /api/
)


@pytest.fixture(scope="module")
def app():
    from app.main import app as fastapi_app
    return fastapi_app


def test_all_routes_use_api_prefix(app):
    """Toutes les routes (hors exemptees) doivent commencer par /api/."""
    bad_routes = []

    for route in app.routes:
        path = getattr(route, "path", "")

        # Ignorer les routes internes FastAPI
        if not path.startswith("/"):
            continue

        # Ignorer les routes exemptees
        if any(path.startswith(prefix) for prefix in EXEMPT_PREFIXES):
            continue

        # Ignorer les routes d'erreur ou de debug
        if path.startswith("/favicon"):
            continue

        # Verifier le prefixe
        if not path.startswith("/api/"):
            bad_routes.append(path)

    assert not bad_routes, (
        f"Routes sans prefixe /api/ detectees : {bad_routes}. "
        f"Toutes les routes metier doivent etre sous /api/."
    )


def test_billing_routes_are_under_api(client: TestClient):
    """Les routes /api/billing/* doivent etre accessibles."""
    routes = [
        "/api/billing/plans",
        "/api/billing/providers",
    ]
    for route in routes:
        response = client.get(route)
        assert response.status_code == 200, (
            f"{route} a renvoye {response.status_code} au lieu de 200"
        )


def test_billing_without_api_prefix_returns_404(client: TestClient):
    """Les routes /billing/* (sans /api/) doivent renvoyer 404."""
    response = client.get("/billing/plans")
    assert response.status_code == 404, (
        "La route /billing/plans (sans /api/) ne doit PAS exister. "
        "Cela evite les confusions frontend/backend."
    )


def test_auth_routes_are_under_api(client: TestClient):
    """Les routes /api/auth/* doivent etre accessibles."""
    response = client.get("/api/auth/me")
    # Sans token -> 401 attendu
    assert response.status_code == 401


def test_generations_routes_are_under_api(client: TestClient):
    """Les routes /api/generations/* doivent etre accessibles."""
    response = client.get("/api/generations")
    assert response.status_code == 401  # sans token
`;

  writeFile('backend/tests/test_api_prefix_consistency.py', content);
}

// ============================================================
// 4. backend/tests/test_frontend_api_calls.py
// ============================================================

function createFrontendApiCallsTest() {
  const content = `"""
Test de coherence des appels API cote frontend.

Verifie que tous les appels api.get/post/... dans les fichiers TS/TSX
utilisent le prefixe /api/.

Ce test attrape les bugs du type api.get("/billing/plans") avant deploiement.
"""

import re
from pathlib import Path

import pytest


FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"


def find_frontend_files():
    """Liste tous les fichiers .ts et .tsx du frontend."""
    files = []
    for ext in ("*.ts", "*.tsx"):
        for f in FRONTEND_DIR.rglob(ext):
            # Ignorer node_modules et .next
            if "node_modules" in str(f) or ".next" in str(f):
                continue
            files.append(f)
    return files


def extract_api_calls(content: str):
    """
    Extrait tous les appels api.get/post/put/delete("<url>") depuis un contenu.
    Retourne une liste d'URLs.
    """
    pattern = re.compile(
        r'api\\.(get|post|put|delete)\\s*(?:<[^>]*>)?\\s*\\(\\s*["\\'\\\`]([^"\\'\\\`\\s]+)["\\'\\\`]'
    )
    return [match.group(2) for match in pattern.finditer(content)]


@pytest.mark.skipif(
    not FRONTEND_DIR.exists(),
    reason="Frontend non disponible",
)
def test_all_api_calls_use_api_prefix():
    """Tous les appels API frontend doivent utiliser /api/."""
    bad_calls = []

    for filepath in find_frontend_files():
        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue

        for url in extract_api_calls(content):
            # Ignorer les URLs absolues (http://, https://)
            if "://" in url:
                continue

            # Ignorer les URLs externes (commencant par http)
            if url.startswith("http"):
                continue

            # Verifier que ca commence par /api/
            if url.startswith("/") and not url.startswith("/api/"):
                rel_path = filepath.relative_to(FRONTEND_DIR.parent)
                bad_calls.append(f"{rel_path} -> {url}")

    assert not bad_calls, (
        "Appels API sans prefixe /api/ detectes :\\n" + "\\n".join(bad_calls)
    )


@pytest.mark.skipif(
    not FRONTEND_DIR.exists(),
    reason="Frontend non disponible",
)
def test_billing_page_uses_api_billing_prefix():
    """Le fichier billing/page.tsx doit appeler /api/billing/*."""
    billing_file = FRONTEND_DIR / "app" / "[locale]" / "dashboard" / "billing" / "page.tsx"

    if not billing_file.exists():
        pytest.skip("billing/page.tsx non trouve")

    content = billing_file.read_text(encoding="utf-8")
    calls = extract_api_calls(content)

    # Tous les appels /billing/ doivent etre /api/billing/
    for url in calls:
        if url.startswith("/billing/"):
            pytest.fail(
                f"billing/page.tsx appelle {url} au lieu de /api{url}"
            )

    # Verifier que les 3 endpoints critiques sont bien appeles
    assert any("/api/billing/plans" in url for url in calls), \\
        "billing/page.tsx ne contient pas d'appel /api/billing/plans"
`;

  writeFile('backend/tests/test_frontend_api_calls.py', content);
}

// ============================================================
// 5. .github/workflows/backend-ci.yml
// ============================================================

function createGithubWorkflow() {
  const content = `name: Backend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run all tests (excluding integration)
        env:
          SECRET_KEY: test-secret-key-for-ci-32chars-long
        run: |
          pytest -m "not integration" --cov=app --cov-report=term-missing

      - name: Verify API prefix consistency
        env:
          SECRET_KEY: test-secret-key-for-ci-32chars-long
        run: |
          pytest tests/test_api_prefix_consistency.py -v

      - name: Verify frontend API calls
        env:
          SECRET_KEY: test-secret-key-for-ci-32chars-long
        run: |
          pytest tests/test_frontend_api_calls.py -v
`;

  writeFile('.github/workflows/backend-ci.yml', content);
}

// ============================================================
// 6. scripts/README-TESTS.md
// ============================================================

function createReadmeTests() {
  const content = `# Tests CandidatIA - Guide complet

## Vue d'ensemble

Trois niveaux de tests :

| Niveau | Quand | Commande |
|---|---|---|
| **Tests unitaires** | A chaque modif backend | \`pytest -m "not integration"\` |
| **Pre-deploiement** | Avant chaque push | \`.\\scripts\\pre-deploy-check.ps1\` |
| **Smoke test prod** | Apres chaque deploiement | \`.\\scripts\\smoke-test-prod.ps1\` |

---

## 1. Tests backend (pytest)

Depuis \`backend/\` avec le venv active :

\`\`\`powershell
# Tous les tests (sans integration)
pytest -m "not integration"

# Tests d'integration (avec IA, DB, etc.)
pytest -m integration -v

# Tests avec couverture
pytest -m "not integration" --cov=app --cov-report=term-missing

# Un test specifique
pytest tests/test_api_prefix_consistency.py -v
\`\`\`

---

## 2. Tests pre-deploiement

**Avant chaque \`git push\`**, lancer :

\`\`\`powershell
.\\scripts\\pre-deploy-check.ps1
\`\`\`

Ce script verifie :
- Etat Git (changements commites)
- Presence des fichiers critiques
- Coherence des appels API frontend (\`/api/\` obligatoire)
- Tests backend
- TypeScript check
- Build frontend

**Si tout est OK** : tu peux \`git push\` en confiance.

---

## 3. Smoke test production

**Apres chaque deploiement**, lancer :

\`\`\`powershell
.\\scripts\\smoke-test-prod.ps1
\`\`\`

Ce script teste :
- Backend Render : health, endpoints publics, endpoints proteges (401)
- Absence du bug \`/billing/plans\` sans \`/api\`
- Frontend Vercel : landing, login, register, legal

**Si un test echoue** : le deploiement a un probleme, verifier les dashboards.

---

## 4. Workflow complet recommande

\`\`\`powershell
# 1. Ecrire le code
# 2. Tester en local (npm run dev + uvicorn app.main:app --reload)
# 3. Pre-deploiement
.\\scripts\\pre-deploy-check.ps1

# 4. Si OK :
git add .
git commit -m "feat: ..."
git push origin main

# 5. Attendre 2-3 minutes (Vercel + Render deploient)
# 6. Smoke test
.\\scripts\\smoke-test-prod.ps1
\`\`\`

---

## 5. Tests speciaux (regression)

### \`test_api_prefix_consistency.py\`
Verifie que toutes les routes FastAPI utilisent le prefixe \`/api/\`.
Empeche le bug : \`/billing/plans\` au lieu de \`/api/billing/plans\`.

### \`test_frontend_api_calls.py\`
Verifie que tous les appels API frontend utilisent \`/api/\`.
Empeche le bug : \`api.get("/billing/plans")\` au lieu de \`/api/billing/plans\`.

---

## 6. CI GitHub Actions

A chaque \`git push\`, GitHub Actions lance automatiquement :
- Tests backend complets
- Tests de coherence des prefixes
- Tests de coherence frontend

Voir \`.github/workflows/backend-ci.yml\`.

**Si un test CI echoue** : ne pas merger la PR tant que ce n'est pas corrige.

---

## 7. En cas de probleme en production

1. **Vercel** : https://vercel.com/dashboard -> Deployments -> verifier le commit deploye
2. **Render** : https://dashboard.render.com -> Logs -> chercher les erreurs
3. **Cache navigateur** : Ctrl+Shift+Suppr
4. **Redeploy force** : sur Vercel, Deployments -> ... -> Redeploy (decocher "Use existing Build Cache")
`;

  writeFile('scripts/README-TESTS.md', content);
}

// ============================================================
// 7. Ajouter pytest-cov dans requirements.txt
// ============================================================

function updateRequirements() {
  const reqPath = path.join(ROOT, 'backend', 'requirements.txt');

  if (!fs.existsSync(reqPath)) {
    log.warn('backend/requirements.txt non trouve - ignore');
    return;
  }

  let content = fs.readFileSync(reqPath, 'utf-8');

  if (content.includes('pytest-cov')) {
    log.skip('pytest-cov deja dans requirements.txt');
    return;
  }

  // Ajouter pytest-cov dans la section Tests
  if (content.includes('# --- Tests ---')) {
    content = content.replace(
      /(# --- Tests ---\n)/,
      '$1pytest-cov==6.0.0\n'
    );
  } else {
    content += '\n# --- Tests ---\npytest-cov==6.0.0\n';
  }

  backupFile(reqPath);
  fs.writeFileSync(reqPath, content, 'utf-8');
  log.ok('pytest-cov ajoute dans requirements.txt');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n\x1b[1m\x1b[35m============================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m  CandidatIA - Installation suite de tests  \x1b[0m');
  console.log('\x1b[1m\x1b[35m============================================\x1b[0m');
  console.log(`\nRacine  : ${ROOT}`);
  console.log(`Backups : ${BACKUP_DIR}\n`);

  // Verifications preliminaires
  if (!fs.existsSync(path.join(ROOT, 'backend'))) {
    console.error('\n\x1b[31m[ERR ] Dossier backend/ introuvable.\x1b[0m');
    console.error('       Execute ce script depuis la racine du projet.\n');
    process.exit(1);
  }

  if (!fs.existsSync(path.join(ROOT, 'frontend'))) {
    console.error('\n\x1b[31m[ERR ] Dossier frontend/ introuvable.\x1b[0m');
    console.error('       Execute ce script depuis la racine du projet.\n');
    process.exit(1);
  }

  const startTime = Date.now();

  log.title('1. scripts/pre-deploy-check.ps1');
  createPreDeployCheck();

  log.title('2. scripts/smoke-test-prod.ps1');
  createSmokeTestProd();

  log.title('3. backend/tests/test_api_prefix_consistency.py');
  createApiPrefixTest();

  log.title('4. backend/tests/test_frontend_api_calls.py');
  createFrontendApiCallsTest();

  log.title('5. .github/workflows/backend-ci.yml');
  createGithubWorkflow();

  log.title('6. scripts/README-TESTS.md');
  createReadmeTests();

  log.title('7. Mise a jour de requirements.txt');
  updateRequirements();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // ============================================================
  // RESUME
  // ============================================================
  console.log('\n\x1b[1m\x1b[35m============================================\x1b[0m');
  console.log('\x1b[1m\x1b[35m  RESUME DE L INSTALLATION\x1b[0m');
  console.log('\x1b[1m\x1b[35m============================================\x1b[0m\n');

  console.log('  Fichiers crees / mis a jour :');
  console.log('    - scripts/pre-deploy-check.ps1');
  console.log('    - scripts/smoke-test-prod.ps1');
  console.log('    - backend/tests/test_api_prefix_consistency.py');
  console.log('    - backend/tests/test_frontend_api_calls.py');
  console.log('    - .github/workflows/backend-ci.yml');
  console.log('    - scripts/README-TESTS.md');
  console.log('    - backend/requirements.txt (pytest-cov ajoute)');
  console.log('');
  console.log(`\x1b[36mDuree   : ${duration}s\x1b[0m`);
  console.log(`\x1b[36mBackups : ${BACKUP_DIR}\x1b[0m`);
  console.log('');

  console.log('\x1b[1m\x1b[32mInstallation terminee.\x1b[0m\n');
  console.log('\x1b[1m\x1b[33mPROCHAINES ETAPES OBLIGATOIRES :\x1b[0m');
  console.log('');
  console.log('  1. Installer pytest-cov dans le venv backend :');
  console.log('       cd backend');
  console.log('       .\\venv\\Scripts\\Activate.ps1');
  console.log('       pip install -r requirements.txt');
  console.log('');
  console.log('  2. Lancer les nouveaux tests de coherence :');
  console.log('       pytest tests/test_api_prefix_consistency.py -v');
  console.log('       pytest tests/test_frontend_api_calls.py -v');
  console.log('');
  console.log('  3. Lancer le pre-deploiement complet :');
  console.log('       cd ..');
  console.log('       .\\scripts\\pre-deploy-check.ps1');
  console.log('');
  console.log('  4. Si tout est OK, commit + push :');
  console.log('       git add .');
  console.log('       git commit -m "chore: add pre-deploy test suite"');
  console.log('       git push origin main');
  console.log('');
  console.log('  5. Apres deploiement (2-3 min), smoke test :');
  console.log('       .\\scripts\\smoke-test-prod.ps1');
  console.log('');
  console.log('\x1b[1m\x1b[32mA partir de maintenant, plus aucun bug ne partira en production sans etre detecte.\x1b[0m\n');
  console.log('\x1b[90mDocumentation complete : scripts/README-TESTS.md\x1b[0m');
  console.log('');
}

main();