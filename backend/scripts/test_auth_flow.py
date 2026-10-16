"""
Script de test manuel du flux auth complet.

Usage : python scripts/test_auth_flow.py

Ce script :
  1. Cree un utilisateur de test
  2. Se connecte
  3. Recupere le profil
  4. Recupere le quota
  5. Affiche l email de test pour le nettoyage
"""

import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx


BASE_URL = "http://localhost:8000"


def main() -> None:
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    password = "MotDePasse123!"

    print("=" * 60)
    print("TEST MANUEL DU FLUX AUTH")
    print("=" * 60)
    print(f"Email : {email}")
    print(f"Password : {password}")
    print()

    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        # 1. Register
        print("[1/4] Inscription...")
        r = client.post("/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User",
        })

        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        data = r.json()
        token = data["access_token"]
        print(f"   OK : token recu ({token[:30]}...)")
        print(f"   OK : user_id = {data['user']['id']}")
        print(f"   OK : credits = {data['user']['credits']}")
        print()

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Login
        print("[2/4] Connexion (login)...")
        r = client.post("/api/auth/login", json={
            "email": email,
            "password": password,
        })

        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        login_data = r.json()
        print(f"   OK : login reussi")
        print(f"   OK : credits = {login_data['user']['credits']}")
        print()

        # 3. Me
        print("[3/4] Profil /me...")
        r = client.get("/api/auth/me", headers=headers)
        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        me = r.json()
        print(f"   OK : email = {me['email']}")
        print(f"   OK : plan = {me['plan']}")
        print(f"   OK : credits = {me['credits']}")
        print()

        # 4. Quota
        print("[4/4] Quota...")
        r = client.get("/api/auth/me/quota", headers=headers)
        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        quota = r.json()
        print(f"   OK : plan_name = {quota['plan_name']}")
        print(f"   OK : credits_remaining = {quota['credits_remaining']}")
        print(f"   OK : price_eur = {quota['price_eur']}")
        print()

    print("=" * 60)
    print("SUCCES : Flux auth complet operationnel")
    print("=" * 60)
    print()
    print(f"Pour nettoyer la DB, executer dans Supabase SQL Editor :")
    print(f"  DELETE FROM profiles WHERE email = '{email}';")


if __name__ == "__main__":
    main()
