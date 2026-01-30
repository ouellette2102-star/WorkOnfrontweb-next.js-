# WorkOn - Uber du travail

Marketplace qui connecte clients (entreprises + résidentiels) avec travailleurs autonomes (90 métiers), avec matching instantané, découverte par carte, carrousels Netflix-style, et profils TikTok-style.

> 🔐 **Clerk** : renseignez `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY` (Dashboard Clerk → API Keys). En local, le mode dev “keyless” fonctionne, mais préparez ces variables pour staging/prod.

## 🚀 Stack Technique

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Auth**: Clerk (email/OTP + OAuth Google/Apple)
- **Payments**: Stripe Connect (marketplace multi-sided)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Storage**: Supabase Storage + UploadThing
- **Map**: Mapbox GL JS
- **Email**: Resend
- **Analytics**: PostHog, Vercel Analytics
- **Error Tracking**: Sentry

## 📋 Prérequis

- Node.js 20+
- pnpm (ou npm/yarn)
- PostgreSQL (local ou Supabase)
- Comptes pour: Clerk, Stripe, Mapbox, Resend (optionnel pour dev)

## 🛠️ Installation

1. **Cloner et installer les dépendances**

```bash
pnpm install
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env.local` à la racine avec les variables suivantes (voir `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/workon?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Mapbox (optionnel pour dev)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Configurer la base de données**

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer les migrations
pnpm db:migrate

# Seed les données de démo
pnpm db:seed
```

4. **Lancer le serveur de développement**

```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Routes d'authentification
│   ├── (marketing)/       # Landing, pricing, legal
│   ├── dashboard/         # Dashboard client/worker
│   ├── profile/           # Profils TikTok-style
│   └── map/               # Carte interactive
├── components/
│   ├── ui/                # Composants shadcn/ui
│   ├── carousel-row.tsx   # Carrousels Netflix-style
│   ├── worker-card.tsx    # Carte travailleur
│   ├── mission-card.tsx   # Carte mission
│   └── profile-header.tsx # En-tête profil
├── lib/
│   ├── prisma.ts          # Client Prisma
│   ├── env.ts             # Validation env
│   └── matching/          # Moteur de matching
└── middleware.ts          # Middleware Clerk
```

## 🎯 Fonctionnalités Principales

### Pour les Clients
- ✅ Découverte de travailleurs par catégories (carrousels)
- ✅ Recherche et filtres
- ✅ Publication de missions
- ✅ Matching intelligent
- ✅ Paiements sécurisés (Stripe Connect)

### Pour les Travailleurs
- ✅ Découverte de missions (carte + liste)
- ✅ Profil TikTok-style avec portfolio
- ✅ Gestion des compétences et tarifs
- ✅ Acceptation de missions
- ✅ Suivi des revenus

### Système de Matching
- Algorithme basé sur:
  - Distance géographique
  - Correspondance des compétences
  - Note et historique
  - Disponibilité
  - Ajustement prix

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests e2e
pnpm test:e2e
```

## 📦 Scripts Disponibles

- `pnpm dev` - Serveur de développement
- `pnpm build` - Build de production
- `pnpm start` - Serveur de production
- `pnpm lint` - Linter ESLint
- `pnpm typecheck` - Vérification TypeScript
- `pnpm db:migrate` - Migrations Prisma
- `pnpm db:seed` - Seed données de démo
- `pnpm db:studio` - Prisma Studio (GUI)

## 🔒 Sécurité

- Row Level Security (RLS) sur Supabase
- Middleware de protection des routes
- Validation Zod pour les inputs
- Audit logs pour actions critiques
- Rate limiting (à implémenter)

## 📄 Licence

Propriétaire - Tous droits réservés

## 🤝 Contribution

Ce projet est en développement actif. Pour contribuer, ouvrez une issue ou une pull request.

---

**Note légale**: WorkOn est une plateforme de mise en relation. Les clients contractent des **travailleurs autonomes**, non des employés. Chaque transaction est régie par un contrat de service indépendant.
