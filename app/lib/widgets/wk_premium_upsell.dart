/// WorkOn Premium Upsell Widget — PR #13
///
/// Subtle, non-intrusive premium nudges following the PRD monetization strategy:
/// - Never blocking or aggressive
/// - Context-aware (shown at the right moment)
/// - Clear value proposition
/// - Legal neutral (WorkOn is infrastructure, not employer)
///
/// Usage:
/// ```dart
/// WkPremiumUpsell.visibilityBoost()
/// WkPremiumUpsell.profileComplete()
/// WkPremiumUpsell.planUpgrade(currentPlan: 'free')
/// WkPremiumUpsell.featureTeaser(feature: 'Analytics avancés')
/// ```
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WK PREMIUM UPSELL
// ─────────────────────────────────────────────────────────────────────────────

/// Subtle premium upsell card — shown contextually, never blocking.
class WkPremiumUpsell extends StatelessWidget {
  const WkPremiumUpsell._({
    required this.title,
    required this.body,
    required this.ctaLabel,
    required this.onTap,
    required this.icon,
    this.badge,
  });

  /// Boost de visibilité — shown on profile/dashboard
  factory WkPremiumUpsell.visibilityBoost({required VoidCallback onTap}) {
    return WkPremiumUpsell._(
      icon: Icons.rocket_launch_outlined,
      title: 'Boostez votre visibilité',
      body: 'Apparaissez en tête des résultats et recevez 3x plus de demandes.',
      ctaLabel: 'Activer le boost',
      badge: 'Pro',
      onTap: onTap,
    );
  }

  /// Profile completion nudge — shown when pct < 80%
  factory WkPremiumUpsell.profileComplete({required VoidCallback onTap}) {
    return WkPremiumUpsell._(
      icon: Icons.person_add_outlined,
      title: 'Complétez votre profil',
      body: 'Un profil complet génère 5x plus de contacts et de confiance.',
      ctaLabel: 'Compléter maintenant',
      onTap: onTap,
    );
  }

  /// Plan upgrade nudge — shown on free plan
  factory WkPremiumUpsell.planUpgrade({required VoidCallback onTap}) {
    return WkPremiumUpsell._(
      icon: Icons.workspace_premium_outlined,
      title: 'Passez à WorkOn Pro',
      body: 'Outils CRM, analytiques, badge Pro et mise en avant locale.',
      ctaLabel: 'Voir les plans',
      badge: 'Premium',
      onTap: onTap,
    );
  }

  /// Feature teaser — locked feature hint
  factory WkPremiumUpsell.featureTeaser({
    required String feature,
    required VoidCallback onTap,
  }) {
    return WkPremiumUpsell._(
      icon: Icons.lock_outline_rounded,
      title: feature,
      body: 'Disponible avec WorkOn Pro. Débloquez les outils avancés.',
      ctaLabel: 'Débloquer',
      badge: 'Pro',
      onTap: onTap,
    );
  }

  final IconData icon;
  final String title;
  final String body;
  final String ctaLabel;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(WkSpacing.cardPadding),
        decoration: BoxDecoration(
          color: WkColors.bgSecondary,
          borderRadius: BorderRadius.circular(WkRadius.card),
          border: Border.all(
            color: WkColors.brandOrange.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            // Icon container
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: WkColors.gradientPremium,
                borderRadius: BorderRadius.circular(WkRadius.md),
                boxShadow: WkColors.shadowPremium,
              ),
              child: Icon(icon, color: Colors.white, size: WkIconSize.md),
            ),
            const SizedBox(width: WkSpacing.md),
            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: WkColors.textPrimary,
                          ),
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            gradient: WkColors.gradientPremium,
                            borderRadius: BorderRadius.circular(WkRadius.pill),
                          ),
                          child: Text(
                            badge!,
                            style: const TextStyle(
                              fontFamily: 'General Sans',
                              fontSize: 9,
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    body,
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 12,
                      color: WkColors.textTertiary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // CTA pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      gradient: WkColors.gradientPremium,
                      borderRadius: BorderRadius.circular(WkRadius.pill),
                      boxShadow: WkColors.shadowPremium,
                    ),
                    child: Text(
                      ctaLabel,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 12,
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WK PLAN CARD
// ─────────────────────────────────────────────────────────────────────────────

/// Plan comparison card for the pricing screen.
class WkPlanCard extends StatelessWidget {
  const WkPlanCard({
    super.key,
    required this.plan,
    required this.price,
    required this.features,
    this.isRecommended = false,
    this.isCurrentPlan = false,
    required this.onSelect,
  });

  final String plan;
  final String price;
  final List<String> features;
  final bool isRecommended;
  final bool isCurrentPlan;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
        border: Border.all(
          color: isRecommended
              ? WkColors.brandOrange
              : WkColors.bgQuaternary,
          width: isRecommended ? 1.5 : 0.5,
        ),
        boxShadow: isRecommended ? WkColors.shadowPremium : WkColors.shadowCard,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(WkSpacing.cardPadding),
            decoration: isRecommended
                ? BoxDecoration(
                    gradient: WkColors.gradientPremium,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(WkRadius.card),
                    ),
                  )
                : null,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  plan,
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: isRecommended
                        ? Colors.white
                        : WkColors.textPrimary,
                  ),
                ),
                Text(
                  price,
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isRecommended
                        ? Colors.white
                        : WkColors.brandOrange,
                  ),
                ),
              ],
            ),
          ),
          // Features
          Padding(
            padding: const EdgeInsets.all(WkSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_rounded,
                        color: WkColors.availableGreen,
                        size: WkIconSize.sm,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        f,
                        style: const TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 13,
                          color: WkColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                )),
                const SizedBox(height: 8),
                // CTA
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: isCurrentPlan ? null : WkColors.gradientPremium,
                      color: isCurrentPlan ? WkColors.bgTertiary : null,
                      borderRadius: BorderRadius.circular(WkRadius.pill),
                    ),
                    child: ElevatedButton(
                      onPressed: isCurrentPlan ? null : onSelect,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        foregroundColor: isCurrentPlan
                            ? WkColors.textTertiary
                            : Colors.white,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(WkRadius.pill),
                        ),
                      ),
                      child: Text(
                        isCurrentPlan ? 'Plan actuel' : 'Choisir',
                        style: const TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
