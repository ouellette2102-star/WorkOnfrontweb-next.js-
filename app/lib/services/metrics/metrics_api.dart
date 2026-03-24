/// Thin API layer for `/api/v1/metrics` endpoints.
///
/// Public endpoints (no auth required). Used for dashboard stats.
///
/// - `GET /api/v1/metrics/ratio` - Worker/employer ratio
/// - `GET /api/v1/metrics/regions` - Available regions
/// - `GET /api/v1/metrics/home-stats` - Home landing stats (contrats, travailleurs, appels)
///
/// **Phase 14:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import 'metrics_models.dart';

/// Exception thrown by [MetricsApi].
class MetricsApiException implements Exception {
  final String message;
  const MetricsApiException([this.message = 'Metrics API error']);

  @override
  String toString() => 'MetricsApiException: $message';
}

/// API client for metrics endpoints.
///
/// Ratio and regions are public endpoints (no auth required).
class MetricsApi {
  const MetricsApi();

  /// Fetches worker/employer ratio.
  ///
  /// Calls `GET /api/v1/metrics/ratio` or `GET /api/v1/metrics/ratio?region=...`.
  ///
  /// Parameters:
  /// - [region]: Optional region/city filter (e.g. 'Montréal').
  Future<RatioMetrics> getRatio({String? region}) async {
    debugPrint('[MetricsApi] Fetching ratio (region: $region)...');

    var uri = ApiClient.buildUri('/metrics/ratio');
    if (region != null && region.isNotEmpty) {
      uri = uri.replace(queryParameters: {'region': region});
    }

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MetricsApi] Ratio response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw MetricsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MetricsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return RatioMetrics.fromJson(body);
    } on TimeoutException {
      debugPrint('[MetricsApi] Timeout fetching ratio');
      throw const MetricsApiException('Connexion timeout');
    } on MetricsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MetricsApi] Error fetching ratio: $e');
      throw MetricsApiException('Erreur réseau: $e');
    }
  }

  /// Fetches available regions (cities with active users).
  ///
  /// Calls `GET /api/v1/metrics/regions`.
  Future<List<String>> getRegions() async {
    debugPrint('[MetricsApi] Fetching regions...');

    final uri = ApiClient.buildUri('/metrics/regions');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MetricsApi] Regions response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw MetricsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MetricsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data = body is List ? body : (body['regions'] ?? body['data'] ?? []);
      return data.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    } on TimeoutException {
      debugPrint('[MetricsApi] Timeout fetching regions');
      throw const MetricsApiException('Connexion timeout');
    } on MetricsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MetricsApi] Error fetching regions: $e');
      throw MetricsApiException('Erreur réseau: $e');
    }
  }

  /// Fetches home landing page stats (public, no auth).
  ///
  /// Calls `GET /api/v1/metrics/home-stats`.
  /// Returns: completedContracts, activeWorkers, openServiceCalls.
  Future<HomeStats> getHomeStats() async {
    debugPrint('[MetricsApi] Fetching home stats...');

    final uri = ApiClient.buildUri('/metrics/home-stats');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MetricsApi] Home stats response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw MetricsApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MetricsApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return HomeStats.fromJson(body);
    } on TimeoutException {
      debugPrint('[MetricsApi] Timeout fetching home stats');
      throw const MetricsApiException('Connexion timeout');
    } on MetricsApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MetricsApi] Error fetching home stats: $e');
      throw MetricsApiException('Erreur réseau: $e');
    }
  }
}
