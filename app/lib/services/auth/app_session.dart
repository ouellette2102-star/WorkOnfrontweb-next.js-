/// App session model for WorkOn.
///
/// Provides a minimal session access layer for checking if an
/// authenticated session exists and accessing the token.
///
/// **PR#11:** Initial implementation with hasSession and optional token.
library;

/// Represents the current app session state.
///
/// Immutable class containing session presence and optional access token.
///
/// ## Usage
///
/// ```dart
/// // Check if session exists
/// if (AuthService.hasSession) {
///   print('User is logged in');
/// }
///
/// // Access token if available
/// final token = AuthService.session.token;
/// if (token != null) {
///   // Use token for API calls
/// }
/// ```
class AppSession {
  /// Creates an [AppSession] with the given values.
  const AppSession({
    required this.hasSession,
    this.token,
  });

  /// Creates an empty session (no authenticated user).
  ///
  /// Used as the initial state before authentication.
  const AppSession.none()
      : hasSession = false,
        token = null;

  /// Creates a session from an access token.
  ///
  /// Example:
  /// ```dart
  /// AppSession.fromToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  /// ```
  const AppSession.fromToken(this.token) : hasSession = true;

  /// Creates an authenticated session without a token.
  ///
  /// Used when authentication succeeds but token is not available
  /// (e.g., some mock flows).
  const AppSession.authenticated()
      : hasSession = true,
        token = null;

  /// Whether an authenticated session exists.
  final bool hasSession;

  /// The access token, or null if not available.
  ///
  /// Note: Token may be null even when [hasSession] is true
  /// (e.g., in mock environments).
  final String? token;

  /// Returns `true` if no session exists.
  bool get isEmpty => !hasSession;

  /// Returns `true` if a session exists with a token.
  bool get hasToken => hasSession && token != null;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AppSession &&
        other.hasSession == hasSession &&
        other.token == token;
  }

  @override
  int get hashCode => Object.hash(hasSession, token);

  @override
  String toString() =>
      'AppSession(hasSession: $hasSession, token: ${token != null ? "[REDACTED]" : "null"})';

  /// Creates a copy with updated values.
  AppSession copyWith({
    bool? hasSession,
    String? token,
  }) {
    return AppSession(
      hasSession: hasSession ?? this.hasSession,
      token: token ?? this.token,
    );
  }
}

