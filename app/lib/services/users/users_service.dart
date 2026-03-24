/// Users service for WorkOn.
///
/// Provides user lookup functionality for deep links and profiles.
///
/// **PR-21:** Deep links support - user lookup by ID.
library;

import 'dart:convert';

import 'package:flutter/foundation.dart';

import '/services/api/api_client.dart';
import '/services/auth/auth_service.dart';
import '/services/auth/auth_errors.dart';
import '/services/auth/token_storage.dart';

/// Basic user info for deep link resolution.
class UserInfo {
  final String id;
  final String? displayName;
  final String? email;
  final String? photoUrl;
  final String? userType; // 'client', 'provider', etc.

  const UserInfo({
    required this.id,
    this.displayName,
    this.email,
    this.photoUrl,
    this.userType,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      displayName: json['displayName']?.toString() ??
          json['name']?.toString() ??
          '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
      email: json['email']?.toString(),
      photoUrl: json['photoUrl']?.toString() ??
          json['profileImage']?.toString() ??
          json['avatar']?.toString(),
      userType: json['userType']?.toString() ?? json['role']?.toString(),
    );
  }

  bool get isProvider => userType?.toLowerCase() == 'provider';
  bool get isClient => userType?.toLowerCase() == 'client';
}

/// Service for user-related operations.
///
/// ## Usage
///
/// ```dart
/// // Get user by ID
/// final user = await UsersService.getUserById('user123');
/// if (user != null) {
///   print('Found user: ${user.displayName}');
/// }
/// ```
abstract final class UsersService {
  /// Gets a user by ID.
  ///
  /// Returns [UserInfo] on success, null if not found.
  ///
  /// Throws on network errors.
  static Future<UserInfo?> getUserById(String userId) async {
    if (userId.isEmpty) {
      debugPrint('[UsersService] Empty userId provided');
      return null;
    }

    debugPrint('[UsersService] Getting user: $userId');

    try {
      // Build request
      final uri = ApiClient.buildUri('/users-local/$userId');
      final headers = <String, String>{
        ...ApiClient.defaultHeaders,
      };

      // FIX-TOKEN-SYNC: Use TokenStorage directly
      final token = TokenStorage.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[UsersService] Response status: ${response.statusCode}');

      if (response.statusCode == 404) {
        debugPrint('[UsersService] User not found: $userId');
        return null;
      }

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode >= 400) {
        debugPrint('[UsersService] Error response: ${response.body}');
        return null;
      }

      // Parse response
      final json = jsonDecode(response.body);
      final data = json is Map<String, dynamic>
          ? (json['data'] ?? json)
          : json;

      if (data is Map<String, dynamic>) {
        final user = UserInfo.fromJson(data);
        debugPrint('[UsersService] Found user: ${user.displayName}');
        return user;
      }

      return null;
    } catch (e) {
      if (e is UnauthorizedException) rethrow;
      debugPrint('[UsersService] Error getting user: $e');
      rethrow;
    }
  }

  /// Checks if a user exists.
  ///
  /// Returns true if the user exists, false otherwise.
  static Future<bool> userExists(String userId) async {
    try {
      final user = await getUserById(userId);
      return user != null;
    } catch (_) {
      return false;
    }
  }
}

