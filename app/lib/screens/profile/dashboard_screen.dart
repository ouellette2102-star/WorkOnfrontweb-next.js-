import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_config.dart';
import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../widgets/wk_skeleton_loader.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/earnings/earnings_api.dart';
import '../../services/earnings/earnings_models.dart';
import '../../services/payments/stripe_connect_api.dart';
import '../../services/payments/stripe_connect_service.dart';
import '../../services/ratings/ratings_api.dart';

/// Dashboard screen — stats réelles depuis API.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  EarningsSummary? _earnings;
  double? _averageRating;
  int? _reviewCount;
  StripeConnectStatus? _stripeStatus;
  bool _stripeLoading = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final auth = context.read<AuthProvider>();

      // Fetch earnings + ratings in parallel
      final futures = <Future>[
        EarningsApi().fetchSummary().catchError((_) => EarningsSummary.empty()),
        RatingsApi().getMySummary().then<dynamic>((v) => v).catchError((_) => null),
      ];

      // Fetch Stripe Connect status if worker
      if (auth.isWorker) {
        futures.add(
          StripeConnectService.getStatus(forceRefresh: true)
              .catchError((_) => const StripeConnectStatus.empty()),
        );
      }

      final results = await Future.wait(futures);
      if (!mounted) return;
      setState(() {
        _earnings = results[0] as EarningsSummary;
        final ratingData = results[1];
        if (ratingData != null) {
          _averageRating = (ratingData as dynamic).average?.toDouble();
          _reviewCount = (ratingData as dynamic).count as int?;
        }
        if (auth.isWorker && results.length > 2) {
          _stripeStatus = results[2] as StripeConnectStatus?;
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() { _earnings = EarningsSummary.empty(); _loading = false; });
    }
  }

  Future<void> _openStripeOnboarding() async {
    setState(() => _stripeLoading = true);
    try {
      final url = await StripeConnectService.getOnboardingUrl();
      if (!mounted) return;
      // url_launcher is available in pubspec
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'ouvrir le lien Stripe.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: WkColors.error),
      );
    } finally {
      if (mounted) setState(() => _stripeLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userId = auth.userId ?? 'user';
    final profileLink = '${AppConfig.profileBaseUrl}/$userId';
    final name = auth.displayName.isNotEmpty ? auth.displayName : 'Utilisateur';

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: const Text(
          'Mon dashboard',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          if (!_loading)
            IconButton(
              icon: const Icon(Icons.refresh_outlined, color: WkColors.textPrimary),
              onPressed: _load,
            ),
        ],
      ),
      body: _loading
          ? SingleChildScrollView(
              padding: const EdgeInsets.all(WkSpacing.lg),
              child: Column(
                children: [
                  WkSkeletonLoader.card(),
                  const SizedBox(height: WkSpacing.lg),
                  WkSkeletonLoader.statCard(),
                  const SizedBox(height: WkSpacing.lg),
                  WkSkeletonLoader.card(),
                ],
              ),
            )
          : RefreshIndicator(
              color: WkColors.brandRed,
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Profile header card
                    _ProfileCard(
                      name: name,
                      role: auth.role.name,
                      profileLink: profileLink,
                    ),
                    const SizedBox(height: 20),
                    // Stats grid
                    const _SectionTitle('Statistiques'),
                    const SizedBox(height: 12),
                    _StatsGrid(
                      earnings: _earnings!,
                      averageRating: _averageRating,
                      reviewCount: _reviewCount,
                      isWorker: auth.isWorker,
                    ),
                    const SizedBox(height: 20),
                    // Quick actions
                    const _SectionTitle('Actions rapides'),
                    const SizedBox(height: 12),
                    WorkOnButton.secondary(
                      label: 'Modifier mon profil',
                      onPressed: () => context.push('/profile/edit'),
                      isFullWidth: true,
                    ),
                    const SizedBox(height: 8),
                    WorkOnButton.ghost(
                      label: 'Mes demandes',
                      onPressed: () => context.push('/profile/me'),
                      isFullWidth: true,
                    ),
                    if (auth.isWorker) ...[
                      const SizedBox(height: 8),
                      WorkOnButton.ghost(
                        label: 'Mes gains',
                        onPressed: () => context.push('/earnings'),
                        isFullWidth: true,
                      ),
                      const SizedBox(height: 20),
                      const _SectionTitle('Paiements'),
                      const SizedBox(height: 12),
                      _StripeConnectCard(
                        status: _stripeStatus,
                        isLoading: _stripeLoading,
                        onConnect: _openStripeOnboarding,
                        onRetry: _load,
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.name, required this.role, required this.profileLink});
  final String name;
  final String role;
  final String profileLink;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(WkSpacing.lg),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.cardLarge),
        border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Gradient avatar ring
              Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  gradient: WkColors.gradientPremium,
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 29,
                  backgroundColor: WkColors.bgTertiary,
                  child: const Icon(
                    Icons.person_rounded,
                    color: WkColors.textSecondary,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: WkColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      role,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 13,
                        color: WkColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: WkSpacing.md),
          // Profile link — copyable
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: profileLink));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Lien copié !'),
                  backgroundColor: WkColors.bgTertiary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(WkRadius.md),
                  ),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: WkColors.bgTertiary,
                borderRadius: BorderRadius.circular(WkRadius.md),
                border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link_rounded, color: WkColors.brandRed, size: 17),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      profileLink,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        color: WkColors.textSecondary,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.copy_outlined, color: WkColors.textTertiary, size: 15),
                ],
              ),
            ),
          ),
          const SizedBox(height: WkSpacing.sm),
          // Share CTA — solid red
          GestureDetector(
            onTap: () => Share.share(
              'Découvrez mon profil WorkOn : $profileLink',
              subject: 'Mon profil WorkOn — $name',
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 13),
              decoration: BoxDecoration(
                color: WkColors.brandRed,
                borderRadius: BorderRadius.circular(WkRadius.pill),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.share_outlined, color: Colors.white, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Partager mon profil',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({
    required this.earnings,
    required this.isWorker,
    this.averageRating,
    this.reviewCount,
  });

  final EarningsSummary earnings;
  final bool isWorker;
  final double? averageRating;
  final int? reviewCount;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _StatCard(
          icon: Icons.task_alt_outlined,
          label: 'Missions complétées',
          value: '${earnings.completedMissionsCount}',
          color: WkColors.success,
        ),
        _StatCard(
          icon: Icons.star_outline,
          label: 'Note moyenne',
          value: averageRating != null
              ? averageRating!.toStringAsFixed(1)
              : '—',
          color: const Color(0xFFFBBF24),
          subtitle: reviewCount != null ? '$reviewCount avis' : null,
        ),
        if (isWorker) ...[
          _StatCard(
            icon: Icons.attach_money_outlined,
            label: 'Gains nets',
            value: '${earnings.totalLifetimeNet.toInt()} \$',
            color: WkColors.brandRed,
          ),
          _StatCard(
            icon: Icons.pending_outlined,
            label: 'En attente',
            value: '${earnings.totalPending.toInt()} \$',
            color: const Color(0xFF2563EB),
          ),
        ] else ...[
          _StatCard(
            icon: Icons.assignment_outlined,
            label: 'Contrats actifs',
            value: '${earnings.paidMissionsCount}',
            color: const Color(0xFF2563EB),
          ),
          _StatCard(
            icon: Icons.verified_outlined,
            label: 'Avis',
            value: '${reviewCount ?? 0}',
            color: const Color(0xFF8B5CF6),
          ),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.subtitle,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.lg),
        border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(label, style: const TextStyle(fontSize: 11, color: WkColors.textSecondary)),
          if (subtitle != null)
            Text(subtitle!, style: const TextStyle(fontSize: 10, color: WkColors.textTertiary)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: const TextStyle(
          fontFamily: 'General Sans',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: WkColors.textPrimary,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Connect card — 3 états : non connecté / action requise / actif

class _StripeConnectCard extends StatelessWidget {
  const _StripeConnectCard({
    required this.status,
    required this.isLoading,
    required this.onConnect,
    required this.onRetry,
  });

  final StripeConnectStatus? status;
  final bool isLoading;
  final VoidCallback onConnect;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    // Loading state
    if (status == null) {
      return WkSkeletonLoader.card();
    }

    final isActive = status!.hasAccount && status!.chargesEnabled && status!.payoutsEnabled;
    final needsAction = status!.hasAccount && (!status!.chargesEnabled || !status!.payoutsEnabled);

    return Container(
      padding: const EdgeInsets.all(WkSpacing.md),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.lg),
        border: Border.all(
          color: isActive
              ? WkColors.availableGreen.withValues(alpha: 0.35)
              : needsAction
                  ? WkColors.warning.withValues(alpha: 0.35)
                  : WkColors.bgQuaternary,
          width: 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isActive
                    ? Icons.check_circle_outline
                    : needsAction
                        ? Icons.warning_amber_outlined
                        : Icons.payment_outlined,
                color: isActive
                    ? WkColors.success
                    : needsAction
                        ? WkColors.warning
                        : WkColors.textSecondary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                isActive
                    ? 'Paiements actifs'
                    : needsAction
                        ? 'Action requise'
                        : 'Compte de paiement',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isActive
                      ? WkColors.success
                      : needsAction
                          ? WkColors.warning
                          : WkColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isActive
                ? 'Vous pouvez recevoir des paiements de vos clients.'
                : needsAction
                    ? 'Complétez votre compte Stripe pour recevoir des paiements.'
                    : 'Connectez votre compte bancaire pour recevoir vos gains.',
            style: const TextStyle(fontSize: 13, color: WkColors.textSecondary, height: 1.4),
          ),
          if (!isActive) ...[
            const SizedBox(height: WkSpacing.md),
            GestureDetector(
              onTap: isLoading ? null : onConnect,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  gradient: isLoading ? null : WkColors.gradientPremium,
                  color: isLoading ? WkColors.bgTertiary : null,
                  borderRadius: BorderRadius.circular(WkRadius.pill),
                  boxShadow: isLoading ? null : WkColors.shadowPremium,
                ),
                child: Center(
                  child: isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          needsAction ? 'Compléter mon compte' : 'Connecter mon compte',
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
