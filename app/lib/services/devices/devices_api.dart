/// Devices API client for WorkOn.
///
/// Handles device registration for push notifications (FCM).
///
/// **FL-DEVICES:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';

/// Exception thrown by [DevicesApi].
class DevicesApiException implements Exception {
  final String message;
  final int? statusCode;

  const DevicesApiException(this.message, [this.statusCode]);

  @override
  String toString() => 'DevicesApiException: $message';
}

/// Device platform types.
enum DevicePlatform {
  ios,
  android,
  web;

  String get value {
    switch (this) {
      case DevicePlatform.ios:
        return 'IOS';
      case DevicePlatform.android:
        return 'ANDROID';
      case DevicePlatform.web:
        return 'WEB';
    }
  }

  static DevicePlatform get current {
    if (kIsWeb) return DevicePlatform.web;
    if (Platform.isIOS) return DevicePlatform.ios;
    return DevicePlatform.android;
  }

  static DevicePlatform fromString(String value) {
    switch (value.toUpperCase()) {
      case 'IOS':
        return DevicePlatform.ios;
      case 'ANDROID':
        return DevicePlatform.android;
      case 'WEB':
        return DevicePlatform.web;
      default:
        return DevicePlatform.android;
    }
  }
}

/// A registered device.
class Device {
  const Device({
    required this.id,
    required this.userId,
    required this.fcmToken,
    required this.platform,
    this.deviceName,
    this.isActive = true,
    this.lastUsedAt,
    required this.createdAt,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      fcmToken: json['fcmToken'] as String? ?? '',
      platform: DevicePlatform.fromString(json['platform']?.toString() ?? 'ANDROID'),
      deviceName: json['deviceName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      lastUsedAt: json['lastUsedAt'] != null
          ? DateTime.tryParse(json['lastUsedAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  final String id;
  final String userId;
  final String fcmToken;
  final DevicePlatform platform;
  final String? deviceName;
  final bool isActive;
  final DateTime? lastUsedAt;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'fcmToken': fcmToken,
        'platform': platform.value,
        'deviceName': deviceName,
        'isActive': isActive,
        'lastUsedAt': lastUsedAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

/// DTO for registering a device.
class RegisterDeviceDto {
  const RegisterDeviceDto({
    required this.fcmToken,
    required this.platform,
    this.deviceName,
  });

  final String fcmToken;
  final DevicePlatform platform;
  final String? deviceName;

  Map<String, dynamic> toJson() => {
        'fcmToken': fcmToken,
        'platform': platform.value,
        if (deviceName != null) 'deviceName': deviceName,
      };
}

/// API client for device operations.
class DevicesApi {
  const DevicesApi();

  /// Registers or updates a device.
  ///
  /// Calls `POST /api/v1/devices`.
  Future<Device> registerDevice(RegisterDeviceDto dto) async {
    debugPrint('[DevicesApi] Registering device (platform: ${dto.platform.value})');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/devices');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[DevicesApi] POST $uri');
      final response = await ApiClient.client
          .post(uri, headers: headers, body: jsonEncode(dto.toJson()))
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[DevicesApi] registerDevice: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw DevicesApiException('Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final data = json['device'] ?? json['data'] ?? json;
      return Device.fromJson(data as Map<String, dynamic>);
    } on TimeoutException {
      throw const DevicesApiException('Connexion impossible');
    } on http.ClientException {
      throw const DevicesApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is DevicesApiException || e is AuthException) rethrow;
      debugPrint('[DevicesApi] registerDevice error: $e');
      throw const DevicesApiException('Une erreur est survenue');
    }
  }

  /// Gets all devices for the current user.
  ///
  /// Calls `GET /api/v1/devices/me`.
  Future<List<Device>> getMyDevices() async {
    debugPrint('[DevicesApi] Getting my devices');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/devices/me');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[DevicesApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[DevicesApi] getMyDevices: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        throw DevicesApiException('Erreur ${response.statusCode}');
      }

      final json = jsonDecode(response.body);
      final List<dynamic> data;
      if (json is List) {
        data = json;
      } else if (json is Map<String, dynamic>) {
        data = json['devices'] ?? json['data'] ?? [];
      } else {
        data = [];
      }

      return data
          .map((e) => Device.fromJson(e as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      throw const DevicesApiException('Connexion impossible');
    } on http.ClientException {
      throw const DevicesApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is DevicesApiException || e is AuthException) rethrow;
      debugPrint('[DevicesApi] getMyDevices error: $e');
      throw const DevicesApiException('Une erreur est survenue');
    }
  }

  /// Deactivates a device.
  ///
  /// Calls `DELETE /api/v1/devices/:id`.
  Future<void> deleteDevice(String deviceId) async {
    debugPrint('[DevicesApi] Deleting device: $deviceId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/devices/$deviceId');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[DevicesApi] DELETE $uri');
      final response = await ApiClient.client
          .delete(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[DevicesApi] deleteDevice: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        throw const DevicesApiException('Appareil introuvable', 404);
      }

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw DevicesApiException('Erreur ${response.statusCode}');
      }
    } on TimeoutException {
      throw const DevicesApiException('Connexion impossible');
    } on http.ClientException {
      throw const DevicesApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is DevicesApiException || e is AuthException) rethrow;
      debugPrint('[DevicesApi] deleteDevice error: $e');
      throw const DevicesApiException('Une erreur est survenue');
    }
  }
}
