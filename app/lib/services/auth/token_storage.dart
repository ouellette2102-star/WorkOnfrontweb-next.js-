/// Token storage service for WorkOn.
///
/// Persists authentication tokens using [FlutterSecureStorage] (encrypted
/// Keychain on iOS, EncryptedSharedPreferences on Android).
///
/// Migration path: on first init, tokens are migrated transparently from
/// the old [SharedPreferences] store so existing sessions are preserved.
library;

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Service for persisting authentication tokens securely.
///
/// ## Usage
///
/// ```dart
/// // Initialize at app startup
/// await TokenStorage.initialize();
///
/// // Save token after login
/// await TokenStorage.setToken('jwt_token_here');
///
/// // Retrieve token (sync, from in-memory cache)
/// final token = TokenStorage.getToken();
///
/// // Clear on logout
/// await TokenStorage.clearToken();
/// ```
abstract final class TokenStorage {
  // ─────────────────────────────────────────────────────────────────────────
  // Storage Keys
  // ─────────────────────────────────────────────────────────────────────────

  static const String _accessTokenKey = 'workon_access_token';
  static const String _refreshTokenKey = 'workon_refresh_token';
  static const String _tokenExpiryKey = 'workon_token_expiry';

  // ─────────────────────────────────────────────────────────────────────────
  // Secure Storage instance
  // ─────────────────────────────────────────────────────────────────────────

  static const _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // ─────────────────────────────────────────────────────────────────────────
  // In-Memory Cache
  // ─────────────────────────────────────────────────────────────────────────

  static String? _cachedAccessToken;
  static String? _cachedRefreshToken;
  static DateTime? _cachedExpiry;
  static bool _initialized = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  /// Initializes the token storage.
  ///
  /// Must be called once at app startup (in main.dart before runApp).
  /// Migrates existing tokens from SharedPreferences if present.
  ///
  /// Returns `true` if a valid access token was found.
  static Future<bool> initialize() async {
    if (_initialized) {
      debugPrint('[TokenStorage] Already initialized');
      return _cachedAccessToken != null;
    }

    try {
      // 1. Try reading from secure storage first
      _cachedAccessToken = await _secure.read(key: _accessTokenKey);
      _cachedRefreshToken = await _secure.read(key: _refreshTokenKey);
      final expiryStr = await _secure.read(key: _tokenExpiryKey);
      if (expiryStr != null) {
        final ms = int.tryParse(expiryStr);
        if (ms != null) _cachedExpiry = DateTime.fromMillisecondsSinceEpoch(ms);
      }

      // 2. If not found in secure storage, migrate from SharedPreferences
      if (_cachedAccessToken == null || _cachedAccessToken!.isEmpty) {
        await _migrateFromSharedPreferences();
      }

      _initialized = true;
      final hasToken = _cachedAccessToken != null && _cachedAccessToken!.isNotEmpty;
      debugPrint('[TokenStorage] Initialized, has token: $hasToken');
      return hasToken;
    } catch (e) {
      debugPrint('[TokenStorage] Init error: $e');
      _initialized = true;
      return false;
    }
  }

  /// Migrates tokens from the legacy SharedPreferences store into secure storage.
  ///
  /// Runs once per device. After migration the SharedPreferences keys are removed.
  static Future<void> _migrateFromSharedPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final oldToken = prefs.getString(_accessTokenKey);
      if (oldToken == null || oldToken.isEmpty) return;

      debugPrint('[TokenStorage] Migrating tokens from SharedPreferences → SecureStorage');

      _cachedAccessToken = oldToken;
      _cachedRefreshToken = prefs.getString(_refreshTokenKey);
      final expiryMs = prefs.getInt(_tokenExpiryKey);
      if (expiryMs != null) {
        _cachedExpiry = DateTime.fromMillisecondsSinceEpoch(expiryMs);
      }

      // Persist to secure storage
      await _secure.write(key: _accessTokenKey, value: oldToken);
      if (_cachedRefreshToken != null) {
        await _secure.write(key: _refreshTokenKey, value: _cachedRefreshToken!);
      }
      if (expiryMs != null) {
        await _secure.write(key: _tokenExpiryKey, value: expiryMs.toString());
      }

      // Remove from SharedPreferences
      await prefs.remove(_accessTokenKey);
      await prefs.remove(_refreshTokenKey);
      await prefs.remove(_tokenExpiryKey);

      debugPrint('[TokenStorage] Migration complete');
    } catch (e) {
      debugPrint('[TokenStorage] Migration error (non-fatal): $e');
    }
  }

  /// Ensures storage is initialized before async writes.
  static Future<void> _ensureInitialized() async {
    if (!_initialized) await initialize();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Token Access (Sync — uses in-memory cache)
  // ─────────────────────────────────────────────────────────────────────────

  /// Returns the current access token, or null if not set.
  ///
  /// Synchronous — reads from the in-memory cache populated during [initialize].
  static String? getToken() => _cachedAccessToken;

  /// Returns the current refresh token, or null if not set.
  static String? getRefreshToken() => _cachedRefreshToken;

  /// Returns the token expiry time, or null if not set.
  static DateTime? getExpiry() => _cachedExpiry;

  /// Returns `true` if a token exists in cache.
  static bool get hasToken =>
      _cachedAccessToken != null && _cachedAccessToken!.isNotEmpty;

  /// Returns `true` if the token is expired.
  static bool get isExpired {
    if (_cachedExpiry == null) return false;
    return DateTime.now().isAfter(_cachedExpiry!);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Token Modification (Async — persists to secure storage)
  // ─────────────────────────────────────────────────────────────────────────

  /// Saves the access token to secure storage.
  static Future<void> setToken(String token) async {
    await _ensureInitialized();
    _cachedAccessToken = token;
    await _secure.write(key: _accessTokenKey, value: token);
    debugPrint('[TokenStorage] Token saved (secure)');
  }

  /// Saves the refresh token to secure storage.
  static Future<void> setRefreshToken(String token) async {
    await _ensureInitialized();
    _cachedRefreshToken = token;
    await _secure.write(key: _refreshTokenKey, value: token);
    debugPrint('[TokenStorage] Refresh token saved (secure)');
  }

  /// Saves the token expiry time.
  static Future<void> setExpiry(DateTime expiry) async {
    await _ensureInitialized();
    _cachedExpiry = expiry;
    await _secure.write(
      key: _tokenExpiryKey,
      value: expiry.millisecondsSinceEpoch.toString(),
    );
    debugPrint('[TokenStorage] Expiry saved: $expiry');
  }

  /// Saves all token data at once.
  ///
  /// Convenience method after login or token refresh.
  static Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
    DateTime? expiresAt,
  }) async {
    await _ensureInitialized();
    await setToken(accessToken);
    if (refreshToken != null) await setRefreshToken(refreshToken);
    if (expiresAt != null) await setExpiry(expiresAt);
  }

  /// Clears all stored tokens from cache and secure storage.
  ///
  /// Call on logout or when tokens are invalidated.
  static Future<void> clearToken() async {
    await _ensureInitialized();

    _cachedAccessToken = null;
    _cachedRefreshToken = null;
    _cachedExpiry = null;

    await _secure.delete(key: _accessTokenKey);
    await _secure.delete(key: _refreshTokenKey);
    await _secure.delete(key: _tokenExpiryKey);

    debugPrint('[TokenStorage] Tokens cleared (secure)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Debug
  // ─────────────────────────────────────────────────────────────────────────

  /// Returns debug info about current token state (never logs token values).
  static Map<String, dynamic> debugInfo() {
    return {
      'initialized': _initialized,
      'hasToken': hasToken,
      'isExpired': isExpired,
      'expiry': _cachedExpiry?.toIso8601String(),
    };
  }
}
