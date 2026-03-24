import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/missions/missions_api.dart';
import '../../services/missions/mission_models.dart';
import '../../services/offers/offers_api.dart';
import '../../services/offers/offer_models.dart';
import '../../services/ratings/ratings_api.dart';
import '../../widgets/wk_badge.dart';
import '../../widgets/wk_rating_display.dart';
import '../../widgets/wk_skeleton_loader.dart';

/// My Profile screen — shows profile + 3-tab missions view.
class MyProfileScreen extends StatefulWidget {
  const MyProfileScreen({super.key});

  @override
  State<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends State<MyProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int? _completionPct;
  double? _avgRating;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final summary = await RatingsApi().getMySummary();
      if (mounted) {
        setState(() {
          _avgRating = summary.average;
          _completionPct = (summary.average / 5.0 * 100).round().clamp(0, 99);
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

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
          'Mon profil',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: WkColors.textPrimary),
            onPressed: () => context.push('/profile/edit'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Profile header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // ── Avatar + Info ──
                Row(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            gradient: WkColors.gradientPremium,
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(2),
                          child: Container(
                            decoration: const BoxDecoration(
                              color: WkColors.bgTertiary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person_rounded,
                              color: WkColors.textSecondary,
                              size: 36,
                            ),
                          ),
                        ),
                        // Online indicator
                        Positioned(
                          bottom: 3,
                          right: 3,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: WkColors.availableGreen,
                              shape: BoxShape.circle,
                              border: Border.all(color: WkColors.bgPrimary, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auth.displayName.isNotEmpty ? auth.displayName : 'Utilisateur',
                            style: const TextStyle(
                              fontFamily: 'General Sans',
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: WkColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            auth.role.name,
                            style: const TextStyle(
                              fontFamily: 'General Sans',
                              fontSize: 13,
                              color: WkColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Rating + badges
                          WkBadgeRow(badges: [
                            WkBadge.verified(),
                            if (_avgRating != null && _avgRating! >= 4.5)
                              WkBadge.topRated(),
                            WkBadge.available(),
                          ]),
                        ],
                      ),
                    ),
                    // Rating chip
                    if (_avgRating != null)
                      WkRatingDisplay.compact(rating: _avgRating!),
                  ],
                ),

                // ── Profile completion bar ──
                if (_completionPct != null) ...[
                  const SizedBox(height: WkSpacing.lg),
                  _ProfileCompletionBar(pct: _completionPct!),
                ],

                const SizedBox(height: WkSpacing.lg),
                WorkOnButton.secondary(
                  label: 'Modifier mon profil',
                  onPressed: () => context.push('/profile/edit'),
                  isFullWidth: true,
                ),
                const SizedBox(height: 8),
                WorkOnButton.ghost(
                  label: 'Mon dashboard',
                  onPressed: () => context.push('/dashboard'),
                  isFullWidth: true,
                ),
              ],
            ),
          ),
          // Tabs
          Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: WkColors.glassBorder)),
            ),
            child: TabBar(
              controller: _tabCtrl,
              indicatorColor: WkColors.brandRed,
              labelColor: WkColors.brandRed,
              unselectedLabelColor: WkColors.textSecondary,
              labelStyle: const TextStyle(
                fontFamily: 'General Sans',
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              tabs: const [
                Tab(text: 'À confirmer'),
                Tab(text: 'Actives'),
                Tab(text: 'Complétées'),
              ],
            ),
          ),
          // Tab views
          Expanded(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _OffersToConfirmTab(),
                _MissionsTab(status: 'active'),
                _MissionsTab(status: 'completed'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE COMPLETION BAR
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileCompletionBar extends StatelessWidget {
  const _ProfileCompletionBar({required this.pct});

  final int pct;

  @override
  Widget build(BuildContext context) {
    final isComplete = pct >= 90;
    return Container(
      padding: const EdgeInsets.all(WkSpacing.cardPadding),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
        border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                WkCopy.profileCompletion,
                style: const TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: WkColors.textSecondary,
                ),
              ),
              Text(
                '$pct%',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isComplete ? WkColors.availableGreen : WkColors.brandOrange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(WkRadius.pill),
            child: LinearProgressIndicator(
              value: pct / 100.0,
              minHeight: 6,
              backgroundColor: WkColors.bgTertiary,
              valueColor: AlwaysStoppedAnimation<Color>(
                isComplete ? WkColors.availableGreen : WkColors.brandOrange,
              ),
            ),
          ),
          if (!isComplete) ...[
            const SizedBox(height: 6),
            Text(
              WkCopy.completionBoostHint,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 11,
                color: WkColors.brandOrange,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _MissionsTab extends StatefulWidget {
  const _MissionsTab({required this.status});
  final String status;

  @override
  State<_MissionsTab> createState() => _MissionsTabState();
}

class _MissionsTabState extends State<_MissionsTab> {
  List<Mission> _missions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final List<Mission> data;
      if (widget.status == 'completed') {
        final all = await MissionsApi().fetchMyMissions();
        data = all.where((m) => m.status == MissionStatus.completed || m.status == MissionStatus.paid).toList();
      } else if (widget.status == 'active') {
        data = await MissionsApi().fetchMyAssignments();
      } else {
        data = await MissionsApi().fetchMyMissions();
      }
      if (mounted) setState(() { _missions = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return ListView.builder(
        padding: const EdgeInsets.all(WkSpacing.lg),
        itemCount: 4,
        itemBuilder: (_, __) => Padding(
          padding: const EdgeInsets.only(bottom: WkSpacing.md),
          child: WkSkeletonLoader.missionCard(),
        ),
      );
    }
    if (_missions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.inbox_outlined, color: WkColors.textTertiary, size: 48),
            const SizedBox(height: 12),
            Text(
              widget.status == 'pending'
                  ? 'Aucune demande à confirmer'
                  : widget.status == 'active'
                      ? 'Aucune mission active'
                      : 'Aucune mission complétée',
              style: const TextStyle(color: WkColors.textSecondary),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _missions.length,
      itemBuilder: (_, i) => _MissionCard(mission: _missions[i], onRefresh: _load),
    );
  }
}

/// Mission card with lifecycle action buttons.
///
/// Buttons shown conditionally by status and user role:
/// - Worker + assigned  → Démarrer  (POST /start)
/// - Worker + inProgress → Terminer (POST /complete)
/// - Creator + open|assigned → Annuler (POST /cancel)
class _MissionCard extends StatefulWidget {
  const _MissionCard({required this.mission, this.onRefresh});
  final Mission mission;
  final VoidCallback? onRefresh;

  @override
  State<_MissionCard> createState() => _MissionCardState();
}

class _MissionCardState extends State<_MissionCard> {
  bool _actionLoading = false;

  Future<void> _start() => _doAction(
    () => MissionsApi().startMission(widget.mission.id),
    'Mission démarrée.',
  );

  Future<void> _complete() => _doAction(
    () => MissionsApi().completeMission(widget.mission.id),
    'Mission terminée.',
  );

  Future<void> _cancel() => _doAction(
    () => MissionsApi().cancelMission(widget.mission.id),
    'Mission annulée.',
    isDestructive: true,
  );

  Future<void> _doAction(
    Future<Mission> Function() action,
    String successMsg, {
    bool isDestructive = false,
  }) async {
    if (_actionLoading) return;

    // Confirmation dialog for destructive actions
    if (isDestructive) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: WkColors.bgSecondary,
          title: const Text('Confirmer l\'annulation', style: TextStyle(color: WkColors.textPrimary)),
          content: const Text('Cette action est irréversible.', style: TextStyle(color: WkColors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Retour', style: TextStyle(color: WkColors.textSecondary)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Annuler la mission', style: TextStyle(color: WkColors.error)),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    setState(() => _actionLoading = true);
    try {
      await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(successMsg), backgroundColor: WkColors.success),
      );
      widget.onRefresh?.call();
    } on MissionsApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: WkColors.error),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e'), backgroundColor: WkColors.error),
      );
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mission = widget.mission;
    final auth = context.read<AuthProvider>();
    final isWorker = auth.isWorker;
    final isCreator = mission.createdByUserId == auth.userId;

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
          Text(
            mission.title,
            style: const TextStyle(
              fontFamily: 'General Sans',
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: WkColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              _StatusBadge(status: mission.status),
              const Spacer(),
              Text(
                '${mission.price.toInt()} \$',
                style: const TextStyle(
                  color: WkColors.brandRed,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),

          // ── Lifecycle action buttons ─────────────────────────────────────
          if (_actionLoading)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: LinearProgressIndicator(color: WkColors.brandRed, backgroundColor: WkColors.bgTertiary),
            )
          else ...[
            // Worker: Démarrer (assigned → in_progress)
            if (isWorker && mission.status == MissionStatus.assigned)
              _LifecycleButton(label: 'Démarrer', icon: Icons.play_arrow_outlined, onTap: _start),

            // Worker: Terminer (in_progress → completed)
            if (isWorker && mission.status == MissionStatus.inProgress)
              _LifecycleButton(label: 'Terminer', icon: Icons.check_circle_outline, onTap: _complete),

            // Creator: Annuler (open|assigned → cancelled)
            if (isCreator &&
                (mission.status == MissionStatus.open ||
                    mission.status == MissionStatus.assigned))
              _LifecycleButton(
                label: 'Annuler',
                icon: Icons.cancel_outlined,
                onTap: _cancel,
                isDanger: true,
              ),
          ],

          // "Laisser un avis" on completed missions
          if (mission.status == MissionStatus.completed ||
              mission.status == MissionStatus.paid)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => context.goNamed(
                  'review',
                  pathParameters: {'missionId': mission.id},
                  extra: {
                    'targetUserId': mission.assignedToUserId ?? '',
                    'targetName': 'Travailleur',
                  },
                ),
                icon: const Icon(Icons.star_outline, color: WkColors.brandRed, size: 16),
                label: const Text('Laisser un avis', style: TextStyle(color: WkColors.brandRed, fontSize: 12)),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _LifecycleButton extends StatelessWidget {
  const _LifecycleButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isDanger = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isDanger;

  @override
  Widget build(BuildContext context) {
    final color = isDanger ? WkColors.error : WkColors.brandRed;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 16, color: color),
        label: Text(label, style: TextStyle(color: color, fontSize: 13)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withValues(alpha: 0.5)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final MissionStatus status;

  @override
  Widget build(BuildContext context) {
    Color color;
    final label = status.displayName;
    switch (status) {
      case MissionStatus.open:
        color = WkColors.success;
        break;
      case MissionStatus.assigned:
      case MissionStatus.inProgress:
        color = const Color(0xFF2563EB);
        break;
      case MissionStatus.completed:
      case MissionStatus.paid:
        color = WkColors.textSecondary;
        break;
      case MissionStatus.cancelled:
        color = WkColors.error;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// P5.5 — Onglet "À confirmer" : offres entrantes avec Accepter / Refuser

class _OffersToConfirmTab extends StatefulWidget {
  @override
  State<_OffersToConfirmTab> createState() => _OffersToConfirmTabState();
}

class _OffersToConfirmTabState extends State<_OffersToConfirmTab> {
  List<Offer> _offers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      // GET /api/v1/offers/mine — offres reçues par le client
      final offers = await OffersApi().fetchMyOffersDetailed();
      final pending = offers.where((o) => o.status == OfferStatus.pending).toList();
      if (mounted) setState(() { _offers = pending; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _accept(String offerId) async {
    try {
      await OffersApi().acceptOffer(offerId);
      if (mounted) {
        setState(() => _offers.removeWhere((o) => o.id == offerId));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Travailleur accepté !'), backgroundColor: WkColors.success),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'accepter.'), backgroundColor: WkColors.error),
        );
      }
    }
  }

  Future<void> _reject(String offerId) async {
    try {
      await OffersApi().rejectOffer(offerId);
      if (mounted) setState(() => _offers.removeWhere((o) => o.id == offerId));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: WkColors.brandRed));
    }
    if (_offers.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, color: WkColors.textTertiary, size: 48),
            SizedBox(height: 12),
            Text('Aucune demande à confirmer', style: TextStyle(color: WkColors.textSecondary)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _offers.length,
      itemBuilder: (_, i) {
        final offer = _offers[i];
        final workerName = offer.applicant?.name ?? 'Travailleur';
        final missionTitle = offer.mission?.title ?? 'Contrat de service';
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
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
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: WkColors.bgTertiary,
                    child: const Icon(Icons.person, color: WkColors.textSecondary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          workerName,
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: WkColors.textPrimary,
                          ),
                        ),
                        Text(
                          missionTitle,
                          style: const TextStyle(fontSize: 13, color: WkColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (offer.message != null && offer.message!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: WkColors.bgTertiary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    offer.message!,
                    style: const TextStyle(fontSize: 13, color: WkColors.textSecondary),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _reject(offer.id),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: WkColors.error,
                        side: const BorderSide(color: WkColors.error),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Refuser'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _accept(offer.id),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WkColors.brandRed,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Accepter', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
