/// Ratings service for WorkOn.
///
/// **PR-F21:** Initial implementation.
library;

import 'package:flutter/foundation.dart';

import '../auth/auth_errors.dart';
import 'ratings_api.dart';
import 'ratings_models.dart';

/// Service that manages ratings operations.
abstract final class RatingsService {
  static const RatingsApi _api = RatingsApi();

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────

  /// Fetches rating summary for a user.
  ///
  /// Returns [RatingsResult] indicating success or failure.
  static Future<RatingsResult<RatingSummary>> fetchSummary(String userId) async {
    try {
      debugPrint('[RatingsService] Fetching summary for $userId...');
      final summary = await _api.getSummary(userId);
      debugPrint('[RatingsService] Summary: ${summary.average} (${summary.count} reviews)');
      return RatingsResult.success(summary);
    } on UnauthorizedException {
      debugPrint('[RatingsService] fetchSummary: unauthorized (401)');
      return RatingsResult.unauthorized();
    } on RatingsApiException catch (e) {
      debugPrint('[RatingsService] fetchSummary error: ${e.message}');
      return RatingsResult.failure(_mapErrorMessage(e.message));
    } catch (e) {
      debugPrint('[RatingsService] fetchSummary unexpected: $e');
      return RatingsResult.failure('Une erreur est survenue');
    }
  }

  /// Fetches current user's rating summary.
  static Future<RatingsResult<RatingSummary>> fetchMySummary() async {
    try {
      debugPrint('[RatingsService] Fetching my summary...');
      final summary = await _api.getMySummary();
      return RatingsResult.success(summary);
    } on UnauthorizedException {
      debugPrint('[RatingsService] fetchMySummary: unauthorized (401)');
      return RatingsResult.unauthorized();
    } on RatingsApiException catch (e) {
      debugPrint('[RatingsService] fetchMySummary error: ${e.message}');
      return RatingsResult.failure(_mapErrorMessage(e.message));
    } catch (e) {
      debugPrint('[RatingsService] fetchMySummary unexpected: $e');
      return RatingsResult.failure('Une erreur est survenue');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reviews List
  // ─────────────────────────────────────────────────────────────────────────

  /// Fetches reviews for a user.
  static Future<RatingsResult<List<Review>>> fetchReviews(
    String userId, {
    int? limit,
    int? offset,
  }) async {
    try {
      debugPrint('[RatingsService] Fetching reviews for $userId...');
      final reviews = await _api.getReviews(userId, limit: limit, offset: offset);
      debugPrint('[RatingsService] Loaded ${reviews.length} reviews');
      return RatingsResult.success(reviews);
    } on UnauthorizedException {
      debugPrint('[RatingsService] fetchReviews: unauthorized (401)');
      return RatingsResult.unauthorized();
    } on RatingsApiException catch (e) {
      debugPrint('[RatingsService] fetchReviews error: ${e.message}');
      return RatingsResult.failure(_mapErrorMessage(e.message));
    } catch (e) {
      debugPrint('[RatingsService] fetchReviews unexpected: $e');
      return RatingsResult.failure('Une erreur est survenue');
    }
  }

  /// Fetches current user's reviews.
  static Future<RatingsResult<List<Review>>> fetchMyReviews({
    int? limit,
    int? offset,
  }) async {
    try {
      debugPrint('[RatingsService] Fetching my reviews...');
      final reviews = await _api.getMyReviews(limit: limit, offset: offset);
      return RatingsResult.success(reviews);
    } on UnauthorizedException {
      debugPrint('[RatingsService] fetchMyReviews: unauthorized (401)');
      return RatingsResult.unauthorized();
    } on RatingsApiException catch (e) {
      debugPrint('[RatingsService] fetchMyReviews error: ${e.message}');
      return RatingsResult.failure(_mapErrorMessage(e.message));
    } catch (e) {
      debugPrint('[RatingsService] fetchMyReviews unexpected: $e');
      return RatingsResult.failure('Une erreur est survenue');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Create Review
  // ─────────────────────────────────────────────────────────────────────────

  /// Creates a new review.
  static Future<RatingsResult<Review>> createReview({
    required String toUserId,
    required int rating,
    String? missionId,
    String? comment,
    List<String>? tags,
  }) async {
    try {
      debugPrint('[RatingsService] Creating review for $toUserId...');

      final request = CreateReviewRequest(
        toUserId: toUserId,
        rating: rating,
        missionId: missionId,
        comment: comment,
        tags: tags,
      );

      // Validate locally first
      final validationError = request.validate();
      if (validationError != null) {
        return RatingsResult.failure(validationError);
      }

      final review = await _api.createReview(request);
      debugPrint('[RatingsService] Review created: ${review.id}');
      return RatingsResult.success(review);
    } on UnauthorizedException {
      // PR-SESSION: Explicit 401 detection (never inferred from text)
      debugPrint('[RatingsService] createReview: unauthorized (401)');
      return RatingsResult.unauthorized();
    } on RatingsApiException catch (e) {
      debugPrint('[RatingsService] createReview error: ${e.message}');
      return RatingsResult.failure(_mapErrorMessage(e.message));
    } catch (e) {
      debugPrint('[RatingsService] createReview unexpected: $e');
      return RatingsResult.failure('Une erreur est survenue');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /// Maps API error messages to user-friendly French messages.
  /// PR-SESSION: No string parsing for 401 detection (handled via UnauthorizedException)
  static String _mapErrorMessage(String message) {
    if (message.contains('timeout')) {
      return 'Connexion impossible. Vérifiez votre réseau.';
    }
    if (message.contains('serveur')) {
      return 'Erreur serveur. Réessayez plus tard.';
    }
    if (message.contains('déjà laissé un avis')) {
      return 'Vous avez déjà laissé un avis pour cette mission.';
    }
    return message;
  }
}

/// Result type for ratings operations.
class RatingsResult<T> {
  const RatingsResult._({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.isUnauthorized = false,
  });

  factory RatingsResult.success(T data) {
    return RatingsResult._(isSuccess: true, data: data);
  }

  factory RatingsResult.failure(String errorMessage) {
    return RatingsResult._(isSuccess: false, errorMessage: errorMessage);
  }

  /// PR-SESSION: Factory for explicit 401 unauthorized
  factory RatingsResult.unauthorized() {
    return const RatingsResult._(
      isSuccess: false,
      isUnauthorized: true,
      errorMessage: 'Session expirée',
    );
  }

  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  /// PR-SESSION: Explicit flag for 401 unauthorized (never inferred from text)
  final bool isUnauthorized;
}

