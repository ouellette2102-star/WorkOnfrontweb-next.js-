/// Mission map API client for WorkOn.
///
/// Calls GET /api/v1/missions-map — public endpoint, no auth required.
/// Returns lightweight mission pins for map display.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Exception
// ─────────────────────────────────────────────────────────────────────────────

class MissionMapApiException implements Exception {
  const MissionMapApiException([this.message = 'Mission map API error']);
  final String message;

  @override
  String toString() => 'MissionMapApiException: $message';
}

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

/// Lightweight mission pin returned by GET /missions-map.
class MissionPin {
  const MissionPin({
    required this.id,
    required this.title,
    required this.latitude,
    required this.longitude,
    required this.price,
    required this.category,
    required this.status,
    this.city,
  });

  factory MissionPin.fromJson(Map<String, dynamic> json) => MissionPin(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
        longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        category: json['category']?.toString() ?? '',
        status: json['status']?.toString() ?? 'open',
        city: json['city']?.toString(),
      );

  final String id;
  final String title;
  final double latitude;
  final double longitude;
  final double price;
  final String category;
  final String status;
  final String? city;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────────────────────────────────────

/// API client for the missions map endpoint.
///
/// Public endpoint — no authentication required.
class MissionMapApi {
  const MissionMapApi();

  /// Fetches mission pins for map display.
  ///
  /// Calls `GET /api/v1/missions-map` with optional geo-filtering.
  ///
  /// Parameters:
  /// - [lat] : center latitude (optional, pairs with [lng])
  /// - [lng] : center longitude (optional, pairs with [lat])
  /// - [radiusKm] : search radius in km (default 10)
  /// - [status] : filter by mission status (optional)
  /// - [category] : filter by category (optional)
  Future<List<MissionPin>> getMissions({
    double? lat,
    double? lng,
    double radiusKm = 10,
    String? status,
    String? category,
  }) async {
    debugPrint('[MissionMapApi] Fetching missions (lat: $lat, lng: $lng, radius: $radiusKm)');

    final params = <String, String>{};
    if (lat != null) params['lat'] = lat.toString();
    if (lng != null) params['lng'] = lng.toString();
    if (lat != null && lng != null) params['radiusKm'] = radiusKm.toString();
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (category != null && category.isNotEmpty) params['category'] = category;

    final uri = ApiClient.buildUri('/missions-map')
        .replace(queryParameters: params.isEmpty ? null : params);

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionMapApi] response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw MissionMapApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MissionMapApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final list = body is List ? body : (body['data'] ?? body['missions'] ?? []);

      return (list as List)
          .map((e) => MissionPin.fromJson(e as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      debugPrint('[MissionMapApi] Timeout');
      throw const MissionMapApiException('Connexion trop lente. Réessayez.');
    } on MissionMapApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MissionMapApi] Error: $e');
      throw MissionMapApiException('Erreur réseau: $e');
    }
  }

  /// Fetches a single mission's full details by ID.
  ///
  /// Calls `GET /api/v1/missions-map/:id` — public endpoint.
  Future<MissionPin> getMissionById(String id) async {
    debugPrint('[MissionMapApi] Fetching mission $id');

    final uri = ApiClient.buildUri('/missions-map/$id');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MissionMapApi] getMissionById response: ${response.statusCode}');

      if (response.statusCode == 404) {
        throw const MissionMapApiException('Mission introuvable');
      }
      if (response.statusCode != 200) {
        throw MissionMapApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return MissionPin.fromJson(body);
    } on TimeoutException {
      throw const MissionMapApiException('Connexion trop lente. Réessayez.');
    } on MissionMapApiException {
      rethrow;
    } catch (e) {
      throw MissionMapApiException('Erreur réseau: $e');
    }
  }
}
