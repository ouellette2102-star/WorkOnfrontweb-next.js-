/// WorkOn Logo Widget
///
/// Renders the WorkOn wordmark with the brand identity:
/// "Work" + red location-pin (replacing the "O") + "n"
///
/// This matches the official WorkOn logo where the letter O
/// is replaced by a red map-pin icon.
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WK LOGO WIDGET
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn brand logo — "Work" + pin icon + "n".
///
/// Usage:
/// ```dart
/// WkLogo()                    // default 22px, white text
/// WkLogo(fontSize: 28)        // larger
/// WkLogo(color: Colors.black) // dark variant (light background)
/// ```
class WkLogo extends StatelessWidget {
  const WkLogo({
    super.key,
    this.fontSize = 22.0,
    this.color = WkColors.textPrimary,
    this.pinColor = WkColors.brandRed,
  });

  final double fontSize;
  final Color color;
  final Color pinColor;

  @override
  Widget build(BuildContext context) {
    // Pin is slightly larger than the cap height for visual balance
    final double pinSize = fontSize * 1.45;

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'Work',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: fontSize,
            fontWeight: FontWeight.w700,
            color: color,
            letterSpacing: -0.4,
            height: 1.0,
          ),
        ),
        // The pin icon replaces the "O" — slightly lifted to align with cap height
        Transform.translate(
          offset: Offset(0, -fontSize * 0.08),
          child: Icon(
            Icons.location_on,
            color: pinColor,
            size: pinSize,
          ),
        ),
        // Negative offset to tuck "n" closer to the pin (kerning)
        Transform.translate(
          offset: Offset(-fontSize * 0.08, 0),
          child: Text(
            'n',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: -0.4,
              height: 1.0,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

/// AppBar size — 20px, fits in standard 56px AppBar
class WkLogoAppBar extends StatelessWidget {
  const WkLogoAppBar({super.key});

  @override
  Widget build(BuildContext context) =>
      const WkLogo(fontSize: 20);
}

/// Large hero size — 32px, for splash / onboarding
class WkLogoHero extends StatelessWidget {
  const WkLogoHero({super.key});

  @override
  Widget build(BuildContext context) =>
      const WkLogo(fontSize: 32);
}

/// Drawer size — 18px
class WkLogoDrawer extends StatelessWidget {
  const WkLogoDrawer({super.key});

  @override
  Widget build(BuildContext context) =>
      const WkLogo(fontSize: 18);
}
