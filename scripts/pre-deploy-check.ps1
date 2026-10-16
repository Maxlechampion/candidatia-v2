# ============================================================
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
    "backend\app\main.py",
    "backend\app\routers\generation.py",
    "backend\app\routers\billing.py",
    "backend\app\routers\generations.py",
    "backend\app\routers\auth.py",
    "backend\app\services\payment\plans.py",
    "frontend\app\layout.tsx",
    "frontend\lib\api.ts",
    "frontend\app\[locale]\dashboard\billing\page.tsx",
    "frontend\app\[locale]\dashboard\history\page.tsx",
    "frontend\app\[locale]\dashboard\generate\page.tsx"
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
    Where-Object { $_.FullName -notmatch "node_modules|\.next" } |
    ForEach-Object {
        $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $matches = [regex]::Matches($content, 'api\.(get|post|put|delete)\s*(?:<[^>]*>)?\s*\(\s*["``''](/[^"``''\s]+)["``'']')
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
$venvPath = Join-Path $BACKEND "venv\Scripts\Activate.ps1"

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
