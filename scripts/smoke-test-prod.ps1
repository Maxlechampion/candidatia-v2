# ============================================================
# smoke-test-prod.ps1 - CandidatIA
# ------------------------------------------------------------
# Test de fumee sur la production.
# Verifie que les endpoints critiques repondent correctement
# et que le fix /api/ est bien deploye.
#
# Usage :
#   .\scripts\smoke-test-prod.ps1
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
        # Recuperer le code HTTP meme en cas d'exception
        $actualStatus = $null
        if ($_.Exception.Response) {
            $actualStatus = [int]$_.Exception.Response.StatusCode.value__
        }

        # Si on attendait ce code, c'est un SUCCES
        if ($actualStatus -eq $ExpectedStatus) {
            Write-Host "[ OK ] $Name -> $actualStatus (attendu)" -ForegroundColor Green
            $script:passed++
        } else {
            $displayStatus = if ($actualStatus) { $actualStatus } else { "erreur reseau" }
            Write-Host "[FAIL] $Name -> $displayStatus (attendu $ExpectedStatus)" -ForegroundColor Red
            $script:failed++
        }
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
