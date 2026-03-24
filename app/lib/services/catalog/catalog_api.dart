/// Catalog API client for WorkOn.
///
/// Thin API layer for `/api/v1/catalog` endpoints.
/// Fetches categories and skills from the backend.
///
/// **FL-1:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import 'catalog_models.dart';

/// Exception thrown by [CatalogApi].
class CatalogApiException implements Exception {
  final String message;
  const CatalogApiException([this.message = 'Catalog API error']);

  @override
  String toString() => 'CatalogApiException: $message';
}

/// API client for catalog endpoints.
///
/// Categories and skills are public endpoints (no auth required).
///
/// ## Usage
///
/// ```dart
/// final api = CatalogApi();
/// final categories = await api.getCategories();
/// final skills = await api.getSkills(categoryId: 'cat-123');
/// ```
class CatalogApi {
  const CatalogApi();

  /// Fetches all categories.
  ///
  /// Calls `GET /api/v1/catalog/categories`.
  ///
  /// Returns a list of [ServiceCategory] sorted by name.
  Future<List<ServiceCategory>> getCategories() async {
    debugPrint('[CatalogApi] Fetching categories...');

    final uri = ApiClient.buildUri('/catalog/categories');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[CatalogApi] Categories response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw CatalogApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw CatalogApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data = body is List ? body : (body['categories'] ?? body['data'] ?? []);

      final categories = data
          .map((json) => ServiceCategory.fromJson(json as Map<String, dynamic>))
          .toList();

      debugPrint('[CatalogApi] Loaded ${categories.length} categories');
      return categories;
    } on TimeoutException {
      debugPrint('[CatalogApi] Timeout fetching categories');
      throw const CatalogApiException('Connexion timeout');
    } on CatalogApiException {
      rethrow;
    } catch (e) {
      debugPrint('[CatalogApi] Error fetching categories: $e');
      throw CatalogApiException('Erreur réseau: $e');
    }
  }

  /// Fetches skills, optionally filtered by category.
  ///
  /// Calls `GET /api/v1/catalog/skills` or `GET /api/v1/catalog/skills?categoryId=...`.
  ///
  /// Parameters:
  /// - [categoryId]: Optional category ID to filter skills.
  ///
  /// Returns a list of [Skill].
  Future<List<Skill>> getSkills({String? categoryId}) async {
    debugPrint('[CatalogApi] Fetching skills (categoryId: $categoryId)...');

    var uri = ApiClient.buildUri('/catalog/skills');
    if (categoryId != null && categoryId.isNotEmpty) {
      uri = uri.replace(queryParameters: {'categoryId': categoryId});
    }

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[CatalogApi] Skills response: ${response.statusCode}');

      if (response.statusCode >= 500) {
        throw CatalogApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw CatalogApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data = body is List ? body : (body['skills'] ?? body['data'] ?? []);

      final skills = data
          .map((json) => Skill.fromJson(json as Map<String, dynamic>))
          .toList();

      debugPrint('[CatalogApi] Loaded ${skills.length} skills');
      return skills;
    } on TimeoutException {
      debugPrint('[CatalogApi] Timeout fetching skills');
      throw const CatalogApiException('Connexion timeout');
    } on CatalogApiException {
      rethrow;
    } catch (e) {
      debugPrint('[CatalogApi] Error fetching skills: $e');
      throw CatalogApiException('Erreur réseau: $e');
    }
  }

  /// Checks catalog health/availability.
  ///
  /// Calls `GET /api/v1/catalog/health`.
  ///
  /// Returns a map with categoriesCount and skillsCount.
  Future<Map<String, int>> getHealth() async {
    debugPrint('[CatalogApi] Checking catalog health...');

    final uri = ApiClient.buildUri('/catalog/health');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      if (response.statusCode != 200) {
        return {'categoriesCount': 0, 'skillsCount': 0};
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return {
        'categoriesCount': body['categoriesCount'] as int? ?? 0,
        'skillsCount': body['skillsCount'] as int? ?? 0,
      };
    } catch (e) {
      debugPrint('[CatalogApi] Health check failed: $e');
      return {'categoriesCount': 0, 'skillsCount': 0};
    }
  }
}
