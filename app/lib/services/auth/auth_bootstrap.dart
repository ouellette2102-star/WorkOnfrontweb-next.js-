/// Authentication bootstrap for WorkOn.
///
/// Provides lightweight session checking at app startup.
/// No exceptions bubble up - all errors return `false`.
///
/// **PR#6:** Initial implementation with in-memory session check.
/// **PR#7:** Updated to use refreshAuthState() for state synchronization.
/// **PR-F04:** Now restores session from persistent storage.
/// **PR-BOOT:** Added Uber-grade cold start safety with network fallback.
library;

import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'auth_errors.dart';
import 'auth_models.dart';
import 'auth_service.dart';
import 'auth_state.dart';
import 'real_auth_repository.dart';
import 'token_storage.dart';
import '../user/user_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PR-BOOT: Bootstrap Result
// ─────────────────────────────────────────────────────────────────────────────

/// Result of the cold-start bootstrap process.
///
/// Differentiates between auth failures (clear tokens) and network failures
/// (keep tokens, let user retry later).
enum BootstrapResult {
  /// Session restored successfully. User is authenticated.
  authenticated,

  /// No tokens found, or tokens are invalid (401/403). User must login.
  unauthenticated,

  /// Network error during bootstrap. Tokens kept, proceed with caution.
  /// User may see network errors later, but won't be logged out.
  networkError,
}

/// Authentication bootstrap utility.
///
/// Use this at app startup to check if a valid session exists
/// and synchronize the auth state.
///
/// ## Usage
///
/// ```dart
/// void main() async {
///   WidgetsFlutterBinding.ensureInitialized();
///
///   // Check if user has valid session and update auth state
///   final hasSession = await AuthBootstrap.checkSession();
///
///   runApp(MyApp(isAuthenticated: hasSession));
/// }
/// ```
///
/// ## Behavior
///
/// - Attempts to restore session from persistent storage (PR-F04)
/// - Validates the current session with backend
/// - Updates [AuthService.state] accordingly (PR#7)
/// - Returns `true` if session is valid
/// - Returns `false` on any error (network, auth, etc.)
/// - Never throws exceptions
/// - No logging noise
abstract final class AuthBootstrap {
  /// Timeout for bootstrap refresh (shorter than normal to avoid blocking startup).
  static const Duration _bootstrapTimeout = Duration(seconds: 8);

  // ─────────────────────────────────────────────────────────────────────────
  // PR-STATE: Cached Bootstrap Result
  // ─────────────────────────────────────────────────────────────────────────

  /// Cached result from the last bootstrap call.
  ///
  /// Used by [AppStartupController] to avoid double bootstrap.
  /// Set by [bootstrapAuth], read by [getLastResult].
  static BootstrapResult? _lastResult;

  /// Returns the last bootstrap result, or null if not yet run.
  ///
  /// PR-STATE: Use this to get the bootstrap result without triggering
  /// a new bootstrap. Returns null if [bootstrapAuth] hasn't been called.
  static BootstrapResult? get lastResult => _lastResult;

  /// Whether bootstrap has already completed.
  static bool get hasCompleted => _lastResult != null;

  /// PR-F2: Resets the cached bootstrap result to allow retry.
  ///
  /// Call this before [bootstrapAuth] to force a fresh bootstrap attempt.
  /// Used by retry UX when user explicitly requests a retry.
  ///
  /// Example:
  /// ```dart
  /// AuthBootstrap.reset();
  /// final result = await AuthBootstrap.bootstrapAuth();
  /// ```
  static void reset() {
    debugPrint('[AuthBootstrap] Resetting cached result for retry');
    _lastResult = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-BOOT: Uber-grade Cold Start Bootstrap
  // ─────────────────────────────────────────────────────────────────────────

  /// Performs Uber-grade cold-start bootstrap with safe fallbacks.
  ///
  /// This method:
  /// 1. Initializes token storage
  /// 2. If refresh token exists, attempts a single silent refresh
  /// 3. On auth failure (401/403) → clears tokens, returns [BootstrapResult.unauthenticated]
  /// 4. On network failure → keeps tokens, returns [BootstrapResult.networkError]
  /// 5. On success → stores new tokens, returns [BootstrapResult.authenticated]
  ///
  /// **Never throws** - all errors are caught and classified.
  ///
  /// Example:
  /// ```dart
  /// void main() async {
  ///   WidgetsFlutterBinding.ensureInitialized();
  ///   final result = await AuthBootstrap.bootstrapAuth();
  ///   // result is authenticated, unauthenticated, or networkError
  ///   runApp(MyApp());
  /// }
  /// ```
  static Future<BootstrapResult> bootstrapAuth() async {
    // PR-STATE: If already completed, return cached result
    if (_lastResult != null) {
      debugPrint('[AuthBootstrap] Returning cached result: $_lastResult');
      return _lastResult!;
    }

    try {
      debugPrint('[AuthBootstrap] Starting cold-start bootstrap...');

      // Step 1: Initialize token storage
      final hasToken = await TokenStorage.initialize();
      if (!hasToken) {
        debugPrint('[AuthBootstrap] No stored token found');
        AuthService.setAuthState(const AuthState.unauthenticated());
        _lastResult = BootstrapResult.unauthenticated;
        return _lastResult!;
      }

      // Step 2: Check if we have a refresh token
      final refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        debugPrint('[AuthBootstrap] No refresh token available');
        await TokenStorage.clearToken();
        AuthService.setAuthState(const AuthState.unauthenticated());
        _lastResult = BootstrapResult.unauthenticated;
        return _lastResult!;
      }

      // Step 3: Check if access token is still valid (not expired locally)
      final accessToken = TokenStorage.getToken();
      if (accessToken != null && accessToken.isNotEmpty && !TokenStorage.isExpired) {
        debugPrint('[AuthBootstrap] Access token still valid, attempting validation...');
        _lastResult = await _validateAndRestoreSession(accessToken, refreshToken);
        return _lastResult!;
      }

      // Step 4: Access token expired or missing, try refresh
      debugPrint('[AuthBootstrap] Access token expired, attempting refresh...');
      _lastResult = await _attemptRefreshAndRestore(refreshToken);
      return _lastResult!;
    } catch (e) {
      debugPrint('[AuthBootstrap] Unexpected error during bootstrap: $e');
      // On unexpected error, keep tokens but report network error
      // This prevents logout on corrupted state
      _lastResult = BootstrapResult.networkError;
      return _lastResult!;
    }
  }

  /// Validates access token with backend and restores session.
  static Future<BootstrapResult> _validateAndRestoreSession(
    String accessToken,
    String refreshToken,
  ) async {
    try {
      final repository = RealAuthRepository();
      final user = await repository.me(accessToken: accessToken)
          .timeout(_bootstrapTimeout);

      // Success - restore full session
      await _restoreSession(user, accessToken, refreshToken);
      debugPrint('[AuthBootstrap] Session validated and restored');
      return BootstrapResult.authenticated;
    } on UnauthorizedException {
      // Token rejected - try refresh
      debugPrint('[AuthBootstrap] Token rejected (401), attempting refresh...');
      return _attemptRefreshAndRestore(refreshToken);
    } on TimeoutException {
      debugPrint('[AuthBootstrap] Validation timeout - network issue');
      return BootstrapResult.networkError;
    } on SocketException {
      debugPrint('[AuthBootstrap] Network error during validation');
      return BootstrapResult.networkError;
    } on http.ClientException {
      debugPrint('[AuthBootstrap] HTTP client error during validation');
      return BootstrapResult.networkError;
    } on AuthNetworkException {
      debugPrint('[AuthBootstrap] Auth network error during validation');
      return BootstrapResult.networkError;
    } catch (e) {
      debugPrint('[AuthBootstrap] Validation error: $e');
      // Unknown error - try refresh as fallback
      return _attemptRefreshAndRestore(refreshToken);
    }
  }

  /// Attempts to refresh tokens and restore session.
  static Future<BootstrapResult> _attemptRefreshAndRestore(String refreshToken) async {
    try {
      final repository = RealAuthRepository();
      debugPrint('[AuthBootstrap] Calling refresh endpoint...');

      final newTokens = await repository.refreshTokens(refreshToken: refreshToken)
          .timeout(_bootstrapTimeout);

      // Save new tokens
      await TokenStorage.saveTokens(
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
      );

      debugPrint('[AuthBootstrap] Refresh successful, validating new token...');

      // Validate new token
      final user = await repository.me(accessToken: newTokens.accessToken)
          .timeout(_bootstrapTimeout);

      // Restore session
      await _restoreSession(user, newTokens.accessToken, newTokens.refreshToken);
      debugPrint('[AuthBootstrap] Session restored after refresh');
      return BootstrapResult.authenticated;
    } on UnauthorizedException {
      // Refresh token invalid - clear everything
      debugPrint('[AuthBootstrap] Refresh token invalid (401), clearing tokens');
      await TokenStorage.clearToken();
      AuthService.setAuthState(const AuthState.unauthenticated());
      return BootstrapResult.unauthenticated;
    } on TimeoutException {
      debugPrint('[AuthBootstrap] Refresh timeout - network issue');
      return BootstrapResult.networkError;
    } on SocketException {
      debugPrint('[AuthBootstrap] Network error during refresh');
      return BootstrapResult.networkError;
    } on http.ClientException {
      debugPrint('[AuthBootstrap] HTTP client error during refresh');
      return BootstrapResult.networkError;
    } on AuthNetworkException {
      debugPrint('[AuthBootstrap] Auth network error during refresh');
      return BootstrapResult.networkError;
    } catch (e) {
      debugPrint('[AuthBootstrap] Refresh error: $e');
      // For unknown errors, assume network issue (don't clear tokens)
      return BootstrapResult.networkError;
    }
  }

  /// Restores the full session state.
  static Future<void> _restoreSession(
    AuthUser user,
    String accessToken,
    String? refreshToken,
  ) async {
    final tokens = AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken ?? '',
      expiresAt: TokenStorage.getExpiry(),
    );

    // Update AuthService internal state (session + auth state)
    AuthService.setSessionFromBootstrap(user: user, tokens: tokens);
    AuthService.setAuthState(AuthState.authenticated(
      userId: user.id,
      email: user.email,
    ));

    // Update user service
    await UserService.setFromAuth(userId: user.id, email: user.email);
    UserService.refreshFromBackendIfPossible();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Legacy Methods (kept for backward compatibility)
  // ─────────────────────────────────────────────────────────────────────────

  /// Checks if a valid authentication session exists.
  ///
  /// This method:
  /// 1. Attempts to restore session from storage (PR-F04)
  /// 2. Checks if there's a stored session in AuthService
  /// 3. Validates the session by calling /auth/me
  /// 4. Updates [AuthService.state] via [AuthService.refreshAuthState] (PR#7)
  /// 5. Returns the result without throwing
  ///
  /// Returns `true` if:
  /// - A valid session exists (in-memory or restored from storage)
  /// - The backend confirms the token is valid
  ///
  /// Returns `false` if:
  /// - No session exists
  /// - Token is expired or invalid
  /// - Network error occurs
  /// - Any other error occurs
  ///
  /// Example:
  /// ```dart
  /// final isLoggedIn = await AuthBootstrap.checkSession();
  /// if (isLoggedIn) {
  ///   // Navigate to home
  /// } else {
  ///   // Navigate to login
  /// }
  /// ```
  static Future<bool> checkSession() async {
    // PR-F04: First try to restore session from persistent storage
    if (!AuthService.isAuthenticated) {
      final restored = await AuthService.tryRestoreSession();
      if (restored) {
        return true;
      }
    }

    // Quick check: if no session exists, set unauthenticated and return
    if (!AuthService.isAuthenticated) {
      AuthService.setAuthState(const AuthState.unauthenticated());
      return false;
    }

    // PR#7: Use refreshAuthState which validates and updates state
    return AuthService.refreshAuthState();
  }

  /// Initializes authentication and checks session in one call.
  ///
  /// Convenience method that combines initialization and session check.
  /// Also updates [AuthService.state] (PR#7).
  /// Now also restores session from persistent storage (PR-F04).
  ///
  /// Example:
  /// ```dart
  /// final isLoggedIn = await AuthBootstrap.initialize();
  /// // AuthService.state is now authenticated or unauthenticated
  /// ```
  static Future<bool> initialize() async {
    // AuthService is already initialized with default repository
    // Check session and update auth state
    return checkSession();
  }
}

