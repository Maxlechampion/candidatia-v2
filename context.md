# 📄 Mise à jour de `docs/context.md` vers v0.9.0

Je vais te livrer **le contenu complet du nouveau `docs/context.md`**, prêt à copier-coller.

---

## 🎯 Action

**Remplace tout le contenu** de `candidatia/docs/context.md` par le contenu ci-dessous.

---

## 📄 Contenu de `docs/context.md` (v0.9.0)

```markdown
# context.md — Contexte global du projet CandidatIA

> **Version** : 0.9.0
> **Dernière mise à jour** : 2026-10-15
> **Statut** : PRICING-v2 appliqué (5 plans B2C) — Historique + Guide enrichi opérationnels
> **Tags Git** : `phase-7e-complete`, `fix-history`, `pricing-v2-applied`, `fix-watermark`, `fix-quota-ux`

---

## 1. VISION DU PRODUIT

### 1.1 Pitch
CandidatIA est un SaaS mondial, multilingue, qui génère en quelques secondes
un **pack de candidature complet** (CV optimisé méthode STAR, lettre de motivation
culturellement adaptée, guide d'entretien professionnel en 8 phases, suivi de relance
programmable) dans la langue choisie par l'utilisateur, avec un score de matching ATS.

### 1.2 Proposition de valeur
- **Pour le candidat** : gain de temps massif, qualité "chasseur de têtes",
  adaptation culturelle automatique au marché cible, guide d'entretien de niveau coaching premium.
- **Pour la plateforme** : modèle freemium scalable, encaissement au Bénin,
  coût opérationnel proche de zéro au lancement.

### 1.3 Cibles
- **B2C primaire** : chercheurs d'emploi francophones (France, Afrique de l'Ouest, diaspora)
- **B2C secondaire** : marché anglophone mondial, MENA, APAC
- **B2B** : écoles de commerce, cabinets de recrutement, ONG, institutions (Phase 10)

---

## 2. ÉTAT D'AVANCEMENT

### 2.1 Roadmap globale

| Phase | Contenu | Tests | Statut |
|---|---|---|---|
| **0** | Fondations (structure, config, docs, CI/CD) | — | ✅ Terminée |
| **1** | Moteur IA multi-provider + orchestrateur + cache | 13 | ✅ Terminée |
| **2** | Ingestion multi-format + détection langue/contenu | 45 | ✅ Terminée |
| **3** | Génération Word/PDF + pipeline complet | 21 | ✅ Terminée |
| **4** | Auth + DB + quotas + protection JWT | 41 | ✅ Terminée |
| **5** | Paiement multi-canal (FedaPay + Flutterwave + Raenest) | 32 | ✅ Terminée |
| **6** | Système de relance + scheduler + emails Brevo | 24 | ✅ Terminée |
| **7a-7f** | Frontend Next.js complet + i18n | — | ✅ Terminée |
| **7e-legal** | Pages légales conformes au Code du numérique du Bénin | — | ✅ Terminée |
| **FIX-historique** | Sauvegarde en DB + endpoint + affichage enrichi | — | ✅ Terminée (2026-10-14) |
| **FIX-billing** | Chemins API `/api/billing/*` corrigés + array payments | — | ✅ Terminée (2026-10-15) |
| **GUIDE-v2** | Guide d'entretien 8 phases + validator + prompt enrichi | — | ✅ Terminée (2026-10-14) |
| **PRICING-v2** | Nouvelle grille tarifaire 5 plans B2C | 13 | ✅ **Terminée (2026-10-15)** |
| **FIX-watermark** | Filigrane diagonal VML (rotation 315°, opacity 0.55) | — | ✅ Terminée (2026-10-15) |
| **FIX-quota-ux** | Encart 402 QUOTA_EXCEEDED avec 2 CTA | — | ✅ Terminée (2026-10-15) |
| **8** | Déploiement production (Vercel + Render) | — | ⏳ À venir |
| **9** | Conformité APDP (déclaration + registre) | — | ⏳ À venir |
| **10** | Marketing + B2B + itération | — | ⏳ À venir |
| **TOTAL** | | **189+** | |

### 2.2 Capacités opérationnelles

| Fonctionnalité | Statut |
|---|---|
| Ingestion PDF (texte + OCR), DOCX, ODT, RTF, HTML, MD, images | ✅ |
| Détection langue (15 langues) + mapping culturel | ✅ |
| Mapping conventions d'entretien par culture | ✅ |
| Moteur IA fallback (Groq → Gemini → Mistral → Cohere) | ✅ |
| Circuit breaker + cache Redis (recommandation : debug Redis) | ⚠️ |
| Génération CV méthode STAR (multilingue) | ✅ |
| Génération Lettre AIDA (multilingue) | ✅ |
| Génération Guide d'entretien 8 phases | ✅ |
| Validator + enrichissement automatique du guide | ✅ |
| Génération Brouillon relance (multilingue) | ✅ |
| Assemblage ZIP | ✅ |
| Auth JWT (register, login, /me) | ✅ |
| Gestion crédits + quotas par plan (5 plans B2C) | ✅ |
| Protection de `/api/generate` | ✅ |
| Historique des packs (sauvegarde + affichage) | ✅ |
| Statistiques utilisateur (total, score moyen) | ✅ |
| Paiement Mobile Money (FedaPay sandbox) | ✅ |
| Paiement carte (Flutterwave) | ✅ |
| Paiement crypto (Raenest) | ✅ |
| Webhooks sécurisés HMAC | ✅ |
| Crédit automatique après paiement + `mark_paid_tier()` | ✅ |
| Relances programmables (avec brouillon IA) | ✅ |
| Scheduler quotidien | ✅ |
| Rappels email automatiques (Brevo) | ✅ |
| Landing page complète (5 plans B2C) | ✅ |
| Pages légales (CGU, Privacy, Cookies) | ✅ |
| Bandeau de consentement cookies | ✅ |
| Page 404 personnalisée | ✅ |
| Filigrane diagonal VML (plan free uniquement) | ✅ |
| Encart UX "Quota épuisé" (402 avec 2 CTA) | ✅ |
| Configuration Vercel | ✅ |

---

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- next-intl (i18n FR/EN)
- Zustand (state management)
- Axios (HTTP client)
- Déploiement : Vercel

**Backend**
- FastAPI
- Pydantic v2
- Python 3.11+
- Déploiement : Render.com

**IA (fallback en cascade)**
- Groq (gpt-oss-120b) — primary
- Google Gemini (1.5 Flash)
- Mistral (Small)
- Cohere (Command R) — clé à régénérer

**Ingestion**
- pypdf + pdfplumber (PDF textuels)
- Tesseract OCR + PyMuPDF (PDF scannés)
- python-docx (Word)
- odfpy (ODT), striprtf (RTF), BeautifulSoup (HTML)

**Données**
- Supabase Postgres (DB) — colonne `is_free_tier` ajoutée
- Upstash Redis (cache — actuellement indisponible)
- Brevo (emails)

**Paiement (encaissement au Bénin)**
- FedaPay (Mobile Money — MTN MoMo, Moov, Celtiis)
- Flutterwave (cartes internationales)
- Raenest (USDT/USDC → USD → Bénin)

### 3.2 Structure du projet

```
candidatia/
├── backend/              # FastAPI (189+ tests)
│   ├── app/
│   │   ├── core/         # config, security, logging, telemetry, database, supabase_client
│   │   ├── models/       # user, generation, payment, relance, ai_log
│   │   ├── routers/      # auth, billing, generation, generations, health, ingestion, quota, relance, scheduler, webhooks
│   │   └── services/
│   │       ├── ai/       # orchestrateur multi-provider + prompts
│   │       │   ├── prompts/
│   │       │   │   ├── cv_prompt.py         # + FORMAT STRICT listes
│   │       │   │   ├── guide_prompt.py      # enrichi 8 phases
│   │       │   │   ├── lettre_prompt.py
│   │       │   │   └── relance_prompt.py
│   │       │   ├── schemas.py
│   │       │   ├── guide_validator.py
│   │       │   ├── orchestrator.py
│   │       │   ├── cache.py
│   │       │   ├── json_repair.py
│   │       │   ├── base.py
│   │       │   ├── groq.py
│   │       │   ├── gemini.py
│   │       │   ├── mistral.py
│   │       │   └── cohere.py
│   │       ├── auth/     # password, jwt, user (+mark_paid_tier), quota (+QuotaExceededError), dependencies
│   │       ├── email/    # Brevo + templates
│   │       ├── generation/
│   │       │   ├── style.py                 # +ajouter_filigrane_diagonal()
│   │       │   ├── word_cv.py               # +_safe_join_items +filigrane
│   │       │   ├── word_guide.py            # +filigrane
│   │       │   ├── word_lettre.py
│   │       │   ├── word_relance.py
│   │       │   ├── pack_builder.py
│   │       │   ├── pdf_export.py
│   │       │   └── base.py
│   │       ├── ingestion/ # extracteurs multi-format
│   │       ├── language/ # détection + locale_map (conventions entretien)
│   │       ├── payment/
│   │       │   ├── plans.py                 # 5 plans B2C (PRICING-v2)
│   │       │   ├── orchestrator.py          # +mark_paid_tier()
│   │       │   ├── fedapay.py
│   │       │   ├── flutterwave.py
│   │       │   ├── raenest.py
│   │       │   ├── base.py
│   │       │   └── schemas.py
│   │       └── relance/  # service + scheduler
│   ├── scripts/          # schema.sql, init_db.py, verify-pricing-v2.py, test_*.py
│   └── tests/            # 189+ tests (test_pricing_v2.py inclus)
├── frontend/             # Next.js 14
│   ├── app/[locale]/
│   │   ├── page.tsx               # Landing 5 plans B2C
│   │   ├── login/, register/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── generate/          # +encart QuotaExceededBanner
│   │   │   ├── history/
│   │   │   ├── relances/
│   │   │   └── billing/           # 5 plans dynamiques (fix array)
│   │   └── legal/ (terms, privacy, cookies)
│   ├── components/
│   │   ├── ui/                    # Button, Input, Card, Alert, Toast, Spinner
│   │   ├── Layout/                # Header, Sidebar, Footer, LanguageSwitcher
│   │   ├── relance/               # RelanceCard, ScheduleModal
│   │   ├── billing/               # PlanCard (5 plans + badge), PaymentMethods
│   │   └── Legal/                 # CookieBanner
│   ├── lib/                       # api.ts, store.ts, supabase.ts, utils.ts
│   ├── messages/                  # fr.json, en.json (5 plans + quota section)
│   └── vercel.json
├── docs/                 # context.md, architecture.md
├── ops/                  # runbook, monitoring
└── scripts/              # setup-phase*.js, pricing-v2-phase*.js (historique)
```

### 3.3 Endpoints backend

**Santé** : `/health`, `/`
**Ingestion** : `POST /api/ingest`
**Génération** : `POST /api/generate`, `GET /api/generate/info`
**Auth** : `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/me/quota`
**Historique** : `/api/generations`, `/api/generations/stats`
**Quota** : `/api/quota/plans`, `/api/quota/me`
**Paiement** : `/api/billing/plans`, `/api/billing/providers`, `/api/billing/checkout`, `/api/billing/payments`, `/api/billing/verify`
**Webhooks** : `/webhooks/fedapay`, `/webhooks/flutterwave`, `/webhooks/raenest`
**Relance** : `/api/relance/schedule`, `/api/relance/pending`, `/api/relance`, `/api/relance/{id}/cancel`, `/api/relance/{id}/mark-sent`
**Scheduler** : `/api/scheduler/run`, `/api/scheduler/health`

---

## 4. BASE DE DONNÉES (Supabase)

| Table | Rôle | Statut |
|---|---|---|
| `profiles` | Utilisateurs (id, email, password_hash, credits, plan, **is_free_tier**, locale) | ✅ |
| `generations` | Historique des packs (user_id, score, paths, langues) | ✅ |
| `payments` | Paiements (provider, transaction_id, amount, status, credits) | ✅ |
| `relances` | Relances programmables (user_id, scheduled_date, email_draft, status) | ✅ |
| `ai_logs` | Monitoring des appels IA (provider, tokens, latency, success) | ✅ |

**RLS** : activé sur toutes les tables, bypassé par `service_role`.

Schéma SQL : `backend/scripts/schema.sql` (colonne `is_free_tier` + migration idempotente).

---

## 5. MODÈLE ÉCONOMIQUE (v2 — appliqué)

### 5.1 Grille tarifaire (PRICING-v2)

| Plan | Code | Prix EUR | Prix XOF | Prix USD | Crédits | Cible |
|---|---|---|---|---|---|---|
| 🆓 Découverte | `free` | 0 € | 0 FCFA | 0 $ | 1 (unique) | Test |
| 🎯 Express | `express` | 3 € | 2 000 FCFA | 3,50 $ | 1 | Impulsion |
| ⭐ Candidature Active | `active` | 7,50 € | 5 000 FCFA | 8,50 $ | 5 | Best-seller |
| 🚀 Recherche Intensive | `intensive` | 18 € | 12 000 FCFA | 20 $ | 15 | Engagement |
| 💎 Pro Illimité | `pro_unlimited` | 22 €/mois | 15 000 FCFA/mois | 25 $/mois | Illimité | Récurrent |
| 🏢 B2B | `b2b` | Sur devis | Sur devis | Sur devis | Volume | Phase 10 |

### 5.2 Différenciation fonctionnelle (Phase B — à venir)

| Plan | Relance auto | Guide enrichi | Coaching IA | Support |
|---|---|---|---|---|
| 🆓 Découverte | ❌ | ❌ | ❌ | standard |
| 🎯 Express | ❌ | ❌ | ❌ | standard |
| ⭐ Candidature Active | ✅ | ✅ | ❌ | standard |
| 🚀 Recherche Intensive | ✅ | ✅ | ✅ | prioritaire |
| 💎 Pro Illimité | ✅ | ✅ | ✅ | VIP |

**Note** : en Phase A (actuelle), la différenciation n'est PAS appliquée. Tous les plans payants donnent accès aux mêmes fonctionnalités.

### 5.3 Canaux de paiement
- **FedaPay** : Mobile Money (MTN MoMo, Moov, Celtiis) + carte bancaire locale
- **Flutterwave** : cartes internationales (Visa, Mastercard)
- **Raenest** : USDT/USDC (crypto stablecoins)
- **Encaissement** : tout au Bénin

### 5.4 Filigrane sur plan gratuit
Les packs générés par un utilisateur en plan `free` portent un **filigrane diagonal VML** en arrière-plan :
> *"CandidatIA - Genere gratuitement - candidatia.com"*

**Caractéristiques** : rotation 315°, taille 60pt, opacité 0.55, couleur #808080, occupant ~50% de la page.

Ce filigrane disparaît dès qu'un pack est acheté (`mark_paid_tier()` appelé automatiquement après paiement réussi).

---

## 6. GUIDE D'ENTRETIEN ENRICHI (GUIDE-v2)

### 6.1 Structure en 8 phases

1. **Préparation** : checklist logistique + recherche entreprise + pitch 30 s
2. **Introduction** : brise-glace, structuration de la présentation
3. **Parcours et motivation** : "Parlez-moi de vous", "Pourquoi ce poste ?", etc.
4. **Compétences techniques** : questions métier + mises en situation
5. **Comportemental (STAR)** : conflits, échecs, leadership, initiative
6. **Questions pièges et pression** : "votre faiblesse", "pourquoi nous", etc.
7. **Vos questions** : par interlocuteur (RH, manager, dirigeant)
8. **Clôture et négociation** : salaire, date de démarrage, question finale

### 6.2 Contenu par question
- **Intention cachée du recruteur** (décryptage psychologique)
- **Stratégie de réponse** (script tactique)
- **Exemple de réponse cadre** (2-4 phrases déjà rédigées, personnalisées avec le CV)

### 6.3 Architecture technique
- **Prompt enrichi** : `backend/app/services/ai/prompts/guide_prompt.py`
- **Validator + fallback** : `backend/app/services/ai/guide_validator.py`
- **Schémas Pydantic** : `GuideData`, `GuidePhase`, `GuideQuestion`, `GuidePiege`, etc.
- **Générateur Word dense** : `backend/app/services/generation/word_guide.py` (10-15 pages)

### 6.4 Adaptation culturelle
Chaque `locale_map` contient :
- `interview_style` : collaboratif, direct, hiérarchique, etc.
- `interview_duration_minutes` : 45 min (US) → 90 min (JP)
- `salary_negotiation_style` : direct, indirect, jamais abordé
- `interview_technical_depth` : standard, élevé

---

## 7. CONFORMITÉ LÉGALE (BÉNIN)

### 7.1 Applicabilité
CandidatIA est soumise au **Code du numérique du Bénin (Loi n° 2017-20 du 20 avril 2018)** car :
- Elle cible des utilisateurs au Bénin (support XOF, Mobile Money, français)
- Elle traite des données de personnes situées au Bénin
- Elle encaisse via des providers béninois

### 7.2 Obligations identifiées

| Obligation | Base légale | Statut |
|---|---|---|
| Privacy Policy | Art. 437-448 | ✅ Publiée |
| CGU (dont exception rétractation) | Art. 347-354 | ✅ Publiée |
| Politique cookies | Art. 383 | ✅ Publiée |
| Cookie banner | Art. 383 | ✅ Implémenté |
| Déclaration APDP | Art. 405 | ⏳ À faire |
| Registre des traitements | Art. 435 | ⏳ À faire |
| Rapport annuel APDP | Art. 387 | ⏳ À venir |
| Consentement marketing | Art. 330-332 | ⏳ À implémenter |
| Contrats sous-traitance | Art. 426 | ⏳ À faire |
| Transferts hors Bénin | Art. 391+ | ⏳ À documenter |

### 7.3 Droits utilisateurs
- **Accès** : réponse ≤ 60 jours
- **Opposition** (prospection) : réponse ≤ 30 jours
- **Rectification / Suppression** : réponse ≤ 45 jours
- **Portabilité** : format structuré

### 7.4 Coordonnées APDP
APDP – Rue 6.076, Aidjèdo, Immeuble El MARZOUK Joël, Cotonou
Tél : (+229) 21 32 57 88 — Email : contact@apdp.bj — Web : www.apdp.bj

---

## 8. CONFIGURATION

### 8.1 Variables backend (`backend/.env`)

```bash
# App
APP_NAME=CandidatIA
APP_ENV=development
SECRET_KEY=<32+ caractères>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# IA
GROQ_API_KEY=<clé>
GEMINI_API_KEY=<clé>
MISTRAL_API_KEY=<clé>
COHERE_API_KEY=<clé>          # ⚠️ actuellement invalide
AI_PROVIDER_ORDER=groq,gemini,mistral,cohere

# Supabase
SUPABASE_URL=https://uftodzmoktbxbgfdotgn.supabase.co
SUPABASE_ANON_KEY=<clé>
SUPABASE_SERVICE_KEY=<clé>
DATABASE_URL=postgresql://...

# Redis (⚠️ actuellement indisponible)
REDIS_URL=redis://localhost:6379

# Brevo
BREVO_API_KEY=<clé>
BREVO_SENDER_EMAIL=<email vérifié>
BREVO_SENDER_NAME=CandidatIA

# FedaPay
FEDAPAY_SECRET_KEY=sk_sandbox_xxx
FEDAPAY_PUBLIC_KEY=pk_sandbox_xxx
FEDAPAY_ENV=sandbox
FEDAPAY_WEBHOOK_SECRET=<secret>

# Flutterwave
FLUTTERWAVE_SECRET_KEY=<clé>
FLUTTERWAVE_PUBLIC_KEY=<clé>
FLUTTERWAVE_WEBHOOK_SECRET=<secret>

# Raenest
RAENEST_API_KEY=<clé>
RAENEST_WEBHOOK_SECRET=<secret>

# Scheduler
CRON_SECRET_TOKEN=<token aléatoire long>

# OCR
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Stockage
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./fichiers_generes
MAX_FILE_SIZE_MB=10
```

### 8.2 Variables frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://uftodzmoktbxbgfdotgn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé>
```

---

## 9. LANCEMENT EN LOCAL

### 9.1 Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
- Backend : http://localhost:8000
- Docs : http://localhost:8000/docs
- Health : http://localhost:8000/health

### 9.2 Frontend
```powershell
cd frontend
npm run dev
```
- Frontend : http://localhost:3000

### 9.3 Tests
```powershell
cd backend
pytest -m "not integration"
pytest -m integration -v
pytest tests/test_pricing_v2.py -v
python scripts\verify-pricing-v2.py
```

---

## 10. DÉCISIONS D'ARCHITECTURE

1. **Orchestrateur IA multi-provider** : résilience, performance, économie (cache).
2. **FedaPay en priorité** : encaissement au Bénin, couverture Mobile Money.
3. **Scheduler en mode "pull"** : compatible avec tous les hébergeurs, protégé par token.
4. **Texte sans accents dans le code** : contournement des problèmes d'encodage Windows.
5. **Fallback OCR en cascade** : pypdf → pdfplumber → Tesseract + PyMuPDF.
6. **Titres Word traduits par dictionnaire** : `CV_TITLES`, `LETTRE_TITLES`, `RELANCE_TITLES`.
7. **Sauvegarde systématique après génération** : toute génération réussie insère une ligne dans `generations` (`_save_generation()`).
8. **Validator + fallback guide** : si l'IA omet des sections, le validator les enrichit.
9. **Grille tarifaire 5 plans B2C** : Découverte + Express + Candidature Active + Recherche Intensive + Pro Illimité.
10. **Filigrane diagonal VML** : rotation 315°, opacity 0.55, couleur #808080, taille 60pt.
11. **Encart UX "Quota épuisé"** : `402 QUOTA_EXCEEDED` avec 2 CTA (recharger / voir plans).
12. **`_safe_join_items()`** : tolère les listes de strings OU de dicts retournées par l'IA.
13. **`mark_paid_tier()`** : retire automatiquement le filigrane après un paiement réussi.

---

## 11. DETTES TECHNIQUES CONNUES

| Dette | Impact | Priorité |
|---|---|---|
| Redis indisponible (`redis_unavailable`) | Élevé (pas de cache IA) | 🔴 Haute |
| Clé Cohere invalide (401) | Moyen (fallback Groq fonctionne) | 🟡 Moyenne |
| Warnings Pydantic V2 (`json_encoders`, `Config`) | Aucun | Basse |
| `test_*.py` à la racine backend (obsolètes) | Aucun | Basse |
| Absence de rate limiting avancé | Moyen | Moyenne |
| Pas de tests frontend (Jest/Playwright) | Moyen | Moyenne |
| Différenciation fonctionnelle par plan non implémentée | Moyen | Moyenne (Phase B) |
| Aucun endpoint de téléchargement d'un ancien pack | Bas | Basse |
| Pagination/filtres sur l'historique | Bas | Basse |

---

## 12. PROCHAINES ÉTAPES

### Phase 8 — Déploiement production
- [ ] Backend sur Render.com (Web Service + Cron Job)
- [ ] Frontend sur Vercel
- [ ] Supabase déjà en production
- [ ] Webhooks FedaPay/Flutterwave/Raenest configurés avec URL publique
- [ ] Scheduler cron configuré (appel quotidien `/api/scheduler/run`)
- [ ] Domaine personnalisé (optionnel)
- [ ] **Debug Redis** (Upstash en production)

### Phase 9 — Conformité APDP
- [ ] Effectuer la déclaration APDP (https://www.apdp.bj)
- [ ] Compléter `privacy/page.tsx` avec adresse réelle + n° déclaration
- [ ] Tenir le registre des activités de traitement
- [ ] Signer les contrats de sous-traitance (Supabase, Brevo, paiement)
- [ ] Implémenter le consentement marketing explicite
- [ ] Préparer le rapport annuel (avant 30 juin)

### Phase 10 — Marketing + B2B
- [ ] Landing SEO multilingue
- [ ] Blog articles
- [ ] Programme d'affiliation
- [ ] Analytics (Plausible ou Umami)
- [ ] Offre B2B (écoles, ONG, cabinets)
- [ ] Dashboard admin B2B
- [ ] API publique + white-label

---

## 13. RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|---|---|---|
| Provider IA tombe | Élevé | Fallback cascade + circuit breaker |
| Sanction APDP | Élevé | Déclaration + registre + conformité |
| FedaPay/Flutterwave refuse KYC | Élevé | Backup Paystack + CinetPay |
| Abus free tier | Élevé | 1 pack unique + email vérifié + filigrane |
| Coût IA explose | Moyen | Cache Redis (à réparer) + monitoring `ai_logs` |
| Attaque DDoS | Faible | Vercel + Render + Cloudflare |

---

## 14. RESSOURCES

- **Repo** : local (`C:\Users\togninoubi.aho\Desktop\projets\CandidatIA\candidatia`)
- **Tags Git** : `phase-7e-complete`, `fix-history`, `pricing-v2-applied`, `fix-watermark`, `fix-quota-ux`
- **Supabase** : https://uftodzmoktbxbgfdotgn.supabase.co
- **FedaPay** : https://dashboard.fedapay.com
- **Render** : https://dashboard.render.com (à venir)
- **Vercel** : https://vercel.com/dashboard (à venir)
- **APDP** : https://www.apdp.bj

---

## 15. HISTORIQUE DES VERSIONS

| Version | Date | Événement |
|---|---|---|
| 0.1.0 | 2026-09-29 | Phase 0-1 : Fondations + Moteur IA |
| 0.2.0 | 2026-09-29 | Phase 2 : Ingestion |
| 0.3.0 | 2026-09-29 | Phase 3 : Génération Word/PDF |
| 0.4.0 | 2026-09-30 | Phase 4 : Auth + DB + quotas |
| 0.5.0 | 2026-09-30 | Phase 5 : Paiement multi-canal |
| 0.6.0 | 2026-10-01 | Phase 6 : Relance + scheduler + emails |
| 0.7.0 | 2026-10-01 | Phase 7 : Frontend complet |
| 0.8.0 | 2026-10-01 | Phase 7e-legal + Conformité Bénin identifiée |
| **0.9.0** | **2026-10-15** | **PRICING-v2 appliqué (5 plans B2C) + Filigrane diagonal + Encart Quota UX** |

---

**Fin du contexte.** Ce document doit être mis à jour à chaque évolution majeure du projet.
```

---

## ✅ Procédure

### 1. Écraser `docs/context.md`

Dans VS Code, ouvre `candidatia/docs/context.md`, **sélectionne tout** (`Ctrl+A`), **supprime**, puis **colle** le contenu ci-dessus.

**Sauvegarde** (`Ctrl+S`).

### 2. Vérifier

```powershell
Get-Content docs\context.md | Select-Object -First 15
```

**Attendu** :
```
# context.md — Contexte global du projet CandidatIA

> **Version** : 0.9.0
> **Dernière mise à jour** : 2026-10-15
...
```

### 3. Commit Git

```powershell
git add docs/context.md
git commit -m "docs: context.md v0.9.0 (PRICING-v2 + filigrane diagonal + quota UX)"
```

---

## 📊 Ce qui a changé dans cette v0.9.0

| Section | Changement |
|---|---|
| **En-tête** | Version + date + tags Git mis à jour |
| **2.1 Roadmap** | `PRICING-v2`, `FIX-watermark`, `FIX-quota-ux` marqués ✅ |
| **2.2 Capacités** | Ajout : 5 plans B2C, filigrane diagonal, encart quota UX |
| **3.2 Structure** | Ajout : `verify-pricing-v2.py`, `_safe_join_items`, `mark_paid_tier`, `QuotaExceededError` |
| **5.4 Filigrane** | Description technique complète (rotation 315°, opacity 0.55, #808080) |
| **10. Décisions** | Ajout décisions 10, 11, 12, 13 |
| **11. Dettes** | Retiré "Différenciation Phase B" (fait), "Filigrane" (fait), "Pro Illimité" (fait) |
| **15. Historique** | v0.9.0 documentée avec date du 2026-10-15 |

---

## 🎯 État final du projet

**PRICING-v2 est 100% appliqué et validé.** Le projet est prêt pour :

| Étape | Contenu |
|---|---|
| **Phase 8** | Déploiement production (Vercel + Render) |
| **Phase 9** | Conformité APDP |
| **Phase 10** | Marketing + B2B |

Dis-moi quand `docs/context.md` est à jour et on attaque **Phase 8** (déploiement) ou une autre priorité selon ton choix.