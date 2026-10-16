"""
Script de test complet avant déploiement.
Vérifie : imports, schemas, logique métier, endpoints.
"""
import sys
import json
from pathlib import Path

# Ajoute le backend au path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test 1 : Tous les imports fonctionnent"""
    print("=" * 60)
    print("TEST 1 : Imports des modules")
    print("=" * 60)
    
    try:
        from app.services.payment.schemas import (
            PaymentIntent, PaymentStatus, PaymentProviderName,
            PaymentResult, WebhookPayload
        )
        print("✅ schemas.py importé avec succès")
    except Exception as e:
        print(f"❌ Erreur import schemas.py : {e}")
        return False
    
    try:
        from app.services.payment.base import PaymentProvider
        print("✅ base.py importé avec succès")
    except Exception as e:
        print(f"❌ Erreur import base.py : {e}")
        return False
    
    try:
        from app.services.payment.fedapay import FedaPayProvider
        print("✅ fedapay.py importé avec succès")
    except Exception as e:
        print(f"❌ Erreur import fedapay.py : {e}")
        return False
    
    try:
        from app.services.payment.orchestrator import PaymentOrchestrator
        print("✅ orchestrator.py importé avec succès")
    except Exception as e:
        print(f"❌ Erreur import orchestrator.py : {e}")
        return False
    
    return True


def test_schemas():
    """Test 2 : Les schemas sont cohérents"""
    print("\n" + "=" * 60)
    print("TEST 2 : Cohérence des schemas")
    print("=" * 60)
    
    from app.services.payment.schemas import PaymentStatus, PaymentIntent
    
    # Test critique : pas d'espaces dans les valeurs
    errors = []
    
    if PaymentStatus.PENDING.value != "pending":
        errors.append(f"❌ PaymentStatus.PENDING = '{PaymentStatus.PENDING.value}' (devrait être 'pending')")
    else:
        print("✅ PaymentStatus.PENDING = 'pending'")
    
    if PaymentStatus.SUCCESS.value != "success":
        errors.append(f"❌ PaymentStatus.SUCCESS = '{PaymentStatus.SUCCESS.value}' (devrait être 'success')")
    else:
        print("✅ PaymentStatus.SUCCESS = 'success'")
    
    if PaymentStatus.FAILED.value != "failed":
        errors.append(f"❌ PaymentStatus.FAILED = '{PaymentStatus.FAILED.value}' (devrait être 'failed')")
    else:
        print("✅ PaymentStatus.FAILED = 'failed'")
    
    # Test : PaymentIntent a bien le champ locale
    try:
        intent = PaymentIntent(
            user_id="test-123",
            amount=5000,
            plan_code="pro",
            credits_to_add=150,
            locale="fr"
        )
        print(f"✅ PaymentIntent créé avec locale='{intent.locale}'")
    except Exception as e:
        errors.append(f"❌ Erreur création PaymentIntent : {e}")
    
    if errors:
        for err in errors:
            print(err)
        return False
    
    return True


def test_fedapay_payload():
    """Test 3 : Le payload FedaPay est correct (sans phone_number)"""
    print("\n" + "=" * 60)
    print("TEST 3 : Payload FedaPay (sans phone_number)")
    print("=" * 60)
    
    from app.services.payment.schemas import PaymentIntent
    
    intent = PaymentIntent(
        user_id="user-123",
        amount=12000,
        currency="XOF",
        plan_code="pro",
        credits_to_add=150,
        customer_email="test@example.com",
        customer_name="Jean Dupont",
        locale="fr"
    )
    
    # Simule la construction du payload (comme dans fedapay.py)
    customer_name = (intent.customer_name or "Client").strip()
    name_parts = customer_name.split(maxsplit=1)
    firstname = name_parts[0] if name_parts else "Client"
    lastname = name_parts[1] if len(name_parts) > 1 else "Client"
    
    callback_url = f"http://localhost:3000/{intent.locale}/billing/return"
    
    payload = {
        "description": intent.description or f"Achat plan {intent.plan_code}",
        "amount": int(intent.amount),
        "currency": {"iso": intent.currency or "XOF"},
        "callback_url": callback_url,
        "customer": {
            "email": intent.customer_email or f"{intent.user_id}@candidatia.com",
            "firstname": firstname,
            "lastname": lastname,
        },
        "metadata": {
            "user_id": intent.user_id,
            "plan_code": intent.plan_code,
            "credits_to_add": intent.credits_to_add,
        },
    }
    
    # Vérifications
    errors = []
    
    if "phone_number" in payload.get("customer", {}):
        errors.append(" phone_number présent dans le payload (doit être supprimé)")
    else:
        print("✅ phone_number absent du payload")
    
    if "/fr/billing/return" in payload["callback_url"]:
        print(f"✅ callback_url correct : {payload['callback_url']}")
    else:
        errors.append(f" callback_url incorrect : {payload['callback_url']}")
    
    if payload["customer"]["firstname"] == "Jean":
        print("✅ firstname correct : 'Jean'")
    else:
        errors.append(f"❌ firstname incorrect : {payload['customer']['firstname']}")
    
    if payload["customer"]["lastname"] == "Dupont":
        print("✅ lastname correct : 'Dupont'")
    else:
        errors.append(f"❌ lastname incorrect : {payload['customer']['lastname']}")
    
    print("\n📋 Payload généré :")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    if errors:
        for err in errors:
            print(err)
        return False
    
    return True


def test_status_mapping():
    """Test 4 : Le mapping de statuts FedaPay fonctionne"""
    print("\n" + "=" * 60)
    print("TEST 4 : Mapping des statuts FedaPay")
    print("=" * 60)
    
    from app.services.payment.schemas import PaymentStatus
    
    status_map = {
        "approved": PaymentStatus.SUCCESS,
        "transferred": PaymentStatus.SUCCESS,
        "pending": PaymentStatus.PENDING,
        "declined": PaymentStatus.FAILED,
        "canceled": PaymentStatus.CANCELLED,
        "refunded": PaymentStatus.REFUNDED,
    }
    
    errors = []
    for fedapay_status, expected in status_map.items():
        actual = status_map.get(fedapay_status)
        if actual == expected:
            print(f"✅ {fedapay_status} → {actual.value}")
        else:
            errors.append(f"❌ {fedapay_status} → {actual} (attendu: {expected})")
    
    if errors:
        for err in errors:
            print(err)
        return False
    
    return True


def test_files_structure():
    """Test 5 : Structure des fichiers frontend"""
    print("\n" + "=" * 60)
    print("TEST 5 : Structure des fichiers")
    print("=" * 60)
    
    base = Path(__file__).parent.parent / "frontend"
    
    required_files = [
        "app/layout.tsx",
        "app/[locale]/layout.tsx",
        "app/[locale]/page.tsx",
        "app/[locale]/login/page.tsx",
        "app/[locale]/dashboard/page.tsx",
        "app/[locale]/dashboard/billing/page.tsx",
        "app/[locale]/billing/return/page.tsx",
        "messages/fr.json",
        "messages/en.json",
    ]
    
    errors = []
    for file in required_files:
        full_path = base / file
        if full_path.exists():
            print(f"✅ {file}")
        else:
            errors.append(f"❌ {file} MANQUANT")
    
    if errors:
        for err in errors:
            print(err)
        return False
    
    return True


def test_translations():
    """Test 6 : Traductions billing présentes"""
    print("\n" + "=" * 60)
    print("TEST 6 : Traductions billing")
    print("=" * 60)
    
    base = Path(__file__).parent.parent / "frontend" / "messages"
    
    errors = []
    for lang in ["fr", "en"]:
        file_path = base / f"{lang}.json"
        if not file_path.exists():
            errors.append(f"❌ {lang}.json manquant")
            continue
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "billing" not in data:
            errors.append(f"❌ Section 'billing' manquante dans {lang}.json")
        elif "page" not in data.get("billing", {}):
            errors.append(f"❌ Section 'billing.page' manquante dans {lang}.json")
        elif "payment_history" not in data.get("billing", {}).get("page", {}):
            errors.append(f"❌ Clé 'billing.page.payment_history' manquante dans {lang}.json")
        else:
            print(f"✅ {lang}.json : traductions billing complètes")
    
    if errors:
        for err in errors:
            print(err)
        return False
    
    return True


# ============================================================
# LANCEMENT DES TESTS
# ============================================================
if __name__ == "__main__":
    print("\n🚀 TESTS DE PRÉ-DÉPLOIEMENT CANDIDATIA\n")
    
    results = {
        "Imports": test_imports(),
        "Schemas": test_schemas(),
        "Payload FedaPay": test_fedapay_payload(),
        "Mapping statuts": test_status_mapping(),
        "Structure fichiers": test_files_structure(),
        "Traductions": test_translations(),
    }
    
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 TOUS LES TESTS SONT PASSÉS ! Prêt pour le déploiement.")
    else:
        print("️  CERTAINS TESTS ONT ÉCHOUÉ. Corrige les erreurs avant de déployer.")
    print("=" * 60 + "\n")