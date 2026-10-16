# CandidatIA

SaaS mondial et multilingue de generation de packs de candidature propulse par IA.

## Vision

Permettre a tout candidat, ou qu il soit, de generer en quelques secondes un pack
de candidature complet (CV methode STAR + Lettre + Guide d entretien + Relance)
dans la langue de son choix, avec un score de matching ATS, sans fournir de cle API.

## Architecture

- Frontend : Next.js 14 (Vercel)
- Backend : FastAPI (Render.com)
- IA : Orchestrateur multi-provider (Groq, Gemini, Mistral, Cohere)
- DB : Supabase (Postgres)
- Cache : Upstash Redis
- Paiement : FedaPay + Flutterwave + Raenest (encaissement au Benin)
- Emails : Brevo

## Quick Start

~~~bash
# 1. Creer le projet
node setup-phase0.js

# 2. Entrer dans le dossier
cd candidatia

# 3. Configurer l environnement
cp backend/.env.example backend/.env
# editer backend/.env et renseigner les cles API

# 4. Lancer avec Docker
docker-compose up --build
~~~

Backend : http://localhost:8000
Swagger : http://localhost:8000/docs
Health : http://localhost:8000/health

## Documentation

- [Contexte](docs/context.md)
- [Architecture](docs/architecture.md)

## Licence

Proprietaire - Tous droits reserves.
