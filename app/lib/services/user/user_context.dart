/// User context models for WorkOn.
///
/// Provides centralized user context including role resolution.
///
/// **PR#10:** Initial implementation with UserRole enum and UserContext class.
library;

/// Represents the user's role in the WorkOn platform.
///
/// Each role has different capabilities and UI flows:
/// - [worker]: Service provider offering services
/// - [employer]: Business/company hiring workers
/// - [residential]: Individual/homeowner seeking services
enum UserRole {
  /// Service provider role.
  worker,

  /// Business/company role.
  employer,

  /// Individual/homeowner role.
  residential,
}

/// Represents the user context status.
///
/// Indicates the current state of user context resolution.
enum UserContextStatus {
  /// Initial state before user context is resolved.
  unknown,

  /// User context is being loaded/resolved.
  loading,

  /// User context is ready and available.
  ready,
}

/// Represents the complete user context.
///
/// Immutable class containing user identity and role information.
///
/// ## Usage
///
/// ```dart
/// // Access current user context
/// final context = UserService.context;
/// if (context.status == UserContextStatus.ready) {
///   print('User: ${context.email}, Role: ${context.role}');
/// }
/// ```
class UserContext {
  /// Creates a [UserContext] with the given values.
  const UserContext({
    required this.status,
    this.userId,
    this.email,
    this.role = UserRole.worker,
  });

  /// Creates an unknown user context.
  ///
  /// Used as the initial state before authentication.
  const UserContext.unknown()
      : status = UserContextStatus.unknown,
        userId = null,
        email = null,
        role = UserRole.worker;

  /// Creates a loading user context.
  ///
  /// Used while resolving user role.
  const UserContext.loading()
      : status = UserContextStatus.loading,
        userId = null,
        email = null,
        role = UserRole.worker;

  /// Creates a ready user context from authentication data.
  ///
  /// Example:
  /// ```dart
  /// UserContext.fromAuth(
  ///   userId: 'usr_123',
  ///   email: 'user@example.com',
  ///   role: UserRole.worker,
  /// )
  /// ```
  const UserContext.fromAuth({
    required this.userId,
    required this.email,
    this.role = UserRole.worker,
  }) : status = UserContextStatus.ready;

  /// The current status of the user context.
  final UserContextStatus status;

  /// The authenticated user's ID, or null if not authenticated.
  final String? userId;

  /// The authenticated user's email, or null if not authenticated.
  final String? email;

  /// The user's role in the platform.
  ///
  /// Defaults to [UserRole.worker] if not resolved.
  final UserRole role;

  /// Returns `true` if the user context is unknown.
  bool get isUnknown => status == UserContextStatus.unknown;

  /// Returns `true` if the user context is loading.
  bool get isLoading => status == UserContextStatus.loading;

  /// Returns `true` if the user context is ready.
  bool get isReady => status == UserContextStatus.ready;

  /// Returns `true` if the user is authenticated (ready status with userId).
  bool get isAuthenticated => status == UserContextStatus.ready && userId != null;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserContext &&
        other.status == status &&
        other.userId == userId &&
        other.email == email &&
        other.role == role;
  }

  @override
  int get hashCode => Object.hash(status, userId, email, role);

  @override
  String toString() =>
      'UserContext(status: $status, userId: $userId, email: $email, role: $role)';

  /// Creates a copy with updated values.
  UserContext copyWith({
    UserContextStatus? status,
    String? userId,
    String? email,
    UserRole? role,
  }) {
    return UserContext(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      role: role ?? this.role,
    );
  }
}

