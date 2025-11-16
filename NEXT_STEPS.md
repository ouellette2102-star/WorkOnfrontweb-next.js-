# Prochaines Étapes - WorkOn

## ✅ Complété

- [x] Structure Next.js 15 + TypeScript + Tailwind
- [x] Schéma Prisma complet (User, WorkerProfile, Mission, etc.)
- [x] Configuration Clerk avec middleware
- [x] Pages principales (landing, dashboard, map, profile)
- [x] Composants UI (carrousels, cartes, profils)
- [x] Système de matching algorithmique
- [x] Script de seed avec données de démo
- [x] Configuration de base (ESLint, TypeScript, tests)

## 🚧 À Implémenter

### Priorité Haute

1. **Stripe Connect Integration**
   - [ ] Configuration Stripe Connect pour travailleurs
   - [ ] Webhooks Stripe (payment_intent, connect account)
   - [ ] Logique de hold/capture des paiements
   - [ ] Calcul des frais de plateforme (8-15%)
   - [ ] Gestion des remboursements et disputes

2. **Onboarding Complet**
   - [ ] Création automatique du profil User après sign-up Clerk
   - [ ] Flow onboarding worker (catégories, compétences, portfolio)
   - [ ] Flow onboarding client (création org, vérification)
   - [ ] Acceptation des documents légaux (versionnés)

3. **Création de Mission (Server Action)**
   - [ ] Action serveur pour créer une mission
   - [ ] Validation Zod
   - [ ] Géocodage de l'adresse (Mapbox Geocoding API)
   - [ ] Déclenchement du matching automatique

4. **Matching Automatique**
   - [ ] Job Inngest/Supabase cron pour matching
   - [ ] Notification des travailleurs matchés
   - [ ] Interface swipe deck pour accepter/refuser

5. **Mapbox Integration**
   - [ ] Initialisation de la carte Mapbox
   - [ ] Clustering des pins
   - [ ] Synchronisation carte/liste
   - [ ] Filtres par distance

### Priorité Moyenne

6. **Système de Reviews**
   - [ ] Formulaire de review après completion
   - [ ] Modération des reviews
   - [ ] Calcul automatique des ratings

7. **CRM Light**
   - [ ] Inbox des leads (workers)
   - [ ] Pipeline (Nouveau → Contacté → Devis → Gagné/Perdu)
   - [ ] Templates d'emails Resend
   - [ ] Favoris clients

8. **UploadThing Integration**
   - [ ] Upload avatars
   - [ ] Upload portfolio (images/vidéos)
   - [ ] Validation taille/type

9. **Notifications**
   - [ ] Système de notifications en temps réel
   - [ ] Notifications push (OneSignal - deferred)
   - [ ] Centre de notifications

10. **Analytics & Monitoring**
    - [ ] PostHog events tracking
    - [ ] Sentry error tracking
    - [ ] Vercel Analytics

### Priorité Basse

11. **Feature Flags**
    - [ ] Middleware de feature flags
    - [ ] Limites FREE tier
    - [ ] Activation/désactivation de modules

12. **Admin Panel**
    - [ ] Dashboard admin
    - [ ] Gestion utilisateurs
    - [ ] Modération reviews
    - [ ] Gestion disputes
    - [ ] Ajustement des poids de matching

13. **i18n**
    - [ ] Configuration next-intl
    - [ ] Traduction fr-CA / en-CA
    - [ ] Sélecteur de langue

14. **Tests E2E Complets**
    - [ ] Test onboarding
    - [ ] Test publication mission
    - [ ] Test acceptation mission
    - [ ] Test paiement
    - [ ] Test review

15. **Performance**
    - [ ] Optimisation images (next/image)
    - [ ] Lazy loading composants
    - [ ] Lighthouse score ≥ 90

## 📝 Notes

- Les clés API doivent être configurées dans `.env.local`
- Le seed crée des données de démo (200 workers, 60 missions)
- Le matching algorithmique est implémenté mais nécessite un job pour s'exécuter automatiquement
- Stripe Connect nécessite une configuration spécifique pour les marketplaces

## 🔗 Liens Utiles

- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Stripe Connect](https://stripe.com/docs/connect)
- [Documentation Mapbox](https://docs.mapbox.com/)
- [Documentation Prisma](https://www.prisma.io/docs)

