/// WorkOn Typography System
///
/// Centralized text styles for consistent typography across the app.
/// Uses "General Sans" as the primary font family.
///
/// **Design System v1.0** - January 2026
library;

import 'package:flutter/material.dart';
import 'workon_colors.dart';

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY TOKENS
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn text styles - Premium dark theme typography.
abstract final class WkTypography {
  /// Primary font family
  static const String fontFamily = 'General Sans';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY STYLES (Hero text, splash screens)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Display Large - 48px, Bold
  static const TextStyle displayLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.0,
    height: 1.1,
    color: WkColors.textPrimary,
  );
  
  /// Display Medium - 40px, Bold
  static const TextStyle displayMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 40,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.8,
    height: 1.15,
    color: WkColors.textPrimary,
  );
  
  /// Display Small - 32px, SemiBold
  static const TextStyle displaySmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.5,
    height: 1.2,
    color: WkColors.textPrimary,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINE STYLES (Section headers, page titles)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Headline Large - 28px, Bold
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.3,
    height: 1.25,
    color: WkColors.textPrimary,
  );
  
  /// Headline Medium - 24px, SemiBold
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    height: 1.3,
    color: WkColors.textPrimary,
  );
  
  /// Headline Small - 20px, SemiBold
  static const TextStyle headlineSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.35,
    color: WkColors.textPrimary,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TITLE STYLES (Card titles, list items)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Title Large - 18px, SemiBold
  static const TextStyle titleLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.4,
    color: WkColors.textPrimary,
  );
  
  /// Title Medium - 16px, Medium
  static const TextStyle titleMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.4,
    color: WkColors.textPrimary,
  );
  
  /// Title Small - 14px, Medium
  static const TextStyle titleSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.4,
    color: WkColors.textPrimary,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY STYLES (Content, descriptions)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Body Large - 16px, Regular
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.15,
    height: 1.5,
    color: WkColors.textSecondary,
  );
  
  /// Body Medium - 14px, Regular
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.15,
    height: 1.5,
    color: WkColors.textSecondary,
  );
  
  /// Body Small - 12px, Regular
  static const TextStyle bodySmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.2,
    height: 1.5,
    color: WkColors.textTertiary,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LABEL STYLES (Form labels, chips, tags)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Label Large - 14px, Medium
  static const TextStyle labelLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.3,
    height: 1.4,
    color: WkColors.textSecondary,
  );
  
  /// Label Medium - 12px, Medium
  static const TextStyle labelMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.4,
    height: 1.4,
    color: WkColors.textSecondary,
  );
  
  /// Label Small - 10px, Medium (badges, chips)
  static const TextStyle labelSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.4,
    color: WkColors.textTertiary,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTON STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Button Large - 16px, SemiBold
  static const TextStyle buttonLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
    height: 1.2,
    color: WkColors.textOnRed,
  );
  
  /// Button Medium - 14px, SemiBold
  static const TextStyle buttonMedium = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
    height: 1.2,
    color: WkColors.textOnRed,
  );
  
  /// Button Small - 12px, Medium
  static const TextStyle buttonSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.3,
    height: 1.2,
    color: WkColors.textOnRed,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Stats - Large numbers (earnings, missions count)
  static const TextStyle stat = TextStyle(
    fontFamily: fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    height: 1.1,
    color: WkColors.textPrimary,
  );
  
  /// Stats Small - Medium numbers
  static const TextStyle statSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.3,
    height: 1.2,
    color: WkColors.textPrimary,
  );
  
  /// Price - Currency display
  static const TextStyle price = TextStyle(
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.w700,
    letterSpacing: 0,
    height: 1.2,
    color: WkColors.brandRed,
  );
  
  /// Rating - Star rating text
  static const TextStyle rating = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.2,
    color: WkColors.warning,
  );
  
  /// Badge - Chip/badge text
  static const TextStyle badge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    height: 1.2,
    color: WkColors.textOnRed,
  );
  
  /// Quote - Review/testimonial text
  static const TextStyle quote = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    letterSpacing: 0.1,
    height: 1.6,
    color: WkColors.textSecondary,
  );
  
  /// Link - Clickable text
  static const TextStyle link = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.4,
    color: WkColors.brandRed,
    decoration: TextDecoration.underline,
    decorationColor: WkColors.brandRed,
  );
  
  /// Caption - Small helper text
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.3,
    height: 1.4,
    color: WkColors.textTertiary,
  );
  
  /// Overline - Section labels (uppercase)
  static const TextStyle overline = TextStyle(
    fontFamily: fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 1.5,
    height: 1.4,
    color: WkColors.textTertiary,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT STYLE EXTENSIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Extensions for easy text style modifications.
extension WkTextStyleExtension on TextStyle {
  /// Change color
  TextStyle withColor(Color color) => copyWith(color: color);
  
  /// Make bold
  TextStyle get bold => copyWith(fontWeight: FontWeight.w700);
  
  /// Make semibold
  TextStyle get semiBold => copyWith(fontWeight: FontWeight.w600);
  
  /// Make medium
  TextStyle get medium => copyWith(fontWeight: FontWeight.w500);
  
  /// Make regular
  TextStyle get regular => copyWith(fontWeight: FontWeight.w400);
  
  /// Primary text color
  TextStyle get primary => copyWith(color: WkColors.textPrimary);
  
  /// Secondary text color
  TextStyle get secondary => copyWith(color: WkColors.textSecondary);
  
  /// Tertiary text color
  TextStyle get tertiary => copyWith(color: WkColors.textTertiary);
  
  /// Brand red color
  TextStyle get red => copyWith(color: WkColors.brandRed);
  
  /// Success color
  TextStyle get success => copyWith(color: WkColors.success);
  
  /// Warning color
  TextStyle get warning => copyWith(color: WkColors.warning);
  
  /// Error color
  TextStyle get error => copyWith(color: WkColors.error);
}
