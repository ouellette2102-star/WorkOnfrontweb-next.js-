/// Offers API client for WorkOn.
///
/// Thin API layer for `/api/v1/offers` endpoints.
/// Uses existing [ApiClient] for HTTP requests.
///
/// **PR-F15:** Initial implementation for mission applications.
/// **PR-F16:** Added fetchMyOffersDetailed for full offer objects.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';
import 'offer_models.dart';

/// Exception thrown by [OffersApi].
class OffersApiException implements Exception {
  final String message;
  final int? statusCode;

  const OffersApiException([this.message = 'Offers API error', this.statusCode]);

  @override
  String toString() => 'OffersApiException: $message';
}

/// Exception thrown when user has already applied to a mission.
class AlreadyAppliedException extends OffersApiException {
  const AlreadyAppliedException()
      : super('Vous avez déjà postulé à cette mission.', 409);
}

/// API client for offers endpoints.
///
/// All methods require authentication (Bearer token).
///
/// ## Usage
///
/// ```dart
/// final api = OffersApi();
/// await api.createOffer(missionId: 'mission-123');
/// ```
class OffersApi {
  /// Creates an offer (application) for a mission.
  ///
  /// Calls `POST /api/v1/offers`.
  ///
  /// Parameters:
  /// - [missionId]: ID of the mission to apply to
  /// - [message]: Optional application message (cover letter)
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [AlreadyAppliedException] if user already applied (409)
  /// - [OffersApiException] on other errors
  Future<void> createOffer({
    required String missionId,
    String? message,
  }) async {
    debugPrint('[OffersApi] Creating offer for mission: $missionId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[OffersApi] No token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/offers');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    final body = <String, dynamic>{
      'missionId': missionId,
    };
    if (message != null && message.trim().isNotEmpty) {
      body['message'] = message.trim();
    }

    try {
      debugPrint('[OffersApi] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] Response status: ${response.statusCode}');

      switch (response.statusCode) {
        case 200:
        case 201:
          debugPrint('[OffersApi] Offer created successfully');
          return;

        case 400:
          final msg = _extractErrorMessage(response.body);
          // Check if it's an "already applied" error in the message
          if (msg != null && msg.toLowerCase().contains('already')) {
            throw const AlreadyAppliedException();
          }
          throw OffersApiException(msg ?? 'Requête invalide', 400);

        case 401:
        case 403:
          debugPrint('[OffersApi] Unauthorized');
          throw const UnauthorizedException();

        case 404:
          throw const OffersApiException('Mission non trouvée', 404);

        case 409:
          // Conflict = already applied
          debugPrint('[OffersApi] Already applied (409)');
          throw const AlreadyAppliedException();

        case 422:
          final msg = _extractErrorMessage(response.body);
          throw OffersApiException(msg ?? 'Données invalides', 422);

        case 429:
          throw const OffersApiException('Trop de requêtes. Réessaie plus tard.', 429);

        default:
          if (response.statusCode >= 500) {
            throw const OffersApiException('Erreur serveur', 500);
          }
          throw OffersApiException('Erreur ${response.statusCode}');
      }
    } on TimeoutException {
      debugPrint('[OffersApi] Request timeout');
      throw const OffersApiException('Connexion impossible. Vérifiez votre réseau.');
    } on http.ClientException catch (e) {
      debugPrint('[OffersApi] Client error: $e');
      throw const OffersApiException('Erreur réseau. Vérifiez votre connexion.');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] Unexpected error: $e');
      throw const OffersApiException('Une erreur est survenue.');
    }
  }

  /// Fetches offers created by the current user.
  ///
  /// Calls `GET /api/v1/offers/mine` or similar.
  ///
  /// Returns a list of mission IDs that the user has applied to.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [OffersApiException] on other errors
  Future<List<String>> fetchMyOffers() async {
    debugPrint('[OffersApi] Fetching my offers...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/offers/mine');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[OffersApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] fetchMyOffers response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        // If endpoint doesn't exist (404), return empty list
        if (response.statusCode == 404) {
          debugPrint('[OffersApi] /offers/mine not found, returning empty list');
          return [];
        }
        throw OffersApiException('Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);
      
      // Handle various response formats
      List<dynamic> items;
      if (json is List) {
        items = json;
      } else if (json is Map<String, dynamic>) {
        items = json['data'] ?? json['offers'] ?? [];
      } else {
        items = [];
      }

      // Extract mission IDs
      final missionIds = <String>[];
      for (final item in items) {
        if (item is Map<String, dynamic>) {
          final missionId = item['missionId'] ?? item['mission_id'] ?? 
              (item['mission'] is Map ? item['mission']['id'] : null);
          if (missionId != null) {
            missionIds.add(missionId.toString());
          }
        }
      }

      debugPrint('[OffersApi] Found ${missionIds.length} applied missions');
      return missionIds;
    } on TimeoutException {
      throw const OffersApiException('Connexion timeout');
    } on http.ClientException {
      throw const OffersApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] fetchMyOffers unexpected error: $e');
      return []; // Graceful fallback
    }
  }

  /// PR-F16: Fetches detailed offers created by the current user.
  ///
  /// Calls `GET /api/v1/offers/mine` with full response parsing.
  ///
  /// Returns a list of [Offer] objects with mission details if available.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [OffersApiException] on other errors
  Future<List<Offer>> fetchMyOffersDetailed() async {
    debugPrint('[OffersApi] Fetching my offers (detailed)...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/offers/mine');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[OffersApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] fetchMyOffersDetailed response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          debugPrint('[OffersApi] /offers/mine not found, returning empty list');
          return [];
        }
        throw OffersApiException('Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);

      // Handle various response formats
      List<dynamic> items;
      if (json is List) {
        items = json;
      } else if (json is Map<String, dynamic>) {
        items = json['data'] ?? json['offers'] ?? [];
      } else {
        items = [];
      }

      // Parse as Offer objects
      final offers = <Offer>[];
      for (final item in items) {
        if (item is Map<String, dynamic>) {
          try {
            offers.add(Offer.fromJson(item));
          } catch (e) {
            debugPrint('[OffersApi] Failed to parse offer: $e');
          }
        }
      }

      debugPrint('[OffersApi] Parsed ${offers.length} offers');
      return offers;
    } on TimeoutException {
      throw const OffersApiException('Connexion impossible. Vérifiez votre réseau.');
    } on http.ClientException {
      throw const OffersApiException('Erreur réseau. Vérifiez votre connexion.');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] fetchMyOffersDetailed unexpected error: $e');
      throw const OffersApiException('Une erreur est survenue.');
    }
  }

  /// PR-02: Fetches applications/offers for a specific mission (employer view).
  ///
  /// Calls `GET /api/v1/offers?missionId=...`.
  ///
  /// Returns a list of [Offer] objects with applicant details if available.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [OffersApiException] on other errors
  Future<List<Offer>> fetchMissionApplications(String missionId) async {
    debugPrint('[OffersApi] Fetching applications for mission: $missionId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final baseUri = ApiClient.buildUri('/offers');
    final uri = baseUri.replace(queryParameters: {'missionId': missionId});
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[OffersApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] fetchMissionApplications response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          debugPrint('[OffersApi] No applications found for mission');
          return [];
        }
        throw OffersApiException('Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);

      // Handle various response formats
      List<dynamic> items;
      if (json is List) {
        items = json;
      } else if (json is Map<String, dynamic>) {
        items = json['data'] ?? json['offers'] ?? json['applications'] ?? [];
      } else {
        items = [];
      }

      // Parse as Offer objects
      final offers = <Offer>[];
      for (final item in items) {
        if (item is Map<String, dynamic>) {
          try {
            offers.add(Offer.fromJson(item));
          } catch (e) {
            debugPrint('[OffersApi] Failed to parse application: $e');
          }
        }
      }

      debugPrint('[OffersApi] Parsed ${offers.length} applications');
      return offers;
    } on TimeoutException {
      throw const OffersApiException('Connexion impossible. Vérifiez votre réseau.');
    } on http.ClientException {
      throw const OffersApiException('Erreur réseau. Vérifiez votre connexion.');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] fetchMissionApplications unexpected error: $e');
      throw const OffersApiException('Une erreur est survenue.');
    }
  }

  /// PR-03: Accepts an offer/application (employer action).
  ///
  /// PR-F1: Calls `PATCH /api/v1/offers/:offerId/accept` (no body).
  ///
  /// This assigns the worker to the mission and updates the offer status.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [OffersApiException] on other errors
  Future<Offer> acceptOffer(String offerId) async {
    debugPrint('[OffersApi] Accepting offer: $offerId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    // PR-F1: Use dedicated /accept endpoint
    final uri = ApiClient.buildUri('/offers/$offerId/accept');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[OffersApi] PATCH $uri');
      final response = await ApiClient.client
          .patch(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] acceptOffer response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        throw const OffersApiException('Candidature non trouvée', 404);
      }

      if (response.statusCode == 409) {
        throw const OffersApiException('Cette candidature a déjà été traitée', 409);
      }

      if (response.statusCode >= 400 && response.statusCode < 500) {
        final msg = _extractErrorMessage(response.body);
        throw OffersApiException(msg ?? 'Erreur lors de l\'acceptation', response.statusCode);
      }

      if (response.statusCode >= 500) {
        throw const OffersApiException('Erreur serveur. Réessayez plus tard.', 500);
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final offer = Offer.fromJson(data as Map<String, dynamic>);
      debugPrint('[OffersApi] Offer accepted: ${offer.id} -> ${offer.status}');
      return offer;
    } on TimeoutException {
      throw const OffersApiException('Connexion impossible. Vérifiez votre réseau.');
    } on http.ClientException {
      throw const OffersApiException('Erreur réseau. Vérifiez votre connexion.');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] acceptOffer unexpected error: $e');
      throw const OffersApiException('Une erreur est survenue.');
    }
  }

  /// PR-03: Rejects an offer/application (employer action).
  ///
  /// PR-F1: Calls `PATCH /api/v1/offers/:offerId/reject` (no body).
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [OffersApiException] on other errors
  Future<Offer> rejectOffer(String offerId) async {
    debugPrint('[OffersApi] Rejecting offer: $offerId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    // PR-F1: Use dedicated /reject endpoint
    final uri = ApiClient.buildUri('/offers/$offerId/reject');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[OffersApi] PATCH $uri');
      final response = await ApiClient.client
          .patch(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[OffersApi] rejectOffer response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        throw const OffersApiException('Candidature non trouvée', 404);
      }

      if (response.statusCode == 409) {
        throw const OffersApiException('Cette candidature a déjà été traitée', 409);
      }

      if (response.statusCode >= 400 && response.statusCode < 500) {
        final msg = _extractErrorMessage(response.body);
        throw OffersApiException(msg ?? 'Erreur lors du refus', response.statusCode);
      }

      if (response.statusCode >= 500) {
        throw const OffersApiException('Erreur serveur. Réessayez plus tard.', 500);
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final offer = Offer.fromJson(data as Map<String, dynamic>);
      debugPrint('[OffersApi] Offer rejected: ${offer.id} -> ${offer.status}');
      return offer;
    } on TimeoutException {
      throw const OffersApiException('Connexion impossible. Vérifiez votre réseau.');
    } on http.ClientException {
      throw const OffersApiException('Erreur réseau. Vérifiez votre connexion.');
    } on Exception catch (e) {
      if (e is OffersApiException || e is AuthException) rethrow;
      debugPrint('[OffersApi] rejectOffer unexpected error: $e');
      throw const OffersApiException('Une erreur est survenue.');
    }
  }

  /// Extracts error message from response body.
  String? _extractErrorMessage(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['message'] as String? ??
          json['error'] as String? ??
          json['errors']?.toString();
    } catch (_) {
      return null;
    }
  }
}

