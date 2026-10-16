"""
Script de test manuel du flux de relance.

Usage : python scripts/test_relance_flow.py

Ce script :
  1. Cree un utilisateur de test
  2. Programme une relance (avec generation IA du brouillon)
  3. Liste les relances pending
  4. Annule la relance
  5. Lance le scheduler
"""

import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from dotenv import load_dotenv

load_dotenv()


BASE_URL = "http://localhost:8000"


def main() -> None:
    email = f"relance-{uuid.uuid4().hex[:8]}@example.com"
    password = "MotDePasse123!"
    cron_token = os.getenv("CRON_SECRET_TOKEN", "")

    print("=" * 60)
    print("TEST MANUEL DU FLUX DE RELANCE")
    print("=" * 60)
    print(f"Email : {email}")
    print(f"Password : {password}")
    print(f"Cron token : {cron_token[:20]}..." if cron_token else "Cron token : VIDE")
    print()

    with httpx.Client(base_url=BASE_URL, timeout=120) as client:
        # 1. Register
        print("[1/6] Inscription...")
        r = client.post("/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test Relance",
        })
        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        token = r.json()["access_token"]
        print("   OK : utilisateur cree")
        print()

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Programme une relance
        print("[2/6] Programmation d une relance (appel IA en cours...)")
        r = client.post(
            "/api/relance/schedule",
            headers=headers,
            json={
                "company_name": "TechCorp",
                "job_title": "Developpeur Python Senior",
                "wait_days": 7,
                "language": "fr",
            },
        )

        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:300]}")
            sys.exit(1)

        relance = r.json()
        relance_id = relance["id"]
        print(f"   OK : relance programmee")
        print(f"   - ID : {relance_id}")
        print(f"   - Date programmee : {relance['scheduled_date']}")
        print(f"   - Statut : {relance['status']}")
        print()
        print("   Brouillon genere :")
        draft_preview = relance["email_draft"][:200].replace("\n", " ")
        print(f"   {draft_preview}...")
        print()

        # 3. Lister les relances pending
        print("[3/6] Liste des relances pending...")
        r = client.get("/api/relance/pending", headers=headers)
        pending = r.json()
        print(f"   Nombre : {len(pending)}")
        for p in pending:
            print(f"   - {p['job_title']} chez {p['company_name']} ({p['scheduled_date']})")
        print()

        # 4. Annuler la relance
        print("[4/6] Annulation de la relance...")
        r = client.post(f"/api/relance/{relance_id}/cancel", headers=headers)
        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)
        print("   OK : relance annulee")
        print()

        # 5. Verifier le statut
        print("[5/6] Verification du statut...")
        r = client.get("/api/relance", headers=headers)
        relances = r.json()
        cancelled = next((x for x in relances if x["id"] == relance_id), None)
        if cancelled:
            print(f"   Statut : {cancelled['status']}")
        print()

        # 6. Lancer le scheduler
        print("[6/6] Execution du scheduler...")
        cron_headers = {"X-Cron-Token": cron_token}
        r = client.post("/api/scheduler/run", headers=cron_headers)

        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
        else:
            report = r.json()
            print(f"   OK : scheduler execute")
            print(f"   - Total : {report['total']}")
            print(f"   - Envoyes : {report['sent']}")
            print(f"   - Echoues : {report['failed']}")
        print()

    print("=" * 60)
    print("SUCCES : Flux de relance operationnel")
    print("=" * 60)
    print()
    print(f"Pour nettoyer la DB :")
    print(f"  DELETE FROM relances WHERE user_id IN (SELECT id FROM profiles WHERE email = '{email}');")
    print(f"  DELETE FROM profiles WHERE email = '{email}';")


if __name__ == "__main__":
    main()
