"""
Script de test manuel du flux de paiement complet.

Usage : python scripts/test_payment_flow.py

Ce script :
  1. Cree un utilisateur de test
  2. Verifie les plans disponibles
  3. Verifie les providers disponibles
  4. Tente un checkout (si un provider est configure)
  5. Affiche l historique des paiements

Note : si aucun provider n est configure (FEDAPAY_SECRET_KEY vide),
le script s arrete a l etape 3 et affiche un message.
"""

import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx


BASE_URL = "http://localhost:8000"


def main() -> None:
    email = f"pay-test-{uuid.uuid4().hex[:8]}@example.com"
    password = "MotDePasse123!"

    print("=" * 60)
    print("TEST MANUEL DU FLUX PAIEMENT")
    print("=" * 60)
    print(f"Email : {email}")
    print(f"Password : {password}")
    print()

    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        # 1. Register
        print("[1/5] Inscription...")
        r = client.post("/api/auth/register", json={
            "email": email,
            "password": password,
        })
        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:200]}")
            sys.exit(1)

        token = r.json()["access_token"]
        print("   OK : token recu")
        print()

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Plans
        print("[2/5] Plans disponibles...")
        r = client.get("/api/billing/plans")
        plans = r.json()["plans"]
        for p in plans:
            price_info = f"{p['price_eur']} EUR / {p['price_xof']} XOF"
            print(f"   - {p['name']} ({p['credits']} credits) : {price_info}")
        print()

        # 3. Providers
        print("[3/5] Providers disponibles...")
        r = client.get("/api/billing/providers")
        providers = r.json()["providers"]
        if not providers:
            print("   AUCUN provider configure.")
            print()
            print("Pour tester le paiement, ajoute dans .env :")
            print("  FEDAPAY_SECRET_KEY=sk_sandbox_xxx")
            print()
            print("Puis relance ce script.")
            return

        print(f"   Providers disponibles : {providers}")
        print()

        # 4. Checkout
        print("[4/5] Creation d une session de paiement (plan Essentiel)...")
        r = client.post(
            "/api/billing/checkout",
            headers=headers,
            json={"plan_code": "essentiel", "provider": providers[0]},
        )

        if r.status_code != 200:
            print(f"   ECHEC : {r.status_code} - {r.text[:300]}")
            sys.exit(1)

        checkout = r.json()
        print("   OK : paiement cree")
        print(f"   - payment_id : {checkout['payment_id']}")
        print(f"   - provider : {checkout['provider']}")
        print(f"   - montant : {checkout['amount']} {checkout['currency']}")
        print(f"   - URL de paiement : {checkout['checkout_url'][:80]}")
        print()

        # 5. Historique
        print("[5/5] Historique des paiements...")
        r = client.get("/api/billing/payments", headers=headers)
        payments = r.json()
        print(f"   Nombre de paiements : {len(payments)}")
        for p in payments:
            print(f"   - {p['plan_purchased']} : {p['amount']} {p['currency']} ({p['status']})")
        print()

    print("=" * 60)
    print("SUCCES : Flux paiement complet operationnel")
    print("=" * 60)
    print()
    print("Pour finaliser : ouvre l URL de paiement dans un navigateur.")
    print("Apres paiement, le webhook FedaPay creditera automatiquement le compte.")


if __name__ == "__main__":
    main()
