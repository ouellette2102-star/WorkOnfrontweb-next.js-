/// Authentication state models for WorkOn.
///
/// Provides a centralized auth state representation that can be
/// observed by the app without coupling to UI.
///
/// **PR#7:** Initial implementation with AuthStatus enum and AuthState class.
library;

/// Represents the current authentication status.
///
/// Used by [AuthState] to indicate the user's authentication state.
enum AuthStatus {
  /// Initial state before auth check completes.
  ///
  /// The app should show a loading/splash screen while in this state.
  unknown,

  /// User is authenticated with a valid session.
  ///
  /// The app can show authenticated UI (home, profile, etc.).
  authenticated,

  /// User is not authenticated or session is invalid.
  ///
  /// The app should show login/onboarding UI.
  unauthenticated,
}

/// Represents the complete authentication state.
///
/// Immutable class containing the current [status] and optional
/// user information ([userId], [email]).
///
/// ## Usage
///
/// ```dart
/// // Listen to auth state changes
/// AuthService.stateListenable.addListener(() {
///   final state = AuthService.state;
///   if (state.status == AuthStatus.authenticated) {
///     print('User logged in: ${state.email}');
///   }
/// });
/// ```
class AuthState {
  /// Creates an [AuthState] with the given values.
  const AuthState({
    required this.status,
    this.userId,
    this.email,
  });

  /// Creates an unknown auth state.
  ///
  /// Used as the initial state before auth check completes.
  const AuthState.unknown()
      : status = AuthStatus.unknown,
        userId = null,
        email = null;

  /// Creates an authenticated state with optional user info.
  ///
  /// Example:
  /// ```dart
  /// AuthState.authenticated(userId: 'usr_123', email: 'user@example.com')
  /// ```
  const AuthState.authenticated({
    this.userId,
    this.email,
  }) : status = AuthStatus.authenticated;

  /// Creates an unauthenticated state.
  ///
  /// Used when user is not logged in or session is invalid.
  const AuthState.unauthenticated()
      : status = AuthStatus.unauthenticated,
        userId = null,
        email = null;

  /// The current authentication status.
  final AuthStatus status;

  /// The authenticated user's ID, or null if not authenticated.
  final String? userId;

  /// The authenticated user's email, or null if not authenticated.
  final String? email;

  /// Returns `true` if the user is authenticated.
  bool get isAuthenticated => status == AuthStatus.authenticated;

  /// Returns `true` if the user is not authenticated.
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;

  /// Returns `true` if the auth state is unknown (initial/loading).
  bool get isUnknown => status == AuthStatus.unknown;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AuthState &&
        other.status == status &&
        other.userId == userId &&
        other.email == email;
  }

  @override
  int get hashCode => Object.hash(status, userId, email);

  @override
  String toString() =>
      'AuthState(status: $status, userId: $userId, email: $email)';

  /// Creates a copy with updated values.
  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? email,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
    );
  }
}

