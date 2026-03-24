/// User API client for WorkOn.
///
/// Provides minimal API calls for user profile data.
///
/// **PR#12:** Initial implementation for role resolution.
/// **PR#13:** Added debugPrint logging and improved error handling.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../config/app_config.dart';
import '../api/api_client.dart';
import '../auth/token_storage.dart';

/// Minimal API client for user-related endpoints.
///
/// Uses existing [ApiClient] infrastructure with automatic token refresh
/// for authentication.
///
/// ## Usage
///
/// ```dart
/// final api = UserApi();
/// final profile = await api.fetchMe();
/// print('Role: ${profile['role']}');
/// ```
class UserApi {
  /// Creates a [UserApi] instance.
  const UserApi();

  /// Fetches the current user's profile from the backend.
  ///
  /// Uses `GET /auth/me` endpoint with Bearer token authentication.
  /// **FIX-TOKEN-SYNC:** Now uses TokenStorage and ApiClient.authenticatedGet
  /// for automatic token refresh on 401.
  ///
  /// Returns the parsed JSON response as a Map.
  ///
  /// Throws if:
  /// - No token available
  /// - Network error occurs
  /// - Non-200 response after retry
  ///
  /// Example:
  /// ```dart
  /// final profile = await UserApi().fetchMe();
  /// final role = profile['role'] as String?;
  /// ```
  Future<Map<String, dynamic>> fetchMe() async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly instead of AuthService.session
    // This ensures we always get the most up-to-date token
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[UserApi] fetchMe: no token available in storage');
      throw const UserApiException('No token available');
    }

    // Build request
    final uri = ApiClient.buildUri('/auth/me');

    try {
      debugPrint('[UserApi] GET $uri');
      
      // FIX-TOKEN-SYNC: Use authenticatedGet which handles automatic token refresh
      final response = await ApiClient.authenticatedGet(uri);

      // PR-8: Enhanced logging for debugging profile load issues
      debugPrint('[UserApi] fetchMe response: ${response.statusCode}');
      if (response.statusCode != 200) {
        debugPrint('[UserApi] fetchMe body: ${response.body}');
      }

      // Check response (401 should be handled by authenticatedGet via refresh)
      if (response.statusCode == 401) {
        debugPrint('[UserApi] fetchMe: 401 Unauthorized - session expired after refresh attempt');
        throw const UserApiException('Session expirée');
      }

      if (response.statusCode == 403) {
        debugPrint('[UserApi] fetchMe: 403 Forbidden');
        throw const UserApiException('Accès refusé');
      }

      if (response.statusCode >= 500) {
        debugPrint('[UserApi] fetchMe: server error ${response.statusCode}');
        throw UserApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        debugPrint('[UserApi] fetchMe: unexpected status ${response.statusCode}');
        throw UserApiException(
          'Erreur ${response.statusCode}',
        );
      }

      // Parse and return JSON
      final body = jsonDecode(response.body);
      if (body is! Map<String, dynamic>) {
        debugPrint('[UserApi] fetchMe: invalid response format');
        throw const UserApiException('Invalid response format');
      }

      return body;
    } on TimeoutException {
      debugPrint('[UserApi] fetchMe: timeout');
      throw const UserApiException('Connection timeout');
    } on UserApiException {
      rethrow;
    } catch (e) {
      debugPrint('[UserApi] fetchMe: unexpected error: $e');
      throw UserApiException('Network error: $e');
    }
  }

  /// Updates the current user's profile.
  ///
  /// Uses `PATCH /users/me` endpoint with Bearer token authentication.
  /// **FIX-TOKEN-SYNC:** Now uses ApiClient.authenticatedPut for automatic
  /// token refresh on 401.
  ///
  /// Only sends non-null fields (partial update).
  ///
  /// Returns the updated profile as a Map.
  ///
  /// Throws if:
  /// - No token available
  /// - Network error occurs
  /// - Non-200 response after retry
  Future<Map<String, dynamic>> patchMe({
    String? fullName,
    String? phone,
    String? city,
    String? bio,
    String? gender,
  }) async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[UserApi] patchMe: no token available in storage');
      throw const UserApiException('No token available');
    }

    // Build request body (only non-null fields)
    final body = <String, dynamic>{};
    if (fullName != null) body['fullName'] = fullName;
    if (phone != null) body['phone'] = phone;
    if (city != null) body['city'] = city;
    if (bio != null) body['bio'] = bio;
    if (gender != null) body['gender'] = gender;

    if (body.isEmpty) {
      debugPrint('[UserApi] patchMe: no fields to update');
      throw const UserApiException('No fields to update');
    }

    // Build request
    final uri = ApiClient.buildUri('/users/me');

    try {
      debugPrint('[UserApi] PATCH $uri');
      
      // FIX-TOKEN-SYNC: Use authenticatedPatch which handles automatic token refresh
      final response = await ApiClient.authenticatedPatch(uri, body: body);

      debugPrint('[UserApi] patchMe response: ${response.statusCode}');

      // Check response (401 should be handled by authenticatedPut via refresh)
      if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint('[UserApi] patchMe: unauthorized/forbidden after refresh attempt');
        throw UserApiException('Unauthorized: ${response.statusCode}');
      }

      if (response.statusCode >= 500) {
        debugPrint('[UserApi] patchMe: server error ${response.statusCode}');
        throw UserApiException('Server error: ${response.statusCode}');
      }

      if (response.statusCode != 200 && response.statusCode != 204) {
        debugPrint('[UserApi] patchMe: unexpected status ${response.statusCode}');
        throw UserApiException(
          'Failed to update profile: ${response.statusCode}',
        );
      }

      // Parse and return JSON (or empty map for 204)
      if (response.statusCode == 204 || response.body.isEmpty) {
        return body; // Return what we sent
      }

      final responseBody = jsonDecode(response.body);
      if (responseBody is! Map<String, dynamic>) {
        debugPrint('[UserApi] patchMe: invalid response format');
        throw const UserApiException('Invalid response format');
      }

      return responseBody;
    } on TimeoutException {
      debugPrint('[UserApi] patchMe: timeout');
      throw const UserApiException('Connection timeout');
    } on UserApiException {
      rethrow;
    } catch (e) {
      debugPrint('[UserApi] patchMe: unexpected error: $e');
      throw UserApiException('Network error: $e');
    }
  }

  /// Uploads a profile picture.
  ///
  /// Uses `POST /api/v1/users/me/picture` with multipart/form-data.
  /// Field name: `file`. Accepts JPEG, PNG, WebP (max 5MB).
  /// Returns the updated user profile map containing `pictureUrl`.
  ///
  /// Throws [UserApiException] on:
  /// - No token available
  /// - File too large or wrong format (400)
  /// - Unauthorized (401)
  /// - Network error / timeout
  Future<Map<String, dynamic>> uploadPicture(File imageFile) async {
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[UserApi] uploadPicture: no token available');
      throw const UserApiException('No token available');
    }

    final uri = ApiClient.buildUri('/users/me/picture');
    debugPrint('[UserApi] POST (multipart) $uri');

    try {
      final request = http.MultipartRequest('POST', uri)
        ..headers.addAll({
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        });

      request.files.add(
        await http.MultipartFile.fromPath('file', imageFile.path),
      );

      final streamed = await request.send().timeout(AppConfig.connectionTimeout);
      final response = await http.Response.fromStream(streamed);

      debugPrint('[UserApi] uploadPicture response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UserApiException('Session expirée');
      }

      if (response.statusCode == 400) {
        final body = _tryParseBody(response.body);
        final msg = (body?['message'] as String?) ?? 'Fichier invalide (format ou taille)';
        throw UserApiException(msg);
      }

      if (response.statusCode >= 500) {
        throw UserApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw UserApiException('Erreur ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      if (body is! Map<String, dynamic>) {
        throw const UserApiException('Invalid response format');
      }
      return body;
    } on TimeoutException {
      debugPrint('[UserApi] uploadPicture: timeout');
      throw const UserApiException('Connection timeout');
    } on UserApiException {
      rethrow;
    } catch (e) {
      debugPrint('[UserApi] uploadPicture: unexpected error: $e');
      throw UserApiException('Network error: $e');
    }
  }

  Map<String, dynamic>? _tryParseBody(String body) {
    try {
      final decoded = jsonDecode(body);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }
}

/// Exception thrown by [UserApi] operations.
class UserApiException implements Exception {
  /// Creates a [UserApiException] with the given message.
  const UserApiException(this.message);

  /// The error message.
  final String message;

  @override
  String toString() => 'UserApiException: $message';
}

