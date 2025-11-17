# 🧪 GUIDE DE TEST MANUEL - WorkOn MVP

**Date** : 17 novembre 2025  
**Version** : MVP Production-Ready  
**Testeur** : Mathieu Ouellette

---

## 🚀 DÉMARRAGE DE L'APPLICATION

### 1. Prérequis

✅ **Node.js** : v18+ installé  
✅ **PostgreSQL** : Actif et accessible  
✅ **Ports libres** : 3000 (frontend) et 3001 (backend)  
✅ **Variables d'environnement** : Configurées (`.env` et `.env.local`)

---

### 2. Lancer le Backend (NestJS)

```bash
# Terminal 1 - Backend
cd C:\Users\ouell\WorkOnApp\backend
npm install
npm run start:dev
```

**✅ Vérification** :
- Le terminal affiche : `Application is running on: http://localhost:3001/api/v1`
- Aucune erreur de compilation TypeScript
- Les routes sont mappées (logs NestJS)

**🔗 Test API** :
```bash
# Ouvrir un navigateur
http://localhost:3001/api/v1
# Doit retourner: {"message":"WorkOn Backend API","version":"1.0.0"}
```

---

### 3. Lancer le Frontend (Next.js 16)

```bash
# Terminal 2 - Frontend
cd C:\Users\ouell\WorkOnApp
npm install
npm run dev
```

**✅ Vérification** :
- Le terminal affiche : `- ready started server on 0.0.0.0:3000`
- Aucune erreur de compilation
- Next.js compile les pages

**🔗 Accès** :
```
http://localhost:3000
```

---

## 👤 SCÉNARIO 1 : PARCOURS WORKER (Travailleur)

### Étape 1.1 : Création de compte + Onboarding

1. **Ouvrir** : `http://localhost:3000`
2. **Cliquer** : "Publier un call" OU "S'inscrire" (bouton en haut à droite)
3. **Créer compte Clerk** :
   - Email : `worker-test@workon.app`
   - Mot de passe : au choix
   - Confirmer l'email si nécessaire (check Clerk Dashboard)

4. **Redirection automatique** : `/onboarding/role`
5. **Choisir rôle** : **WORKER** (Travailleur)
6. **Cliquer** : "Continuer"

7. **Compléter profil** (`/onboarding/details`) :
   - Nom complet : `Jean Tremblay`
   - Téléphone : `514-555-1234`
   - Ville : `Montréal`
8. **Cliquer** : "Terminer"

**✅ Vérifications** :
- Redirection vers `/worker/dashboard`
- Message de bienvenue affiché
- Statistiques visibles (0 missions actives, 0 complétées)
- 4 cartes d'actions rapides : Missions, Paiements, Notifications, Messages

---

### Étape 1.2 : Consulter missions disponibles

1. **Cliquer** : Carte "🔍 Missions disponibles" OU menu latéral "Missions"
2. **Page** : `/worker/missions`
3. **Observer** :
   - Filtres : Distance (5-50 km), Catégorie
   - Mode d'affichage : Liste / Swipe / Carte
   - Localisation demandée (accepter ou refuser)

**✅ Vérifications** :
- Les missions sont affichées (si aucune : message "Aucune mission disponible")
- Les filtres fonctionnent
- Le bouton "Réserver" est visible sur chaque mission

---

### Étape 1.3 : Réserver une mission

**Préparation** : S'assurer qu'une mission CREATED existe (créée par un Employer)

1. **Trouver une mission** dans la liste
2. **Cliquer** : "Réserver cette mission"
3. **Attendre** : Toast de confirmation "Mission réservée avec succès !"
4. **Revenir** : Dashboard (`/worker/dashboard`)

**✅ Vérifications** :
- Section "Missions actives" affiche la mission réservée
- Statut : `RESERVED`
- Boutons disponibles : "Démarrer", "Voir détails"

---

### Étape 1.4 : Démarrer une mission

1. **Dans Dashboard** : Section "Missions actives"
2. **Cliquer** : "Démarrer" sur la mission réservée
3. **Attendre** : Toast "Mission démarrée"

**✅ Vérifications** :
- Statut change à `IN_PROGRESS`
- Time Tracker apparaît avec horloge en cours
- Bouton "Check-in" visible

---

### Étape 1.5 : Time Tracking (Check-in / Check-out)

1. **Cliquer** : "Check-in" (enregistrer début de travail)
2. **Attendre** quelques secondes
3. **Cliquer** : "Check-out" (enregistrer fin de travail)
4. **Observer** : Durée cumulative s'affiche

**✅ Vérifications** :
- Les logs temps sont enregistrés
- La durée totale est calculée correctement
- Possibilité de faire plusieurs check-in/check-out

---

### Étape 1.6 : Upload Photos de mission

1. **Cliquer** : "Ajouter des photos" (ou bouton similaire)
2. **Sélectionner** : 1-3 photos depuis ton ordinateur
3. **Attendre** : Upload terminé
4. **Observer** : Photos affichées dans la mission

**✅ Vérifications** :
- Les photos sont visibles
- Possibilité de supprimer une photo
- Les photos sont associées à la mission

---

### Étape 1.7 : Terminer une mission

1. **Cliquer** : "Terminer la mission"
2. **Confirmer** si demandé
3. **Attendre** : Toast "Mission terminée"

**✅ Vérifications** :
- Statut change à `COMPLETED`
- La mission disparaît de "Missions actives"
- La mission apparaît dans "Historique"
- Time Tracker arrêté automatiquement

---

### Étape 1.8 : Onboarding Stripe (Recevoir des paiements)

1. **Cliquer** : Carte "💰 Paiements" OU aller sur `/worker/payments`
2. **Observer** : Banner "Complétez votre onboarding Stripe"
3. **Cliquer** : "Commencer l'onboarding Stripe"
4. **Redirection** : Stripe Connect (site externe)
5. **Compléter** : Formulaire Stripe (mode Test) :
   - Informations personnelles
   - Adresse
   - Informations bancaires test
6. **Terminer** : Onboarding Stripe
7. **Redirection** : `/worker/payments/onboarding/return`

**✅ Vérifications** :
- Message "Onboarding complété !" s'affiche
- Retour sur `/worker/payments`
- Banner disparu
- Stats de paiement affichées
- Historique vide (normal, pas encore de paiement)

---

### Étape 1.9 : Chat avec Employeur

**Préparation** : Mission doit être réservée et avoir un Employer

1. **Aller** : Détails d'une mission (`/missions/mine` puis cliquer sur une mission)
2. **Cliquer** : "💬 Chat" ou onglet Chat
3. **Écrire** : "Bonjour, j'ai une question sur la mission"
4. **Envoyer**

**✅ Vérifications** :
- Message envoyé apparaît instantanément
- Horodatage correct
- L'Employer recevra une notification

---

### Étape 1.10 : Notifications

1. **Cliquer** : Icône cloche (🔔) en haut à droite OU `/notifications`
2. **Observer** : Liste des notifications
3. **Cliquer** : Sur une notification

**✅ Vérifications** :
- Types de notifications :
  - `NEW_MESSAGE` : Redirection vers `/missions/[id]/chat`
  - `MISSION_STATUS_CHANGED` : Redirection vers `/missions/mine`
- Badge avec nombre non lus visible
- Notification marquée comme lue après clic

---

## 👔 SCÉNARIO 2 : PARCOURS EMPLOYER (Employeur)

### Étape 2.1 : Création de compte + Onboarding

1. **Se déconnecter** (Worker) : Clerk UserButton → Sign Out
2. **Ouvrir** : `http://localhost:3000`
3. **S'inscrire** avec un **nouveau compte** :
   - Email : `employer-test@workon.app`
   - Confirmer

4. **Choisir rôle** : **EMPLOYER** (Employeur)
5. **Compléter profil** :
   - Nom : `Marie Dubois`
   - Téléphone : `450-555-5678`
   - Ville : `Laval`

**✅ Vérifications** :
- Redirection vers `/employer/dashboard`
- Message personnalisé affiché
- 4 cartes d'actions rapides

---

### Étape 2.2 : Créer une mission

1. **Cliquer** : Carte "➕ Créer une mission" OU `/missions/new`
2. **Remplir formulaire** :
   - **Titre** : `Aide ménage résidentiel`
   - **Description** : `Besoin d'aide pour nettoyer un appartement 3½`
   - **Catégorie** : `Ménage` (ou autre)
   - **Ville** : `Montréal`
   - **Adresse** : `123 Rue Example, Montréal`
   - **Prix** : `100` (en dollars)
   - **Date début** : Demain
   - **Date fin** : Après-demain
3. **Cliquer** : "Créer la mission"

**✅ Vérifications** :
- Toast "Mission créée avec succès !"
- Redirection vers `/missions/mine`
- La mission apparaît dans la liste
- Statut : `CREATED`

---

### Étape 2.3 : Voir les missions créées

1. **Aller** : `/missions/mine` (ou carte "Mes missions")
2. **Observer** : Liste des missions

**✅ Vérifications** :
- Toutes les missions créées sont visibles
- Statuts affichés : CREATED, RESERVED, IN_PROGRESS, COMPLETED
- Bouton "Créer une mission" visible

---

### Étape 2.4 : Voir les détails d'une mission

1. **Cliquer** : Sur une carte de mission
2. **Observer** : Détails complets

**✅ Vérifications** :
- Titre, description, ville, adresse
- Prix, dates
- Statut actuel
- Worker assigné (si réservée)
- Onglets : Détails / Chat / Temps / Photos

---

### Étape 2.5 : Chat avec Worker

**Préparation** : Mission doit être réservée par un Worker

1. **Onglet** : "Chat"
2. **Écrire** : "Bonjour ! Merci d'avoir accepté la mission"
3. **Envoyer**

**✅ Vérifications** :
- Message envoyé visible
- Messages du Worker visibles (s'il a écrit)
- Horodatage correct

---

### Étape 2.6 : Voir les logs temps (Time Tracking)

**Préparation** : Worker doit avoir fait des check-in/check-out

1. **Onglet** : "Temps" (ou "Time Logs")
2. **Observer** : Liste des check-in / check-out

**✅ Vérifications** :
- Date/heure de chaque log
- Type : CHECK_IN ou CHECK_OUT
- Note (si présente)
- Durée cumulative affichée

---

### Étape 2.7 : Voir les photos de mission

**Préparation** : Worker doit avoir uploadé des photos

1. **Onglet** : "Photos"
2. **Observer** : Galerie de photos

**✅ Vérifications** :
- Toutes les photos uploadées sont visibles
- Possibilité de cliquer pour agrandir
- Nom du fichier / date d'upload visible

---

### Étape 2.8 : Payer une mission (Stripe)

**Préparation** :
- Mission doit être `COMPLETED`
- Worker doit avoir complété l'onboarding Stripe

1. **Aller** : `/missions/mine`
2. **Trouver** : Mission COMPLETED
3. **Cliquer** : "Payer la mission" (bouton à ajouter si manquant → aller sur `/missions/[id]/pay`)
4. **Observer** : Résumé de paiement
   - Montant mission : 100 $
   - Frais plateforme (12%) : 12 $
   - Total à payer : 100 $ (WorkOn prélève les frais automatiquement)
5. **Cliquer** : "Procéder au paiement"
6. **Stripe Elements** : Formulaire de carte apparaît
7. **Entrer carte test** :
   - Numéro : `4242 4242 4242 4242`
   - Expiry : `12/34`
   - CVC : `123`
8. **Cliquer** : "Payer maintenant"
9. **Attendre** : Toast "Paiement effectué avec succès !"

**✅ Vérifications** :
- Redirection vers `/missions/mine`
- Statut mission change (ou reste COMPLETED)
- DB : Payment créé avec `status = SUCCEEDED`
- Worker reçoit notification
- Employer reçoit notification
- Worker voit paiement dans `/worker/payments` (historique)

---

### Étape 2.9 : Notifications Employer

1. **Cliquer** : Icône cloche (🔔) `/notifications`
2. **Observer** : Notifications

**✅ Vérifications** :
- Notifications de réservation de mission
- Notifications de changement de statut
- Notifications de nouveaux messages
- Redirection appropriée après clic

---

## 🗺️ SCÉNARIO 3 : FONCTIONNALITÉS TRANSVERSES

### Étape 3.1 : Carte interactive (Map)

1. **Aller** : `/map`
2. **Observer** : Carte + side panel

**✅ Vérifications** :
- Carte chargée (ou placeholder)
- Side panel avec missions à proximité
- Possibilité de cliquer sur une mission

**⚠️ Note** : La carte Leaflet/Mapbox nécessite une clé API configurée

---

### Étape 3.2 : Profil utilisateur

1. **Cliquer** : Menu latéral "Profil" OU `/profile`
2. **Observer** : Informations profil

**✅ Vérifications** :
- Nom complet, téléphone, ville affichés
- Rôle principal affiché
- Possibilité de modifier (si implémenté)

---

### Étape 3.3 : Navigation & Rôles

1. **Tester redirection automatique** :
   - Worker essayant d'accéder `/employer/dashboard` → Redirigé vers `/worker/dashboard`
   - Employer essayant d'accéder `/worker/dashboard` → Redirigé vers `/employer/dashboard`
   - Utilisateur non connecté → Redirigé vers `/sign-in`

**✅ Vérifications** :
- Protection des routes fonctionne
- Pas d'erreur 404
- Messages clairs si accès refusé

---

### Étape 3.4 : Géolocalisation (si activée)

1. **Dans** `/worker/missions` (Worker)
2. **Activer** : Localisation dans le navigateur (si demandé)
3. **Observer** : Missions triées par distance

**✅ Vérifications** :
- Distance affichée pour chaque mission
- Tri par proximité
- Carte affiche position utilisateur

---

## ✅ CHECKLIST DE VALIDATION GLOBALE

### Authentification & Onboarding
- [ ] Création compte Worker fonctionne
- [ ] Création compte Employer fonctionne
- [ ] Onboarding rôle fonctionne
- [ ] Onboarding détails fonctionne
- [ ] Redirection après onboarding correcte

### Worker
- [ ] Dashboard Worker affiche statistiques
- [ ] Liste missions disponibles fonctionne
- [ ] Réservation mission fonctionne
- [ ] Démarrage mission fonctionne
- [ ] Time Tracking (check-in/check-out) fonctionne
- [ ] Upload photos fonctionne
- [ ] Terminer mission fonctionne
- [ ] Onboarding Stripe fonctionne
- [ ] Historique paiements visible (si payé)

### Employer
- [ ] Dashboard Employer affiche sections
- [ ] Création mission fonctionne
- [ ] Liste "Mes missions" fonctionne
- [ ] Voir détails mission fonctionne
- [ ] Chat avec Worker fonctionne
- [ ] Voir logs temps fonctionne
- [ ] Voir photos fonctionne
- [ ] Paiement Stripe fonctionne

### Chat & Notifications
- [ ] Chat temps réel fonctionne
- [ ] Messages envoyés/reçus affichés
- [ ] Notifications créées automatiquement
- [ ] Badge notification compte correct
- [ ] Redirection depuis notification fonctionne
- [ ] Marquer comme lu fonctionne

### Stripe Connect
- [ ] Onboarding Worker Stripe complet
- [ ] Création PaymentIntent fonctionne
- [ ] Paiement carte test passe
- [ ] Webhook reçu et traité
- [ ] Payment DB créé avec bon statut
- [ ] Worker reçoit paiement (88%)
- [ ] WorkOn prélève frais (12%)

### Sécurité & Performance
- [ ] Routes protégées fonctionnent
- [ ] Worker ne peut pas accéder routes Employer
- [ ] Employer ne peut pas accéder routes Worker
- [ ] Tokens Clerk valides
- [ ] Aucune clé secrète exposée
- [ ] Pas de crash runtime
- [ ] Performance acceptable (< 3s chargement)

---

## 🐛 BUGS CONNUS / LIMITATIONS

### Limitations techniques
1. **Carte interactive** : Nécessite clé Mapbox configurée
2. **Géolocalisation** : Utilisateur doit accepter dans le navigateur
3. **Mode Test Stripe** : Utiliser uniquement cartes test
4. **Webhook local** : Utiliser Stripe CLI pour tester webhooks en local

### Fonctionnalités futures
- Système de rating/reviews
- Recherche avancée missions
- Filtre par compétences
- Dashboard analytics avancé
- Exports PDF (factures, contrats)

---

## 📝 RAPPORT DE BUGS (À REMPLIR)

| #  | Page/Feature | Description Bug | Sévérité | Reproduit? |
|----|--------------|-----------------|----------|------------|
| 1  |              |                 |          | ☐ Oui ☐ Non |
| 2  |              |                 |          | ☐ Oui ☐ Non |
| 3  |              |                 |          | ☐ Oui ☐ Non |

---

## ✅ CONCLUSION DU TEST

**Date** : _____________  
**Testeur** : Mathieu Ouellette

**Note globale** : ☐ Excellent  ☐ Bon  ☐ Moyen  ☐ À retravailler

**Commentaires** :
_____________________________________________
_____________________________________________
_____________________________________________

**Prêt pour production ?** : ☐ Oui  ☐ Non (raison : _____________)

---

*Guide généré automatiquement - Audit complet WorkOn MVP*

