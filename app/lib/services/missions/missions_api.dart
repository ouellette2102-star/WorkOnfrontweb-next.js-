/// Missions API client for WorkOn.
///
/// Thin API layer for `/api/v1/missions-local` endpoints.
/// Uses existing [ApiClient] for HTTP requests.
///
/// **PR-F05:** Initial implementation for missions feed.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';
import 'mission_models.dart';

/// Exception thrown by [MissionsApi].
class MissionsApiException implements Exception {
  final String message;
  const MissionsApiException([this.message = 'Missions API error']);

  @override
  String toString() => 'MissionsApiException: $message';
}

/// API client for missions endpoints.
///
/// All methods require authentication (Bearer token).
///
/// ## Usage
///
/// ```dart
/// final api = MissionsApi();
/// final missions = await api.fetchNearby(
///   latitude: 45.5017,
///   longitude: -73.5673,
///   radiusKm: 10,
/// );
/// ```
class MissionsApi {
  /// Fetches nearby missions.
  ///
  /// Calls `GET /api/v1/missions-local/nearby`.
  ///
  /// Parameters:
  /// - [latitude]: User's latitude
  /// - [longitude]: User's longitude
  /// - [radiusKm]: Search radius in kilometers (default: 10)
  /// - [sort]: Sort order (optional): 'proximity', 'price_asc', 'price_desc', 'newest'
  /// - [category]: Filter by category (optional)
  /// - [query]: Search text query (optional) - PR-09
  ///
  /// Returns a list of [Mission] sorted by distance (or specified sort).
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] on other errors
  ///
  /// **PR-F10:** Added sort and category parameters.
  /// **PR-09:** Added query parameter for text search.
  Future<List<Mission>> fetchNearby({
    required double latitude,
    required double longitude,
    double radiusKm = 10,
    String? sort,
    String? category,
    String? query,
  }) async {
    debugPrint('[MissionsApi] Fetching nearby missions (radius: $radiusKm, sort: $sort, category: $category, query: $query)...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] No token available');
      throw const UnauthorizedException();
    }

    // Build query params - **FL-3:** Backend now supports sort/category/query (PR-3)
    // Backend NearbyMissionsQueryDto accepts: latitude, longitude, radiusKm, sort, category, query
    final queryParams = <String, String>{
      'latitude': latitude.toString(),
      'longitude': longitude.toString(),
      'radiusKm': radiusKm.toString(),
    };
    
    // **FL-3:** Send sort/category/query to backend
    if (sort != null && sort.isNotEmpty) {
      queryParams['sort'] = sort;
    }
    if (category != null && category.isNotEmpty) {
      queryParams['category'] = category;
    }
    if (query != null && query.isNotEmpty) {
      queryParams['query'] = query;
    }
    
    debugPrint('[MissionsApi] Query params: $queryParams');

    // Build URI with query params — uses buildUri to avoid double /api/v1 prefix
    final uri = ApiClient.buildUri('/missions-local/nearby')
        .replace(queryParameters: queryParams);

    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MissionsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] Response status: ${response.statusCode}');

      // PR-F10: Get missions and apply client-side sort if backend doesn't support it
      var missions = _handleListResponse(response);
      missions = _applySortIfNeeded(missions, sort);
      
      return missions;
    } on TimeoutException {
      debugPrint('[MissionsApi] Request timeout');
      throw const MissionsApiException('Connexion timeout');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] Client error: $e');
      throw const MissionsApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] Unexpected error: $e');
      throw const MissionsApiException();
    }
  }

  /// PR-F10: Apply client-side sorting as fallback.
  List<Mission> _applySortIfNeeded(List<Mission> missions, String? sort) {
    if (sort == null || sort == 'proximity') {
      // Default: sort by distance (already sorted by backend)
      return missions;
    }

    final sorted = List<Mission>.from(missions);
    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'newest':
        sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
    }
    return sorted;
  }

  /// Fetches mission details by ID.
  ///
  /// Calls `GET /api/v1/missions-local/:id`.
  ///
  /// **PR-F06:** Enhanced logging and error handling.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] if mission not found or other error
  Future<Mission> fetchById(String id) async {
    debugPrint('[MissionsApi] fetchById: $id');

    // Validate ID
    if (id.isEmpty) {
      debugPrint('[MissionsApi] fetchById: empty ID provided');
      throw const MissionsApiException('ID de mission invalide');
    }

    // Check auth
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] fetchById: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/$id');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MissionsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] fetchById response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint('[MissionsApi] fetchById: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        debugPrint('[MissionsApi] fetchById: mission not found');
        throw const MissionsApiException('Mission non trouvée');
      }

      if (response.statusCode >= 500) {
        debugPrint('[MissionsApi] fetchById: server error');
        throw const MissionsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200) {
        debugPrint('[MissionsApi] fetchById: unexpected status ${response.statusCode}');
        throw MissionsApiException('Erreur inattendue (${response.statusCode})');
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] fetchById: success - ${mission.title}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] fetchById: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] fetchById: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] fetchById: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] fetchById: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Fetches user's created missions.
  ///
  /// Calls `GET /api/v1/missions-local/my-missions`.
  Future<List<Mission>> fetchMyMissions() async {
    debugPrint('[MissionsApi] Fetching my missions...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/my-missions');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      return _handleListResponse(response);
    } on TimeoutException {
      throw const MissionsApiException('Connexion timeout');
    } on http.ClientException {
      throw const MissionsApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      throw const MissionsApiException();
    }
  }

  /// Fetches user's assigned missions.
  ///
  /// Calls `GET /api/v1/missions-local/my-assignments`.
  Future<List<Mission>> fetchMyAssignments() async {
    debugPrint('[MissionsApi] Fetching my assignments...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/my-assignments');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MissionsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] my-assignments response: ${response.statusCode}');
      if (response.statusCode >= 400) {
        debugPrint('[MissionsApi] my-assignments error body: ${response.body}');
      }
      
      return _handleListResponse(response);
    } on TimeoutException {
      throw const MissionsApiException('Connexion timeout');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] my-assignments network error: $e');
      throw const MissionsApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] my-assignments unexpected error: $e');
      throw const MissionsApiException();
    }
  }

  /// Creates a new mission.
  ///
  /// Calls `POST /api/v1/missions-local`.
  ///
  /// Only employers and residential clients can create missions.
  ///
  /// **PR-F20:** Employer Flow - Create Mission.
  Future<Mission> createMission({
    required String title,
    required String description,
    required String category,
    required double price,
    required double latitude,
    required double longitude,
    required String city,
    String? address,
  }) async {
    debugPrint('[MissionsApi] Creating mission: $title');

    // Check auth
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] createMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    final body = {
      'title': title,
      'description': description,
      'category': category,
      'price': price,
      'latitude': latitude,
      'longitude': longitude,
      'city': city,
      if (address != null && address.isNotEmpty) 'address': address,
    };

    debugPrint('[MissionsApi] POST $uri');
    debugPrint('[MissionsApi] Body: $body');

    try {
      final response = await ApiClient.client
          .post(
            uri,
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] createMission response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] createMission: forbidden - $errorBody');
        throw MissionsApiException(errorBody ?? 'Non autorisé');
      }

      if (response.statusCode >= 500) {
        debugPrint('[MissionsApi] createMission: server error');
        throw const MissionsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 201 && response.statusCode != 200) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] createMission: error ${response.statusCode} - $errorBody');
        throw MissionsApiException(errorBody ?? 'Erreur lors de la création');
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] createMission: success - ${mission.id}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] createMission: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] createMission: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] createMission: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] createMission: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Accepts a mission (worker takes the call).
  ///
  /// Calls `POST /api/v1/missions-local/:id/accept`.
  ///
  /// Precondition: mission.status must be "open".
  /// Result: mission becomes "assigned" to the worker.
  ///
  /// **PR-F22:** Worker Flow - Accept Mission.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] if mission not available or other error
  Future<Mission> acceptMission(String missionId) async {
    debugPrint('[MissionsApi] Accepting mission: $missionId');

    // Validate ID
    if (missionId.isEmpty) {
      debugPrint('[MissionsApi] acceptMission: empty ID provided');
      throw const MissionsApiException('ID de mission invalide');
    }

    // Check auth
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] acceptMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/$missionId/accept');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    debugPrint('[MissionsApi] POST $uri');

    try {
      final response = await ApiClient.client
          .post(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] acceptMission response: ${response.statusCode}');

      if (response.statusCode == 401) {
        debugPrint('[MissionsApi] acceptMission: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 403) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] acceptMission: forbidden - $errorBody');
        throw MissionsApiException(errorBody ?? 'Seuls les workers peuvent accepter des missions');
      }

      // 400 or 409: mission not available (already taken, cancelled, etc.)
      if (response.statusCode == 400 || response.statusCode == 409) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] acceptMission: conflict/bad request - $errorBody');
        throw MissionsApiException(errorBody ?? 'Cette mission n\'est plus disponible');
      }

      if (response.statusCode == 404) {
        debugPrint('[MissionsApi] acceptMission: mission not found');
        throw const MissionsApiException('Mission non trouvée');
      }

      if (response.statusCode >= 500) {
        debugPrint('[MissionsApi] acceptMission: server error');
        throw const MissionsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] acceptMission: error ${response.statusCode} - $errorBody');
        throw MissionsApiException(errorBody ?? 'Erreur lors de l\'acceptation');
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] acceptMission: success - ${mission.id} now ${mission.status}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] acceptMission: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] acceptMission: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] acceptMission: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] acceptMission: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Starts a mission (assigned -> in_progress).
  ///
  /// Calls `POST /api/v1/missions-local/:id/start`.
  ///
  /// Precondition: mission.status must be "assigned" and user is the assigned worker.
  /// Result: mission status becomes "in_progress".
  ///
  /// **PR-F24:** Worker Flow - Start Mission.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] if mission cannot be started
  Future<Mission> startMission(String missionId) async {
    debugPrint('[MissionsApi] Starting mission: $missionId');

    // Validate ID
    if (missionId.isEmpty) {
      debugPrint('[MissionsApi] startMission: empty ID provided');
      throw const MissionsApiException('ID de mission invalide');
    }

    // Check auth
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] startMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/$missionId/start');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    debugPrint('[MissionsApi] POST $uri');

    try {
      final response = await ApiClient.client
          .post(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] startMission response: ${response.statusCode}');

      if (response.statusCode == 401) {
        debugPrint('[MissionsApi] startMission: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 403) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] startMission: forbidden - $errorBody');
        throw MissionsApiException(errorBody ?? 'Vous ne pouvez pas démarrer cette mission');
      }

      if (response.statusCode == 404) {
        debugPrint('[MissionsApi] startMission: not found');
        throw const MissionsApiException('Mission non trouvée');
      }

      // 400 or 409: mission cannot be started (wrong status, etc.)
      if (response.statusCode == 400 || response.statusCode == 409) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] startMission: conflict/bad request - $errorBody');
        throw MissionsApiException(errorBody ?? 'Impossible de démarrer cette mission');
      }

      if (response.statusCode >= 500) {
        debugPrint('[MissionsApi] startMission: server error');
        throw const MissionsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] startMission: error ${response.statusCode} - $errorBody');
        throw MissionsApiException(errorBody ?? 'Erreur lors du démarrage');
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] startMission: success - ${mission.id} now ${mission.status}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] startMission: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] startMission: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] startMission: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] startMission: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Completes a mission (in_progress -> completed).
  ///
  /// Calls `POST /api/v1/missions-local/:id/complete`.
  ///
  /// Precondition: mission.status must be "in_progress" (or "assigned") and user is the assigned worker.
  /// Result: mission status becomes "completed".
  ///
  /// **PR-F25:** Worker Flow - Complete Mission.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] if mission cannot be completed
  Future<Mission> completeMission(String missionId) async {
    debugPrint('[MissionsApi] Completing mission: $missionId');

    // Validate ID
    if (missionId.isEmpty) {
      debugPrint('[MissionsApi] completeMission: empty ID provided');
      throw const MissionsApiException('ID de mission invalide');
    }

    // Check auth
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] completeMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/$missionId/complete');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    debugPrint('[MissionsApi] POST $uri');

    try {
      final response = await ApiClient.client
          .post(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] completeMission response: ${response.statusCode}');

      if (response.statusCode == 401) {
        debugPrint('[MissionsApi] completeMission: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 403) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] completeMission: forbidden - $errorBody');
        throw MissionsApiException(errorBody ?? 'Vous ne pouvez pas terminer cette mission');
      }

      if (response.statusCode == 404) {
        debugPrint('[MissionsApi] completeMission: not found');
        throw const MissionsApiException('Mission non trouvée');
      }

      // 400 or 409: mission cannot be completed (wrong status, etc.)
      if (response.statusCode == 400 || response.statusCode == 409) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] completeMission: conflict/bad request - $errorBody');
        throw MissionsApiException(errorBody ?? 'Impossible de terminer cette mission');
      }

      if (response.statusCode >= 500) {
        debugPrint('[MissionsApi] completeMission: server error');
        throw const MissionsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200 && response.statusCode != 201 && response.statusCode != 204) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[MissionsApi] completeMission: error ${response.statusCode} - $errorBody');
        throw MissionsApiException(errorBody ?? 'Erreur lors de la complétion');
      }

      // Handle 204 No Content or empty body
      if (response.statusCode == 204 || response.body.isEmpty) {
        debugPrint('[MissionsApi] completeMission: success (204/no content)');
        // Return a placeholder - caller should refresh to get updated mission
        return Mission(
          id: missionId,
          title: '',
          description: '',
          category: '',
          price: 0,
          latitude: 0,
          longitude: 0,
          city: '',
          status: MissionStatus.completed,
          createdByUserId: '',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] completeMission: success - ${mission.id} now ${mission.status}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] completeMission: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] completeMission: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] completeMission: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] completeMission: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Cancels a mission (open|assigned -> cancelled).
  ///
  /// Calls `POST /api/v1/missions-local/:id/cancel`.
  ///
  /// Only the mission creator or an admin can cancel.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [MissionsApiException] with status 403 if caller is not the creator
  /// - [MissionsApiException] with status 404 if mission not found
  Future<Mission> cancelMission(String missionId) async {
    debugPrint('[MissionsApi] Cancelling mission: $missionId');

    if (missionId.isEmpty) {
      throw const MissionsApiException('ID de mission invalide');
    }

    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MissionsApi] cancelMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/missions-local/$missionId/cancel');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    debugPrint('[MissionsApi] POST $uri');

    try {
      final response = await ApiClient.client
          .post(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionsApi] cancelMission response: ${response.statusCode}');

      if (response.statusCode == 401) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 403) {
        final msg = _tryParseError(response.body) ?? 'Seul le créateur peut annuler cette mission';
        throw MissionsApiException(msg);
      }

      if (response.statusCode == 404) {
        throw const MissionsApiException('Mission non trouvée');
      }

      if (response.statusCode >= 500) {
        throw MissionsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200 && response.statusCode != 204) {
        final msg = _tryParseError(response.body);
        throw MissionsApiException(msg ?? 'Erreur: ${response.statusCode}');
      }

      // 204 or empty body — return a cancelled placeholder
      if (response.statusCode == 204 || response.body.isEmpty) {
        return Mission(
          id: missionId,
          title: '',
          description: '',
          category: '',
          price: 0,
          latitude: 0,
          longitude: 0,
          city: '',
          status: MissionStatus.cancelled,
          createdByUserId: '',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }

      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic> ? (json['data'] ?? json) : json;
      final mission = Mission.fromJson(data as Map<String, dynamic>);
      debugPrint('[MissionsApi] cancelMission: success - ${mission.id} now ${mission.status}');
      return mission;
    } on TimeoutException {
      debugPrint('[MissionsApi] cancelMission: timeout');
      throw const MissionsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[MissionsApi] cancelMission: network error - $e');
      throw const MissionsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[MissionsApi] cancelMission: JSON parse error - $e');
      throw const MissionsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is MissionsApiException || e is AuthException) rethrow;
      debugPrint('[MissionsApi] cancelMission: unexpected error - $e');
      throw const MissionsApiException('Erreur inattendue');
    }
  }

  /// Tries to parse error message from response body.
  String? _tryParseError(String body) {
    try {
      final json = jsonDecode(body);
      if (json is Map<String, dynamic>) {
        return json['message'] as String? ?? json['error'] as String?;
      }
    } catch (_) {}
    return null;
  }

  /// Handles list response parsing.
  List<Mission> _handleListResponse(http.Response response) {
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw const UnauthorizedException();
    }

    if (response.statusCode >= 500) {
      throw const MissionsApiException('Erreur serveur');
    }

    if (response.statusCode != 200) {
      throw MissionsApiException('Erreur ${response.statusCode}');
    }

    final json = jsonDecode(response.body);

    // Handle both array and wrapped responses
    List<dynamic> items;
    if (json is List) {
      items = json;
    } else if (json is Map<String, dynamic>) {
      items = json['data'] ?? json['missions'] ?? [];
    } else {
      items = [];
    }

    debugPrint('[MissionsApi] Parsed ${items.length} missions');

    return items
        .map((item) => Mission.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}

