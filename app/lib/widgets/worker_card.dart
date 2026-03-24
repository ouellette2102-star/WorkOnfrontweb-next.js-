/// WorkOn Worker Card — Premium Swipe Card v2
///
/// Full-screen swipeable card used in [TalentSwipeScreen].
/// Upgraded: WkBadge, WkRatingDisplay, gradient CTA, cinematic overlay.
library;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../config/ui_tokens.dart';
import '../config/workon_colors.dart';
import '../config/workon_widgets.dart';
import '../services/workers/worker_models.dart';
import '../widgets/wk_badge.dart';
import '../widgets/wk_rating_display.dart';

/// Full-screen swipeable worker card.
class WorkerCard extends StatelessWidget {
  const WorkerCard({
    super.key,
    required this.worker,
    this.onReserve,
    this.onTap,
  });

  final WorkerProfile worker;
  final VoidCallback? onReserve;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.cardLarge),
        border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: GestureDetector(
        onTap: onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(WkRadius.cardLarge),
          child: Stack(
            children: [
              // Background photo
              _WorkerPhoto(photoUrl: worker.photoUrl),
              // Cinematic gradient overlay — bottom 60% darkening
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: WkColors.gradientSwipeCard,
                  ),
                ),
              ),
              // Top badges row (available + top performer)
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Row(
                  children: [
                    if (worker.badges.any((b) => b.type == 'top_performer'))
                      WkBadge.topRated(),
                    const SizedBox(width: 6),
                    WkBadge.verified(),
                    const Spacer(),
                    // Hourly rate chip
                    if (worker.hourlyRate != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          gradient: WkColors.gradientPremium,
                          borderRadius: BorderRadius.circular(WkRadius.pill),
                          boxShadow: WkColors.shadowPremium,
                        ),
                        child: Text(
                          '${worker.hourlyRate!.toInt()} \$/h',
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              // Info overlay at bottom
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: _WorkerInfo(worker: worker, onReserve: onReserve),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO
// ─────────────────────────────────────────────────────────────────────────────

class _WorkerPhoto extends StatelessWidget {
  const _WorkerPhoto({this.photoUrl});
  final String? photoUrl;

  @override
  Widget build(BuildContext context) {
    if (photoUrl == null || photoUrl!.isEmpty) {
      return Container(
        color: WkColors.bgTertiary,
        child: const Center(
          child: Icon(Icons.person_rounded, color: WkColors.textTertiary, size: 80),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: photoUrl!,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (_, __) => Container(
        color: WkColors.bgTertiary,
        child: const Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: WkColors.brandRed,
          ),
        ),
      ),
      errorWidget: (_, __, ___) => Container(
        color: WkColors.bgTertiary,
        child: const Center(
          child: Icon(Icons.person_rounded, color: WkColors.textTertiary, size: 80),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

class _WorkerInfo extends StatelessWidget {
  const _WorkerInfo({required this.worker, this.onReserve});
  final WorkerProfile worker;
  final VoidCallback? onReserve;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Name
          Text(
            worker.displayName,
            style: const TextStyle(
              fontFamily: 'General Sans',
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.5,
              shadows: [Shadow(color: Colors.black54, blurRadius: 10)],
            ),
          ),
          const SizedBox(height: 3),
          // Job + city
          if (worker.jobTitle != null || worker.city != null)
            Text(
              [worker.jobTitle, worker.city].whereType<String>().join(' · '),
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 14,
                color: Colors.white70,
                height: 1.3,
              ),
            ),
          const SizedBox(height: 10),
          // Rating + completion
          Row(
            children: [
              WkRatingDisplay.compact(
                rating: worker.averageRating,
                size: WkRatingSize.small,
                starColor: WkColors.warning,
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(WkRadius.pill),
                ),
                child: Text(
                  '${worker.completionPercentage}% complet',
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 11,
                    color: Colors.white70,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Badge row
          if (worker.badges.isNotEmpty)
            Wrap(
              spacing: 5,
              runSpacing: 5,
              children: worker.badges
                  .take(3)
                  .map((b) => WkBadge.custom(
                        label: b.label,
                        color: Colors.white,
                        backgroundColor: Colors.white.withOpacity(0.15),
                      ))
                  .toList(),
            ),
          const SizedBox(height: 14),
          // CTA — gradient premium button
          GestureDetector(
            onTap: onReserve,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: WkColors.brandRed,
                borderRadius: BorderRadius.circular(WkRadius.pill),
              ),
              child: const Center(
                child: Text(
                  'Contacter · Réserver',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Trust footer
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified_outlined, color: Colors.white54, size: 13),
              SizedBox(width: 4),
              Text(
                'Identité vérifiée',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
              SizedBox(width: 12),
              Icon(Icons.security_outlined, color: Colors.white54, size: 13),
              SizedBox(width: 4),
              Text(
                'Conforme & assuré',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
