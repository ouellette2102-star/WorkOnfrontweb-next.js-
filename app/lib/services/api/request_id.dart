/// Request ID provider for WorkOn observability.
///
/// Generates and manages correlation IDs for API request tracing.
/// Uses a session-scoped ID that persists for the app's lifetime.
///
/// **PR-OBS:** Correlation ID implementation.
library;

import 'dart:math';

/// Provides request correlation IDs for API tracing.
///
/// Generates a single session-scoped ID at startup that is included
/// in all API requests via the `X-Request-Id` header.
///
/// ## Usage
///
/// ```dart
/// // Get the session ID for headers
/// final headers = {
///   'X-Request-Id': RequestId.sessionId,
/// };
/// ```
///
/// ## ID Format
///
/// Uses a lightweight pseudo-UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
/// Generated without external dependencies using Dart's built-in Random.
abstract final class RequestId {
  /// Header name for correlation ID.
  static const String headerName = 'X-Request-Id';

  /// Session-scoped correlation ID.
  ///
  /// Generated once at first access and reused for the entire app session.
  /// Format: pseudo-UUID v4 (32 hex chars with dashes).
  static final String sessionId = _generateUuid();

  /// Counter for per-request unique suffix (optional granularity).
  static int _requestCounter = 0;

  /// Generates a unique request ID combining session ID and counter.
  ///
  /// Use this if you need per-request uniqueness instead of per-session.
  /// Format: `{sessionId}:{counter}`
  static String generateRequestId() {
    _requestCounter++;
    return '$sessionId:$_requestCounter';
  }

  /// Resets the request counter (for testing only).
  static void resetCounter() {
    _requestCounter = 0;
  }

  /// Generates a pseudo-UUID v4 without external dependencies.
  ///
  /// Not cryptographically secure, but sufficient for correlation IDs.
  /// Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  static String _generateUuid() {
    final random = Random();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));

    // Set version (4) and variant (8, 9, a, or b)
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant

    // Convert to hex string with dashes
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-'
        '${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-'
        '${hex.substring(16, 20)}-'
        '${hex.substring(20, 32)}';
  }
}

