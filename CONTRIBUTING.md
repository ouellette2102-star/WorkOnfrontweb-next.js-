# Guide de Contribution

Merci de votre intérêt pour contribuer à WorkOn !

## Structure du Projet

- `src/app/` - Pages Next.js (App Router)
- `src/components/` - Composants React réutilisables
- `src/lib/` - Utilitaires et logique métier
- `prisma/` - Schéma de base de données
- `scripts/` - Scripts utilitaires (seed, setup)

## Workflow

1. Créer une branche depuis `main`
2. Faire vos modifications
3. Tester localement (`pnpm dev`)
4. Vérifier le lint (`pnpm lint`)
5. Vérifier les types (`pnpm typecheck`)
6. Créer une Pull Request

## Standards de Code

- TypeScript strict
- ESLint + Prettier
- Composants fonctionnels avec hooks
- Server Components par défaut (Next.js 15)
- Client Components uniquement si nécessaire

## Tests

- Tests unitaires: `pnpm test`
- Tests e2e: `pnpm test:e2e`

## Questions?

Ouvrez une issue sur GitHub.

