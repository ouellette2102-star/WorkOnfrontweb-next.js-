# 🚀 Démarrage Rapide - Worker Mission Dashboard

## ⚡ En 3 Étapes

### 1️⃣ Démarrer le Backend
```powershell
cd C:\Users\ouell\WorkOnApp\backend
npm run start:dev
```
✅ Backend écoute sur : `http://localhost:3001`

---

### 2️⃣ Démarrer le Frontend
```powershell
cd C:\Users\ouell\WorkOnApp
npm run dev
```
✅ Frontend écoute sur : `http://localhost:3000`

---

### 3️⃣ Accéder au Dashboard Worker
1. Ouvrir : `http://localhost:3000/sign-in`
2. Se connecter avec un compte **WORKER**
3. Automatiquement redirigé vers `/worker/dashboard`
4. Cliquer sur **"Missions disponibles"** 🔍
5. **Profiter du dashboard !** 🎉

---

## 🔧 Vérifications Rapides

### Backend OK ?
```bash
curl http://localhost:3001/api/v1/health
# Doit retourner un statut 200
```

### Frontend OK ?
```bash
curl http://localhost:3000
# Doit retourner du HTML Next.js
```

### API Missions OK ?
```bash
# Remplacer {TOKEN} par un vrai token Clerk
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:3001/api/v1/missions/feed?latitude=45.5&longitude=-73.5&maxDistance=20
# Doit retourner un array JSON de missions
```

---

## 🎯 Fonctionnalités à Tester

### Vue Liste 📋
- Affichage en grille de toutes les missions
- Badge de distance sur chaque carte
- Boutons "Réserver" et "Détails"

### Vue Swipe 💫
- Carte unique avec animations fluides
- 3 actions : ❌ Passer, ⭐ Sauvegarder, ✅ Réserver
- Progression : "X / Y missions"

### Vue Carte 🗺️
- Carte interactive Leaflet
- Marqueur bleu pour vous
- Marqueurs verts 💼 pour les missions
- Popup avec bouton "Réserver"

### Filtres ⚙️
- Catégorie (ex: Ménage, Plomberie)
- Distance (5km, 10km, 20km, 50km, Illimité)
- Bouton "Actualiser les missions"

### Notifications 🔔
- Toast de succès après réservation
- Toast d'erreur si problème
- Badge de notification pour l'employeur

---

## 🐛 Problèmes Fréquents

### ❌ "Failed to fetch"
**Cause** : Backend pas démarré ou mauvaise URL  
**Solution** : Vérifier que le backend tourne sur `:3001`

### ❌ "Impossible de récupérer le token"
**Cause** : Pas connecté ou session expirée  
**Solution** : Se reconnecter via Clerk

### ❌ "Géolocalisation refusée"
**Cause** : Permission refusée dans le navigateur  
**Solution** : Autoriser dans les paramètres du navigateur (icône à gauche de l'URL)

### ❌ Carte Leaflet ne s'affiche pas
**Cause** : CSS Leaflet pas chargé  
**Solution** : Refresh la page (le CSS se charge dynamiquement)

### ❌ "ERESOLVE" lors de npm install
**Cause** : Conflit de peer dependencies  
**Solution** : Utiliser `npm install sonner --legacy-peer-deps`

---

## 📝 Variables d'Environnement Requises

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_..."
PORT=3001
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

---

## 🎓 Ressources

- **Tests Complets** : `TESTS_WORKER_MISSION_DASHBOARD.md`
- **Résumé Technique** : `WORKER_DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- **Architecture Backend** : `backend/src/missions/missions.service.ts`
- **Composants Frontend** : `src/components/worker/`

---

## 🆘 Support

### Erreurs TypeScript ?
```bash
# Frontend
npm run typecheck

# Backend
cd backend
npx tsc --noEmit
```

### Problème de base de données ?
```bash
cd backend
npx prisma studio  # Ouvre l'UI pour inspecter les données
npx prisma migrate dev  # Si besoin de re-migrer
```

### Problème Clerk ?
- Vérifier que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` est dans `.env.local`
- Vérifier que l'utilisateur a bien le rôle `WORKER` dans Clerk Dashboard

---

**Bon développement ! 🚀**

