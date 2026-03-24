/// Centralized UI tokens for WorkOn branding consistency.
///
/// This file contains all design tokens (spacing, radius, colors, microcopy)
/// to ensure consistent UX across the app.
///
/// **PR-F08:** Initial implementation.
library;

import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// SPACING TOKENS
// ─────────────────────────────────────────────────────────────────────────────

/// Standard spacing values used across the app.
abstract final class WkSpacing {
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double xxxxl = 48.0;
  static const double xxxxxl = 64.0;

  /// Horizontal page padding.
  static const double pagePadding = 20.0;

  /// Section gap.
  static const double sectionGap = 20.0;

  /// Card internal padding.
  static const double cardPadding = 16.0;

  /// Hero section vertical padding.
  static const double heroPadding = 40.0;

  /// Bottom nav safe area buffer.
  static const double bottomNavHeight = 68.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// RADIUS TOKENS
// ─────────────────────────────────────────────────────────────────────────────

/// Standard border radius values.
abstract final class WkRadius {
  static const double xs = 6.0;
  static const double sm = 8.0;
  static const double md = 10.0;
  static const double lg = 12.0;
  static const double xl = 16.0;
  static const double xxl = 20.0;
  static const double xxxl = 24.0;

  /// Default card radius.
  static const double card = 16.0;

  /// Large card radius (hero cards, swipe cards).
  static const double cardLarge = 24.0;

  /// Button radius.
  static const double button = 10.0;

  /// Pill button / chip radius (full rounded).
  static const double pill = 999.0;

  /// Badge radius.
  static const double badge = 12.0;

  /// Full circle.
  static const double circle = 100.0;

  /// Bottom sheet top corners.
  static const double bottomSheet = 24.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// MICROCOPY (FRENCH)
// ─────────────────────────────────────────────────────────────────────────────

/// Centralized French microcopy strings.
abstract final class WkCopy {
  // ─── Loading states ───
  static const String loading = 'Chargement…';
  static const String loadingMissions = 'Chargement…';

  // ─── Empty states ───
  static const String emptyMissions = 'Aucune mission disponible près de toi.';
  static const String emptyGeneric = 'Aucun élément à afficher.';

  // ─── Error states ───
  static const String errorMissions = 'Impossible de charger les missions.';
  static const String errorGeneric = 'Une erreur est survenue.';
  static const String errorNotFound = 'Élément introuvable.';
  static const String errorMissionNotFound = 'Mission introuvable.';
  static const String errorNetwork = 'Connexion impossible. Vérifie ta connexion.';
  static const String errorTimeout = 'Délai de connexion dépassé. Réessaie.';
  static const String errorServer = 'Erreur serveur. Réessaie plus tard.';
  static const String errorUnexpected = 'Une erreur inattendue est survenue.';

  // ─── Actions ───
  static const String retry = 'Réessayer';
  static const String back = 'Retour';
  static const String seeAll = 'Voir tout';
  static const String refresh = 'Actualiser';

  // ─── Section titles ───
  static const String missionsNearby = 'Missions à proximité';
  static const String popularServices = 'Services populaires';
  static const String justForYou = 'Juste pour toi';
  static const String missionDetail = 'Détails mission';

  // ─── Mission detail labels ───
  static const String description = 'Description';
  static const String location = 'Localisation';
  static const String information = 'Informations';
  static const String noDescription = 'Aucune description fournie.';
  static const String city = 'Ville';
  static const String address = 'Adresse';
  static const String coordinates = 'Coordonnées';
  static const String distance = 'Distance';
  static const String category = 'Catégorie';
  static const String publishedOn = 'Publiée le';
  static const String budget = 'Budget';

  // ─── PR-F09: Mission actions ───
  static const String actions = 'Actions';
  static const String apply = 'Postuler';
  static const String applyDisabled = 'Mission non disponible';
  static const String share = 'Partager';
  static const String save = 'Sauvegarder';
  static const String comingSoon = 'Bientôt disponible';
  static const String saved = 'Sauvegardé !';
  static const String shared = 'Lien copié !';
  static const String legalDisclaimer = 'WorkOn est une plateforme de mise en relation. Aucun lien d\'emploi. Prestataires autonomes.';

  // ─── PR-F10: Missions filters ───
  static const String filters = 'Filtres';
  static const String sortBy = 'Trier par';
  static const String sortProximity = 'Proximité';
  static const String sortPriceAsc = 'Prix ↑';
  static const String sortPriceDesc = 'Prix ↓';
  static const String sortNewest = 'Nouveau';
  static const String allCategories = 'Toutes';

  // ─── PR-F11: Saved missions ───
  static const String savedMissions = 'Sauvegardées';
  static const String savedSuccess = 'Mission sauvegardée';
  static const String unsavedSuccess = 'Retirée des sauvegardées';
  static const String emptySavedMissions = 'Aucune mission sauvegardée.';
  static const String tapToSaveHint = 'Appuie sur l\'icône pour sauvegarder une mission';

  // ─── PR-F12: Share mission ───
  static const String shareError = 'Impossible de partager';

  // ─── PR-F15: Apply to mission ───
  static const String applySuccess = 'Candidature envoyée !';
  static const String applyAlreadyApplied = 'Vous avez déjà postulé à cette mission.';
  static const String applyError = 'Une erreur est survenue. Réessaye.';
  static const String applyNetworkError = 'Connexion impossible. Vérifie ta connexion.';
  static const String applied = 'Postulé';
  static const String applying = 'Envoi…';

  // ─── PR-F16: My Applications ───
  static const String myApplications = 'Mes candidatures';
  static const String emptyApplications = 'Tu n\'as pas encore postulé.';
  static const String emptyApplicationsHint = 'Explore les missions et postule !';
  static const String applicationPending = 'En attente';
  static const String applicationAccepted = 'Acceptée';
  static const String applicationRejected = 'Refusée';
  static const String applicationCancelled = 'Annulée';
  static const String applicationExpired = 'Expirée';
  static const String viewMission = 'Voir la mission';
  static const String appliedOn = 'Postulé le';

  // ─── PR-F17: Session expired ───
  static const String sessionExpired = 'Session expirée, veuillez vous reconnecter.';

  // ─── PR-F2: Bootstrap recovery ───
  static const String bootstrapRetryHint = 'Vérifie ta connexion et réessaie.';

  // ─── PR-F18: Profile edit ───
  static const String profileUpdated = 'Profil mis à jour !';
  static const String profileUpdateError = 'Impossible de mettre à jour le profil.';
  static const String profileLoadError = 'Impossible de charger le profil.';
  static const String nameRequired = 'Le nom est requis.';
  static const String saving = 'Enregistrement…';
  static const String saveProfile = 'Enregistrer';
  static const String noChanges = 'Aucune modification';

  // ─── PR-F19: Messaging ───
  static const String messages = 'Messages';
  static const String emptyConversations = 'Aucune conversation';
  // PR-4: Updated hint - chat accessible from mission detail only
  static const String emptyConversationsHint = 'Accède au chat depuis le détail d\'une mission pour discuter avec le client ou le prestataire.';
  static const String loadingConversations = 'Chargement des conversations…';
  static const String errorConversations = 'Impossible de charger les conversations.';
  static const String errorMessages = 'Impossible de charger les messages.';
  // PR-4: New hint for direct mission navigation
  static const String goToMissions = 'Voir les missions';
  static const String errorSendMessage = 'Impossible d\'envoyer le message.';
  static const String typeMessage = 'Écris ton message…';
  static const String send = 'Envoyer';
  static const String today = 'Aujourd\'hui';
  static const String yesterday = 'Hier';
  static const String exploreMissions = 'Explorer les missions';

  // ─── PR-F20: Push notifications ───
  static const String newMessage = 'Nouveau message';
  static const String notificationTapToView = 'Appuie pour voir';
  static const String notificationsEnabled = 'Notifications activées';
  static const String notificationsDisabled = 'Notifications désactivées';

  // ─── PR-F21: Ratings/Reviews ───
  static const String ratings = 'Évaluations';
  static const String reviews = 'Avis';
  static const String allReviews = 'Tous les avis';
  static const String seeAllReviews = 'Voir tous les avis';
  static const String leaveReview = 'Laisser un avis';
  static const String yourRating = 'Ta note';
  static const String yourComment = 'Ton commentaire (optionnel)';
  static const String commentHint = 'Qu\'as-tu pensé de cette expérience ?';
  static const String commentMaxLength = 'Maximum 500 caractères';
  static const String submitReview = 'Envoyer l\'avis';
  static const String reviewSuccess = 'Merci pour ton avis !';
  static const String reviewError = 'Impossible d\'envoyer l\'avis.';
  static const String reviewAlreadySubmitted = 'Tu as déjà laissé un avis.';
  static const String emptyReviews = 'Aucun avis pour le moment.';
  static const String emptyReviewsHint = 'Sois le premier à laisser un avis !';
  static const String errorReviews = 'Impossible de charger les avis.';
  static const String ratingRequired = 'Une note est requise.';
  static const String noReviews = 'Aucun avis';
  static const String oneReview = '1 avis';
  static const String reviewsCount = 'avis'; // "12 avis"
  static const String user = 'Utilisateur'; // Anonymous author fallback
  static const String whatStoodOut = 'Qu\'est-ce qui t\'a marqué ?';
  static const String experienceWith = 'Comment s\'est passée ton expérience ?';

  // ─── Availability ───
  static const String availableNow = 'Disponible maintenant';
  static const String notAvailable = 'Non disponible';
  static const String availableToday = 'Disponible aujourd\'hui';
  static const String setAvailability = 'Définir ma disponibilité';

  // ─── Profile completion ───
  static const String profileCompletion = 'Complétion du profil';
  static const String completeProfile = 'Compléter mon profil';
  static const String profileCompleteHint = 'Un profil complet reçoit 5x plus de demandes';
  static const String addCertification = 'Ajouter une certification';
  static const String addPhoto = 'Ajouter une photo';
  static const String addDescription = 'Ajouter une description';
  static const String completionBoostHint = '+15% de visibilité';

  // ─── Badges ───
  static const String badgeVerified = 'Vérifié';
  static const String badgeConforme = 'Conforme';
  static const String badgePro = 'Pro';
  static const String badgePremium = 'Premium';
  static const String badgeTopRated = 'Top Noté';
  static const String badgeReliable = 'Fiable';
  static const String badgeNew = 'Nouveau';
  static const String badgeActive = 'Actif';
  static const String badgeUrgent = 'Urgent';
  static const String badgeFeatured = 'En vedette';

  // ─── Trust / Security ───
  static const String escrowTitle = 'Paiement sécurisé';
  static const String escrowExplain = 'Votre paiement est conservé en dépôt sécurisé et libéré uniquement après confirmation de la mission.';
  static const String contractLink = 'Voir le contrat de service standard';
  static const String securedByStripe = 'Sécurisé par Stripe';
  static const String neutralPlatform = 'WorkOn est une plateforme de mise en relation. Aucune relation d\'emploi.';

  // ─── Home sections ───
  static const String goodMorning = 'Bonjour';
  static const String goodAfternoon = 'Bon après-midi';
  static const String goodEvening = 'Bonsoir';
  static const String missionsThisWeek = 'missions cette semaine';
  static const String profileViews = 'vues du profil';
  static const String newRequests = 'nouvelles demandes';
  static const String quickActions = 'Actions rapides';
  static const String myMissions = 'Mes missions';
  static const String nearbyOpportunities = 'Opportunités proches';
  static const String improveProfile = 'Améliorer mon profil';
  static const String recentActivity = 'Activité récente';

  // ─── Matching ───
  static const String matchScore = 'Compatibilité';
  static const String nearbyLabel = 'à proximité';
  static const String responseTime = 'Répond en général en';
  static const String completionRate = 'Taux de complétion';
  static const String reliabilityScore = 'Fiabilité';
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS COLORS
// ─────────────────────────────────────────────────────────────────────────────

/// Status colors for missions.
abstract final class WkStatusColors {
  static const Color open = Color(0xFF10B981); // Emerald green
  static const Color assigned = Color(0xFF3B82F6); // Blue
  static const Color inProgress = Color(0xFFF59E0B); // Amber
  static const Color active = Color(0xFFF59E0B); // Alias for inProgress (Amber)
  static const Color upcoming = Color(0xFF3B82F6); // Alias for assigned (Blue)
  static const Color completed = Color(0xFF6B7280); // Gray
  static const Color paid = Color(0xFF059669); // PR-6: Success green for paid
  static const Color cancelled = Color(0xFFEF4444); // Red
  static const Color error = Color(0xFFEF4444); // Alias for cancelled (Red)
  static const Color unknown = Color(0xFF9CA3AF); // Light gray
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADIENT PRESETS
// ─────────────────────────────────────────────────────────────────────────────

/// Predefined gradient color pairs for cards.
abstract final class WkGradients {
  static const List<List<Color>> cardGradients = [
    [Color(0xFF6366F1), Color(0xFF8B5CF6)], // Indigo-violet
    [Color(0xFF10B981), Color(0xFF059669)], // Emerald
    [Color(0xFFF59E0B), Color(0xFFD97706)], // Amber
    [Color(0xFFEC4899), Color(0xFFDB2777)], // Pink
    [Color(0xFF3B82F6), Color(0xFF1D4ED8)], // Blue
  ];

  /// Get gradient at index (cycles through available gradients).
  static List<Color> getCardGradient(int index) {
    return cardGradients[index % cardGradients.length];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON SIZES
// ─────────────────────────────────────────────────────────────────────────────

/// Standard icon sizes.
abstract final class WkIconSize {
  static const double xs = 14.0;
  static const double sm = 16.0;
  static const double md = 20.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 40.0;
  static const double xxxl = 48.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION DURATIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Standard animation durations.
abstract final class WkDuration {
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
}

