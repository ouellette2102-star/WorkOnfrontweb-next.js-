/// Earnings API client for WorkOn.
///
/// Thin API layer for `/api/v1/earnings` endpoints.
/// Uses existing [ApiClient] for HTTP requests.
///
/// PR-EARNINGS: Earnings module implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';
import 'earnings_models.dart';

/// Exception thrown by [EarningsApi].
class EarningsApiException implements Exception {
  final String message;
  const EarningsApiException([this.message = 'Earnings API error']);

  @override
  String toString() => 'EarningsApiException: $message';
}

/// API client for earnings endpoints.
///
/// All methods require authentication (Bearer token).
///
/// ## Endpoints
///
/// - `GET /api/v1/earnings/summary` - Earnings summary
/// - `GET /api/v1/earnings/history` - Paginated history
/// - `GET /api/v1/earnings/by-mission/:id` - Single mission earnings
class EarningsApi {
  /// Fetches earnings summary for the current user.
  ///
  /// Calls `GET /api/v1/earnings/summary`.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [EarningsApiException] on other errors
  Future<EarningsSummary> fetchSummary() async {
    debugPrint('[EarningsApi] Fetching summary...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[EarningsApi] fetchSummary: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/earnings/summary');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[EarningsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[EarningsApi] fetchSummary response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint('[EarningsApi] fetchSummary: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode >= 500) {
        debugPrint('[EarningsApi] fetchSummary: server error');
        throw const EarningsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[EarningsApi] fetchSummary: error ${response.statusCode} - $errorBody');
        throw EarningsApiException(errorBody ?? 'Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);
      final summary = EarningsSummary.fromJson(json as Map<String, dynamic>);
      debugPrint('[EarningsApi] fetchSummary: success - net=${summary.totalLifetimeNet}');
      return summary;
    } on TimeoutException {
      debugPrint('[EarningsApi] fetchSummary: timeout');
      throw const EarningsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[EarningsApi] fetchSummary: network error - $e');
      throw const EarningsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[EarningsApi] fetchSummary: JSON parse error - $e');
      throw const EarningsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is EarningsApiException || e is AuthException) rethrow;
      debugPrint('[EarningsApi] fetchSummary: unexpected error - $e');
      throw const EarningsApiException('Erreur inattendue');
    }
  }

  /// Fetches earnings history (paginated).
  ///
  /// Calls `GET /api/v1/earnings/history`.
  ///
  /// Parameters:
  /// - [cursor]: Optional cursor for pagination
  /// - [limit]: Number of items to fetch (default 20, max 100)
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [EarningsApiException] on other errors
  Future<EarningsHistoryResponse> fetchHistory({
    String? cursor,
    int limit = 20,
  }) async {
    debugPrint('[EarningsApi] Fetching history (cursor: $cursor, limit: $limit)...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[EarningsApi] fetchHistory: no token available');
      throw const UnauthorizedException();
    }

    // Build query params
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    if (cursor != null && cursor.isNotEmpty) {
      queryParams['cursor'] = cursor;
    }

    final uri = Uri.parse('${ApiClient.baseUrl}/api/v1/earnings/history')
        .replace(queryParameters: queryParams);
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[EarningsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[EarningsApi] fetchHistory response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint('[EarningsApi] fetchHistory: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode >= 500) {
        debugPrint('[EarningsApi] fetchHistory: server error');
        throw const EarningsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[EarningsApi] fetchHistory: error ${response.statusCode} - $errorBody');
        throw EarningsApiException(errorBody ?? 'Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);
      final historyResponse = EarningsHistoryResponse.fromJson(json as Map<String, dynamic>);
      debugPrint('[EarningsApi] fetchHistory: success - ${historyResponse.transactions.length} items');
      return historyResponse;
    } on TimeoutException {
      debugPrint('[EarningsApi] fetchHistory: timeout');
      throw const EarningsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[EarningsApi] fetchHistory: network error - $e');
      throw const EarningsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[EarningsApi] fetchHistory: JSON parse error - $e');
      throw const EarningsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is EarningsApiException || e is AuthException) rethrow;
      debugPrint('[EarningsApi] fetchHistory: unexpected error - $e');
      throw const EarningsApiException('Erreur inattendue');
    }
  }

  /// Fetches earnings detail for a specific mission.
  ///
  /// Calls `GET /api/v1/earnings/by-mission/:missionId`.
  ///
  /// Throws:
  /// - [UnauthorizedException] if not authenticated
  /// - [EarningsApiException] on other errors (including 404)
  Future<EarningTransaction> fetchByMission(String missionId) async {
    debugPrint('[EarningsApi] Fetching earnings for mission: $missionId');

    // Validate ID
    if (missionId.isEmpty) {
      debugPrint('[EarningsApi] fetchByMission: empty ID provided');
      throw const EarningsApiException('ID de mission invalide');
    }

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[EarningsApi] fetchByMission: no token available');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/earnings/by-mission/$missionId');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[EarningsApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[EarningsApi] fetchByMission response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint('[EarningsApi] fetchByMission: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        debugPrint('[EarningsApi] fetchByMission: not found');
        throw const EarningsApiException('Revenu non trouvé pour cette mission');
      }

      if (response.statusCode >= 500) {
        debugPrint('[EarningsApi] fetchByMission: server error');
        throw const EarningsApiException('Erreur serveur. Réessayez plus tard.');
      }

      if (response.statusCode != 200) {
        final errorBody = _tryParseError(response.body);
        debugPrint('[EarningsApi] fetchByMission: error ${response.statusCode} - $errorBody');
        throw EarningsApiException(errorBody ?? 'Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);
      final transaction = EarningTransaction.fromJson(json as Map<String, dynamic>);
      debugPrint('[EarningsApi] fetchByMission: success - ${transaction.netAmount}');
      return transaction;
    } on TimeoutException {
      debugPrint('[EarningsApi] fetchByMission: timeout');
      throw const EarningsApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[EarningsApi] fetchByMission: network error - $e');
      throw const EarningsApiException('Erreur réseau. Vérifiez votre connexion.');
    } on FormatException catch (e) {
      debugPrint('[EarningsApi] fetchByMission: JSON parse error - $e');
      throw const EarningsApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is EarningsApiException || e is AuthException) rethrow;
      debugPrint('[EarningsApi] fetchByMission: unexpected error - $e');
      throw const EarningsApiException('Erreur inattendue');
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
}


