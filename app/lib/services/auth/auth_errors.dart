/// Authentication exceptions for WorkOn.
///
/// Typed exceptions for clear error handling in [AuthService].
/// Messages are kept generic to avoid exposing sensitive information.
library;

/// Base exception for all authentication errors.
class AuthException implements Exception {
  /// Creates an [AuthException] with an optional message.
  const AuthException([this.message = 'An authentication error occurred']);

  /// Error message describing what went wrong.
  final String message;

  @override
  String toString() => 'AuthException: $message';
}

/// Thrown when login credentials are invalid.
///
/// This covers both incorrect email and incorrect password cases.
/// The message is intentionally vague to prevent user enumeration.
class InvalidCredentialsException extends AuthException {
  /// Creates an [InvalidCredentialsException].
  const InvalidCredentialsException()
      : super('Invalid email or password');
}

/// Thrown when attempting to register with an existing email.
class EmailAlreadyInUseException extends AuthException {
  /// Creates an [EmailAlreadyInUseException].
  const EmailAlreadyInUseException()
      : super('This email is already registered');
}

/// Thrown when a request requires authentication but none is provided.
///
/// This typically means the access token is missing, invalid, or expired.
class UnauthorizedException extends AuthException {
  /// Creates an [UnauthorizedException].
  const UnauthorizedException()
      : super('Authentication required');
}

/// Thrown when the session has expired and refresh failed.
class SessionExpiredException extends AuthException {
  /// Creates a [SessionExpiredException].
  const SessionExpiredException()
      : super('Your session has expired. Please log in again');
}

/// Thrown when there is a network or server error during auth.
class AuthNetworkException extends AuthException {
  /// Creates an [AuthNetworkException] with optional message.
  const AuthNetworkException([String message = 'Unable to connect. Please check your connection'])
      : super(message);
}

