/// Real authentication repository for WorkOn.
///
/// Implements [AuthRepository] with actual HTTP calls to the WorkOn
/// backend hosted on Railway.
///
/// **PR#5:** Initial implementation with login/register/me/logout.
/// **PR#13:** Added debugPrint logging for error tracing.
/// **PR-F17:** Added refreshTokens for automatic token refresh.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import 'auth_errors.dart';
import 'auth_models.dart';
import 'auth_repository.dart';

/// Real implementation of [AuthRepository] using HTTP calls.
///
/// Connects to the WorkOn backend API for authentication operations.
///
/// ## Usage
///
/// ```dart
/// final repository = RealAuthRepository();
/// final session = await repository.login(
///   email: 'user@example.com',
///   password: 'password123',
/// );
/// ```
///
/// ## Error Handling
///
/// All methods throw typed [AuthException] subclasses:
/// - [InvalidCredentialsException]: 401 on login
/// - [EmailAlreadyInUseException]: 409 on register
/// - [UnauthorizedException]: 401 on me/logout
/// - [AuthNetworkException]: Network or server errors
class RealAuthRepository implements AuthRepository {
  /// Creates a [RealAuthRepository].
  ///
  /// Uses the shared [ApiClient] for HTTP configuration.
  RealAuthRepository();

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication Endpoints
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final uri = ApiClient.buildUri('/auth/login');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: ApiClient.defaultHeaders,
            body: jsonEncode({
              'email': email,
              'password': password,
            }),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] login response: ${response.statusCode}');
      return _handleAuthResponse(response, 'login');
    } on TimeoutException {
      debugPrint('[RealAuthRepository] login timeout');
      throw const AuthNetworkException('Connection timeout');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] login network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] login unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<AuthSession> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final uri = ApiClient.buildUri('/auth/register');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      
      // Build request body matching backend CreateUserDto
      // Backend expects: email, password, firstName?, lastName?, role?
      // NOTE: 'name' is NOT a valid field - use firstName/lastName
      final Map<String, dynamic> requestBody = {
        'email': email,
        'password': password,
        // Default role for new users (can be changed in profile later)
        'role': 'worker',
      };
      
      // If name provided, split into firstName/lastName
      if (name != null && name.isNotEmpty) {
        final parts = name.trim().split(' ');
        requestBody['firstName'] = parts.first;
        if (parts.length > 1) {
          requestBody['lastName'] = parts.sublist(1).join(' ');
        }
      }
      
      final response = await ApiClient.client
          .post(
            uri,
            headers: ApiClient.defaultHeaders,
            body: jsonEncode(requestBody),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] register response: ${response.statusCode}');
      return _handleAuthResponse(response, 'register');
    } on TimeoutException {
      debugPrint('[RealAuthRepository] register timeout');
      throw const AuthNetworkException('Connection timeout');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] register network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] register unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<AuthUser> me({required String accessToken}) async {
    final uri = ApiClient.buildUri('/auth/me');

    try {
      debugPrint('[RealAuthRepository] GET $uri');
      final response = await ApiClient.client
          .get(
            uri,
            headers: {
              ...ApiClient.defaultHeaders,
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] me response: ${response.statusCode}');

      if (response.statusCode == 401) {
        debugPrint('[RealAuthRepository] me: unauthorized');
        throw const UnauthorizedException();
      }

      if (response.statusCode == 403) {
        debugPrint('[RealAuthRepository] me: forbidden');
        throw const UnauthorizedException();
      }

      if (response.statusCode >= 500) {
        debugPrint('[RealAuthRepository] me: server error ${response.statusCode}');
        throw const AuthNetworkException('Server error');
      }

      if (response.statusCode != 200) {
        debugPrint('[RealAuthRepository] me: unexpected status ${response.statusCode}');
        throw const AuthNetworkException();
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;

      // Handle both wrapped and unwrapped responses
      final userData = json['user'] ?? json['data'] ?? json;
      return AuthUser.fromJson(userData as Map<String, dynamic>);
    } on TimeoutException {
      debugPrint('[RealAuthRepository] me timeout');
      throw const AuthNetworkException('Connection timeout');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] me network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] me unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<void> logout({String? accessToken}) async {
    // If no token, nothing to invalidate on server
    if (accessToken == null) {
      debugPrint('[RealAuthRepository] logout: no token, skipping server call');
      return;
    }

    final uri = ApiClient.buildUri('/auth/logout');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: {
              ...ApiClient.defaultHeaders,
              'Authorization': 'Bearer $accessToken',
            },
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] logout response: ${response.statusCode}');
      // Fire-and-forget: we don't care about the response
      // Local session cleanup is handled by AuthService
    } catch (e) {
      // Ignore all errors - logout should always succeed locally
      debugPrint('[RealAuthRepository] logout error (ignored): $e');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F14: Password Reset Endpoints
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Future<void> forgotPassword({required String email}) async {
    final uri = ApiClient.buildUri('/auth/forgot-password');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: ApiClient.defaultHeaders,
            body: jsonEncode({'email': email.trim()}),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] forgotPassword response: ${response.statusCode}');

      switch (response.statusCode) {
        case 200:
        case 201:
        case 204:
          // Success - email sent
          return;

        case 400:
          final message = _extractErrorMessage(response.body);
          throw AuthException(message ?? 'Adresse email invalide');

        case 404:
          throw const AuthException('Aucun compte associé à cet email');

        case 429:
          throw const AuthException('Trop de tentatives. Réessaie plus tard.');

        default:
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] forgotPassword timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] forgotPassword network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] forgotPassword unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    final uri = ApiClient.buildUri('/auth/reset-password');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      // PR-F2: Backend expects {token, newPassword} where token is the JWT from email
      // The 'code' parameter IS the token received via forgot-password email
      final response = await ApiClient.client
          .post(
            uri,
            headers: ApiClient.defaultHeaders,
            body: jsonEncode({
              'token': code.trim(),
              'newPassword': newPassword,
            }),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] resetPassword response: ${response.statusCode}');

      switch (response.statusCode) {
        case 200:
        case 201:
        case 204:
          // Success - password reset
          return;

        case 400:
          final message = _extractErrorMessage(response.body);
          throw AuthException(message ?? 'Code invalide ou expiré');

        case 401:
          throw const AuthException('Code invalide ou expiré');

        case 422:
          final message = _extractErrorMessage(response.body);
          throw AuthException(message ?? 'Mot de passe invalide');

        case 429:
          throw const AuthException('Trop de tentatives. Réessaie plus tard.');

        default:
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] resetPassword timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] resetPassword network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] resetPassword unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Response Handling
  // ─────────────────────────────────────────────────────────────────────────

  /// Handles authentication responses (login/register).
  ///
  /// Parses the response body and returns an [AuthSession].
  /// Throws typed exceptions based on status code.
  AuthSession _handleAuthResponse(http.Response response, String operation) {
    switch (response.statusCode) {
      case 200:
      case 201:
        return _parseAuthSession(response.body);

      case 400:
        // Bad request - validation error
        final message = _extractErrorMessage(response.body);
        throw AuthException(message ?? 'Invalid request');

      case 401:
        // Unauthorized - invalid credentials
        throw const InvalidCredentialsException();

      case 409:
        // Conflict - email already in use (register only)
        throw const EmailAlreadyInUseException();

      case 422:
        // Unprocessable entity - validation error
        final message = _extractErrorMessage(response.body);
        throw AuthException(message ?? 'Validation failed');

      case 429:
        // Too many requests
        throw const AuthException('Too many attempts. Please try again later');

      case 500:
      case 502:
      case 503:
      case 504:
        // Server error
        throw const AuthNetworkException();

      default:
        throw const AuthNetworkException();
    }
  }

  /// Parses the response body into an [AuthSession].
  ///
  /// Handles various backend response formats:
  /// - `{ user: {...}, tokens: {...} }`
  /// - `{ user: {...}, access_token: "...", refresh_token: "..." }`
  /// - `{ data: { user: {...}, tokens: {...} } }`
  AuthSession _parseAuthSession(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;

      // Try standard format first
      if (json.containsKey('user') && json.containsKey('tokens')) {
        return AuthSession.fromJson(json);
      }

      // Try wrapped format
      if (json.containsKey('data')) {
        final data = json['data'] as Map<String, dynamic>;
        return AuthSession.fromJson(data);
      }

      // Try flat token format (snake_case)
      if (json.containsKey('user') && json.containsKey('access_token')) {
        return AuthSession(
          user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
          tokens: AuthTokens(
            accessToken: json['access_token'] as String,
            refreshToken: json['refresh_token'] as String? ?? '',
            expiresAt: json['expires_at'] != null
                ? DateTime.parse(json['expires_at'] as String)
                : null,
          ),
        );
      }

      // Try flat token format (camelCase - NestJS backend format)
      if (json.containsKey('user') && json.containsKey('accessToken')) {
        return AuthSession(
          user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
          tokens: AuthTokens(
            accessToken: json['accessToken'] as String,
            refreshToken: json['refreshToken'] as String? ?? '',
            expiresAt: json['expiresAt'] != null
                ? DateTime.parse(json['expiresAt'] as String)
                : null,
          ),
        );
      }

      // Fallback: try to parse as AuthSession directly
      return AuthSession.fromJson(json);
    } catch (e) {
      throw const AuthException('Failed to parse authentication response');
    }
  }

  /// Extracts error message from response body.
  String? _extractErrorMessage(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['message'] as String? ??
          json['error'] as String? ??
          json['errors']?.toString();
    } catch (_) {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F17: Token Refresh
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Future<AuthTokens> refreshTokens({required String refreshToken}) async {
    final uri = ApiClient.buildUri('/auth/refresh');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: ApiClient.defaultHeaders,
            body: jsonEncode({'refreshToken': refreshToken}),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] refreshTokens response: ${response.statusCode}');

      switch (response.statusCode) {
        case 200:
        case 201:
          return _parseTokensResponse(response.body);

        case 401:
        case 403:
          debugPrint('[RealAuthRepository] refreshTokens: invalid/expired refresh token');
          throw const UnauthorizedException();

        default:
          if (response.statusCode >= 500) {
            throw const AuthNetworkException('Erreur serveur');
          }
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] refreshTokens timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] refreshTokens network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] refreshTokens unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  /// Parses token refresh response.
  AuthTokens _parseTokensResponse(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;

      // Try standard format: { tokens: {...} }
      if (json.containsKey('tokens')) {
        final tokens = json['tokens'] as Map<String, dynamic>;
        return AuthTokens.fromJson(tokens);
      }

      // Try flat format: { accessToken, refreshToken, expiresAt }
      if (json.containsKey('accessToken') || json.containsKey('access_token')) {
        return AuthTokens(
          accessToken: (json['accessToken'] ?? json['access_token']) as String,
          refreshToken: (json['refreshToken'] ?? json['refresh_token'] ?? '') as String,
          expiresAt: json['expiresAt'] != null
              ? DateTime.parse(json['expiresAt'] as String)
              : json['expires_at'] != null
                  ? DateTime.parse(json['expires_at'] as String)
                  : null,
        );
      }

      // Try wrapped format: { data: { tokens: {...} } }
      if (json.containsKey('data')) {
        final data = json['data'] as Map<String, dynamic>;
        if (data.containsKey('tokens')) {
          return AuthTokens.fromJson(data['tokens'] as Map<String, dynamic>);
        }
        // Try flat in data
        return AuthTokens(
          accessToken: (data['accessToken'] ?? data['access_token']) as String,
          refreshToken: (data['refreshToken'] ?? data['refresh_token'] ?? '') as String,
          expiresAt: data['expiresAt'] != null
              ? DateTime.parse(data['expiresAt'] as String)
              : null,
        );
      }

      throw const AuthException('Invalid token response format');
    } catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] Failed to parse token response: $e');
      throw const AuthException('Échec du rafraîchissement du token');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F2: Email Change & Account Deletion
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Future<void> requestEmailChange({required String newEmail}) async {
    final uri = ApiClient.buildUri('/auth/change-email');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.authenticatedPost(
        uri,
        body: {'newEmail': newEmail.trim()},
      );

      debugPrint('[RealAuthRepository] requestEmailChange response: ${response.statusCode}');
      debugPrint('[RealAuthRepository] requestEmailChange body: ${response.body}');

      switch (response.statusCode) {
        case 200:
        case 201:
          // Success - OTP sent
          return;

        case 400:
          final json = _tryParseJson(response.body);
          final errorCode = json?['errorCode'] as String?;
          final message = json?['message'] as String? ?? 'Requête invalide';
          
          if (errorCode == 'RATE_LIMITED') {
            throw const AuthException('Veuillez patienter avant de réessayer.');
          }
          if (errorCode == 'INVALID_EMAIL') {
            throw const AuthException('Format d\'email invalide.');
          }
          throw AuthException(message);

        case 401:
          throw const UnauthorizedException();

        case 429:
          throw const AuthException('Trop de tentatives. Réessayez plus tard.');

        default:
          if (response.statusCode >= 500) {
            throw const AuthNetworkException('Erreur serveur');
          }
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] requestEmailChange timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] requestEmailChange network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] requestEmailChange unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<void> verifyEmailOtp({
    required String newEmail,
    required String code,
  }) async {
    final uri = ApiClient.buildUri('/auth/verify-email-otp');

    try {
      debugPrint('[RealAuthRepository] POST $uri');
      final response = await ApiClient.authenticatedPost(
        uri,
        body: {
          'newEmail': newEmail.trim(),
          'code': code.trim(),
        },
      );

      debugPrint('[RealAuthRepository] verifyEmailOtp response: ${response.statusCode}');
      debugPrint('[RealAuthRepository] verifyEmailOtp body: ${response.body}');

      switch (response.statusCode) {
        case 200:
        case 201:
          // Success - email updated
          return;

        case 400:
          final json = _tryParseJson(response.body);
          final errorCode = json?['errorCode'] as String?;
          final message = json?['message'] as String?;

          switch (errorCode) {
            case 'OTP_INVALID':
              throw const AuthException('Code incorrect. Vérifiez et réessayez.');
            case 'OTP_EXPIRED':
              throw const AuthException('Code expiré. Demandez un nouveau code.');
            case 'OTP_LOCKED':
              throw const AuthException('Trop de tentatives. Demandez un nouveau code.');
            case 'OTP_NOT_FOUND':
              throw const AuthException('Aucune demande de changement trouvée. Recommencez.');
            case 'EMAIL_IN_USE':
              throw const AuthException('Cette adresse email est déjà utilisée.');
            default:
              throw AuthException(message ?? 'Code invalide');
          }

        case 401:
          throw const UnauthorizedException();

        case 429:
          throw const AuthException('Trop de tentatives. Réessayez plus tard.');

        default:
          if (response.statusCode >= 500) {
            throw const AuthNetworkException('Erreur serveur');
          }
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] verifyEmailOtp timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] verifyEmailOtp network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] verifyEmailOtp unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  @override
  Future<void> deleteAccount() async {
    final uri = ApiClient.buildUri('/auth/account');

    try {
      debugPrint('[RealAuthRepository] DELETE $uri');
      
      // Use authenticatedDelete with body
      final response = await ApiClient.client
          .delete(
            uri,
            headers: ApiClient.authHeaders,
            body: jsonEncode({'confirm': 'DELETE'}),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[RealAuthRepository] deleteAccount response: ${response.statusCode}');
      debugPrint('[RealAuthRepository] deleteAccount body: ${response.body}');

      switch (response.statusCode) {
        case 200:
        case 204:
          // Success - account deleted
          return;

        case 400:
          final json = _tryParseJson(response.body);
          final errorCode = json?['errorCode'] as String?;
          final message = json?['message'] as String?;

          if (errorCode == 'CONFIRM_REQUIRED') {
            throw const AuthException('Confirmation requise.');
          }
          throw AuthException(message ?? 'Échec de la suppression');

        case 401:
          throw const UnauthorizedException();

        case 404:
          throw const AuthException('Compte introuvable.');

        default:
          if (response.statusCode >= 500) {
            throw const AuthNetworkException('Erreur serveur');
          }
          throw const AuthNetworkException();
      }
    } on TimeoutException {
      debugPrint('[RealAuthRepository] deleteAccount timeout');
      throw const AuthNetworkException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[RealAuthRepository] deleteAccount network error: $e');
      throw const AuthNetworkException();
    } on Exception catch (e) {
      if (e is AuthException) rethrow;
      debugPrint('[RealAuthRepository] deleteAccount unexpected error: $e');
      throw const AuthNetworkException();
    }
  }

  /// Tries to parse JSON, returns null on failure.
  Map<String, dynamic>? _tryParseJson(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}

