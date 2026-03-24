import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../services/workers/worker_models.dart';
import '../../services/workers/workers_api.dart';
import '../../widgets/worker_card.dart';

/// Swipe screen — "Trouvez votre talent".
/// Fetches workers from GET /api/v1/profiles/workers and displays as swipeable cards.
class TalentSwipeScreen extends StatefulWidget {
  const TalentSwipeScreen({super.key});

  @override
  State<TalentSwipeScreen> createState() => _TalentSwipeScreenState();
}

class _TalentSwipeScreenState extends State<TalentSwipeScreen> {
  final CardSwiperController _swiperCtrl = CardSwiperController();
  List<WorkerProfile> _workers = [];
  bool _loading = true;
  String? _error;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadWorkers();
  }

  Future<void> _loadWorkers() async {
    try {
      final result = await const WorkersApi().getWorkers(limit: 30);
      if (mounted) {
        setState(() {
          _workers = result.workers;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Impossible de charger les travailleurs.';
          _loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _swiperCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Explorer',
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: WkColors.textPrimary),
            onPressed: () {/* TODO: filters */},
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: WkColors.brandRed),
            )
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _loadWorkers)
              : _workers.isEmpty
                  ? const _EmptyView()
                  : _SwipeView(
                      workers: _workers,
                      swiperCtrl: _swiperCtrl,
                      currentIndex: _currentIndex,
                      onIndexChange: (i) => setState(() => _currentIndex = i),
                    ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _SwipeView extends StatelessWidget {
  const _SwipeView({
    required this.workers,
    required this.swiperCtrl,
    required this.currentIndex,
    required this.onIndexChange,
  });

  final List<WorkerProfile> workers;
  final CardSwiperController swiperCtrl;
  final int currentIndex;
  final ValueChanged<int> onIndexChange;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Deck indicator + counter
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${currentIndex + 1} / ${workers.length}',
                style: const TextStyle(
                  fontFamily: 'General Sans',
                  color: WkColors.textTertiary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              // Dot indicators (max 7 visible)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(
                  workers.length.clamp(0, 7),
                  (i) => AnimatedContainer(
                    duration: WkDuration.fast,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    width: i == currentIndex % 7 ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      gradient: i == currentIndex % 7
                          ? WkColors.gradientPremium
                          : null,
                      color: i == currentIndex % 7
                          ? null
                          : WkColors.bgQuaternary,
                      borderRadius: BorderRadius.circular(WkRadius.pill),
                    ),
                  ),
                ),
              ),
              const Text(
                '← ✕    ❤ →',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  color: WkColors.textTertiary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        // Cards
        Expanded(
          child: CardSwiper(
            controller: swiperCtrl,
            cardsCount: workers.length,
            onSwipe: (prev, curr, dir) {
              if (curr != null) onIndexChange(curr);
              return true;
            },
            cardBuilder: (ctx, index, h, v) {
              final worker = workers[index];
              return               WorkerCard(
                worker: worker,
                onTap: () => context.goNamed(
                  'worker-detail',
                  pathParameters: {'workerId': worker.id},
                  extra: {
                    'firstName': worker.firstName,
                    'lastName': worker.lastName,
                    'jobTitle': worker.jobTitle ?? '',
                    'city': worker.city ?? '',
                    'photoUrl': worker.photoUrl ?? '',
                    'rating': worker.averageRating,
                    'completionPct': worker.completionPercentage,
                    'hourlyRate': worker.hourlyRate ?? 0,
                  },
                ),
                onReserve: () => context.goNamed(
                  'booking',
                  pathParameters: {'workerId': worker.id},
                  extra: {
                    'firstName': worker.firstName,
                    'lastName': worker.lastName,
                    'jobTitle': worker.jobTitle ?? '',
                    'city': worker.city ?? '',
                    'photoUrl': worker.photoUrl ?? '',
                    'rating': worker.averageRating,
                    'completionPct': worker.completionPercentage,
                    'hourlyRate': worker.hourlyRate ?? 0,
                  },
                ),
              );
            },
          ),
        ),
        // Action buttons (skip | contact)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _ActionBtn(
                icon: Icons.close_rounded,
                color: WkColors.error,
                onTap: () => swiperCtrl.swipe(CardSwiperDirection.left),
              ),
              const SizedBox(width: 36),
              _ActionBtn(
                icon: Icons.favorite_rounded,
                color: WkColors.brandOrange,
                isPrimary: true,
                onTap: () => swiperCtrl.swipe(CardSwiperDirection.right),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({
    required this.icon,
    required this.color,
    required this.onTap,
    this.isPrimary = false,
  });
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: isPrimary ? 68 : 56,
        height: isPrimary ? 68 : 56,
        decoration: BoxDecoration(
          gradient: isPrimary ? WkColors.gradientPremium : null,
          color: isPrimary ? null : WkColors.bgSecondary,
          shape: BoxShape.circle,
          border: isPrimary
              ? null
              : Border.all(color: color.withOpacity(0.3), width: 1.5),
          boxShadow: isPrimary
              ? WkColors.shadowPremium
              : [
                  BoxShadow(
                    color: color.withOpacity(0.1),
                    blurRadius: 12,
                  ),
                ],
        ),
        child: Icon(
          icon,
          color: isPrimary ? Colors.white : color,
          size: isPrimary ? 30 : 26,
        ),
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
          const SizedBox(height: 16),
          Text(error, style: const TextStyle(color: WkColors.textSecondary)),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onRetry,
            child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed)),
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, color: WkColors.textTertiary, size: 64),
          SizedBox(height: 16),
          Text(
            'Aucun travailleur disponible',
            style: TextStyle(color: WkColors.textSecondary, fontSize: 16),
          ),
          SizedBox(height: 8),
          Text(
            'Revenez plus tard',
            style: TextStyle(color: WkColors.textTertiary, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
