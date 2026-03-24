/// WkPrimaryButton — Solid red CTA button matching WorkOn brand references.
///
/// Full-width, pill shape, solid brandRed. Matches the reference design
/// showing "Réserver", "Commencer", "Finaliser mon inscription", etc.
library;

import 'package:flutter/material.dart';

import '../config/ui_tokens.dart';
import '../config/workon_colors.dart';

class WkPrimaryButton extends StatelessWidget {
  const WkPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.height = 52.0,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final double height;

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPressed != null && !isLoading;

    return GestureDetector(
      onTap: enabled ? onPressed : null,
      child: AnimatedContainer(
        duration: WkDuration.fast,
        width: double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: enabled ? WkColors.brandRed : WkColors.bgTertiary,
          borderRadius: BorderRadius.circular(WkRadius.pill),
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, color: Colors.white, size: 18),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      label,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        letterSpacing: 0.1,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
