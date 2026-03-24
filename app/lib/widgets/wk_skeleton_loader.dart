/// WorkOn Skeleton Loader Widget — PR #2
///
/// Shimmer loading states for cards, profiles, and lists.
/// Replaces blank screens and spinners with content-aware placeholders.
///
/// Usage:
/// ```dart
/// WkSkeletonLoader.card()
/// WkSkeletonLoader.profileCard()
/// WkSkeletonLoader.missionCard()
/// WkSkeletonLoader.listItem()
/// WkSkeleton(width: 120, height: 16)  // arbitrary block
/// ```
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// SHIMMER ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

/// Base shimmer animation wrapper.
class _ShimmerWrapper extends StatefulWidget {
  const _ShimmerWrapper({required this.child});

  final Widget child;

  @override
  State<_ShimmerWrapper> createState() => _ShimmerWrapperState();
}

class _ShimmerWrapperState extends State<_ShimmerWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _animation = Tween<double>(begin: -2.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: const [
                Color(0xFF1A1A1E),
                Color(0xFF2A2A2E),
                Color(0xFF333338),
                Color(0xFF2A2A2E),
                Color(0xFF1A1A1E),
              ],
              stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
              transform: _SlidingGradientTransform(slidePercent: _animation.value),
            ).createShader(bounds);
          },
          child: child!,
        );
      },
      child: widget.child,
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  const _SlidingGradientTransform({required this.slidePercent});

  final double slidePercent;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * slidePercent, 0, 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE SKELETON BLOCK
// ─────────────────────────────────────────────────────────────────────────────

/// Single skeleton block with optional radius.
class WkSkeleton extends StatelessWidget {
  const WkSkeleton({
    super.key,
    this.width,
    this.height = 14.0,
    this.radius,
    this.isCircle = false,
  });

  final double? width;
  final double height;
  final double? radius;
  final bool isCircle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: isCircle
            ? null
            : BorderRadius.circular(radius ?? WkRadius.sm),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/// Factory for pre-built skeleton loading states.
class WkSkeletonLoader extends StatelessWidget {
  const WkSkeletonLoader._({required this.child});

  /// Generic card skeleton
  factory WkSkeletonLoader.card() {
    return const WkSkeletonLoader._(child: _CardSkeleton());
  }

  /// Profile/worker card skeleton (swipe style)
  factory WkSkeletonLoader.profileCard() {
    return const WkSkeletonLoader._(child: _ProfileCardSkeleton());
  }

  /// Mission card skeleton
  factory WkSkeletonLoader.missionCard() {
    return const WkSkeletonLoader._(child: _MissionCardSkeleton());
  }

  /// List item skeleton (conversation, notification)
  factory WkSkeletonLoader.listItem() {
    return const WkSkeletonLoader._(child: _ListItemSkeleton());
  }

  /// Profile header skeleton (my profile / worker detail)
  factory WkSkeletonLoader.profileHeader() {
    return const WkSkeletonLoader._(child: _ProfileHeaderSkeleton());
  }

  /// Stat card skeleton (dashboard)
  factory WkSkeletonLoader.statCard() {
    return const WkSkeletonLoader._(child: _StatCardSkeleton());
  }

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return _ShimmerWrapper(child: child);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

class _CardSkeleton extends StatelessWidget {
  const _CardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(WkSpacing.cardPadding),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(children: [
            const WkSkeleton(width: 44, height: 44, isCircle: true),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  WkSkeleton(width: double.infinity, height: 14, radius: WkRadius.xs),
                  const SizedBox(height: 6),
                  WkSkeleton(width: 120, height: 11, radius: WkRadius.xs),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 14),
          WkSkeleton(width: double.infinity, height: 11, radius: WkRadius.xs),
          const SizedBox(height: 6),
          WkSkeleton(width: 200, height: 11, radius: WkRadius.xs),
          const SizedBox(height: 14),
          WkSkeleton(width: 100, height: 32, radius: WkRadius.pill),
        ],
      ),
    );
  }
}

class _ProfileCardSkeleton extends StatelessWidget {
  const _ProfileCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 420,
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.cardLarge),
      ),
      child: Stack(
        children: [
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.all(WkSpacing.cardPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  WkSkeleton(width: 160, height: 20, radius: WkRadius.xs),
                  const SizedBox(height: 8),
                  WkSkeleton(width: 120, height: 13, radius: WkRadius.xs),
                  const SizedBox(height: 10),
                  Row(children: [
                    WkSkeleton(width: 80, height: 26, radius: WkRadius.pill),
                    const SizedBox(width: 8),
                    WkSkeleton(width: 70, height: 26, radius: WkRadius.pill),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MissionCardSkeleton extends StatelessWidget {
  const _MissionCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(WkSpacing.cardPadding),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(children: [
            WkSkeleton(width: 72, height: 26, radius: WkRadius.pill),
            const SizedBox(width: 8),
            WkSkeleton(width: 60, height: 26, radius: WkRadius.pill),
          ]),
          const SizedBox(height: 12),
          WkSkeleton(width: double.infinity, height: 16, radius: WkRadius.xs),
          const SizedBox(height: 6),
          WkSkeleton(width: 180, height: 13, radius: WkRadius.xs),
          const SizedBox(height: 12),
          Row(children: [
            const WkSkeleton(width: 16, height: 16, isCircle: true),
            const SizedBox(width: 6),
            WkSkeleton(width: 100, height: 12, radius: WkRadius.xs),
            const Spacer(),
            WkSkeleton(width: 60, height: 18, radius: WkRadius.xs),
          ]),
        ],
      ),
    );
  }
}

class _ListItemSkeleton extends StatelessWidget {
  const _ListItemSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: WkSpacing.pagePadding,
        vertical: WkSpacing.sm,
      ),
      child: Row(children: [
        const WkSkeleton(width: 48, height: 48, isCircle: true),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              WkSkeleton(width: double.infinity, height: 14, radius: WkRadius.xs),
              const SizedBox(height: 6),
              WkSkeleton(width: 160, height: 11, radius: WkRadius.xs),
            ],
          ),
        ),
        const SizedBox(width: 12),
        WkSkeleton(width: 40, height: 11, radius: WkRadius.xs),
      ]),
    );
  }
}

class _ProfileHeaderSkeleton extends StatelessWidget {
  const _ProfileHeaderSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        WkSkeleton(width: double.infinity, height: 240, radius: 0),
        Padding(
          padding: const EdgeInsets.all(WkSpacing.pagePadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const WkSkeleton(width: 80, height: 80, isCircle: true),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WkSkeleton(width: 160, height: 20, radius: WkRadius.xs),
                      const SizedBox(height: 8),
                      WkSkeleton(width: 120, height: 14, radius: WkRadius.xs),
                      const SizedBox(height: 8),
                      WkSkeleton(width: 100, height: 14, radius: WkRadius.xs),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              Row(children: [
                WkSkeleton(width: 80, height: 26, radius: WkRadius.pill),
                const SizedBox(width: 8),
                WkSkeleton(width: 70, height: 26, radius: WkRadius.pill),
                const SizedBox(width: 8),
                WkSkeleton(width: 90, height: 26, radius: WkRadius.pill),
              ]),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatCardSkeleton extends StatelessWidget {
  const _StatCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(WkSpacing.cardPadding),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          WkSkeleton(width: 36, height: 36, radius: WkRadius.sm),
          const SizedBox(height: 12),
          WkSkeleton(width: 80, height: 28, radius: WkRadius.xs),
          const SizedBox(height: 6),
          WkSkeleton(width: 100, height: 12, radius: WkRadius.xs),
        ],
      ),
    );
  }
}
