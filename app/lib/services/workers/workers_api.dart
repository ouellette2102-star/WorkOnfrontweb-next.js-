/// Workers discovery API client for WorkOn.
///
/// Thin API layer for `GET /api/v1/profiles/workers`.
/// Public endpoint — no auth required.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import 'worker_models.dart';

/// Exception thrown by [WorkersApi].
class WorkersApiException implements Exception {
  final String message;
  const WorkersApiException([this.message = 'Workers API error']);

  @override
  String toString() => 'WorkersApiException: $message';
}

/// API client for worker discovery endpoints.
class WorkersApi {
  const WorkersApi();

  /// Fetches a paginated list of active workers.
  ///
  /// Calls `GET /api/v1/profiles/workers`.
  Future<WorkersListResponse> getWorkers({
    String? city,
    String? category,
    int limit = 20,
    int page = 1,
  }) async {
    debugPrint('[WorkersApi] Fetching workers (city: $city, limit: $limit, page: $page)');

    var uri = ApiClient.buildUri('/profiles/workers');
    final params = <String, String>{
      'limit': '$limit',
      'page': '$page',
      if (city != null && city.isNotEmpty) 'city': city,
      if (category != null && category.isNotEmpty) 'category': category,
    };
    uri = uri.replace(queryParameters: params);

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return WorkersListResponse.fromJson(body);
      }

      throw WorkersApiException('Erreur: ${response.statusCode}');
    } on TimeoutException {
      throw const WorkersApiException('Connexion timeout');
    } on WorkersApiException {
      rethrow;
    } catch (e) {
      throw WorkersApiException('Erreur réseau: $e');
    }
  }

  /// Fetches a single worker's public profile.
  ///
  /// Calls `GET /api/v1/profiles/workers/:id`.
  Future<WorkerProfile> getWorkerById(String workerId) async {
    final uri = ApiClient.buildUri('/profiles/workers/$workerId');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return WorkerProfile.fromJson(body);
      }

      throw WorkersApiException('Travailleur introuvable: ${response.statusCode}');
    } on TimeoutException {
      throw const WorkersApiException('Connexion timeout');
    } on WorkersApiException {
      rethrow;
    } catch (e) {
      throw WorkersApiException('Erreur réseau: $e');
    }
  }
}
