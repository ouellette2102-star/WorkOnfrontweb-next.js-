import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/ratings/ratings_api.dart';
import '../../services/ratings/ratings_models.dart';
import '../../services/workers/worker_models.dart';
import '../../services/workers/workers_api.dart';
import '../../widgets/wk_badge.dart';
import '../../widgets/wk_rating_display.dart';
import '../../widgets/wk_skeleton_loader.dart';

/// Profil public complet d'un travailleur.
/// Accessible via /talent/:workerId
class WorkerDetailScreen extends StatefulWidget {
  const WorkerDetailScreen({
    super.key,
    required this.workerId,
    this.workerData,
  });

  final String workerId;
  final Map<String, dynamic>? workerData;

  @override
  State<WorkerDetailScreen> createState() => _WorkerDetailScreenState();
}

class _WorkerDetailScreenState extends State<WorkerDetailScreen> {
  WorkerProfile? _worker;
  RatingSummary? _ratingSummary;
  List<Review> _reviews = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        const WorkersApi().getWorkerById(widget.workerId),
        RatingsApi().getSummary(widget.workerId).catchError((_) => null),
        RatingsApi().getReviews(widget.workerId, limit: 5).catchError((_) => <Review>[]),
      ]);
      if (mounted) {
        setState(() {
          _worker = results[0] as WorkerProfile;
          _ratingSummary = results[1] as RatingSummary?;
          _reviews = results[2] as List<Review>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Impossible de charger le profil.';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: _loading
          ? WkSkeletonLoader.profileHeader()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _worker == null
                  ? const SizedBox.shrink()
                  : _buildProfile(context),
      // Floating CTA — always visible, non-blocking scroll
      bottomNavigationBar: _worker != null && !_loading && _error == null
          ? _FloatingBookCTA(
              worker: _worker!,
              ratingSummary: _ratingSummary,
              workerId: widget.workerId,
            )
          : null,
    );
  }

  Widget _buildProfile(BuildContext context) {
    final worker = _worker!;
    return CustomScrollView(
      slivers: [
        // Hero photo + back button
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          backgroundColor: WkColors.bgSecondary,
          leading: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.black45,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 18),
            ),
            onPressed: () => context.pop(),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                worker.photoUrl != null
                    ? CachedNetworkImage(
                        imageUrl: worker.photoUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: WkColors.bgTertiary,
                          child: const Icon(Icons.person, color: WkColors.textTertiary, size: 80),
                        ),
                      )
                    : Container(
                        color: WkColors.bgTertiary,
                        child: const Icon(Icons.person, color: WkColors.textTertiary, size: 80),
                      ),
                // Gradient
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black87],
                      stops: [0.5, 1.0],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name + job
                Text(
                  worker.displayName,
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: WkColors.textPrimary,
                  ),
                ),
                if (worker.jobTitle != null)
                  Text(
                    worker.jobTitle!,
                    style: const TextStyle(fontSize: 15, color: WkColors.textSecondary),
                  ),
                if (worker.city != null)
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, color: WkColors.textTertiary, size: 14),
                      const SizedBox(width: 4),
                      Text(worker.city!, style: const TextStyle(color: WkColors.textTertiary, fontSize: 13)),
                    ],
                  ),
                const SizedBox(height: 16),
                // Rating display — premium
                if (_ratingSummary != null)
                  WkRatingDisplay.full(
                    rating: _ratingSummary!.average,
                    reviewCount: _ratingSummary!.count,
                    size: WkRatingSize.medium,
                  )
                else
                  const Text(
                    'Nouveau profil',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 13,
                      color: WkColors.textTertiary,
                    ),
                  ),
                const SizedBox(height: 12),
                // Trust badge row
                WkBadgeRow(badges: [
                  WkBadge.verified(),
                  WkBadge.conforme(),
                  if (_ratingSummary != null && _ratingSummary!.average >= 4.5)
                    WkBadge.topRated(),
                  WkBadge.available(),
                  ...worker.badges.map((b) => WkBadge.custom(
                    label: b.label,
                    color: WkColors.brandRed,
                    backgroundColor: WkColors.brandRedSoft,
                  )),
                ]),
                if (worker.hourlyRate != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.attach_money, color: WkColors.brandRed, size: 18),
                      Text(
                        '${worker.hourlyRate!.toInt()} \$/h',
                        style: const TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: WkColors.brandRed,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 24),
                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _MiniStat(
                      value: '${worker.completedMissions}',
                      label: 'Missions',
                    ),
                    _MiniStat(
                      value: '${worker.completionPercentage}%',
                      label: 'Complétion',
                    ),
                    _MiniStat(
                      value: '${worker.reviewCount}',
                      label: 'Avis',
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Trust badges
                const _TrustSection(),
                const SizedBox(height: 24),
                // Recent reviews
                if (_reviews.isNotEmpty) ...[
                  const Text(
                    'Avis récents',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._reviews.map((r) => _ReviewCard(review: r)).toList(),
                  const SizedBox(height: 24),
                ],
                // CTA is now floating at the bottom — spacer to avoid overlap
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING BOOK CTA
// ─────────────────────────────────────────────────────────────────────────────

class _FloatingBookCTA extends StatelessWidget {
  const _FloatingBookCTA({
    required this.worker,
    required this.ratingSummary,
    required this.workerId,
  });

  final WorkerProfile worker;
  final RatingSummary? ratingSummary;
  final String workerId;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        border: const Border(
          top: BorderSide(color: WkColors.bgQuaternary, width: 0.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (worker.hourlyRate != null)
                    Text(
                      'À partir de ${worker.hourlyRate!.toInt()} \$/h',
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: WkColors.textPrimary,
                      ),
                    ),
                  if (ratingSummary != null)
                    WkRatingDisplay.compact(
                      rating: ratingSummary!.average,
                      size: WkRatingSize.small,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            GestureDetector(
              onTap: () => context.goNamed(
                'booking',
                pathParameters: {'workerId': workerId},
                extra: {
                  'firstName': worker.firstName,
                  'lastName': worker.lastName,
                  'jobTitle': worker.jobTitle ?? '',
                  'city': worker.city ?? '',
                  'photoUrl': worker.photoUrl ?? '',
                  'rating': ratingSummary?.average ?? 0.0,
                  'completionPct': worker.completionPercentage,
                  'hourlyRate': worker.hourlyRate ?? 0.0,
                },
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                decoration: BoxDecoration(
                  color: WkColors.brandRed,
                  borderRadius: BorderRadius.circular(WkRadius.pill),
                ),
                child: Text(
                  'Contacter ${worker.firstName}',
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.value, required this.label});
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12, color: WkColors.textSecondary)),
      ],
    );
  }
}

class _TrustSection extends StatelessWidget {
  const _TrustSection();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: WkColors.glassBorder),
      ),
      child: const Column(
        children: [
          _TrustRow(icon: Icons.verified_outlined, text: 'Identité vérifiée'),
          SizedBox(height: 8),
          _TrustRow(icon: Icons.security_outlined, text: 'Assurances & conformité'),
          SizedBox(height: 8),
          _TrustRow(icon: Icons.description_outlined, text: 'Contrat sécurisé WorkOn'),
        ],
      ),
    );
  }
}

class _TrustRow extends StatelessWidget {
  const _TrustRow({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.check_circle, color: WkColors.success, size: 16),
        const SizedBox(width: 10),
        Icon(icon, color: WkColors.textSecondary, size: 16),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(color: WkColors.textSecondary, fontSize: 13)),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});
  final Review review;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: WkColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RatingBarIndicator(
                rating: review.rating.toDouble(),
                itemBuilder: (_, __) => const Icon(Icons.star, color: Color(0xFFFBBF24)),
                itemCount: 5,
                itemSize: 14,
                unratedColor: WkColors.bgTertiary,
              ),
              const Spacer(),
              Text(
                review.formattedDate,
                style: const TextStyle(color: WkColors.textTertiary, fontSize: 11),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              review.comment!,
              style: const TextStyle(color: WkColors.textSecondary, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: WkColors.error, size: 48),
          const SizedBox(height: 12),
          Text(error, style: const TextStyle(color: WkColors.textSecondary)),
          const SizedBox(height: 16),
          TextButton(onPressed: onRetry, child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed))),
        ],
      ),
    );
  }
}
