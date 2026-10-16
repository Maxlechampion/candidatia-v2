"""
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
        r'api\.(get|post|put|delete)\s*(?:<[^>]*>)?\s*\(\s*["\'\`]([^"\'\`\s]+)["\'\`]'
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
        "Appels API sans prefixe /api/ detectes :\n" + "\n".join(bad_calls)
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
    assert any("/api/billing/plans" in url for url in calls), \
        "billing/page.tsx ne contient pas d'appel /api/billing/plans"
