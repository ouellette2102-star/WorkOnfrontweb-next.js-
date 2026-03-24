/// WorkOn Premium Theme
///
/// Centralized ThemeData for the WorkOn app.
/// Applies brand colors, typography, and component styles globally.
///
/// **Design System v1.0** - January 2026
///
/// Usage in main.dart:
/// ```dart
/// MaterialApp(
///   theme: WkTheme.dark,
///   darkTheme: WkTheme.dark,
///   themeMode: ThemeMode.dark, // Force dark mode
/// )
/// ```
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'workon_colors.dart';
import 'workon_typography.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WORKON THEME
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn theme configuration.
abstract final class WkTheme {
  // ═══════════════════════════════════════════════════════════════════════════
  // DARK THEME (Primary)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Premium dark theme for WorkOn
  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    
    // ─── Color Scheme ───
    colorScheme: const ColorScheme.dark(
      primary: WkColors.brandRed,
      onPrimary: WkColors.textOnRed,
      primaryContainer: WkColors.brandRedDark,
      onPrimaryContainer: WkColors.textOnRed,
      secondary: WkColors.bgTertiary,
      onSecondary: WkColors.textPrimary,
      secondaryContainer: WkColors.bgQuaternary,
      onSecondaryContainer: WkColors.textPrimary,
      tertiary: WkColors.warning,
      onTertiary: WkColors.textPrimary,
      tertiaryContainer: WkColors.warningSoft,
      error: WkColors.error,
      onError: WkColors.textOnRed,
      errorContainer: WkColors.errorSoft,
      onErrorContainer: WkColors.error,
      surface: WkColors.bgSecondary,
      onSurface: WkColors.textPrimary,
      surfaceContainerHighest: WkColors.bgTertiary,
      onSurfaceVariant: WkColors.textSecondary,
      outline: WkColors.glassBorder,
      outlineVariant: WkColors.bgQuaternary,
      shadow: Colors.black,
      scrim: Colors.black54,
      inverseSurface: WkColors.textPrimary,
      onInverseSurface: WkColors.bgPrimary,
      inversePrimary: WkColors.brandRedLight,
    ),
    
    // ─── Scaffold ───
    scaffoldBackgroundColor: WkColors.bgPrimary,
    
    // ─── App Bar ───
    appBarTheme: const AppBarTheme(
      backgroundColor: WkColors.bgPrimary,
      foregroundColor: WkColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: WkTypography.titleLarge,
      iconTheme: IconThemeData(
        color: WkColors.textPrimary,
        size: 24,
      ),
      actionsIconTheme: IconThemeData(
        color: WkColors.textPrimary,
        size: 24,
      ),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
    ),
    
    // ─── Bottom Navigation Bar ───
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: WkColors.bgSecondary,
      selectedItemColor: WkColors.brandRed,
      unselectedItemColor: WkColors.textTertiary,
      selectedLabelStyle: WkTypography.labelSmall,
      unselectedLabelStyle: WkTypography.labelSmall,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    
    // ─── Navigation Bar (Material 3) ───
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: WkColors.bgSecondary,
      indicatorColor: WkColors.brandRedSoft,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return WkTypography.labelSmall.copyWith(color: WkColors.brandRed);
        }
        return WkTypography.labelSmall.copyWith(color: WkColors.textTertiary);
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: WkColors.brandRed, size: 24);
        }
        return const IconThemeData(color: WkColors.textTertiary, size: 24);
      }),
      elevation: 0,
      height: 64,
    ),
    
    // ─── Card ───
    cardTheme: CardThemeData(
      color: WkColors.bgSecondary,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      margin: EdgeInsets.zero,
    ),
    
    // ─── Elevated Button ───
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: WkButtonStyle.primary,
    ),
    
    // ─── Outlined Button ───
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: WkButtonStyle.secondary,
    ),
    
    // ─── Text Button ───
    textButtonTheme: TextButtonThemeData(
      style: WkButtonStyle.ghost,
    ),
    
    // ─── Floating Action Button ───
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: WkColors.brandRed,
      foregroundColor: WkColors.textOnRed,
      elevation: 8,
      shape: CircleBorder(),
    ),
    
    // ─── Input Decoration ───
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: WkColors.bgTertiary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.brandRed, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.error, width: 2),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WkColors.bgQuaternary),
      ),
      labelStyle: WkTypography.labelMedium,
      hintStyle: WkTypography.bodyMedium.copyWith(color: WkColors.textTertiary),
      errorStyle: WkTypography.labelSmall.copyWith(color: WkColors.error),
      prefixIconColor: WkColors.textSecondary,
      suffixIconColor: WkColors.textSecondary,
    ),
    
    // ─── Chip ───
    chipTheme: ChipThemeData(
      backgroundColor: WkColors.bgTertiary,
      selectedColor: WkColors.brandRedSoft,
      disabledColor: WkColors.bgQuaternary,
      labelStyle: WkTypography.labelMedium,
      secondaryLabelStyle: WkTypography.labelSmall,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: WkColors.glassBorder),
      ),
    ),
    
    // ─── Bottom Sheet ───
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: WkColors.bgSecondary,
      modalBackgroundColor: WkColors.bgSecondary,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      elevation: 8,
      dragHandleColor: WkColors.textTertiary,
      dragHandleSize: Size(40, 4),
    ),
    
    // ─── Dialog ───
    dialogTheme: DialogThemeData(
      backgroundColor: WkColors.bgSecondary,
      elevation: 16,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      titleTextStyle: WkTypography.headlineSmall,
      contentTextStyle: WkTypography.bodyMedium,
    ),
    
    // ─── Snack Bar ───
    snackBarTheme: SnackBarThemeData(
      backgroundColor: WkColors.bgTertiary,
      contentTextStyle: WkTypography.bodyMedium.copyWith(color: WkColors.textPrimary),
      actionTextColor: WkColors.brandRed,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    
    // ─── Divider ───
    dividerTheme: const DividerThemeData(
      color: WkColors.bgQuaternary,
      thickness: 1,
      space: 1,
    ),
    
    // ─── List Tile ───
    listTileTheme: const ListTileThemeData(
      tileColor: Colors.transparent,
      selectedTileColor: WkColors.brandRedSoft,
      iconColor: WkColors.textSecondary,
      textColor: WkColors.textPrimary,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    ),
    
    // ─── Switch ───
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return WkColors.brandRed;
        }
        return WkColors.textTertiary;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return WkColors.brandRedSoft;
        }
        return WkColors.bgQuaternary;
      }),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    
    // ─── Checkbox ───
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return WkColors.brandRed;
        }
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(WkColors.textOnRed),
      side: const BorderSide(color: WkColors.glassBorder, width: 2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
      ),
    ),
    
    // ─── Radio ───
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return WkColors.brandRed;
        }
        return WkColors.textTertiary;
      }),
    ),
    
    // ─── Progress Indicator ───
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: WkColors.brandRed,
      linearTrackColor: WkColors.bgQuaternary,
      circularTrackColor: WkColors.bgQuaternary,
    ),
    
    // ─── Slider ───
    sliderTheme: SliderThemeData(
      activeTrackColor: WkColors.brandRed,
      inactiveTrackColor: WkColors.bgQuaternary,
      thumbColor: WkColors.brandRed,
      overlayColor: WkColors.brandRedSoft,
      valueIndicatorColor: WkColors.brandRed,
      valueIndicatorTextStyle: WkTypography.labelSmall.copyWith(
        color: WkColors.textOnRed,
      ),
    ),
    
    // ─── Tab Bar ───
    tabBarTheme: TabBarThemeData(
      labelColor: WkColors.brandRed,
      unselectedLabelColor: WkColors.textTertiary,
      labelStyle: WkTypography.labelLarge.copyWith(fontWeight: FontWeight.w600),
      unselectedLabelStyle: WkTypography.labelLarge,
      indicator: const UnderlineTabIndicator(
        borderSide: BorderSide(color: WkColors.brandRed, width: 3),
      ),
      indicatorSize: TabBarIndicatorSize.label,
    ),
    
    // ─── Text Theme ───
    textTheme: const TextTheme(
      displayLarge: WkTypography.displayLarge,
      displayMedium: WkTypography.displayMedium,
      displaySmall: WkTypography.displaySmall,
      headlineLarge: WkTypography.headlineLarge,
      headlineMedium: WkTypography.headlineMedium,
      headlineSmall: WkTypography.headlineSmall,
      titleLarge: WkTypography.titleLarge,
      titleMedium: WkTypography.titleMedium,
      titleSmall: WkTypography.titleSmall,
      bodyLarge: WkTypography.bodyLarge,
      bodyMedium: WkTypography.bodyMedium,
      bodySmall: WkTypography.bodySmall,
      labelLarge: WkTypography.labelLarge,
      labelMedium: WkTypography.labelMedium,
      labelSmall: WkTypography.labelSmall,
    ),
    
    // ─── Icon Theme ───
    iconTheme: const IconThemeData(
      color: WkColors.textSecondary,
      size: 24,
    ),
    
    // ─── Primary Icon Theme ───
    primaryIconTheme: const IconThemeData(
      color: WkColors.textOnRed,
      size: 24,
    ),
    
    // ─── Tooltip ───
    tooltipTheme: TooltipThemeData(
      decoration: BoxDecoration(
        color: WkColors.bgTertiary,
        borderRadius: BorderRadius.circular(8),
      ),
      textStyle: WkTypography.bodySmall.copyWith(color: WkColors.textPrimary),
    ),
  );
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LIGHT THEME (Secondary - if needed)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Light theme (for specific screens if needed)
  static ThemeData get light => dark.copyWith(
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    colorScheme: const ColorScheme.light(
      primary: WkColors.brandRed,
      onPrimary: WkColors.textOnRed,
      surface: Colors.white,
      onSurface: Color(0xFF1E293B),
      outline: Color(0xFFE2E8F0),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME EXTENSIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Extension methods for easier theme access.
extension WkThemeExtension on BuildContext {
  /// Access the current theme data
  ThemeData get theme => Theme.of(this);
  
  /// Access the color scheme
  ColorScheme get colors => Theme.of(this).colorScheme;
  
  /// Access the text theme
  TextTheme get textTheme => Theme.of(this).textTheme;
  
  /// Check if dark mode
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}
