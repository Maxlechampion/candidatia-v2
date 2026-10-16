# context.md — Contexte global du projet CandidatIA

> Version : 0.1.0
> Statut : Phase 0 livree

## 1. Vision

SaaS mondial, multilingue, de generation de packs de candidature IA.

## 2. Stack technique

- Frontend : Next.js 14 (Vercel)
- Backend : FastAPI (Render.com)
- IA : Orchestrateur multi-provider (Groq, Gemini, Mistral, Cohere)
- DB : Supabase (Postgres)
- Cache : Upstash Redis
- Paiement : FedaPay + Flutterwave + Raenest
- Emails : Brevo

## 3. Modele economique

Freemium + packs payants + abonnement Pro.

## 4. Contraintes

- Aucune cle API utilisateur
- Encaissement au Benin
- Documents dans la langue choisie explicitement
- Relance programmable par l utilisateur

## 5. Roadmap

- [x] Phase 0 : Fondations
- [ ] Phase 1 : Moteur IA multi-provider
- [ ] Phase 2 : Ingestion multi-format
- [ ] Phase 3 : Generation Word/PDF
- [ ] Phase 4 : Auth + DB + quotas
- [ ] Phase 5 : Paiement
- [ ] Phase 6 : Relance
- [ ] Phase 7 : Frontend
- [ ] Phase 8 : Deploiement
- [ ] Phase 9 : Marketing
