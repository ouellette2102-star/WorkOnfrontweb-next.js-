/// Consent gate for handling 403 CONSENT_REQUIRED responses.
///
/// Provides:
/// - Global lock to prevent multiple modals
/// - Modal display callback registration
/// - Retry coordination after consent acceptance
///
/// **PR-S2:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'consent_api.dart';
import 'consent_store.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Exceptions
// ─────────────────────────────────────────────────────────────────────────────

/// Exception thrown when consent is required but not given.
class ConsentRequiredException implements Exception {
  final String reason;
  final List<String> missingDocuments;

  const ConsentRequiredException({
    this.reason = 'Consent required',
    this.missingDocuments = const [],
  });

  @override
  String toString() => 'ConsentRequiredException: $reason';
}

/// Exception thrown when consent flow fails.
class ConsentFlowException implements Exception {
  final String message;

  const ConsentFlowException(this.message);

  @override
  String toString() => 'ConsentFlowException: $message';
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/// Callback type for showing consent modal.
/// Returns true if user accepted, false if refused/closed.
typedef ShowConsentModalCallback = Future<bool> Function();

// ─────────────────────────────────────────────────────────────────────────────
// Consent Gate
// ─────────────────────────────────────────────────────────────────────────────

/// Handles CONSENT_REQUIRED (403) responses globally.
///
/// Features:
/// - Single modal at a time (multiple requests wait)
/// - Retry after acceptance
/// - No infinite loops (max 1 retry)
///
/// ## Setup
///
/// ```dart
/// // At app startup, register the modal callback
/// ConsentGate.setShowModalCallback(() async {
///   // Show your consent modal/dialog
///   // Return true if accepted, false if cancelled
///   return await showConsentDialog();
/// });
/// ```
///
/// ## Usage
///
/// ```dart
/// // In API client, wrap response handling
/// if (ConsentGate.isConsentRequired(response)) {
///   final accepted = await ConsentGate.ensureAccepted();
///   if (accepted) {
///     // Retry request
///   }
/// }
/// ```
abstract final class ConsentGate {
  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /// Callback to show consent modal.
  static ShowConsentModalCallback? _showModalCallback;

  /// Sets the modal callback.
  static void setShowModalCallback(ShowConsentModalCallback callback) {
    _showModalCallback = callback;
    debugPrint('[ConsentGate] Modal callback registered');
  }

  /// Returns true if modal callback is registered.
  static bool get hasModalCallback => _showModalCallback != null;

  // ─────────────────────────────────────────────────────────────────────────
  // Concurrency Control
  // ─────────────────────────────────────────────────────────────────────────

  /// Shared completer for ongoing consent flow.
  /// Multiple CONSENT_REQUIRED responses will wait on the same future.
  static Completer<bool>? _consentCompleter;

  /// Whether a consent flow is currently in progress.
  static bool get isInProgress =>
      _consentCompleter != null && !_consentCompleter!.isCompleted;

  // ─────────────────────────────────────────────────────────────────────────
  // Detection
  // ─────────────────────────────────────────────────────────────────────────

  /// Checks if an HTTP response indicates CONSENT_REQUIRED.
  ///
  /// Checks:
  /// - Status code is 403
  /// - Body contains { "error": "CONSENT_REQUIRED" } or { "code": "CONSENT_REQUIRED" }
  static bool isConsentRequired(http.Response response) {
    if (response.statusCode != 403) {
      return false;
    }

    try {
      final body = jsonDecode(response.body);
      if (body is Map<String, dynamic>) {
        final error = body['error'] as String?;
        final code = body['code'] as String?;
        return error == 'CONSENT_REQUIRED' || code == 'CONSENT_REQUIRED';
      }
    } catch (_) {
      // JSON parse failed, not consent required
    }

    return false;
  }

  /// Extracts missing documents from CONSENT_REQUIRED response.
  static List<String> extractMissingDocuments(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      if (body is Map<String, dynamic>) {
        final missing = body['missing'] as List<dynamic>?;
        if (missing != null) {
          return missing.map((e) => e.toString()).toList();
        }
      }
    } catch (_) {
      // Ignore parse errors
    }
    return [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Consent Flow
  // ─────────────────────────────────────────────────────────────────────────

  /// Ensures user has accepted consent.
  ///
  /// Flow:
  /// 1. If consent flow already in progress, wait for it
  /// 2. Show modal and wait for user response
  /// 3. If accepted, call ConsentStore.acceptAll()
  /// 4. Return true if successful, false otherwise
  ///
  /// **Thread-safe:** Multiple callers will share the same flow.
  /// Only one modal is shown at a time.
  static Future<bool> ensureAccepted() async {
    // If flow already in progress, wait for it
    if (isInProgress) {
      debugPrint('[ConsentGate] Flow already in progress, waiting...');
      try {
        return await _consentCompleter!.future;
      } catch (_) {
        return false;
      }
    }

    // Start new flow
    _consentCompleter = Completer<bool>();
    debugPrint('[ConsentGate] Starting consent flow...');

    try {
      // Check if modal callback is registered
      if (_showModalCallback == null) {
        debugPrint('[ConsentGate] No modal callback registered');
        _consentCompleter!.complete(false);
        return false;
      }

      // Show modal and wait for user response
      final userAccepted = await _showModalCallback!();

      if (!userAccepted) {
        debugPrint('[ConsentGate] User declined consent');
        _consentCompleter!.complete(false);
        return false;
      }

      // User accepted - call backend
      debugPrint('[ConsentGate] User accepted, syncing with backend...');
      try {
        await ConsentStore.acceptAll();
        debugPrint('[ConsentGate] Backend sync successful');
        _consentCompleter!.complete(true);
        return true;
      } catch (e) {
        debugPrint('[ConsentGate] Backend sync failed: $e');
        _consentCompleter!.complete(false);
        return false;
      }
    } catch (e) {
      debugPrint('[ConsentGate] Consent flow error: $e');
      _consentCompleter!.completeError(e);
      return false;
    } finally {
      // Clear completer after a short delay
      Future.delayed(const Duration(milliseconds: 100), () {
        _consentCompleter = null;
      });
    }
  }

  /// Resets the gate state (for testing).
  static void reset() {
    _consentCompleter = null;
    debugPrint('[ConsentGate] Reset');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Consent Interceptor
// ─────────────────────────────────────────────────────────────────────────────

/// Interceptor for handling CONSENT_REQUIRED in HTTP responses.
///
/// Similar to [TokenRefreshInterceptor] but for consent.
/// Wraps request execution with consent handling.
abstract final class ConsentInterceptor {
  /// Header to mark a request as retried (anti-loop).
  static const String _retryHeader = 'X-WorkOn-Consent-Retry';

  /// Executes an HTTP request with consent handling.
  ///
  /// Parameters:
  /// - [executeRequest]: Function that executes the HTTP request
  /// - [retried]: Whether this is a retry after consent (internal use)
  ///
  /// Flow:
  /// 1. Execute request
  /// 2. If CONSENT_REQUIRED: trigger consent flow
  /// 3. If consent accepted: retry request ONCE
  /// 4. If consent refused or retry fails: throw [ConsentRequiredException]
  static Future<http.Response> executeWithConsent(
    Future<http.Response> Function() executeRequest, {
    bool retried = false,
  }) async {
    final response = await executeRequest();

    // If not CONSENT_REQUIRED, return as-is
    if (!ConsentGate.isConsentRequired(response)) {
      return response;
    }

    // If already retried, don't retry again (prevent infinite loop)
    if (retried) {
      debugPrint('[ConsentInterceptor] Already retried, aborting');
      final missing = ConsentGate.extractMissingDocuments(response);
      throw ConsentRequiredException(
        reason: 'Consent still required after retry',
        missingDocuments: missing,
      );
    }

    debugPrint('[ConsentInterceptor] Got CONSENT_REQUIRED, starting flow...');

    // Try consent flow
    final accepted = await ConsentGate.ensureAccepted();

    if (accepted) {
      // Retry the request
      debugPrint('[ConsentInterceptor] Retrying request after consent...');
      return executeWithConsent(executeRequest, retried: true);
    } else {
      // User refused consent
      debugPrint('[ConsentInterceptor] User refused consent');
      final missing = ConsentGate.extractMissingDocuments(response);
      throw ConsentRequiredException(
        reason: 'User declined consent',
        missingDocuments: missing,
      );
    }
  }
}

