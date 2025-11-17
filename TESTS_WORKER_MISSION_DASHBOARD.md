# 📋 Tests Manuels - Worker Mission Dashboard

## 🎯 Objectif
Valider que le Worker Mission Dashboard fonctionne correctement de bout en bout, incluant toutes les vues (Liste, Swipe, Carte) et toutes les fonctionnalités (filtres, géolocalisation, réservation, notifications).

---

## ⚙️ Prérequis

### Backend (NestJS)
- [ ] Le backend tourne sur `http://localhost:3001`
- [ ] PostgreSQL est accessible et migrations Prisma appliquées
- [ ] Les variables d'environnement backend sont correctement configurées
- [ ] Le endpoint `/api/v1/missions/feed` est actif

### Frontend (Next.js)
- [ ] Le frontend tourne sur `http://localhost:3000`
- [ ] Sonner est installé (`npm install sonner --legacy-peer-deps`)
- [ ] Les variables d'environnement frontend sont correctement configurées :
  - `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...`
- [ ] Leaflet CSS est chargé dynamiquement

### Données de test
- [ ] Au moins 5 missions créées dans la base de données avec statut `CREATED`
- [ ] Les missions ont des coordonnées GPS valides (latitude, longitude)
- [ ] Les missions ont des catégories variées (Ménage, Plomberie, Jardinage, etc.)
- [ ] Les missions sont dans différentes villes

---

## 🧪 Tests à Exécuter

### 1️⃣ Authentification & Accès Worker

**Test 1.1 : Connexion en tant que Worker**
- [ ] Aller sur `http://localhost:3000/sign-in`
- [ ] Se connecter avec un compte Clerk ayant le rôle `WORKER`
- [ ] Vérifier la redirection vers `/worker/dashboard`

**Test 1.2 : Vérification du Dashboard Worker**
- [ ] Sur `/worker/dashboard`, vérifier :
  - [ ] Le greeting affiche "Salut {Prénom} 👋"
  - [ ] La localisation actuelle est affichée (ville)
  - [ ] Le bouton "Missions disponibles" pointe vers `/worker/missions`

**Test 1.3 : Protection des routes**
- [ ] En tant qu'employer, tenter d'accéder à `/worker/missions`
- [ ] Vérifier la redirection vers `/employer/dashboard`

---

### 2️⃣ Page Missions Worker - Chargement Initial

**Test 2.1 : Première visite**
- [ ] Aller sur `/worker/missions`
- [ ] Vérifier l'affichage du greeting "Salut {Prénom} 👋"
- [ ] Vérifier que le navigateur demande la permission de géolocalisation
- [ ] Accepter la géolocalisation

**Test 2.2 : Chargement des missions**
- [ ] Vérifier l'affichage d'un spinner de chargement
- [ ] Vérifier que les missions se chargent correctement
- [ ] Vérifier l'affichage du compteur : "X mission(s) près de vous"

**Test 2.3 : Géolocalisation refusée**
- [ ] Refuser la permission de géolocalisation
- [ ] Vérifier l'affichage d'une alerte jaune :
  - "⚠️ Impossible d'obtenir votre position. Certaines fonctionnalités (distance) seront limitées."
- [ ] Vérifier que les missions se chargent quand même (sans distance calculée)

---

### 3️⃣ Filtres de Missions

**Test 3.1 : Filtre par catégorie**
- [ ] Entrer "Ménage" dans le champ "Catégorie de mission"
- [ ] Cliquer sur "Actualiser les missions"
- [ ] Vérifier que seules les missions de catégorie "Ménage" sont affichées

**Test 3.2 : Filtre par distance (5 km)**
- [ ] Sélectionner "5 km" dans le dropdown "Distance maximale"
- [ ] Cliquer sur "Actualiser les missions"
- [ ] Vérifier que seules les missions à ≤ 5 km sont affichées

**Test 3.3 : Filtre par distance (Illimité)**
- [ ] Sélectionner "Illimité" dans le dropdown "Distance maximale"
- [ ] Cliquer sur "Actualiser les missions"
- [ ] Vérifier que toutes les missions sont affichées

**Test 3.4 : Combinaison de filtres**
- [ ] Entrer "Plomberie" dans la catégorie
- [ ] Sélectionner "10 km" dans la distance
- [ ] Cliquer sur "Actualiser les missions"
- [ ] Vérifier que les résultats respectent les deux critères

**Test 3.5 : Aucune mission trouvée**
- [ ] Entrer une catégorie inexistante (ex: "ZZZ")
- [ ] Cliquer sur "Actualiser les missions"
- [ ] Vérifier l'affichage de l'état vide :
  - Icône 🔍
  - "Aucune mission disponible"
  - "Essayez d'élargir votre rayon de recherche..."

---

### 4️⃣ Vue Liste (📋 Liste)

**Test 4.1 : Affichage de la grille**
- [ ] Cliquer sur le bouton "📋 Liste"
- [ ] Vérifier l'affichage d'une grille responsive (3 colonnes sur desktop)
- [ ] Vérifier que chaque carte affiche :
  - [ ] Badge de distance en haut (si géoloc active)
  - [ ] Titre de la mission
  - [ ] Nom de l'employeur ("par X")
  - [ ] Description (limitée à 3 lignes)
  - [ ] Catégorie avec icône 🏷️
  - [ ] Ville avec icône 📍
  - [ ] Taux horaire avec icône 💰 (en vert)
  - [ ] Date de début avec icône 📅
  - [ ] Boutons "Réserver" et "Détails"

**Test 4.2 : Hover sur une carte**
- [ ] Passer la souris sur une carte de mission
- [ ] Vérifier l'effet de survol (border bleue)

**Test 4.3 : Réservation depuis la liste**
- [ ] Cliquer sur "Réserver" sur une mission
- [ ] Vérifier l'affichage d'un toast de succès : "Mission réservée avec succès !"
- [ ] Vérifier que la mission disparaît de la liste
- [ ] Vérifier le rechargement automatique de la liste

**Test 4.4 : Bouton "Détails"**
- [ ] Cliquer sur "Détails" sur une mission
- [ ] Vérifier l'affichage d'une alerte (placeholder pour l'instant)

---

### 5️⃣ Vue Swipe (💫 Swipe)

**Test 5.1 : Affichage de la première carte**
- [ ] Cliquer sur le bouton "💫 Swipe"
- [ ] Vérifier l'affichage d'une seule carte centrée
- [ ] Vérifier l'animation d'entrée (fade in + scale + rotation)
- [ ] Vérifier l'indicateur de progression : "1 / X"

**Test 5.2 : Contenu de la carte**
- [ ] Vérifier l'affichage du badge de distance (en haut, bleu)
- [ ] Vérifier l'affichage du titre (3xl, gras)
- [ ] Vérifier l'affichage de l'employeur
- [ ] Vérifier l'affichage de la description complète
- [ ] Vérifier l'affichage des infos détaillées :
  - Catégorie
  - Lieu
  - Rémunération (en vert, XL)
  - Date de début
- [ ] Vérifier l'affichage des 3 boutons :
  - ❌ Passer (rouge)
  - ⭐ Sauvegarder (jaune)
  - ✅ Réserver (vert)

**Test 5.3 : Action "Passer"**
- [ ] Cliquer sur "❌ Passer"
- [ ] Vérifier l'animation de sortie (slide vers la gauche + rotation)
- [ ] Vérifier l'affichage de la mission suivante
- [ ] Vérifier la mise à jour du compteur : "2 / X"

**Test 5.4 : Action "Sauvegarder"**
- [ ] Cliquer sur "⭐ Sauvegarder"
- [ ] Vérifier l'animation de sortie (fade out)
- [ ] Vérifier l'affichage d'un toast info (fonctionnalité à venir)
- [ ] Vérifier l'affichage de la mission suivante

**Test 5.5 : Action "Réserver"**
- [ ] Cliquer sur "✅ Réserver"
- [ ] Vérifier l'animation de sortie (slide vers la droite + rotation)
- [ ] Vérifier l'affichage d'un toast de succès : "Mission réservée avec succès !"
- [ ] Vérifier l'affichage de la mission suivante

**Test 5.6 : Navigation précédente**
- [ ] Après avoir avancé de 2-3 missions
- [ ] Cliquer sur "← Mission précédente" (en bas)
- [ ] Vérifier le retour à la mission précédente

**Test 5.7 : Fin des missions**
- [ ] Parcourir toutes les missions
- [ ] Vérifier l'affichage de l'écran de fin :
  - Icône ✅
  - "Toutes les missions parcourues !"
  - "Revenez plus tard pour de nouvelles opportunités"

---

### 6️⃣ Vue Carte (🗺️ Carte)

**Test 6.1 : Chargement de la carte**
- [ ] Cliquer sur le bouton "🗺️ Carte"
- [ ] Vérifier le chargement de la carte Leaflet
- [ ] Vérifier l'affichage des tuiles OpenStreetMap
- [ ] Vérifier l'absence d'erreurs console liées à Leaflet

**Test 6.2 : Marqueur du worker**
- [ ] Si géoloc active, vérifier l'affichage du marqueur bleu du worker
- [ ] Cliquer sur le marqueur bleu
- [ ] Vérifier l'affichage du popup : "📍 Vous êtes ici"

**Test 6.3 : Marqueurs des missions**
- [ ] Vérifier l'affichage d'un marqueur vert 💼 pour chaque mission
- [ ] Vérifier que tous les marqueurs sont visibles (zoom automatique)
- [ ] Cliquer sur un marqueur de mission
- [ ] Vérifier l'affichage du popup avec :
  - Titre de la mission
  - Distance (si géoloc active)
  - Taux horaire (en vert)
  - Bouton "Réserver"

**Test 6.4 : Réservation depuis la carte**
- [ ] Cliquer sur le bouton "Réserver" dans un popup
- [ ] Vérifier l'affichage d'un toast de succès
- [ ] Vérifier la fermeture du popup
- [ ] Vérifier que le marqueur de la mission réservée disparaît

**Test 6.5 : Zoom et navigation**
- [ ] Zoomer/dézoomer sur la carte
- [ ] Déplacer la carte
- [ ] Vérifier que les marqueurs restent interactifs

**Test 6.6 : Alerte géoloc désactivée**
- [ ] Si géoloc refusée, vérifier l'affichage du bandeau jaune en bas :
  - "⚠️ Activez la géolocalisation pour voir votre position sur la carte"

---

### 7️⃣ Notifications Backend

**Test 7.1 : Notification à l'employeur (réservation)**
- [ ] En tant que worker, réserver une mission
- [ ] Se déconnecter et se reconnecter en tant qu'employeur (créateur de la mission)
- [ ] Aller sur `/notifications`
- [ ] Vérifier la présence d'une notification :
  - Type : `MISSION_STATUS_CHANGED`
  - Message : "Mission passée de CREATED à RESERVED"

**Test 7.2 : Badge de notification**
- [ ] Vérifier la présence du badge rouge sur l'icône de notification (en haut à droite)
- [ ] Vérifier le compteur de notifications non lues

---

### 8️⃣ Tests de Performance & UX

**Test 8.1 : Temps de chargement**
- [ ] Mesurer le temps de chargement initial de `/worker/missions`
- [ ] Objectif : < 2 secondes sur réseau rapide

**Test 8.2 : Réactivité des filtres**
- [ ] Changer de filtre et cliquer sur "Actualiser"
- [ ] Vérifier que le rechargement est fluide (< 1 seconde)

**Test 8.3 : Animations fluides**
- [ ] Vérifier que les animations swipe sont fluides (60 fps)
- [ ] Vérifier l'absence de lag lors du changement de vue

**Test 8.4 : Responsive design**
- [ ] Tester sur mobile (375px de largeur)
- [ ] Vérifier que la grille passe en 1 colonne
- [ ] Vérifier que les filtres sont empilés verticalement
- [ ] Vérifier que la carte est utilisable sur mobile

**Test 8.5 : Gestion des erreurs réseau**
- [ ] Arrêter le backend
- [ ] Tenter de charger les missions
- [ ] Vérifier l'affichage d'une erreur claire : "Erreur lors du chargement des missions"
- [ ] Vérifier l'absence de crash de l'app

---

### 9️⃣ Tests API Backend

**Test 9.1 : Endpoint `/api/v1/missions/feed`**
- [ ] Ouvrir Postman ou Insomnia
- [ ] GET `http://localhost:3001/api/v1/missions/feed?latitude=45.5&longitude=-73.5&maxDistance=20&category=Ménage`
- [ ] Headers : `Authorization: Bearer {CLERK_TOKEN}`
- [ ] Vérifier la réponse 200 OK
- [ ] Vérifier la structure JSON :
  ```json
  [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "category": "string | null",
      "city": "string | null",
      "address": "string | null",
      "hourlyRate": "number | null",
      "startsAt": "string | null",
      "endsAt": "string | null",
      "status": "CREATED",
      "employerId": "string",
      "employerName": "string | null",
      "priceCents": "number",
      "currency": "string",
      "distance": "number | null",
      "latitude": "number | null",
      "longitude": "number | null",
      "createdAt": "string"
    }
  ]
  ```
- [ ] Vérifier que `distance` est bien calculée
- [ ] Vérifier que les missions sont triées par distance (croissant)

**Test 9.2 : Endpoint `/api/v1/missions/{id}/reserve`**
- [ ] POST `http://localhost:3001/api/v1/missions/{missionId}/reserve`
- [ ] Headers : `Authorization: Bearer {CLERK_TOKEN_WORKER}`
- [ ] Vérifier la réponse 200 OK
- [ ] Vérifier que le statut de la mission passe à `RESERVED`
- [ ] Vérifier que `workerId` est assigné

**Test 9.3 : Protection des routes (worker uniquement)**
- [ ] En tant qu'employer, tenter d'appeler `/api/v1/missions/feed`
- [ ] Vérifier la réponse 403 Forbidden

---

### 🔟 Tests de Régression

**Test 10.1 : Dashboard employer intact**
- [ ] Se connecter en tant qu'employer
- [ ] Aller sur `/employer/dashboard`
- [ ] Vérifier que rien n'est cassé
- [ ] Vérifier que la création de mission fonctionne toujours

**Test 10.2 : Notifications existantes intactes**
- [ ] Vérifier que les notifications de chat fonctionnent toujours
- [ ] Vérifier que les notifications de paiement fonctionnent toujours

**Test 10.3 : Time tracking intact**
- [ ] Vérifier que le time tracking sur les missions fonctionne toujours

**Test 10.4 : Photos de mission intactes**
- [ ] Vérifier que l'upload de photos fonctionne toujours

**Test 10.5 : Chat de mission intact**
- [ ] Vérifier que le chat entre worker et employer fonctionne toujours

---

## ✅ Critères de Validation Globaux

### Fonctionnalités Core
- [ ] ✅ Toutes les vues (Liste, Swipe, Carte) fonctionnent
- [ ] ✅ Les filtres (catégorie, distance) fonctionnent
- [ ] ✅ La géolocalisation fonctionne (calcul de distance)
- [ ] ✅ La réservation de mission fonctionne
- [ ] ✅ Les notifications sont envoyées à l'employeur

### UX & Design
- [ ] ✅ Animations fluides (framer-motion)
- [ ] ✅ Toasts de notification (sonner)
- [ ] ✅ États de chargement clairs
- [ ] ✅ États vides gérés
- [ ] ✅ Erreurs gérées avec messages clairs
- [ ] ✅ Responsive design (mobile + desktop)

### Sécurité & Architecture
- [ ] ✅ Routes protégées (worker uniquement)
- [ ] ✅ Tokens Clerk valides requis
- [ ] ✅ Aucune API existante n'est cassée
- [ ] ✅ Aucune feature existante n'est cassée
- [ ] ✅ Pas de fuite de données sensibles

### Performance
- [ ] ✅ Chargement initial < 2 secondes
- [ ] ✅ Réponse API < 500 ms
- [ ] ✅ Pas de lag visible dans les animations
- [ ] ✅ Pas de memory leak (carte Leaflet cleanup OK)

---

## 🐛 Bugs Connus / Limitations

### Fonctionnalités en Placeholder
- [ ] Bouton "Détails" dans la liste (alerte placeholder)
- [ ] Bouton "Sauvegarder" dans le swipe (toast placeholder)

### Améliorations Futures
- [ ] Implémentation de la page de détails de mission
- [ ] Implémentation de la fonctionnalité "Sauvegarder pour plus tard"
- [ ] Ajout de filtres avancés (date, salaire min/max)
- [ ] Ajout du calcul d'ETA (temps estimé d'arrivée)
- [ ] Ajout de la fonction "Signaler un problème"

---

## 🚀 Commandes de Lancement

### Backend
```bash
cd backend
npm run start:dev
```

### Frontend
```bash
cd C:\Users\ouell\WorkOnApp
npm run dev
```

### Base de données
```bash
cd backend
npx prisma studio  # Pour inspecter les données
```

---

## 📊 Résultat Final

**Date du test** : _____________________  
**Testeur** : _____________________  
**Environnement** : _____________________  

### Résumé
- Tests réussis : _____ / _____
- Tests échoués : _____ / _____
- Bugs critiques trouvés : _____

### Décision
- [ ] ✅ Worker Mission Dashboard validé pour production
- [ ] ⚠️ Validation conditionnelle (bugs mineurs à corriger)
- [ ] ❌ Validation refusée (bugs critiques)

### Commentaires
_____________________________________________
_____________________________________________
_____________________________________________

