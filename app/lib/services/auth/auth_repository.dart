/// Authentication repository abstraction for WorkOn.
///
/// Defines the contract for authentication operations, enabling
/// dependency injection for testing.
///
/// Production uses [RealAuthRepository] (see `real_auth_repository.dart`).
library;

import 'auth_errors.dart';
import 'auth_models.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Abstract Repository Interface
// ─────────────────────────────────────────────────────────────────────────────

/// Abstract interface for authentication operations.
///
/// Implementations must provide login, register, me, and logout functionality.
/// This abstraction allows swapping between mock and real implementations
/// without changing the AuthService consumer code.
abstract class AuthRepository {
  /// Authenticates a user with email and password.
  ///
  /// Returns an [AuthSession] containing user and tokens on success.
  ///
  /// Throws:
  /// - [InvalidCredentialsException] if credentials are incorrect.
  /// - [AuthNetworkException] if connection fails.
  Future<AuthSession> login({
    required String email,
    required String password,
  });

  /// Registers a new user account.
  ///
  /// Returns an [AuthSession] containing user and tokens on success.
  ///
  /// Throws:
  /// - [EmailAlreadyInUseException] if email is already registered.
  /// - [AuthNetworkException] if connection fails.
  Future<AuthSession> register({
    required String email,
    required String password,
    String? name,
  });

  /// Fetches the current user's profile using an access token.
  ///
  /// Returns the [AuthUser] associated with the token.
  ///
  /// Throws:
  /// - [UnauthorizedException] if the token is invalid or expired.
  Future<AuthUser> me({required String accessToken});

  /// Logs out the current user.
  ///
  /// This should invalidate the session on the server if applicable.
  /// Local session cleanup is handled by AuthService.
  Future<void> logout({String? accessToken});

  /// PR-F14: Requests a password reset email/code.
  ///
  /// Sends a verification code to the user's email address.
  ///
  /// Throws:
  /// - [AuthException] if email is not found or invalid.
  /// - [AuthNetworkException] if connection fails.
  Future<void> forgotPassword({required String email});

  /// PR-F14: Resets the user's password using a verification code.
  ///
  /// Verifies the code and sets a new password.
  ///
  /// Throws:
  /// - [AuthException] if code is invalid or expired.
  /// - [AuthNetworkException] if connection fails.
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  });

  /// PR-F17: Refreshes the access token using a refresh token.
  ///
  /// Returns new [AuthTokens] with fresh access and refresh tokens.
  ///
  /// Throws:
  /// - [UnauthorizedException] if refresh token is invalid or expired.
  /// - [AuthNetworkException] if connection fails.
  Future<AuthTokens> refreshTokens({required String refreshToken});

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F2: Email Change & Account Deletion
  // ─────────────────────────────────────────────────────────────────────────

  /// Requests email change by sending OTP to the new email address.
  ///
  /// Throws:
  /// - [AuthException] if email is invalid or rate limited.
  /// - [AuthNetworkException] if connection fails.
  Future<void> requestEmailChange({required String newEmail});

  /// Verifies the OTP code and updates the user's email.
  ///
  /// Throws:
  /// - [AuthException] with errorCode: OTP_INVALID, OTP_EXPIRED, OTP_LOCKED, EMAIL_IN_USE
  /// - [AuthNetworkException] if connection fails.
  Future<void> verifyEmailOtp({
    required String newEmail,
    required String code,
  });

  /// Permanently deletes the user's account (GDPR-compliant).
  ///
  /// Throws:
  /// - [AuthException] if confirmation is missing.
  /// - [AuthNetworkException] if connection fails.
  Future<void> deleteAccount();
}
