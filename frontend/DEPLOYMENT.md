# Deploiement CandidatIA - Frontend

## Pre-requis

- Compte Vercel gratuit (https://vercel.com)
- Backend deja deploye (voir backend/DEPLOYMENT.md)

## Etapes

### 1. Preparer le projet

```bash
cd frontend
npm install
npm run build
```

### 2. Installer Vercel CLI

```bash
npm install -g vercel
```

### 3. Se connecter

```bash
vercel login
```

### 4. Deployer en preview

```bash
vercel
```

### 5. Configurer les variables d environnement

Dans le dashboard Vercel > Settings > Environment Variables :

- `NEXT_PUBLIC_API_URL` = URL backend Render (ex: `https://candidatia-backend.onrender.com`)
- `NEXT_PUBLIC_SUPABASE_URL` = URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = cle anon Supabase

### 6. Deployer en production

```bash
vercel --prod
```

## Domaine personnalise (optionnel)

1. Vercel > Settings > Domains
2. Ajouter ton domaine
3. Configurer les DNS chez ton registraire
