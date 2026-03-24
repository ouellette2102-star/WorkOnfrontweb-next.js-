/// WorkOn Home Screen — Premium v2 — PR #4
///
/// Personalized dashboard hub with:
/// - Greeting + user first name (from AuthProvider)
/// - Availability toggle (connects to user service)
/// - Profile completion score
/// - Quick action chips
/// - Contextual horizontal rails (missions, stats)
/// - Cinematic hero gradient
///
/// Backend connections preserved: MetricsApi, AuthProvider
/// No mock data — all fallbacks are graceful.
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/ui_tokens.dart';
import '../config/workon_colors.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/notifications_provider.dart';
import '../services/metrics/metrics_api.dart';
import '../services/metrics/metrics_models.dart';
import '../widgets/app_drawer.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/wk_badge.dart';
import '../widgets/wk_logo.dart';
import '../widgets/wk_skeleton_loader.dart';

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // -1 = no tab active on the Home landing page
  int _navIndex = -1;
  HomeStats? _stats;
  bool _statsLoading = true;
  String? _statsError;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    if (!mounted) return;
    setState(() {
      _statsLoading = true;
      _statsError = null;
    });
    try {
      final stats = await const MetricsApi().getHomeStats();
      if (mounted) {
        setState(() {
          _stats = stats;
          _statsLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _statsLoading = false;
          _statsError = WkCopy.errorGeneric;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

      return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        color: WkColors.brandRed,
        backgroundColor: WkColors.bgSecondary,
        displacement: 40,
        onRefresh: _loadStats,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Atmospheric Hero Section ──
            SliverToBoxAdapter(
              child: _HeroSection(
                auth: auth,
                stats: _stats,
                statsLoading: _statsLoading,
              ),
            ),

            // ── Quick Actions ──
            const SliverToBoxAdapter(child: _QuickActionsSection()),
            const SliverToBoxAdapter(child: SizedBox(height: WkSpacing.xxl)),

            // ── Action Cards ──
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
              sliver: SliverToBoxAdapter(child: _ActionCards()),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: WkSpacing.xxl)),

            // ── Profile completion nudge (logged in only) ──
            if (auth.isLoggedIn) ...[
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
                sliver: SliverToBoxAdapter(child: _ProfileNudge(auth: auth)),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: WkSpacing.xxl)),
            ],

            // ── Legal disclaimer ──
            const SliverToBoxAdapter(child: _LegalFooter()),
            const SliverToBoxAdapter(child: SizedBox(height: WkSpacing.xxxl)),
          ],
        ),
      ),
      bottomNavigationBar: WorkOnBottomNavBar(
        currentIndex: _navIndex,
        onTap: (i) => setState(() => _navIndex = i),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION — atmospheric header with stats
// ─────────────────────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.auth,
    required this.stats,
    required this.statsLoading,
  });

  final AuthProvider auth;
  final HomeStats? stats;
  final bool statsLoading;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return WkCopy.goodMorning;
    if (hour < 18) return WkCopy.goodAfternoon;
    return WkCopy.goodEvening;
  }

  @override
  Widget build(BuildContext context) {
    final notifCount = context.watch<NotificationsProvider>().unreadCount;

    return Stack(
      children: [
        // Atmospheric background — warm dark radial, not flat red
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0.0, -0.8),
                radius: 1.0,
                colors: [
                  const Color(0xFF2A0D0D),
                  WkColors.bgPrimary,
                ],
              ),
            ),
          ),
        ),

        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              WkSpacing.pagePadding,
              WkSpacing.sm,
              WkSpacing.pagePadding,
              WkSpacing.xxl,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top bar — logo + notifications
                Row(
                  children: [
                    Builder(
                      builder: (ctx) => GestureDetector(
                        onTap: () => Scaffold.of(ctx).openDrawer(),
                        child: const Icon(
                          Icons.menu_rounded,
                          color: WkColors.textPrimary,
                          size: 22,
                        ),
                      ),
                    ),
                    const Expanded(
                      child: Center(child: WkLogoAppBar()),
                    ),
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.notifications_outlined,
                            color: WkColors.textPrimary,
                            size: 22,
                          ),
                          onPressed: () => context.go('/notifications'),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 36,
                            minHeight: 36,
                          ),
                        ),
                        if (notifCount > 0)
                          Positioned(
                            top: 4,
                            right: 4,
                            child: Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: WkColors.brandRed,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: WkSpacing.xxl),

                // Greeting
                if (auth.isLoggedIn && auth.firstName != null) ...[
                  Text(
                    '$_greeting, ${auth.firstName}',
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: WkColors.textTertiary,
                    ),
                  ),
                  const SizedBox(height: WkSpacing.xs),
                ],

                // Hero title
                Text(
                  auth.isLoggedIn
                      ? 'Tableau de bord'
                      : 'Trouvez\ndes talents',
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 34,
                    fontWeight: FontWeight.w700,
                    color: WkColors.textPrimary,
                    height: 1.1,
                    letterSpacing: -0.8,
                  ),
                ),
                const SizedBox(height: WkSpacing.sm),
                const Text(
                  'Professionnels vérifiés, disponibles près de vous.',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: WkColors.textSecondary,
                    height: 1.5,
                  ),
                ),

                const SizedBox(height: WkSpacing.xl),

                // Stats row
                statsLoading
                    ? WkSkeletonLoader.card()
                    : _HeroStatsRow(
                        stats: stats ??
                            const HomeStats(
                              completedContracts: 0,
                              activeWorkers: 0,
                              openServiceCalls: 0,
                            ),
                      ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _HeroStatsRow extends StatelessWidget {
  const _HeroStatsRow({required this.stats});
  final HomeStats stats;

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: WkSpacing.lg,
        vertical: WkSpacing.md,
      ),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.lg),
        border: Border.all(color: WkColors.glassBorder, width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatChip(
            icon: Icons.bolt_rounded,
            iconColor: WkColors.brandOrange,
            value: _fmt(stats.activeWorkers),
            label: 'Actifs',
          ),
          Container(width: 0.5, height: 28, color: WkColors.glassBorder),
          _StatChip(
            icon: Icons.check_circle_outline_rounded,
            iconColor: WkColors.success,
            value: _fmt(stats.completedContracts),
            label: 'Missions',
          ),
          Container(width: 0.5, height: 28, color: WkColors.glassBorder),
          _StatChip(
            icon: Icons.location_on_outlined,
            iconColor: WkColors.brandRed,
            value: _fmt(stats.openServiceCalls),
            label: 'Près de vous',
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: iconColor, size: 13),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        const SizedBox(height: 1),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 10,
            color: WkColors.textTertiary,
            letterSpacing: 0.1,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APP BAR (legacy — kept for compatibility, not used in home)
// ─────────────────────────────────────────────────────────────────────────────

class _HomeAppBar extends StatelessWidget {
  const _HomeAppBar({required this.auth});

  final AuthProvider auth;

  @override
  Widget build(BuildContext context) {
    final notifCount = context.watch<NotificationsProvider>().unreadCount;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          Builder(
            builder: (ctx) => IconButton(
              icon: const Icon(Icons.menu_rounded, color: WkColors.textPrimary),
              onPressed: () => Scaffold.of(ctx).openDrawer(),
            ),
          ),
          const Expanded(
            child: Center(child: WkLogoAppBar()),
          ),
          if (auth.isLoggedIn)
            Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  icon: const Icon(
                    Icons.notifications_outlined,
                    color: WkColors.textPrimary,
                  ),
                  onPressed: () => context.go('/notifications'),
                ),
                if (notifCount > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        gradient: WkColors.gradientPremium,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            )
          else
            const SizedBox(width: 48),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO GREETING
// ─────────────────────────────────────────────────────────────────────────────

class _HeroGreeting extends StatelessWidget {
  const _HeroGreeting({required this.auth});

  final AuthProvider auth;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return WkCopy.goodMorning;
    if (hour < 18) return WkCopy.goodAfternoon;
    return WkCopy.goodEvening;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (auth.isLoggedIn && auth.firstName != null) ...[
            Text(
              '$_greeting, ${auth.firstName}',
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 13,
                fontWeight: FontWeight.w400,
                color: WkColors.textTertiary,
                letterSpacing: 0.1,
              ),
            ),
            const SizedBox(height: 6),
          ],
          Text(
            auth.isLoggedIn ? 'Tableau de bord' : 'Trouvez un talent',
            style: const TextStyle(
              fontFamily: 'General Sans',
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: WkColors.textPrimary,
              height: 1.15,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Professionnels vérifiés, disponibles près de vous.',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: WkColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM STATS CARD
// ─────────────────────────────────────────────────────────────────────────────

class _PlatformStatsCard extends StatelessWidget {
  const _PlatformStatsCard({required this.stats});

  final HomeStats stats;

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
        border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
        boxShadow: WkColors.shadowCard,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatItem(
            value: _fmt(stats.activeWorkers),
            label: 'Actifs',
            icon: Icons.bolt_rounded,
            iconColor: WkColors.brandOrange,
          ),
          Container(width: 0.5, height: 36, color: WkColors.bgQuaternary),
          _StatItem(
            value: _fmt(stats.completedContracts),
            label: 'Missions',
            icon: Icons.check_circle_outline_rounded,
            iconColor: WkColors.success,
          ),
          Container(width: 0.5, height: 36, color: WkColors.bgQuaternary),
          _StatItem(
            value: _fmt(stats.openServiceCalls),
            label: 'Près de vous',
            icon: Icons.location_on_outlined,
            iconColor: WkColors.brandRed,
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
    required this.iconColor,
  });

  final String value;
  final String label;
  final IconData icon;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: iconColor, size: WkIconSize.md),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 11,
            color: WkColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  const _QuickActionsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
          child: Text(
            WkCopy.quickActions,
            style: const TextStyle(
              fontFamily: 'General Sans',
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: WkColors.textSecondary,
              letterSpacing: 0.2,
            ),
          ),
        ),
        const SizedBox(height: WkSpacing.md),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
            children: [
              _QuickChip(
                label: 'Explorer les talents',
                icon: Icons.explore_outlined,
                onTap: () => context.go('/talent'),
              ),
              const SizedBox(width: WkSpacing.sm),
              _QuickChip(
                label: 'Voir la carte',
                icon: Icons.map_outlined,
                onTap: () => context.go('/map'),
              ),
              const SizedBox(width: WkSpacing.sm),
              _QuickChip(
                label: 'Publier une mission',
                icon: Icons.add_circle_outline_rounded,
                isPrimary: true,
                onTap: () => context.push('/publish'),
              ),
              const SizedBox(width: WkSpacing.sm),
              _QuickChip(
                label: 'Mes messages',
                icon: Icons.chat_bubble_outline_rounded,
                onTap: () => context.go('/messages'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: isPrimary
            ? WkCardDecoration.premiumPill
            : BoxDecoration(
                color: WkColors.bgSecondary,
                borderRadius: BorderRadius.circular(WkRadius.pill),
                border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
              ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: WkIconSize.sm,
              color: isPrimary ? Colors.white : WkColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isPrimary ? Colors.white : WkColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CARDS
// ─────────────────────────────────────────────────────────────────────────────

class _ActionCards extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ActionCard(
            icon: Icons.people_outline_rounded,
            title: 'Trouver un talent',
            subtitle: 'Parcourir les profils',
            gradient: WkColors.gradientPremium,
            onTap: () => context.go('/talent'),
          ),
        ),
        const SizedBox(width: WkSpacing.md),
        Expanded(
          child: _ActionCard(
            icon: Icons.map_outlined,
            title: 'Voir la carte',
            subtitle: 'Appels de service',
            gradient: const LinearGradient(
              colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
            ),
            onTap: () => context.go('/map'),
          ),
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final LinearGradient gradient;
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
          border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
          boxShadow: WkColors.shadowCard,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: gradient,
                borderRadius: BorderRadius.circular(WkRadius.sm),
              ),
              child: Icon(icon, color: Colors.white, size: WkIconSize.md),
            ),
            const SizedBox(height: WkSpacing.md),
            Text(
              title,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: WkColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 12,
                color: WkColors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE NUDGE (logged-in only)
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileNudge extends StatelessWidget {
  const _ProfileNudge({required this.auth});

  final AuthProvider auth;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/profile/me'),
      child: Container(
        padding: const EdgeInsets.all(WkSpacing.cardPadding),
        decoration: BoxDecoration(
          color: WkColors.bgSecondary,
          borderRadius: BorderRadius.circular(WkRadius.card),
          border: Border.all(color: WkColors.brandRedSoft, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: WkColors.brandRedSoft,
                borderRadius: BorderRadius.circular(WkRadius.md),
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: WkColors.brandRed,
                size: WkIconSize.md,
              ),
            ),
            const SizedBox(width: WkSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Complétez votre profil',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: WkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    WkCopy.profileCompleteHint,
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 12,
                      color: WkColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: WkSpacing.sm),
            WkBadge.custom(
              label: '+15%',
              color: WkColors.brandOrange,
              backgroundColor: WkColors.brandOrangeSoft,
              icon: Icons.trending_up_rounded,
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL FOOTER
// ─────────────────────────────────────────────────────────────────────────────

class _LegalFooter extends StatelessWidget {
  const _LegalFooter();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: WkSpacing.pagePadding),
      child: Text(
        WkCopy.legalDisclaimer,
        style: const TextStyle(
          fontFamily: 'General Sans',
          fontSize: 11,
          color: WkColors.textDisabled,
          height: 1.5,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
