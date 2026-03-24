/// Authentication models for WorkOn.
///
/// Minimal, clean data structures used by [AuthService].
/// Includes JSON serialization for future backend integration.
library;

/// Represents an authenticated user.
class AuthUser {
  /// Creates an [AuthUser] instance.
  const AuthUser({
    required this.id,
    required this.email,
    this.name,
  });

  /// Creates an [AuthUser] from a JSON map.
  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
    );
  }

  /// Unique user identifier.
  final String id;

  /// User's email address.
  final String email;

  /// User's display name (optional).
  final String? name;

  /// Converts this user to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      if (name != null) 'name': name,
    };
  }

  @override
  String toString() => 'AuthUser(id: $id, email: $email, name: $name)';
}

/// Represents authentication tokens.
class AuthTokens {
  /// Creates an [AuthTokens] instance.
  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    this.expiresAt,
  });

  /// Creates [AuthTokens] from a JSON map.
  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
    );
  }

  /// JWT access token for API requests.
  final String accessToken;

  /// Refresh token for obtaining new access tokens.
  final String refreshToken;

  /// Expiration time of the access token.
  final DateTime? expiresAt;

  /// Returns `true` if the access token has expired.
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  /// Converts these tokens to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'refresh_token': refreshToken,
      if (expiresAt != null) 'expires_at': expiresAt!.toIso8601String(),
    };
  }

  @override
  String toString() =>
      'AuthTokens(accessToken: ${accessToken.substring(0, 10)}..., '
      'refreshToken: ${refreshToken.substring(0, 10)}..., '
      'expiresAt: $expiresAt)';
}

/// Represents a complete authentication session.
class AuthSession {
  /// Creates an [AuthSession] instance.
  const AuthSession({
    required this.user,
    required this.tokens,
  });

  /// Creates an [AuthSession] from a JSON map.
  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
    );
  }

  /// The authenticated user.
  final AuthUser user;

  /// The authentication tokens.
  final AuthTokens tokens;

  /// Converts this session to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'tokens': tokens.toJson(),
    };
  }

  @override
  String toString() => 'AuthSession(user: $user, tokens: $tokens)';
}

