/// Push API client for WorkOn.
///
/// **PR-F20:** Initial implementation.
/// **PR-F25:** Aligned with backend POST /devices endpoint.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../auth/token_storage.dart';
import 'notification_prefs.dart';

// Helper function to check if user has an active session
bool _hasActiveSession() {
  final token = TokenStorage.getToken();
  return token != null && token.isNotEmpty;
}

/// API client for push notification device registration.
///
/// Endpoints:
/// - POST /devices - Register/update device (upsert)
/// - DELETE /devices/:id - Deactivate device
class PushApi {
  const PushApi();

  /// Registers a device for push notifications.
  ///
  /// Calls `POST /devices` with Bearer token.
  /// Backend performs upsert on (userId, deviceId) unique constraint.
  ///
  /// [token] is the FCM/APNs push token.
  /// [platform] is 'android' or 'ios'.
  ///
  /// Returns `true` if registration succeeded.
  Future<bool> registerDevice({
    required String token,
    required String platform,
  }) async {
    if (!_hasActiveSession()) {
      debugPrint('[PushApi] registerDevice: no session');
      return false;
    }

    // Get stable device identifier
    final deviceId = await _getDeviceId();
    if (deviceId == null || deviceId.isEmpty) {
      debugPrint('[PushApi] registerDevice: no deviceId');
      return false;
    }

    final uri = ApiClient.buildUri('/devices');

    try {
      debugPrint('[PushApi] POST $uri (platform: $platform, deviceId: ${deviceId.substring(0, 8)}...)');
      
      final response = await ApiClient.authenticatedPost(
        uri,
        body: {
          'deviceId': deviceId,
          'platform': platform,
          'pushToken': token,
          'appVersion': await _getAppVersion(),
        },
      );

      debugPrint('[PushApi] registerDevice: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Store the device record ID for later unregistration
        try {
          final body = jsonDecode(response.body) as Map<String, dynamic>;
          final recordId = body['id']?.toString();
          if (recordId != null && recordId.isNotEmpty) {
            await NotificationPrefs.setDeviceRecordId(recordId);
            debugPrint('[PushApi] Stored device record ID');
          }
        } catch (e) {
          debugPrint('[PushApi] Could not parse device record ID: $e');
        }
        return true;
      }

      debugPrint('[PushApi] registerDevice: failed ${response.statusCode}');
      if (response.statusCode >= 400) {
        debugPrint('[PushApi] Response: ${response.body}');
      }
      return false;
    } on TimeoutException {
      debugPrint('[PushApi] registerDevice: timeout');
      return false;
    } catch (e) {
      debugPrint('[PushApi] registerDevice: error $e');
      return false;
    }
  }

  /// Unregisters a device from push notifications.
  ///
  /// Calls `DELETE /devices/:id` with Bearer token.
  ///
  /// [token] is ignored (kept for backward compatibility).
  /// Uses stored device record ID from registration.
  ///
  /// Returns `true` if unregistration succeeded or device was already gone.
  Future<bool> unregisterDevice({required String token}) async {
    // Note: token param kept for backward compatibility but not used.
    // We use the stored device record ID instead.
    
    if (!_hasActiveSession()) {
      debugPrint('[PushApi] unregisterDevice: no session');
      // Still try to clear local state
      await NotificationPrefs.setDeviceRecordId(null);
      return true; // Consider success since we're logging out anyway
    }

    // Get stored device record ID
    final recordId = await NotificationPrefs.getDeviceRecordId();
    if (recordId == null || recordId.isEmpty) {
      debugPrint('[PushApi] unregisterDevice: no stored record ID, skipping');
      return true; // Nothing to unregister
    }

    final uri = ApiClient.buildUri('/devices/$recordId');

    try {
      debugPrint('[PushApi] DELETE $uri');
      
      final response = await ApiClient.authenticatedDelete(uri);

      debugPrint('[PushApi] unregisterDevice: ${response.statusCode}');

      // 204 = deleted, 404 = already gone (both OK)
      final success = response.statusCode == 204 || response.statusCode == 404;
      
      if (success) {
        // Clear stored record ID
        await NotificationPrefs.setDeviceRecordId(null);
      }
      
      return success;
    } on TimeoutException {
      debugPrint('[PushApi] unregisterDevice: timeout');
      return false;
    } catch (e) {
      debugPrint('[PushApi] unregisterDevice: error $e');
      return false;
    }
  }

  /// Gets a stable device identifier.
  ///
  /// Uses device_info_plus to get vendor ID (IDFV on iOS, Android ID on Android).
  /// Falls back to a random UUID stored in prefs if unavailable.
  Future<String?> _getDeviceId() async {
    // First check if we have a stored device ID
    var deviceId = await NotificationPrefs.getStoredDeviceId();
    if (deviceId != null && deviceId.isNotEmpty) {
      return deviceId;
    }

    // Try to get from platform
    // NOTE (Post-MVP/PR-F25): Use device_info_plus for real device ID
    // For now, generate a stable ID based on platform
    try {
      if (Platform.isIOS) {
        // On iOS, ideally use identifierForVendor
        // For now, generate and store a UUID
        deviceId = _generateDeviceId();
      } else if (Platform.isAndroid) {
        // On Android, ideally use Android ID
        // For now, generate and store a UUID
        deviceId = _generateDeviceId();
      } else {
        deviceId = _generateDeviceId();
      }

      // Store for future use
      await NotificationPrefs.setStoredDeviceId(deviceId);
      debugPrint('[PushApi] Generated and stored new deviceId');
      return deviceId;
    } catch (e) {
      debugPrint('[PushApi] Error getting device ID: $e');
      return null;
    }
  }

  /// Generates a random device ID.
  String _generateDeviceId() {
    // Simple UUID-like generation without external package
    final now = DateTime.now().millisecondsSinceEpoch;
    final random = now.hashCode.toRadixString(36);
    return 'workon-$random-${now.toRadixString(36)}';
  }

  /// Gets the app version string.
  Future<String?> _getAppVersion() async {
    // NOTE (Post-MVP/PR-F25): Use package_info_plus for real version
    return '1.0.0'; // Fallback version
  }
}
