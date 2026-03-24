/// WorkOn Brand Colors - Premium Dark Theme
///
/// Centralized color palette for the WorkOn app.
/// Based on brand guidelines: Red telephone + Pin location marker.
///
/// **Design System v1.0** - January 2026
/// **Design System v2.0** - March 2026 — Premium gradient + orange accent
library;

import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// BRAND COLORS
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn brand colors - Red accent on dark theme.
abstract final class WkColors {
  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND RED (Primary Accent)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Primary brand red - CTAs, highlights, active states
  static const Color brandRed = Color(0xFFE53935);
  
  /// Darker red for pressed/hover states
  static const Color brandRedDark = Color(0xFFB71C1C);
  
  /// Lighter red for subtle highlights
  static const Color brandRedLight = Color(0xFFFF6659);
  
  /// Red with 10% opacity for backgrounds
  static const Color brandRedSoft = Color(0x1AE53935);
  
  /// Red with 20% opacity for cards/containers
  static const Color brandRedMuted = Color(0x33E53935);

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND ACCENT (Refined red spectrum — no orange, no template feel)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Brand accent warm — used for subtle secondary highlights
  static const Color brandOrange = Color(0xFFE57373);

  /// Gradient start — deep crimson (confident, professional)
  static const Color brandGradientStart = Color(0xFFB71C1C);

  /// Gradient end — medium red (clean, no orange tint)
  static const Color brandGradientEnd = Color(0xFFE53935);

  /// Accent 8% opacity — soft backgrounds
  static const Color brandOrangeSoft = Color(0x14E53935);

  /// Accent 15% opacity — muted containers
  static const Color brandOrangeMuted = Color(0x26E53935);

  // ═══════════════════════════════════════════════════════════════════════════
  // PREMIUM & TRUST COLORS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Premium gold — Pro/Premium badge, Top Performer highlight
  static const Color premiumGold = Color(0xFFF5C842);

  /// Premium gold 10% opacity
  static const Color premiumGoldSoft = Color(0x1AF5C842);

  /// Verified blue — identity verified badge (Twitter/X style)
  static const Color verifiedBlue = Color(0xFF1D9BF0);

  /// Verified blue 10% opacity
  static const Color verifiedBlueSoft = Color(0x1A1D9BF0);

  /// Available green — real-time availability dot
  static const Color availableGreen = Color(0xFF22C55E);

  /// Available green 15% opacity — availability backgrounds
  static const Color availableGreenSoft = Color(0x2622C55E);

  // ═══════════════════════════════════════════════════════════════════════════
  // DARK THEME BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Primary background - deepest black
  static const Color bgPrimary = Color(0xFF0D0D0F);
  
  /// Secondary background - cards, surfaces
  static const Color bgSecondary = Color(0xFF1A1A1E);
  
  /// Tertiary background - elevated elements, modals
  static const Color bgTertiary = Color(0xFF252529);
  
  /// Quaternary - subtle separators, borders
  static const Color bgQuaternary = Color(0xFF2F2F35);

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Primary text - headings, important content
  static const Color textPrimary = Color(0xFFFFFFFF);
  
  /// Secondary text - body, descriptions
  static const Color textSecondary = Color(0xFFB0B0B0);
  
  /// Tertiary text - labels, hints, captions
  static const Color textTertiary = Color(0xFF707070);
  
  /// Disabled text
  static const Color textDisabled = Color(0xFF4A4A4A);
  
  /// Text on red background
  static const Color textOnRed = Color(0xFFFFFFFF);

  // ═══════════════════════════════════════════════════════════════════════════
  // BORDERS & GLASS (subtle — Linear/Vercel style)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Subtle border — 6% white (default for cards, inputs)
  static const Color glassWhite = Color(0x0AFFFFFF);
  
  /// Border standard — 8% white (slightly more visible)
  static const Color glassBorder = Color(0x14FFFFFF);
  
  /// Shadow base
  static const Color glassShadow = Color(0x40000000);
  
  /// Very subtle highlight
  static const Color glassHighlight = Color(0x06FFFFFF);

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Success - green
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF34D399);
  static const Color successSoft = Color(0x1A10B981);
  
  /// Warning - amber
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningSoft = Color(0x1AF59E0B);
  
  /// Error - red (same as brand)
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorSoft = Color(0x1AEF4444);
  
  /// Info - blue
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoSoft = Color(0x1A3B82F6);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS COLORS (Missions)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Open mission - available
  static const Color statusOpen = Color(0xFF10B981);
  
  /// Assigned - matched with worker
  static const Color statusAssigned = Color(0xFF3B82F6);
  
  /// In Progress - work ongoing
  static const Color statusInProgress = Color(0xFFF59E0B);
  
  /// Completed - finished
  static const Color statusCompleted = Color(0xFF6B7280);
  
  /// Paid - payment confirmed
  static const Color statusPaid = Color(0xFF059669);
  
  /// Cancelled - aborted
  static const Color statusCancelled = Color(0xFFEF4444);

  // ═══════════════════════════════════════════════════════════════════════════
  // BADGES & CHIPS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Reliable badge - green
  static const Color badgeReliable = Color(0xFF10B981);
  
  /// Punctual badge - blue
  static const Color badgePunctual = Color(0xFF3B82F6);
  
  /// Top Performer badge - gold
  static const Color badgeTopPerformer = Color(0xFFF59E0B);
  
  /// Certified badge - red (brand)
  static const Color badgeCertified = Color(0xFFE53935);
  
  /// Premium badge - purple
  static const Color badgePremium = Color(0xFF8B5CF6);

  // ═══════════════════════════════════════════════════════════════════════════
  // GRADIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Primary gradient - red to dark red
  static const LinearGradient gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandRed, brandRedDark],
  );

  /// Premium gradient — refined deep red to brand red (no orange)
  static const LinearGradient gradientPremium = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [brandGradientStart, brandGradientEnd],
  );

  /// Premium gradient vertical — for swipe overlays
  static const LinearGradient gradientPremiumVertical = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [brandGradientStart, brandGradientEnd],
  );

  /// Hero overlay gradient — very subtle dark top fade (not red)
  static const LinearGradient gradientHero = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0x28000000), Color(0x000D0D0F)],
  );

  /// Swipe card overlay — image bottom fade for readability
  static const LinearGradient gradientSwipeCard = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0x00000000), Color(0xE6000000)],
    stops: [0.4, 1.0],
  );

  /// Gold gradient — premium badge highlight
  static const LinearGradient gradientGold = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF5C842), Color(0xFFD4A017)],
  );

  /// Card gradient - subtle dark
  static const LinearGradient gradientCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [bgSecondary, bgTertiary],
  );

  /// Glass gradient - for premium cards
  static const LinearGradient gradientGlass = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [glassWhite, Color(0x0DFFFFFF)],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SHADOWS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Standard card shadow
  static List<BoxShadow> get shadowCard => [
    BoxShadow(
      color: Colors.black.withOpacity(0.3),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
  
  /// Elevated shadow for modals
  static List<BoxShadow> get shadowElevated => [
    BoxShadow(
      color: Colors.black.withOpacity(0.5),
      blurRadius: 24,
      offset: const Offset(0, 12),
    ),
  ];
  
  /// Glow shadow for CTAs
  static List<BoxShadow> get shadowGlow => [
    BoxShadow(
      color: brandRed.withOpacity(0.4),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];
  
  /// Subtle shadow for inputs
  static List<BoxShadow> get shadowSubtle => [
    BoxShadow(
      color: Colors.black.withOpacity(0.2),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  /// Premium glow — clean red glow, not orange
  static List<BoxShadow> get shadowPremium => [
    BoxShadow(
      color: brandRed.withOpacity(0.22),
      blurRadius: 16,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    ),
  ];

  /// Gold glow — for premium badges and level indicators
  static List<BoxShadow> get shadowGold => [
    BoxShadow(
      color: premiumGold.withOpacity(0.3),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  /// Verified glow — for verified identity badges
  static List<BoxShadow> get shadowVerified => [
    BoxShadow(
      color: verifiedBlue.withOpacity(0.25),
      blurRadius: 10,
      offset: const Offset(0, 3),
    ),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD DECORATIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Pre-built card decorations for consistent styling.
abstract final class WkCardDecoration {
  /// Standard dark card
  static BoxDecoration get standard => BoxDecoration(
    color: WkColors.bgSecondary,
    borderRadius: BorderRadius.circular(16),
    boxShadow: WkColors.shadowCard,
  );
  
  /// Glassmorphism card
  static BoxDecoration get glass => BoxDecoration(
    color: WkColors.glassWhite,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: WkColors.glassBorder, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );
  
  /// Elevated card for modals/overlays
  static BoxDecoration get elevated => BoxDecoration(
    color: WkColors.bgTertiary,
    borderRadius: BorderRadius.circular(20),
    boxShadow: WkColors.shadowElevated,
  );
  
  /// Worker card (swipe style)
  static BoxDecoration get workerCard => BoxDecoration(
    color: WkColors.bgSecondary,
    borderRadius: BorderRadius.circular(24),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.4),
        blurRadius: 16,
        offset: const Offset(0, 8),
      ),
    ],
  );
  
  /// Red accent card
  static BoxDecoration get accent => BoxDecoration(
    gradient: WkColors.gradientPrimary,
    borderRadius: BorderRadius.circular(16),
    boxShadow: WkColors.shadowGlow,
  );
  
  /// Input field decoration
  static BoxDecoration get input => BoxDecoration(
    color: WkColors.bgTertiary,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: WkColors.glassBorder, width: 1),
  );
  
  /// Input field focused
  static BoxDecoration get inputFocused => BoxDecoration(
    color: WkColors.bgTertiary,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: WkColors.brandRed, width: 2),
    boxShadow: [
      BoxShadow(
        color: WkColors.brandRed.withOpacity(0.2),
        blurRadius: 8,
        offset: const Offset(0, 0),
      ),
    ],
  );

  /// Premium gradient card — for CTAs, highlighted actions
  static BoxDecoration get premium => BoxDecoration(
    gradient: WkColors.gradientPremium,
    borderRadius: BorderRadius.circular(16),
    boxShadow: WkColors.shadowPremium,
  );

  /// Premium pill button — full-width gradient CTA
  static BoxDecoration get premiumPill => BoxDecoration(
    gradient: WkColors.gradientPremium,
    borderRadius: BorderRadius.circular(999),
    boxShadow: WkColors.shadowPremium,
  );

  /// Gold badge container — premium level indicator
  static BoxDecoration get goldBadge => BoxDecoration(
    gradient: WkColors.gradientGold,
    borderRadius: BorderRadius.circular(999),
    boxShadow: WkColors.shadowGold,
  );

  /// Verified container — identity verified indicator
  static BoxDecoration get verified => BoxDecoration(
    color: WkColors.verifiedBlueSoft,
    borderRadius: BorderRadius.circular(999),
    border: Border.all(color: WkColors.verifiedBlue.withOpacity(0.4), width: 1),
  );

  /// Available container — real-time availability chip
  static BoxDecoration get available => BoxDecoration(
    color: WkColors.availableGreenSoft,
    borderRadius: BorderRadius.circular(999),
    border: Border.all(color: WkColors.availableGreen.withOpacity(0.4), width: 1),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON STYLES
// ─────────────────────────────────────────────────────────────────────────────

/// Pre-built button styles.
abstract final class WkButtonStyle {
  /// Primary red button
  static ButtonStyle get primary => ElevatedButton.styleFrom(
    backgroundColor: WkColors.brandRed,
    foregroundColor: WkColors.textOnRed,
    elevation: 4,
    shadowColor: WkColors.brandRed.withOpacity(0.5),
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    textStyle: const TextStyle(
      fontFamily: 'General Sans',
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.3,
    ),
  );
  
  /// Secondary outline button
  static ButtonStyle get secondary => OutlinedButton.styleFrom(
    foregroundColor: WkColors.textPrimary,
    side: const BorderSide(color: WkColors.glassBorder, width: 1.5),
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    textStyle: const TextStyle(
      fontFamily: 'General Sans',
      fontSize: 16,
      fontWeight: FontWeight.w600,
    ),
  );
  
  /// Ghost text button
  static ButtonStyle get ghost => TextButton.styleFrom(
    foregroundColor: WkColors.brandRed,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    textStyle: const TextStyle(
      fontFamily: 'General Sans',
      fontSize: 16,
      fontWeight: FontWeight.w600,
    ),
  );
  
  /// Disabled button
  static ButtonStyle get disabled => ElevatedButton.styleFrom(
    backgroundColor: WkColors.bgTertiary,
    foregroundColor: WkColors.textDisabled,
    elevation: 0,
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  );
  
  /// Icon button (FAB style)
  static ButtonStyle get icon => ElevatedButton.styleFrom(
    backgroundColor: WkColors.brandRed,
    foregroundColor: WkColors.textOnRed,
    elevation: 8,
    shadowColor: WkColors.brandRed.withOpacity(0.5),
    shape: const CircleBorder(),
    padding: const EdgeInsets.all(16),
  );
  
  /// Small button
  static ButtonStyle get small => ElevatedButton.styleFrom(
    backgroundColor: WkColors.brandRed,
    foregroundColor: WkColors.textOnRed,
    elevation: 2,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
    textStyle: const TextStyle(
      fontFamily: 'General Sans',
      fontSize: 14,
      fontWeight: FontWeight.w500,
    ),
  );

  /// Premium pill — full-width gradient button (uses InkWell + container, see WkGradientButton)
  static ButtonStyle get premium => ElevatedButton.styleFrom(
    backgroundColor: WkColors.brandGradientStart,
    foregroundColor: WkColors.textOnRed,
    elevation: 6,
    shadowColor: WkColors.brandGradientEnd.withOpacity(0.4),
    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(999),
    ),
    textStyle: const TextStyle(
      fontFamily: 'General Sans',
      fontSize: 16,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.3,
    ),
  );
}
