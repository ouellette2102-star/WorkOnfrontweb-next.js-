/// App boot state models for WorkOn.
///
/// Provides a single source of truth for app startup status,
/// independent of the underlying auth implementation.
///
/// **PR#8:** Initial implementation with AppBootStatus enum and AppBootState class.
/// **PR-STATE:** Added networkError status for graceful degradation.
library;

/// Represents the app boot/startup status.
///
/// Used by [AppBootState] to indicate where the app is in its
/// initialization process.
enum AppBootStatus {
  /// App is initializing (checking session, loading config, etc.).
  ///
  /// The app should show a splash/loading screen.
  loading,

  /// User is authenticated and ready to use the app.
  ///
  /// The app can navigate to the main/home screen.
  authenticated,

  /// User is not authenticated or session is invalid.
  ///
  /// The app should show login/onboarding UI.
  unauthenticated,

  /// Network error during bootstrap. Tokens preserved.
  ///
  /// PR-STATE: App should proceed to home (if tokens exist) and show network banner.
  /// User can retry when network is available.
  networkError,
}

/// Represents the complete app boot state.
///
/// Immutable class containing the current [status] and optional
/// user information ([userId], [email]).
///
/// ## Usage
///
/// ```dart
/// // Listen to boot state changes
/// appStartupController.bootStateListenable.addListener(() {
///   final state = appStartupController.bootState;
///   switch (state.status) {
///     case AppBootStatus.loading:
///       // Show splash screen
///       break;
///     case AppBootStatus.authenticated:
///       // Navigate to home
///       break;
///     case AppBootStatus.unauthenticated:
///       // Navigate to login
///       break;
///   }
/// });
/// ```
class AppBootState {
  /// Creates an [AppBootState] with the given values.
  const AppBootState({
    required this.status,
    this.userId,
    this.email,
  });

  /// Creates a loading boot state.
  ///
  /// Used during app initialization while checking session.
  const AppBootState.loading()
      : status = AppBootStatus.loading,
        userId = null,
        email = null;

  /// Creates an authenticated boot state.
  ///
  /// Both [userId] and [email] are required to properly identify the user.
  ///
  /// Example:
  /// ```dart
  /// AppBootState.authenticated(userId: 'usr_123', email: 'user@example.com')
  /// ```
  const AppBootState.authenticated({
    required this.userId,
    required this.email,
  }) : status = AppBootStatus.authenticated;

  /// Creates an unauthenticated boot state.
  ///
  /// Used when no valid session exists.
  const AppBootState.unauthenticated()
      : status = AppBootStatus.unauthenticated,
        userId = null,
        email = null;

  /// Creates a network error boot state.
  ///
  /// PR-STATE: Used when bootstrap failed due to network issues.
  /// Tokens are preserved; user may still have a valid session.
  const AppBootState.networkError()
      : status = AppBootStatus.networkError,
        userId = null,
        email = null;

  /// The current boot status.
  final AppBootStatus status;

  /// The authenticated user's ID, or null if not authenticated.
  final String? userId;

  /// The authenticated user's email, or null if not authenticated.
  final String? email;

  /// Returns `true` if the app is still loading.
  bool get isLoading => status == AppBootStatus.loading;

  /// Returns `true` if the user is authenticated.
  bool get isAuthenticated => status == AppBootStatus.authenticated;

  /// Returns `true` if the user is not authenticated.
  bool get isUnauthenticated => status == AppBootStatus.unauthenticated;

  /// Returns `true` if bootstrap failed due to network error.
  bool get isNetworkError => status == AppBootStatus.networkError;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AppBootState &&
        other.status == status &&
        other.userId == userId &&
        other.email == email;
  }

  @override
  int get hashCode => Object.hash(status, userId, email);

  @override
  String toString() =>
      'AppBootState(status: $status, userId: $userId, email: $email)';

  /// Creates a copy with updated values.
  AppBootState copyWith({
    AppBootStatus? status,
    String? userId,
    String? email,
  }) {
    return AppBootState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
    );
  }
}

