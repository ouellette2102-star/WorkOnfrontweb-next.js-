/// Minimal API client for WorkOn backend integration.
///
/// This client provides a centralized HTTP layer configured with
/// [AppConfig] settings. No endpoints or business logic included.
///
/// Usage:
/// ```dart
/// final response = await ApiClient.get('/endpoint');
/// ```
///
/// **PR-F17:** Added authenticatedRequest with automatic token refresh.
/// **PR-OBS:** Added X-Request-Id correlation header.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../config/app_config.dart';
import '../auth/token_refresh_interceptor.dart';
import '../auth/token_storage.dart';
import 'request_id.dart';

/// Exception thrown when device is offline or backend unreachable.
class NetworkUnavailableException implements Exception {
  const NetworkUnavailableException([this.message = 'Pas de connexion réseau']);
  final String message;

  @override
  String toString() => message;
}

/// Centralized API client for backend communication.
///
/// Configured with:
/// - Base URL from [AppConfig.activeApiUrl]
/// - Timeout settings from [AppConfig]
/// - Prepared headers structure (auth to be added later)
abstract final class ApiClient {
  // ─────────────────────────────────────────────────────────────────────────
  // HTTP Client Instance
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal HTTP client instance.
  static final http.Client _client = http.Client();

  /// Exposes the underlying HTTP client for advanced usage.
  static http.Client get client => _client;

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /// Base URL for all API requests.
  static String get baseUrl => AppConfig.activeApiUrl;

  /// Connection timeout duration.
  static Duration get connectionTimeout => AppConfig.connectionTimeout;

  /// Receive timeout duration.
  static Duration get receiveTimeout => AppConfig.receiveTimeout;

  // ─────────────────────────────────────────────────────────────────────────
  // Headers
  // ─────────────────────────────────────────────────────────────────────────

  /// Default headers for all requests.
  ///
  /// Includes:
  /// - Content-Type and Accept for JSON
  /// - X-Request-Id for correlation/tracing (PR-OBS)
  static Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        RequestId.headerName: RequestId.sessionId,
      };

  // ─────────────────────────────────────────────────────────────────────────
  // URL Builder
  // ─────────────────────────────────────────────────────────────────────────

  /// Builds a full URI from an endpoint path.
  ///
  /// Example: `buildUri('/users')` → `https://workon-backend.../api/v1/users`
  static Uri buildUri(String endpoint) {
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('${AppConfig.apiUrl}$path');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /// Closes the HTTP client.
  static void dispose() {
    _client.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Offline Guard
  // ─────────────────────────────────────────────────────────────────────────

  /// Wraps any HTTP call and converts [SocketException] / [TimeoutException]
  /// into [NetworkUnavailableException] for consistent offline handling.
  static Future<http.Response> _wrapOffline(
    Future<http.Response> Function() fn,
  ) async {
    try {
      return await fn();
    } on SocketException catch (e) {
      debugPrint('[ApiClient] SocketException (offline?): $e');
      throw const NetworkUnavailableException();
    } on TimeoutException catch (e) {
      debugPrint('[ApiClient] Timeout: $e');
      throw const NetworkUnavailableException('Connexion trop lente. Réessayez.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F17: Authenticated Requests with Token Refresh
  // ─────────────────────────────────────────────────────────────────────────

  /// Gets headers with current auth token.
  static Map<String, String> get authHeaders {
    final token = TokenStorage.getToken();
    final headers = {...defaultHeaders};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Executes an authenticated GET request with automatic token refresh on 401.
  ///
  /// Uses [TokenRefreshInterceptor] to handle token expiry transparently.
  ///
  /// Example:
  /// ```dart
  /// final response = await ApiClient.authenticatedGet(
  ///   ApiClient.buildUri('/missions/nearby'),
  /// );
  /// ```
  static Future<http.Response> authenticatedGet(
    Uri uri, {
    Map<String, String>? additionalHeaders,
  }) async {
    return _wrapOffline(() => TokenRefreshInterceptor.executeWithRefresh(
      () => _client.get(
        uri,
        headers: {...authHeaders, ...?additionalHeaders},
      ).timeout(connectionTimeout),
    ));
  }

  /// Executes an authenticated POST request with automatic token refresh on 401.
  static Future<http.Response> authenticatedPost(
    Uri uri, {
    Object? body,
    Map<String, String>? additionalHeaders,
  }) async {
    return _wrapOffline(() => TokenRefreshInterceptor.executeWithRefresh(
      () => _client.post(
        uri,
        headers: {...authHeaders, ...?additionalHeaders},
        body: body is String ? body : (body != null ? jsonEncode(body) : null),
      ).timeout(connectionTimeout),
    ));
  }

  /// Executes an authenticated PUT request with automatic token refresh on 401.
  static Future<http.Response> authenticatedPut(
    Uri uri, {
    Object? body,
    Map<String, String>? additionalHeaders,
  }) async {
    return _wrapOffline(() => TokenRefreshInterceptor.executeWithRefresh(
      () => _client.put(
        uri,
        headers: {...authHeaders, ...?additionalHeaders},
        body: body is String ? body : (body != null ? jsonEncode(body) : null),
      ).timeout(connectionTimeout),
    ));
  }

  /// Executes an authenticated DELETE request with automatic token refresh on 401.
  static Future<http.Response> authenticatedDelete(
    Uri uri, {
    Map<String, String>? additionalHeaders,
  }) async {
    return _wrapOffline(() => TokenRefreshInterceptor.executeWithRefresh(
      () => _client.delete(
        uri,
        headers: {...authHeaders, ...?additionalHeaders},
      ).timeout(connectionTimeout),
    ));
  }

  /// Executes an authenticated PATCH request with automatic token refresh on 401.
  static Future<http.Response> authenticatedPatch(
    Uri uri, {
    Object? body,
    Map<String, String>? additionalHeaders,
  }) async {
    return _wrapOffline(() => TokenRefreshInterceptor.executeWithRefresh(
      () => _client.patch(
        uri,
        headers: {...authHeaders, ...?additionalHeaders},
        body: body is String ? body : (body != null ? jsonEncode(body) : null),
      ).timeout(connectionTimeout),
    ));
  }
}

