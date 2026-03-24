/// Ratings API client for WorkOn.
///
/// **PR-F21:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../auth/auth_service.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';
import 'ratings_models.dart';

/// API endpoints for ratings.
///
/// Adjust these if backend uses different routes.
abstract final class RatingsEndpoints {
  /// GET summary for a user: /reviews/summary?userId=...
  static const String summary = '/reviews/summary';

  /// GET list for a user: /reviews?userId=...
  static const String list = '/reviews';

  /// POST create review: /reviews
  static const String create = '/reviews';

  /// GET my reviews summary: /me/reviews/summary (optional)
  static const String mySummary = '/me/reviews/summary';

  /// GET my reviews: /me/reviews (optional)
  static const String myList = '/me/reviews';
}

/// API client for ratings/reviews operations.
class RatingsApi {
  const RatingsApi();

  /// Fetches rating summary for a user.
  ///
  /// Calls `GET /reviews/summary?userId=...` with Bearer token.
  Future<RatingSummary> getSummary(String userId) async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[RatingsApi] getSummary: no token');
      throw const RatingsApiException('Token non disponible');
    }

    // Build URI with query params manually
    final baseUri = ApiClient.buildUri(RatingsEndpoints.summary);
    final uri = baseUri.replace(queryParameters: {'userId': userId});
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[RatingsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RatingsApi] getSummary: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        // PR-SESSION: Throw UnauthorizedException for explicit 401 detection
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        // No reviews yet → return empty
        return const RatingSummary.empty();
      }

      if (response.statusCode >= 500) {
        throw RatingsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw RatingsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return RatingSummary.fromJson(body);
    } on TimeoutException {
      debugPrint('[RatingsApi] getSummary: timeout');
      throw const RatingsApiException('Connexion timeout');
    } on RatingsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[RatingsApi] getSummary: error: $e');
      throw RatingsApiException('Erreur réseau: $e');
    }
  }

  /// Fetches reviews for a user.
  ///
  /// Calls `GET /reviews?userId=...` with Bearer token.
  Future<List<Review>> getReviews(String userId, {int? limit, int? offset}) async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[RatingsApi] getReviews: no token');
      throw const RatingsApiException('Token non disponible');
    }

    final queryParams = <String, String>{'userId': userId};
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();

    // Build URI with query params manually
    final baseUri = ApiClient.buildUri(RatingsEndpoints.list);
    final uri = baseUri.replace(queryParameters: queryParams);
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[RatingsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RatingsApi] getReviews: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        // PR-SESSION: Throw UnauthorizedException for explicit 401 detection
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        return []; // No reviews
      }

      if (response.statusCode >= 500) {
        throw RatingsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw RatingsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data = body is List
          ? body
          : (body['reviews'] ?? body['data'] ?? []);

      return data
          .map((json) => Review.fromJson(json as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      debugPrint('[RatingsApi] getReviews: timeout');
      throw const RatingsApiException('Connexion timeout');
    } on RatingsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[RatingsApi] getReviews: error: $e');
      throw RatingsApiException('Erreur réseau: $e');
    }
  }

  /// Creates a new review.
  ///
  /// Calls `POST /reviews` with Bearer token.
  Future<Review> createReview(CreateReviewRequest request) async {
    // Validate first
    final validationError = request.validate();
    if (validationError != null) {
      throw RatingsApiException(validationError);
    }

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[RatingsApi] createReview: no token');
      throw const RatingsApiException('Token non disponible');
    }

    final uri = ApiClient.buildUri(RatingsEndpoints.create);

    try {
      debugPrint('[RatingsApi] POST $uri');
      // Use authenticated POST for automatic token refresh
      final response = await ApiClient.authenticatedPost(
        uri,
        body: request.toJson(),
      );

      debugPrint('[RatingsApi] createReview: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        // PR-SESSION: Throw UnauthorizedException for explicit 401 detection
        throw const UnauthorizedException();
      }

      if (response.statusCode == 409) {
        throw const RatingsApiException('Vous avez déjà laissé un avis');
      }

      if (response.statusCode >= 500) {
        throw RatingsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw RatingsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final reviewData = body['review'] ?? body;
      return Review.fromJson(reviewData as Map<String, dynamic>);
    } on TimeoutException {
      debugPrint('[RatingsApi] createReview: timeout');
      throw const RatingsApiException('Connexion timeout');
    } on RatingsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[RatingsApi] createReview: error: $e');
      throw RatingsApiException('Erreur réseau: $e');
    }
  }

  /// Fetches current user's reviews summary.
  ///
  /// Calls `GET /me/reviews/summary` or falls back to userId-based endpoint.
  Future<RatingSummary> getMySummary() async {
    final userId = AuthService.currentUser?.id;
    if (userId == null) {
      debugPrint('[RatingsApi] getMySummary: no userId');
      return const RatingSummary.empty();
    }

    // Use userId-based endpoint (more reliable)
    return getSummary(userId);
  }

  /// Fetches current user's reviews.
  Future<List<Review>> getMyReviews({int? limit, int? offset}) async {
    final userId = AuthService.currentUser?.id;
    if (userId == null) {
      debugPrint('[RatingsApi] getMyReviews: no userId');
      return [];
    }

    return getReviews(userId, limit: limit, offset: offset);
  }
}

/// Exception thrown by [RatingsApi] operations.
class RatingsApiException implements Exception {
  const RatingsApiException(this.message);

  final String message;

  @override
  String toString() => 'RatingsApiException: $message';
}

