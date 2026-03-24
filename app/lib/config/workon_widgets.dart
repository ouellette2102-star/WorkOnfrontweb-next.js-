/// WorkOn Reusable Widgets
///
/// Premium UI components following the WorkOn design system.
/// Drop-in replacements for standard Flutter widgets.
///
/// **Design System v1.0** - January 2026
library;

import 'package:flutter/material.dart';
import 'workon_colors.dart';
import 'workon_typography.dart';
import 'ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WORKON BUTTON
// ─────────────────────────────────────────────────────────────────────────────

/// Premium button widget with WorkOn styling.
///
/// Usage:
/// ```dart
/// WorkOnButton.primary(
///   label: 'Se connecter',
///   onPressed: () {},
/// )
/// ```
class WorkOnButton extends StatelessWidget {
  const WorkOnButton._({
    required this.label,
    required this.onPressed,
    required this.variant,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.size = WorkOnButtonSize.medium,
  });

  /// Primary red button (main CTA)
  factory WorkOnButton.primary({
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool isLoading = false,
    bool isFullWidth = false,
    WorkOnButtonSize size = WorkOnButtonSize.medium,
  }) {
    return WorkOnButton._(
      label: label,
      onPressed: onPressed,
      variant: _ButtonVariant.primary,
      icon: icon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      size: size,
    );
  }

  /// Secondary outline button
  factory WorkOnButton.secondary({
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool isLoading = false,
    bool isFullWidth = false,
    WorkOnButtonSize size = WorkOnButtonSize.medium,
  }) {
    return WorkOnButton._(
      label: label,
      onPressed: onPressed,
      variant: _ButtonVariant.secondary,
      icon: icon,
      isLoading: isLoading,
      isFullWidth: isFullWidth,
      size: size,
    );
  }

  /// Ghost text button
  factory WorkOnButton.ghost({
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool isLoading = false,
    bool isFullWidth = false,
    WorkOnButtonSize size = WorkOnButtonSize.medium,
  }) {
    return WorkOnButton._(
      label: label,
      onPressed: onPressed,
      variant: _ButtonVariant.ghost,
      isFullWidth: isFullWidth,
      icon: icon,
      isLoading: isLoading,
      size: size,
    );
  }

  final String label;
  final VoidCallback? onPressed;
  final _ButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final WorkOnButtonSize size;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;
    
    final padding = switch (size) {
      WorkOnButtonSize.small => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      WorkOnButtonSize.medium => const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      WorkOnButtonSize.large => const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
    };
    
    final textStyle = switch (size) {
      WorkOnButtonSize.small => WkTypography.buttonSmall,
      WorkOnButtonSize.medium => WkTypography.buttonMedium,
      WorkOnButtonSize.large => WkTypography.buttonLarge,
    };
    
    final iconSize = switch (size) {
      WorkOnButtonSize.small => 16.0,
      WorkOnButtonSize.medium => 20.0,
      WorkOnButtonSize.large => 24.0,
    };

    Widget buttonChild = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(
                variant == _ButtonVariant.primary
                    ? WkColors.textOnRed
                    : WkColors.brandRed,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ] else if (icon != null) ...[
          Icon(icon, size: iconSize),
          const SizedBox(width: 8),
        ],
        Text(label, style: textStyle),
      ],
    );

    switch (variant) {
      case _ButtonVariant.primary:
        return SizedBox(
          width: isFullWidth ? double.infinity : null,
          child: ElevatedButton(
            onPressed: isDisabled ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDisabled ? WkColors.bgTertiary : WkColors.brandRed,
              foregroundColor: isDisabled ? WkColors.textDisabled : WkColors.textOnRed,
              elevation: isDisabled ? 0 : 4,
              shadowColor: WkColors.brandRed.withOpacity(0.5),
              padding: padding,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(WkRadius.button),
              ),
            ),
            child: buttonChild,
          ),
        );

      case _ButtonVariant.secondary:
        return SizedBox(
          width: isFullWidth ? double.infinity : null,
          child: OutlinedButton(
            onPressed: isDisabled ? null : onPressed,
            style: OutlinedButton.styleFrom(
              foregroundColor: isDisabled ? WkColors.textDisabled : WkColors.textPrimary,
              side: BorderSide(
                color: isDisabled ? WkColors.bgQuaternary : WkColors.glassBorder,
                width: 1.5,
              ),
              padding: padding,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(WkRadius.button),
              ),
            ),
            child: buttonChild,
          ),
        );

      case _ButtonVariant.ghost:
        return TextButton(
          onPressed: isDisabled ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: isDisabled ? WkColors.textDisabled : WkColors.brandRed,
            padding: padding,
          ),
          child: buttonChild,
        );
    }
  }
}

enum _ButtonVariant { primary, secondary, ghost }
enum WorkOnButtonSize { small, medium, large }

// ─────────────────────────────────────────────────────────────────────────────
// WORKON CARD
// ─────────────────────────────────────────────────────────────────────────────

/// Premium card widget with multiple variants.
///
/// Usage:
/// ```dart
/// WorkOnCard.standard(
///   child: Text('Content'),
/// )
/// ```
class WorkOnCard extends StatelessWidget {
  const WorkOnCard._({
    required this.child,
    required this.variant,
    this.onTap,
    this.padding,
    this.margin,
    this.borderRadius,
  });

  /// Standard dark card
  factory WorkOnCard.standard({
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? borderRadius,
  }) {
    return WorkOnCard._(
      child: child,
      variant: _CardVariant.standard,
      onTap: onTap,
      padding: padding,
      margin: margin,
      borderRadius: borderRadius,
    );
  }

  /// Glassmorphism card
  factory WorkOnCard.glass({
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? borderRadius,
  }) {
    return WorkOnCard._(
      child: child,
      variant: _CardVariant.glass,
      onTap: onTap,
      padding: padding,
      margin: margin,
      borderRadius: borderRadius,
    );
  }

  /// Elevated card for modals/overlays
  factory WorkOnCard.elevated({
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? borderRadius,
  }) {
    return WorkOnCard._(
      child: child,
      variant: _CardVariant.elevated,
      onTap: onTap,
      padding: padding,
      margin: margin,
      borderRadius: borderRadius,
    );
  }

  /// Red accent card
  factory WorkOnCard.accent({
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? borderRadius,
  }) {
    return WorkOnCard._(
      child: child,
      variant: _CardVariant.accent,
      onTap: onTap,
      padding: padding,
      margin: margin,
      borderRadius: borderRadius,
    );
  }

  final Widget child;
  final _CardVariant variant;
  final VoidCallback? onTap;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final double? borderRadius;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? WkRadius.card;
    final cardPadding = padding ?? const EdgeInsets.all(WkSpacing.cardPadding);

    final decoration = switch (variant) {
      _CardVariant.standard => BoxDecoration(
          color: WkColors.bgSecondary,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: WkColors.shadowCard,
        ),
      _CardVariant.glass => BoxDecoration(
          color: WkColors.glassWhite,
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: WkColors.glassBorder, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
      _CardVariant.elevated => BoxDecoration(
          color: WkColors.bgTertiary,
          borderRadius: BorderRadius.circular(radius + 4),
          boxShadow: WkColors.shadowElevated,
        ),
      _CardVariant.accent => BoxDecoration(
          gradient: WkColors.gradientPrimary,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: WkColors.shadowGlow,
        ),
    };

    final content = Container(
      margin: margin,
      decoration: decoration,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Padding(
          padding: cardPadding,
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: content,
      );
    }

    return content;
  }
}

enum _CardVariant { standard, glass, elevated, accent }

// ─────────────────────────────────────────────────────────────────────────────
// WORKON TEXT FIELD
// ─────────────────────────────────────────────────────────────────────────────

/// Premium text field with dark styling.
///
/// Usage:
/// ```dart
/// WorkOnTextField(
///   label: 'Email',
///   hint: 'exemple@workon.app',
///   controller: emailController,
/// )
/// ```
class WorkOnTextField extends StatelessWidget {
  const WorkOnTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.errorText,
    this.maxLines = 1,
    this.enabled = true,
    this.autofocus = false,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final String? Function(String?)? validator;
  final String? errorText;
  final int maxLines;
  final bool enabled;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: WkTypography.labelMedium.copyWith(
              color: WkColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          maxLines: maxLines,
          enabled: enabled,
          autofocus: autofocus,
          style: WkTypography.bodyMedium.copyWith(
            color: WkColors.textPrimary,
          ),
          cursorColor: WkColors.brandRed,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: WkTypography.bodyMedium.copyWith(
              color: WkColors.textTertiary,
            ),
            errorText: errorText,
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon, color: WkColors.textSecondary, size: 20)
                : null,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: enabled ? WkColors.bgTertiary : WkColors.bgQuaternary,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.glassBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.glassBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.brandRed, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.error, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(WkRadius.button),
              borderSide: const BorderSide(color: WkColors.bgQuaternary),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKON LOGO
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn logo widget with pin marker for "O".
///
/// Usage:
/// ```dart
/// WorkOnLogo(size: 48)
/// WorkOnLogo.withTagline()
/// ```
class WorkOnLogo extends StatelessWidget {
  const WorkOnLogo({
    super.key,
    this.size = 32,
    this.showTagline = false,
  });

  /// Logo with tagline
  factory WorkOnLogo.withTagline({double size = 32}) {
    return WorkOnLogo(size: size, showTagline: true);
  }

  final double size;
  final bool showTagline;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // "Work" text
            Text(
              'Work',
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: size,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            // Pin marker (replacing "O")
            _PinMarker(size: size),
            // "n" text
            Text(
              'n',
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: size,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        if (showTagline) ...[
          const SizedBox(height: 8),
          Text(
            'Une ligne directe vers le travail instantané',
            style: WkTypography.bodySmall.copyWith(
              color: WkColors.textTertiary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

/// Pin marker icon (location pin) for the logo.
class _PinMarker extends StatelessWidget {
  const _PinMarker({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size * 0.7,
      height: size * 1.1,
      child: CustomPaint(
        painter: _PinPainter(),
      ),
    );
  }
}

class _PinPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = WkColors.brandRed
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height * 0.35);
    final radius = size.width * 0.45;

    // Draw the main circle
    canvas.drawCircle(center, radius, paint);

    // Draw the pin point (triangle)
    final path = Path()
      ..moveTo(center.dx - radius * 0.6, center.dy + radius * 0.4)
      ..lineTo(center.dx, size.height * 0.95)
      ..lineTo(center.dx + radius * 0.6, center.dy + radius * 0.4)
      ..close();
    canvas.drawPath(path, paint);

    // Draw the inner circle (hole)
    final innerPaint = Paint()
      ..color = WkColors.bgPrimary
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.35, innerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKON BADGE
// ─────────────────────────────────────────────────────────────────────────────

/// Badge widget for worker profile tags.
///
/// Usage:
/// ```dart
/// WorkOnBadge.reliable()
/// WorkOnBadge.punctual()
/// WorkOnBadge.topPerformer()
/// ```
class WorkOnBadge extends StatelessWidget {
  const WorkOnBadge._({
    required this.label,
    required this.color,
    this.icon,
  });

  factory WorkOnBadge.reliable() => const WorkOnBadge._(
        label: 'RELIABLE',
        color: WkColors.badgeReliable,
        icon: Icons.verified,
      );

  factory WorkOnBadge.punctual() => const WorkOnBadge._(
        label: 'PUNCTUAL',
        color: WkColors.badgePunctual,
        icon: Icons.schedule,
      );

  factory WorkOnBadge.topPerformer() => const WorkOnBadge._(
        label: 'TOP PERFORMER',
        color: WkColors.badgeTopPerformer,
        icon: Icons.star,
      );

  factory WorkOnBadge.certified() => const WorkOnBadge._(
        label: 'CERTIFIÉ',
        color: WkColors.badgeCertified,
        icon: Icons.workspace_premium,
      );

  factory WorkOnBadge.premium() => const WorkOnBadge._(
        label: 'PREMIUM',
        color: WkColors.badgePremium,
        icon: Icons.diamond,
      );

  factory WorkOnBadge.custom({
    required String label,
    required Color color,
    IconData? icon,
  }) =>
      WorkOnBadge._(label: label, color: color, icon: icon);

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(WkRadius.badge),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: WkTypography.badge.copyWith(color: color),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKON STATS ROW
// ─────────────────────────────────────────────────────────────────────────────

/// Stats row for worker profile (missions, earned, rating).
class WorkOnStatsRow extends StatelessWidget {
  const WorkOnStatsRow({
    super.key,
    required this.missions,
    required this.earned,
    required this.rating,
  });

  final int missions;
  final String earned;
  final double rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _StatItem(value: missions.toString(), label: 'Missions'),
        _StatDivider(),
        _StatItem(value: earned, label: 'Earned'),
        _StatDivider(),
        _StatItem(
          value: rating.toStringAsFixed(1),
          label: 'Rating',
          suffix: const Icon(Icons.star, color: WkColors.warning, size: 16),
        ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.value,
    required this.label,
    this.suffix,
  });

  final String value;
  final String label;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(value, style: WkTypography.statSmall),
            if (suffix != null) ...[
              const SizedBox(width: 2),
              suffix!,
            ],
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: WkTypography.labelSmall.copyWith(
            color: WkColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

class _StatDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 40,
      color: WkColors.bgQuaternary,
    );
  }
}
