/// WorkOn Rating Display Widget — PR #2
///
/// Unified rating component: stars + numeric score + review count.
/// Supports multiple sizes and display modes (compact, full, inline).
///
/// Usage:
/// ```dart
/// WkRatingDisplay(rating: 4.9, reviewCount: 47)
/// WkRatingDisplay.compact(rating: 4.8)
/// WkRatingDisplay.inline(rating: 4.7, reviewCount: 12)
/// ```
library;

import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WK RATING DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

/// Premium rating display for WorkOn profiles and cards.
class WkRatingDisplay extends StatelessWidget {
  const WkRatingDisplay({
    super.key,
    required this.rating,
    this.reviewCount,
    this.size = WkRatingSize.medium,
    this.showStars = true,
    this.showCount = true,
    this.showNumeric = true,
    this.starColor,
  });

  /// Compact — stars + number only, no review count
  factory WkRatingDisplay.compact({
    required double rating,
    WkRatingSize size = WkRatingSize.small,
    Color? starColor,
  }) {
    return WkRatingDisplay(
      rating: rating,
      size: size,
      showStars: true,
      showCount: false,
      showNumeric: true,
      starColor: starColor,
    );
  }

  /// Inline — number + star icon (no full star row)
  factory WkRatingDisplay.inline({
    required double rating,
    int? reviewCount,
    WkRatingSize size = WkRatingSize.small,
  }) {
    return WkRatingDisplay(
      rating: rating,
      reviewCount: reviewCount,
      size: size,
      showStars: false,
      showCount: reviewCount != null,
      showNumeric: true,
    );
  }

  /// Full — star row + number + review count
  factory WkRatingDisplay.full({
    required double rating,
    required int reviewCount,
    WkRatingSize size = WkRatingSize.medium,
  }) {
    return WkRatingDisplay(
      rating: rating,
      reviewCount: reviewCount,
      size: size,
      showStars: true,
      showCount: true,
      showNumeric: true,
    );
  }

  final double rating;
  final int? reviewCount;
  final WkRatingSize size;
  final bool showStars;
  final bool showCount;
  final bool showNumeric;
  final Color? starColor;

  double get _starSize => switch (size) {
    WkRatingSize.small => 12.0,
    WkRatingSize.medium => 14.0,
    WkRatingSize.large => 18.0,
  };

  double get _fontSize => switch (size) {
    WkRatingSize.small => 12.0,
    WkRatingSize.medium => 14.0,
    WkRatingSize.large => 16.0,
  };

  double get _countFontSize => switch (size) {
    WkRatingSize.small => 11.0,
    WkRatingSize.medium => 12.0,
    WkRatingSize.large => 13.0,
  };

  @override
  Widget build(BuildContext context) {
    final activeColor = starColor ?? WkColors.warning;

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (showStars) ...[
          _StarRow(rating: rating, starSize: _starSize, activeColor: activeColor),
          const SizedBox(width: 4),
        ] else ...[
          Icon(Icons.star_rounded, color: activeColor, size: _starSize + 2),
          const SizedBox(width: 3),
        ],
        if (showNumeric)
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: _fontSize,
              fontWeight: FontWeight.w700,
              color: WkColors.textPrimary,
              height: 1.2,
            ),
          ),
        if (showCount && reviewCount != null) ...[
          const SizedBox(width: 4),
          Text(
            _reviewCountLabel(reviewCount!),
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: _countFontSize,
              fontWeight: FontWeight.w400,
              color: WkColors.textTertiary,
              height: 1.2,
            ),
          ),
        ],
      ],
    );
  }

  String _reviewCountLabel(int count) {
    if (count == 0) return WkCopy.noReviews;
    if (count == 1) return '(${WkCopy.oneReview})';
    return '($count ${WkCopy.reviewsCount})';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAR ROW
// ─────────────────────────────────────────────────────────────────────────────

class _StarRow extends StatelessWidget {
  const _StarRow({
    required this.rating,
    required this.starSize,
    required this.activeColor,
  });

  final double rating;
  final double starSize;
  final Color activeColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final starValue = i + 1;
        final filled = rating >= starValue;
        final halfFilled = !filled && rating >= starValue - 0.5;

        return Icon(
          halfFilled
              ? Icons.star_half_rounded
              : filled
                  ? Icons.star_rounded
                  : Icons.star_outline_rounded,
          color: (filled || halfFilled)
              ? activeColor
              : WkColors.textDisabled,
          size: starSize,
        );
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIZE ENUM
// ─────────────────────────────────────────────────────────────────────────────

enum WkRatingSize { small, medium, large }
