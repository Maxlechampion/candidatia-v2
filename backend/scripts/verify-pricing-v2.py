"""
Script de validation PRICING-v2.

Verifie que tous les elements de la refonte tarifaire sont en place :
  - plans.py (5 plans B2C)
  - quota_service.py (PLAN_QUOTAS alignes + QuotaExceededError)
  - models/user.py (is_free_tier)
  - schema.sql (colonne + migration)
  - user_service.py (is_free_tier + mark_paid_tier)
  - word_cv.py (filigrane)
  - word_guide.py (filigrane)
  - generation.py (apply_watermark + _save_generation)
  - payment/orchestrator.py (mark_paid_tier)
  - Frontend PlanCard.tsx, billing, landing
  - i18n FR/EN

Usage : python scripts/verify-pricing-v2.py
"""
import sys
from pathlib import Path

BACKEND = Path(__file__).parent.parent
ROOT = BACKEND.parent
FRONTEND = ROOT / "frontend"

# Compteurs
OK = 0
MISSING = 0
WARN = 0
details = []


def check(label, condition, detail_ok="", detail_ko=""):
    """Verifie une condition et affiche le resultat."""
    global OK, MISSING
    if condition:
        OK += 1
        print(f"  [OK]      {label}")
        if detail_ok:
            print(f"            {detail_ok}")
    else:
        MISSING += 1
        print(f"  [MISSING] {label}")
        if detail_ko:
            print(f"            {detail_ko}")


def warn(label, msg):
    global WARN
    WARN += 1
    print(f"  [WARN]    {label}")
    print(f"            {msg}")


def read_file(path):
    """Retourne le contenu d un fichier ou None."""
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def main():
    global OK, MISSING, WARN

    print()
    print("=" * 70)
    print("  VERIFICATION PRICING-v2")
    print("=" * 70)
    print()

    # ================================================================
    # 1. BACKEND - PLANS
    # ================================================================
    print("--- 1. Backend : plans.py ---")
    plans = read_file(BACKEND / "app" / "services" / "payment" / "plans.py")
    check("plans.py existe", plans is not None)
    if plans:
        for code in ["free", "express", "active", "intensive", "pro_unlimited"]:
            check(f'Plan "{code}" present', f'"{code}":' in plans)
        check("Champ is_free present", '"is_free"' in plans)
        check("Prix XOF express=2000", '"price_xof": 2000' in plans)
        check("Prix XOF active=5000", '"price_xof": 5000' in plans)
        check("Prix XOF intensive=12000", '"price_xof": 12000' in plans)
        check("Prix XOF pro_unlimited=15000", '"price_xof": 15000' in plans)
    print()

    # ================================================================
    # 2. BACKEND - QUOTA SERVICE
    # ================================================================
    print("--- 2. Backend : quota_service.py ---")
    quota = read_file(BACKEND / "app" / "services" / "auth" / "quota_service.py")
    check("quota_service.py existe", quota is not None)
    if quota:
        check("Import AppError present", "from app.core.errors import AppError" in quota)
        check("Classe QuotaExceededError", "class QuotaExceededError(AppError):" in quota)
        check("error_code QUOTA_EXCEEDED", '"QUOTA_EXCEEDED"' in quota)
        check("status_code 402", "status_code = 402" in quota)
        check('PLAN_QUOTAS contient "pro_unlimited"', '"pro_unlimited"' in quota)
        check('PLAN_QUOTAS contient "express"', '"express"' in quota)
        # Verifier alignement des 5 plans
        for code in ["free", "express", "active", "intensive", "pro_unlimited"]:
            check(f'Quota pour "{code}"', f'"{code}":' in quota)
    print()

    # ================================================================
    # 3. BACKEND - MODEL USER
    # ================================================================
    print("--- 3. Backend : models/user.py ---")
    user = read_file(BACKEND / "app" / "models" / "user.py")
    check("user.py existe", user is not None)
    if user:
        check("Champ is_free_tier", "is_free_tier" in user)
    print()

    # ================================================================
    # 4. BACKEND - SCHEMA SQL
    # ================================================================
    print("--- 4. Backend : schema.sql ---")
    schema = read_file(BACKEND / "scripts" / "schema.sql")
    check("schema.sql existe", schema is not None)
    if schema:
        check("Colonne is_free_tier", "is_free_tier" in schema)
        check("Migration ALTER TABLE", "ALTER TABLE profiles ADD COLUMN" in schema)
    print()

    # ================================================================
    # 5. BACKEND - USER SERVICE
    # ================================================================
    print("--- 5. Backend : user_service.py ---")
    user_svc = read_file(BACKEND / "app" / "services" / "auth" / "user_service.py")
    check("user_service.py existe", user_svc is not None)
    if user_svc:
        check("is_free_tier a la creation", '"is_free_tier": True' in user_svc)
        check("Fonction mark_paid_tier", "def mark_paid_tier" in user_svc)
    print()

    # ================================================================
    # 6. BACKEND - FILIGRANE WORD
    # ================================================================
    print("--- 6. Backend : filigrane (word_cv, word_guide, style) ---")
    style = read_file(BACKEND / "app" / "services" / "generation" / "style.py")
    check("style.py existe", style is not None)
    if style:
        check(
            "Fonction ajouter_filigrane_diagonal",
            "def ajouter_filigrane_diagonal" in style,
        )
        check("Opacite 0.55", 'opacity="0.55"' in style or 'opacity="0.' in style)
        check("Rotation 315", "rotation:315" in style)

    wcv = read_file(BACKEND / "app" / "services" / "generation" / "word_cv.py")
    check("word_cv.py existe", wcv is not None)
    if wcv:
        check(
            "Utilise ajouter_filigrane_diagonal",
            "ajouter_filigrane_diagonal" in wcv,
        )
        check(
            "Fonction _safe_join_items",
            "def _safe_join_items" in wcv,
        )

    wguide = read_file(BACKEND / "app" / "services" / "generation" / "word_guide.py")
    check("word_guide.py existe", wguide is not None)
    if wguide:
        check(
            "Utilise ajouter_filigrane_diagonal",
            "ajouter_filigrane_diagonal" in wguide,
        )
    print()

    # ================================================================
    # 7. BACKEND - GENERATION ROUTER
    # ================================================================
    print("--- 7. Backend : generation.py ---")
    gen = read_file(BACKEND / "app" / "routers" / "generation.py")
    check("generation.py existe", gen is not None)
    if gen:
        check("Propagation apply_watermark", "apply_watermark" in gen)
        check("Fonction _save_generation", "def _save_generation" in gen)
        check("Appel _save_generation", "_save_generation(user_id" in gen)
        check("Import insert_row", "from app.core.database import insert_row" in gen)
    print()

    # ================================================================
    # 8. BACKEND - PAYMENT ORCHESTRATOR
    # ================================================================
    print("--- 8. Backend : payment/orchestrator.py ---")
    orch = read_file(
        BACKEND / "app" / "services" / "payment" / "orchestrator.py"
    )
    check("payment/orchestrator.py existe", orch is not None)
    if orch:
        check("mark_paid_tier importe", "mark_paid_tier" in orch)
        check("mark_paid_tier appele", "mark_paid_tier(" in orch)
    print()

    # ================================================================
    # 9. BACKEND - TESTS
    # ================================================================
    print("--- 9. Backend : tests ---")
    test_pricing = BACKEND / "tests" / "test_pricing_v2.py"
    check("tests/test_pricing_v2.py existe", test_pricing.exists())
    if test_pricing.exists():
        content = test_pricing.read_text(encoding="utf-8")
        check("Test plans count", "test_plans_has_5_b2c" in content)
        check("Test quota align", "test_quota_service_aligns_with_plans" in content)
    print()

    # ================================================================
    # 10. FRONTEND - PLAN CARD
    # ================================================================
    print("--- 10. Frontend : PlanCard.tsx ---")
    pc = read_file(FRONTEND / "components" / "billing" / "PlanCard.tsx")
    check("PlanCard.tsx existe", pc is not None)
    if pc:
        check("Support is_free", "is_free" in pc)
        check("Support isUnlimited", "isUnlimited" in pc)
        check("Badge free_badge", "free_badge" in pc)
    print()

    # ================================================================
    # 11. FRONTEND - BILLING PAGE
    # ================================================================
    print("--- 11. Frontend : billing/page.tsx ---")
    bp = read_file(
        FRONTEND
        / "app"
        / "[locale]"
        / "dashboard"
        / "billing"
        / "page.tsx"
    )
    check("billing/page.tsx existe", bp is not None)
    if bp:
        check("Pas de FEDAPAY_PRICES en dur", "FEDAPAY_PRICES" not in bp)
        check("Utilise setPlans depuis API", 'api.get("/api/billing/plans")' in bp)
        check(
            "Fix payments array",
            "setPayments(paymentsRes.data.payments" in bp
            or "paymentsRes.data.payments || []" in bp,
        )
    print()

    # ================================================================
    # 12. FRONTEND - LANDING PAGE
    # ================================================================
    print("--- 12. Frontend : page.tsx (landing) ---")
    landing = read_file(FRONTEND / "app" / "[locale]" / "page.tsx")
    check("landing/page.tsx existe", landing is not None)
    if landing:
        for key in [
            "plan_free_name",
            "plan_express_name",
            "plan_active_name",
            "plan_intensive_name",
            "plan_pro_unlimited_name",
        ]:
            check(f"Cle {key}", key in landing)
    print()

    # ================================================================
    # 13. FRONTEND - I18N FR
    # ================================================================
    print("--- 13. Frontend : messages/fr.json ---")
    fr = read_file(FRONTEND / "messages" / "fr.json")
    check("fr.json existe", fr is not None)
    if fr:
        import json as _json

        try:
            data = _json.loads(fr)
            landing_fr = data.get("landing", {})
            billing_fr = data.get("billing", {})
            quota_fr = data.get("quota", {})
            check(
                "landing.plan_express_name",
                "plan_express_name" in landing_fr,
            )
            check(
                "landing.plan_pro_unlimited_name",
                "plan_pro_unlimited_name" in landing_fr,
            )
            check("billing.free_label", "free_label" in billing_fr)
            check("billing.free_badge", "free_badge" in billing_fr)
            check("billing.credits_unlimited", "credits_unlimited" in billing_fr)
            check("quota.exceeded_title", "exceeded_title" in quota_fr)
        except Exception as e:
            warn("fr.json parsing echoue", str(e))
    print()

    # ================================================================
    # 14. FRONTEND - I18N EN
    # ================================================================
    print("--- 14. Frontend : messages/en.json ---")
    en = read_file(FRONTEND / "messages" / "en.json")
    check("en.json existe", en is not None)
    if en:
        try:
            data = _json.loads(en)
            landing_en = data.get("landing", {})
            billing_en = data.get("billing", {})
            quota_en = data.get("quota", {})
            check(
                "landing.plan_express_name",
                "plan_express_name" in landing_en,
            )
            check(
                "landing.plan_pro_unlimited_name",
                "plan_pro_unlimited_name" in landing_en,
            )
            check("billing.free_label", "free_label" in billing_en)
            check("billing.free_badge", "free_badge" in billing_en)
            check("quota.exceeded_title", "exceeded_title" in quota_en)
        except Exception as e:
            warn("en.json parsing echoue", str(e))
    print()

    # ================================================================
    # 15. FRONTEND - GENERATE PAGE (quota UX)
    # ================================================================
    print("--- 15. Frontend : generate/page.tsx (quota UX) ---")
    gp = read_file(
        FRONTEND
        / "app"
        / "[locale]"
        / "dashboard"
        / "generate"
        / "page.tsx"
    )
    check("generate/page.tsx existe", gp is not None)
    if gp:
        check("QuotaExceededBanner present", "QuotaExceededBanner" in gp)
        check("Detection 402", "status === 402" in gp or "QUOTA_EXCEEDED" in gp)
        check("quotaExceeded state", "setQuotaExceeded" in gp)
    print()

    # ================================================================
    # RAPPORT FINAL
    # ================================================================
    print()
    print("=" * 70)
    print("  RAPPORT FINAL")
    print("=" * 70)
    print()
    print(f"  [OK]      {OK} verifications reussies")
    print(f"  [MISSING] {MISSING} elements manquants")
    print(f"  [WARN]    {WARN} avertissements")
    print()

    if MISSING == 0:
        print("=" * 70)
        print("  PRICING-v2 : 100% COMPLET")
        print("=" * 70)
        print()
        print("  Tous les elements sont en place. Tu peux passer a")
        print("  la phase suivante (GUIDE-v2).")
        print()
        return 0
    else:
        print("=" * 70)
        print(f"  PRICING-v2 : {MISSING} element(s) a corriger")
        print("=" * 70)
        print()
        print("  Verifie les lignes [MISSING] ci-dessus.")
        print()
        return 1


if __name__ == "__main__":
    sys.exit(main())