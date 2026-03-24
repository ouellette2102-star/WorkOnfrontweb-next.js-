/// WorkOn Trust & Match Score Widgets — PR #12
///
/// Premium mechanics for reputation, reliability, and matching signals.
/// All visual — no backend calls. Data passed in as primitives.
///
/// Usage:
/// ```dart
/// WkTrustScore(score: 92)
/// WkMatchScore(score: 87, label: 'Compatibilité')
/// WkReliabilityBar(completionRate: 0.96, responseTime: '~1h')
/// ```
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WK TRUST SCORE
// ─────────────────────────────────────────────────────────────────────────────

/// Trust score ring — circular progress + numeric label.
/// Used on public profiles and worker cards.
class WkTrustScore extends StatelessWidget {
  const WkTrustScore({
    super.key,
    required this.score,
    this.size = WkTrustScoreSize.medium,
    this.showLabel = true,
  });

  final int score;
  final WkTrustScoreSize size;
  final bool showLabel;

  Color get _color {
    if (score >= 90) return WkColors.availableGreen;
    if (score >= 75) return WkColors.brandOrange;
    if (score >= 60) return WkColors.warning;
    return WkColors.error;
  }

  String get _label {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Fiable';
    if (score >= 60) return 'Bon';
    return 'À améliorer';
  }

  double get _ringSize => switch (size) {
    WkTrustScoreSize.small => 40.0,
    WkTrustScoreSize.medium => 56.0,
    WkTrustScoreSize.large => 80.0,
  };

  double get _fontSize => switch (size) {
    WkTrustScoreSize.small => 11.0,
    WkTrustScoreSize.medium => 14.0,
    WkTrustScoreSize.large => 20.0,
  };

  double get _strokeWidth => switch (size) {
    WkTrustScoreSize.small => 3.0,
    WkTrustScoreSize.medium => 4.0,
    WkTrustScoreSize.large => 6.0,
  };

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: _ringSize,
          height: _ringSize,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: score / 100.0,
                strokeWidth: _strokeWidth,
                backgroundColor: WkColors.bgTertiary,
                valueColor: AlwaysStoppedAnimation<Color>(_color),
                strokeCap: StrokeCap.round,
              ),
              Text(
                '$score',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: _fontSize,
                  fontWeight: FontWeight.w700,
                  color: WkColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (showLabel && size != WkTrustScoreSize.small) ...[
          const SizedBox(height: 4),
          Text(
            _label,
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: _color,
            ),
          ),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WK MATCH SCORE
// ─────────────────────────────────────────────────────────────────────────────

/// Match compatibility score — inline pill with gradient.
/// Used on swipe cards and mission cards.
class WkMatchScore extends StatelessWidget {
  const WkMatchScore({
    super.key,
    required this.score,
    this.label,
  });

  final int score;
  final String? label;

  Color get _color {
    if (score >= 85) return WkColors.availableGreen;
    if (score >= 70) return WkColors.brandOrange;
    if (score >= 55) return WkColors.warning;
    return WkColors.textTertiary;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(WkRadius.pill),
        border: Border.all(color: _color.withOpacity(0.3), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.bolt_rounded, color: _color, size: 12),
          const SizedBox(width: 3),
          Text(
            label != null ? '${label!} $score%' : '$score%',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: _color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WK RELIABILITY BAR
// ─────────────────────────────────────────────────────────────────────────────

/// Reliability indicators — completion rate + response time.
/// Used on public profiles and booking screen.
class WkReliabilityBar extends StatelessWidget {
  const WkReliabilityBar({
    super.key,
    this.completionRate,
    this.responseTime,
    this.completedMissions,
  });

  final double? completionRate;
  final String? responseTime;
  final int? completedMissions;

  @override
  Widget build(BuildContext context) {
    final items = <_ReliabilityItem>[];

    if (completionRate != null)
      items.add(_ReliabilityItem(
        icon: Icons.check_circle_outline_rounded,
        label: '${(completionRate! * 100).toInt()}%',
        sublabel: WkCopy.completionRate,
        color: completionRate! >= 0.9
            ? WkColors.availableGreen
            : WkColors.brandOrange,
      ));

    if (responseTime != null)
      items.add(_ReliabilityItem(
        icon: Icons.schedule_rounded,
        label: responseTime!,
        sublabel: WkCopy.responseTime,
        color: WkColors.verifiedBlue,
      ));

    if (completedMissions != null)
      items.add(_ReliabilityItem(
        icon: Icons.emoji_events_outlined,
        label: '$completedMissions',
        sublabel: 'missions',
        color: WkColors.premiumGold,
      ));

    if (items.isEmpty) return const SizedBox.shrink();

    return Row(
      children: items
          .expand((item) => [item, const SizedBox(width: WkSpacing.md)])
          .take(items.length * 2 - 1)
          .toList(),
    );
  }
}

class _ReliabilityItem extends StatelessWidget {
  const _ReliabilityItem({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String sublabel;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: WkIconSize.sm),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
              ),
            ),
            Text(
              sublabel,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 10,
                color: WkColors.textTertiary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WK LEVEL BADGE
// ─────────────────────────────────────────────────────────────────────────────

/// Premium level badge — Débutant / Confirmé / Expert / Elite.
class WkLevelBadge extends StatelessWidget {
  const WkLevelBadge({
    super.key,
    required this.level,
    this.completedCount = 0,
  });

  final WkUserLevel level;
  final int completedCount;

  String get _label => switch (level) {
    WkUserLevel.starter => 'Débutant',
    WkUserLevel.confirmed => 'Confirmé',
    WkUserLevel.expert => 'Expert',
    WkUserLevel.elite => 'Élite',
  };

  Color get _color => switch (level) {
    WkUserLevel.starter => WkColors.textTertiary,
    WkUserLevel.confirmed => WkColors.info,
    WkUserLevel.expert => WkColors.brandOrange,
    WkUserLevel.elite => WkColors.premiumGold,
  };

  LinearGradient? get _gradient => switch (level) {
    WkUserLevel.elite => WkColors.gradientGold,
    WkUserLevel.expert => WkColors.gradientPremium,
    _ => null,
  };

  IconData get _icon => switch (level) {
    WkUserLevel.starter => Icons.star_border_rounded,
    WkUserLevel.confirmed => Icons.star_half_rounded,
    WkUserLevel.expert => Icons.star_rounded,
    WkUserLevel.elite => Icons.workspace_premium_rounded,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        gradient: _gradient,
        color: _gradient == null ? _color.withOpacity(0.15) : null,
        borderRadius: BorderRadius.circular(WkRadius.pill),
        border: Border.all(
          color: _color.withOpacity(0.4),
          width: 0.5,
        ),
        boxShadow: level == WkUserLevel.elite ? WkColors.shadowGold : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _icon,
            color: level == WkUserLevel.elite || level == WkUserLevel.expert
                ? Colors.white
                : _color,
            size: 12,
          ),
          const SizedBox(width: 4),
          Text(
            _label,
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: level == WkUserLevel.elite || level == WkUserLevel.expert
                  ? Colors.white
                  : _color,
            ),
          ),
        ],
      ),
    );
  }

  /// Derive level from completed missions count.
  static WkUserLevel fromCount(int count) {
    if (count >= 100) return WkUserLevel.elite;
    if (count >= 25) return WkUserLevel.expert;
    if (count >= 5) return WkUserLevel.confirmed;
    return WkUserLevel.starter;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum WkTrustScoreSize { small, medium, large }

enum WkUserLevel { starter, confirmed, expert, elite }
