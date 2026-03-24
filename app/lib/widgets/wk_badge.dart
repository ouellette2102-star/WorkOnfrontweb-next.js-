/// WorkOn Badge Widget — PR #2
///
/// Unified badge component for trust signals, levels, and status indicators.
/// All badge variants follow the WorkOn premium design system.
///
/// Usage:
/// ```dart
/// WkBadge.verified()
/// WkBadge.pro()
/// WkBadge.available()
/// WkBadge.custom(label: 'Urgent', color: WkColors.error)
/// ```
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// BADGE VARIANT ENUM
// ─────────────────────────────────────────────────────────────────────────────

enum WkBadgeVariant {
  verified,
  conforme,
  pro,
  premium,
  topRated,
  reliable,
  available,
  unavailable,
  urgent,
  featured,
  newUser,
  active,
  custom,
}

// ─────────────────────────────────────────────────────────────────────────────
// WK BADGE
// ─────────────────────────────────────────────────────────────────────────────

/// Premium badge component for WorkOn trust signals and status indicators.
class WkBadge extends StatelessWidget {
  const WkBadge._({
    required this.label,
    required this.variant,
    this.icon,
    this.color,
    this.backgroundColor,
    this.size = WkBadgeSize.small,
    this.showIcon = true,
  });

  // ─── Factory constructors ───

  /// ✓ Identité vérifiée — blue
  factory WkBadge.verified({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeVerified,
      variant: WkBadgeVariant.verified,
      icon: Icons.verified,
      color: WkColors.verifiedBlue,
      backgroundColor: WkColors.verifiedBlueSoft,
      size: size,
    );
  }

  /// ✓ Conformité métier — green
  factory WkBadge.conforme({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeConforme,
      variant: WkBadgeVariant.conforme,
      icon: Icons.shield_outlined,
      color: WkColors.availableGreen,
      backgroundColor: WkColors.availableGreenSoft,
      size: size,
    );
  }

  /// 💼 Pro plan — orange brand
  factory WkBadge.pro({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgePro,
      variant: WkBadgeVariant.pro,
      icon: Icons.workspace_premium_outlined,
      color: WkColors.brandOrange,
      backgroundColor: WkColors.brandOrangeSoft,
      size: size,
    );
  }

  /// ⭐ Premium plan — gold gradient
  factory WkBadge.premium({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgePremium,
      variant: WkBadgeVariant.premium,
      icon: Icons.star_rounded,
      color: WkColors.premiumGold,
      backgroundColor: WkColors.premiumGoldSoft,
      size: size,
    );
  }

  /// 🏆 Top noté — gold
  factory WkBadge.topRated({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeTopRated,
      variant: WkBadgeVariant.topRated,
      icon: Icons.emoji_events_outlined,
      color: WkColors.premiumGold,
      backgroundColor: WkColors.premiumGoldSoft,
      size: size,
    );
  }

  /// ✅ Fiable — green
  factory WkBadge.reliable({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeReliable,
      variant: WkBadgeVariant.reliable,
      icon: Icons.check_circle_outline,
      color: WkColors.success,
      backgroundColor: WkColors.successSoft,
      size: size,
    );
  }

  /// 🟢 Disponible maintenant — green with animated dot
  factory WkBadge.available({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.availableNow,
      variant: WkBadgeVariant.available,
      icon: null,
      color: WkColors.availableGreen,
      backgroundColor: WkColors.availableGreenSoft,
      size: size,
    );
  }

  /// ⚫ Non disponible — muted
  factory WkBadge.unavailable({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.notAvailable,
      variant: WkBadgeVariant.unavailable,
      icon: null,
      color: WkColors.textTertiary,
      backgroundColor: WkColors.bgTertiary,
      size: size,
    );
  }

  /// 🔴 Urgent — brand red
  factory WkBadge.urgent({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeUrgent,
      variant: WkBadgeVariant.urgent,
      icon: Icons.bolt_rounded,
      color: WkColors.brandRed,
      backgroundColor: WkColors.brandRedSoft,
      size: size,
    );
  }

  /// ✨ En vedette — orange
  factory WkBadge.featured({WkBadgeSize size = WkBadgeSize.small}) {
    return WkBadge._(
      label: WkCopy.badgeFeatured,
      variant: WkBadgeVariant.featured,
      icon: Icons.auto_awesome,
      color: WkColors.brandOrange,
      backgroundColor: WkColors.brandOrangeSoft,
      size: size,
    );
  }

  /// Custom badge with any label and color
  factory WkBadge.custom({
    required String label,
    required Color color,
    required Color backgroundColor,
    IconData? icon,
    WkBadgeSize size = WkBadgeSize.small,
  }) {
    return WkBadge._(
      label: label,
      variant: WkBadgeVariant.custom,
      icon: icon,
      color: color,
      backgroundColor: backgroundColor,
      size: size,
    );
  }

  final String label;
  final WkBadgeVariant variant;
  final IconData? icon;
  final Color? color;
  final Color? backgroundColor;
  final WkBadgeSize size;
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    final fg = color ?? WkColors.textPrimary;
    final bg = backgroundColor ?? WkColors.bgTertiary;
    final isAvailable = variant == WkBadgeVariant.available;
    final isUnavailable = variant == WkBadgeVariant.unavailable;
    final hasStatusDot = isAvailable || isUnavailable;

    final double fontSize = size == WkBadgeSize.large ? 12.0 : 10.0;
    final double iconSize = size == WkBadgeSize.large ? 14.0 : 11.0;
    final double dotSize = size == WkBadgeSize.large ? 8.0 : 6.0;
    final EdgeInsets padding = size == WkBadgeSize.large
        ? const EdgeInsets.symmetric(horizontal: 10, vertical: 5)
        : const EdgeInsets.symmetric(horizontal: 7, vertical: 3);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(WkRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hasStatusDot) ...[
            _StatusDot(color: fg, size: dotSize),
            const SizedBox(width: 4),
          ] else if (icon != null) ...[
            Icon(icon, color: fg, size: iconSize),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              color: fg,
              letterSpacing: 0.2,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE ROW
// ─────────────────────────────────────────────────────────────────────────────

/// Horizontal row of badges with auto-wrap and spacing.
class WkBadgeRow extends StatelessWidget {
  const WkBadgeRow({
    super.key,
    required this.badges,
    this.spacing = 6.0,
  });

  final List<WkBadge> badges;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: spacing,
      runSpacing: spacing,
      children: badges,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DOT (animated for availability)
// ─────────────────────────────────────────────────────────────────────────────

class _StatusDot extends StatefulWidget {
  const _StatusDot({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  State<_StatusDot> createState() => _StatusDotState();
}

class _StatusDotState extends State<_StatusDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.4, end: 1.0).animate(
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
      animation: _opacity,
      builder: (_, __) => Opacity(
        opacity: _opacity.value,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: widget.color.withOpacity(0.5),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIZE ENUM
// ─────────────────────────────────────────────────────────────────────────────

enum WkBadgeSize { small, large }
