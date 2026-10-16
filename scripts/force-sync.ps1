# ============================================================
# force-sync.ps1 - CandidatIA
# ------------------------------------------------------------
# Force une synchronisation complete avec GitHub :
#   1. Vérifie l'état Git
#   2. Force l'ajout de tous les fichiers modifiés
#   3. Commit + push
#   4. Vérifie que GitHub a bien reçu les changements
#
# Usage :
#   .\scripts\force-sync.ps1 -Message "feat: ma modification"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $PSScriptRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Magenta
}

function Write-OK($msg) {
    Write-Host "[ OK ] $msg" -ForegroundColor Green
}

function Write-WARN($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Write-ERR($msg) {
    Write-Host "[ERR ] $msg" -ForegroundColor Red
}

Push-Location $ROOT

# ============================================================
# 1. Etat avant
# ============================================================
Write-Step "1. Etat Git avant"

$status = git status --short
if ($status) {
    Write-Host $status
} else {
    Write-WARN "Aucun changement detecte. Forcer quand meme ?"
}

# ============================================================
# 2. Recuperer le dernier commit local + remote
# ============================================================
Write-Step "2. Dernier commit local vs remote"

$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main 2>$null

Write-Host "Local  : $localCommit"
Write-Host "Remote : $remoteCommit"

if ($localCommit -eq $remoteCommit) {
    Write-WARN "Local et remote sont deja sync"
}

# ============================================================
# 3. Forcer l'ajout de TOUS les fichiers modifies
# ============================================================
Write-Step "3. Ajout force de tous les fichiers modifies"

# 3a. Ajouter normalement
git add -A

# 3b. Forcer l'ajout des fichiers deja suivis (meme si Git dit "rien a commit")
git add -u

# 3c. Verifier si des fichiers modifies ne sont pas dans l'index
$unstaged = git diff --name-only
if ($unstaged) {
    Write-WARN "Fichiers non staged detectes, ajout force :"
    Write-Host $unstaged
    foreach ($file in $unstaged -split "`n") {
        if ($file.Trim()) {
            git add -f "$($file.Trim())"
        }
    }
}

# ============================================================
# 4. Verifier ce qui sera commite
# ============================================================
Write-Step "4. Fichiers prets a commiter"

$staged = git diff --cached --name-only
if (-not $staged) {
    Write-WARN "Aucun changement staged. Rien a commiter."
    Pop-Location
    exit 0
}

Write-Host $staged

# ============================================================
# 5. Commit
# ============================================================
Write-Step "5. Commit"

git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-ERR "Commit echoue"
    Pop-Location
    exit 1
}
Write-OK "Commit reussi"

# ============================================================
# 6. Push FORCE (avec --force-with-lease pour la securite)
# ============================================================
Write-Step "6. Push vers origin/main"

# Essayer push normal d'abord
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-WARN "Push normal echoue, tentative de pull puis push"
    git pull --rebase origin main
    git push origin main

    if ($LASTEXITCODE -ne 0) {
        Write-ERR "Push echoue definitivement"
        Pop-Location
        exit 1
    }
}
Write-OK "Push reussi"

# ============================================================
# 7. Verifier que GitHub a bien recu le commit
# ============================================================
Write-Step "7. Verification post-push"

# Attendre 2 secondes que GitHub traite le push
Start-Sleep -Seconds 2

# Fetch pour recuperer l'etat reel
git fetch origin main

$newLocalCommit = git rev-parse HEAD
$newRemoteCommit = git rev-parse origin/main

Write-Host "Local  : $newLocalCommit"
Write-Host "Remote : $newRemoteCommit"

if ($newLocalCommit -eq $newRemoteCommit) {
    Write-OK "GITHUB A BIEN RECU LE COMMIT"
} else {
    Write-ERR "DECALAGE DETECTE - Le remote n'est pas a jour"
    Write-Host ""
    Write-Host "Causes possibles :" -ForegroundColor Yellow
    Write-Host "  1. Branche differente (verifier 'git branch')"
    Write-Host "  2. Fichiers ignores par .gitignore"
    Write-Host "  3. Probleme de hooks (pre-push)"
    Write-Host ""
    Write-Host "Solutions manuelles :" -ForegroundColor Yellow
    Write-Host "  git push --force-with-lease origin main"
    Write-Host "  git ls-files --others --exclude-standard  (fichiers ignores)"
}

# ============================================================
# 8. Resume
# ============================================================
Write-Step "RESUME"

Write-Host "Commit  : $newLocalCommit"
Write-Host "Message : $Message"
Write-Host ""

if ($newLocalCommit -eq $newRemoteCommit) {
    Write-Host "SYNC REUSSIE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes :" -ForegroundColor Yellow
    Write-Host "  1. Verifier Vercel : https://vercel.com/dashboard"
    Write-Host "  2. Verifier Render : https://dashboard.render.com"
    Write-Host "  3. Apres 2-3 min : .\scripts\smoke-test-prod.ps1"
} else {
    Write-Host "SYNC ECHOUEE - Action manuelle requise" -ForegroundColor Red
}

Pop-Location