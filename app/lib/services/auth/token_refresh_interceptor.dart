/// Token refresh interceptor for WorkOn.
///
/// Provides transparent token refresh when access token expires.
/// Handles concurrency by using a shared refresh future.
///
/// **PR-F17:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'auth_errors.dart';
import 'auth_service.dart';
import 'token_storage.dart';

/// Callback for forcing logout when refresh fails.
typedef LogoutCallback = Future<void> Function();

/// Callback for showing session expired message to user.
typedef SessionExpiredCallback = void Function();

/// Token refresh interceptor that handles 401 responses.
///
/// Features:
/// - Automatic token refresh on 401
/// - Concurrency control (only one refresh at a time)
/// - Request replay after successful refresh
/// - Forced logout on refresh failure
///
/// ## Usage
///
/// ```dart
/// // Setup once at app startup
/// TokenRefreshInterceptor.setLogoutCallback(() async {
///   await AuthService.logout();
/// });
///
/// // Make authenticated request
/// final response = await TokenRefreshInterceptor.executeWithRefresh(
///   () => http.get(uri, headers: headers),
///   getHeaders: () => {..., 'Authorization': 'Bearer ${TokenStorage.getToken()}'},
/// );
/// ```
abstract final class TokenRefreshInterceptor {
  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /// Callback to execute logout when refresh fails.
  static LogoutCallback? _logoutCallback;

  /// Callback to show session expired message.
  static SessionExpiredCallback? _sessionExpiredCallback;

  /// Sets the logout callback.
  static void setLogoutCallback(LogoutCallback callback) {
    _logoutCallback = callback;
  }

  /// Sets the session expired callback (for showing snackbar).
  static void setSessionExpiredCallback(SessionExpiredCallback callback) {
    _sessionExpiredCallback = callback;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Concurrency Control
  // ─────────────────────────────────────────────────────────────────────────

  /// Shared future for ongoing refresh operation.
  /// Multiple 401 responses will wait on the same future.
  static Completer<bool>? _refreshCompleter;

  /// Whether a refresh is currently in progress.
  static bool get isRefreshing => _refreshCompleter != null && !_refreshCompleter!.isCompleted;

  // ─────────────────────────────────────────────────────────────────────────
  // Token Refresh Logic
  // ─────────────────────────────────────────────────────────────────────────

  /// Attempts to refresh the access token.
  ///
  /// Uses mutex pattern: if refresh is already in progress, waits for it.
  /// Returns `true` if refresh succeeded, `false` otherwise.
  ///
  /// **Never throws** - failures return `false`.
  static Future<bool> tryRefresh() async {
    // If refresh already in progress, wait for it
    if (isRefreshing) {
      debugPrint('[TokenRefreshInterceptor] Refresh already in progress, waiting...');
      try {
        return await _refreshCompleter!.future;
      } catch (_) {
        return false;
      }
    }

    // Start new refresh
    _refreshCompleter = Completer<bool>();
    debugPrint('[TokenRefreshInterceptor] Starting token refresh...');

    try {
      final refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        debugPrint('[TokenRefreshInterceptor] No refresh token available');
        _refreshCompleter!.complete(false);
        return false;
      }

      // Call AuthService to refresh
      final success = await AuthService.tryRefreshTokens();

      _refreshCompleter!.complete(success);
      debugPrint('[TokenRefreshInterceptor] Refresh ${success ? "succeeded" : "failed"}');
      return success;
    } catch (e) {
      debugPrint('[TokenRefreshInterceptor] Refresh error: $e');
      _refreshCompleter!.complete(false);
      return false;
    } finally {
      // Clear completer after a short delay to prevent rapid re-attempts
      Future.delayed(const Duration(milliseconds: 100), () {
        _refreshCompleter = null;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Request Execution with Refresh
  // ─────────────────────────────────────────────────────────────────────────

  /// Executes an HTTP request with automatic token refresh on 401.
  ///
  /// Parameters:
  /// - [executeRequest]: Function that executes the HTTP request.
  /// - [retried]: Whether this is a retry after refresh (internal use).
  ///
  /// Flow:
  /// 1. Execute request
  /// 2. If 401: try refresh
  /// 3. If refresh succeeds: retry request once
  /// 4. If refresh fails: trigger logout and return original 401 response
  ///
  /// Returns the HTTP response (may be from retry).
  static Future<http.Response> executeWithRefresh(
    Future<http.Response> Function() executeRequest, {
    bool retried = false,
  }) async {
    final response = await executeRequest();

    // If not 401, return as-is
    if (response.statusCode != 401) {
      return response;
    }

    // If already retried, don't retry again (prevent infinite loop)
    if (retried) {
      debugPrint('[TokenRefreshInterceptor] Already retried, returning 401');
      await _handleRefreshFailure();
      return response;
    }

    debugPrint('[TokenRefreshInterceptor] Got 401, attempting refresh...');

    // Try to refresh
    final refreshed = await tryRefresh();

    if (refreshed) {
      // Retry the request with new token
      debugPrint('[TokenRefreshInterceptor] Retrying request with new token...');
      return executeWithRefresh(executeRequest, retried: true);
    } else {
      // Refresh failed, trigger logout
      await _handleRefreshFailure();
      return response;
    }
  }

  /// Handles refresh failure by triggering logout and notifying user.
  static Future<void> _handleRefreshFailure() async {
    debugPrint('[TokenRefreshInterceptor] Refresh failed, triggering logout');

    // Notify user
    _sessionExpiredCallback?.call();

    // Trigger logout
    try {
      await _logoutCallback?.call();
    } catch (e) {
      debugPrint('[TokenRefreshInterceptor] Logout callback error: $e');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Header Helper
  // ─────────────────────────────────────────────────────────────────────────

  /// Gets authenticated headers with current token.
  ///
  /// Use this to get fresh headers after a token refresh.
  static Map<String, String> getAuthHeaders(Map<String, String> baseHeaders) {
    final token = TokenStorage.getToken();
    if (token != null && token.isNotEmpty) {
      return {
        ...baseHeaders,
        'Authorization': 'Bearer $token',
      };
    }
    return baseHeaders;
  }
}

