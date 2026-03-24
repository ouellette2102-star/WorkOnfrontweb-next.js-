/// Devices Service for WorkOn.
///
/// Manages device registration for push notifications.
/// Should be called on login and app resume.
///
/// **FL-DEVICES:** Initial implementation.
library;

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

import 'devices_api.dart';

/// Service for managing device registration.
///
/// ## Usage
///
/// ```dart
/// // Register device on login
/// await DevicesService.registerCurrentDevice(fcmToken);
///
/// // Unregister on logout
/// await DevicesService.unregisterCurrentDevice();
/// ```
class DevicesService {
  DevicesService._();

  static final _api = const DevicesApi();
  static final _deviceInfo = DeviceInfoPlugin();

  /// Currently registered device ID.
  static String? _currentDeviceId;

  /// Last registered FCM token.
  static String? _lastFcmToken;

  /// Gets the current device ID.
  static String? get currentDeviceId => _currentDeviceId;

  /// Registers the current device with the backend.
  ///
  /// Should be called:
  /// - After successful login
  /// - When FCM token changes
  /// - On app resume (to update lastUsedAt)
  static Future<Device?> registerCurrentDevice(String fcmToken) async {
    debugPrint('[DevicesService] Registering device with FCM token');

    // Skip if same token already registered
    if (_currentDeviceId != null && _lastFcmToken == fcmToken) {
      debugPrint('[DevicesService] Device already registered with same token');
      return null;
    }

    try {
      final deviceName = await _getDeviceName();
      final platform = DevicePlatform.current;

      final dto = RegisterDeviceDto(
        fcmToken: fcmToken,
        platform: platform,
        deviceName: deviceName,
      );

      final device = await _api.registerDevice(dto);

      _currentDeviceId = device.id;
      _lastFcmToken = fcmToken;

      debugPrint('[DevicesService] Device registered: ${device.id}');
      return device;
    } catch (e) {
      debugPrint('[DevicesService] Failed to register device: $e');
      return null;
    }
  }

  /// Unregisters the current device.
  ///
  /// Should be called on logout.
  static Future<void> unregisterCurrentDevice() async {
    if (_currentDeviceId == null) {
      debugPrint('[DevicesService] No device to unregister');
      return;
    }

    debugPrint('[DevicesService] Unregistering device: $_currentDeviceId');

    try {
      await _api.deleteDevice(_currentDeviceId!);
      debugPrint('[DevicesService] Device unregistered');
    } catch (e) {
      debugPrint('[DevicesService] Failed to unregister device: $e');
    } finally {
      _currentDeviceId = null;
      _lastFcmToken = null;
    }
  }

  /// Gets all devices for the current user.
  static Future<List<Device>> getMyDevices() async {
    debugPrint('[DevicesService] Getting my devices');
    return _api.getMyDevices();
  }

  /// Deletes a specific device.
  static Future<void> deleteDevice(String deviceId) async {
    debugPrint('[DevicesService] Deleting device: $deviceId');
    await _api.deleteDevice(deviceId);

    if (_currentDeviceId == deviceId) {
      _currentDeviceId = null;
      _lastFcmToken = null;
    }
  }

  /// Clears local state (call on logout).
  static void clearState() {
    _currentDeviceId = null;
    _lastFcmToken = null;
    debugPrint('[DevicesService] State cleared');
  }

  /// Gets a human-readable device name.
  static Future<String> _getDeviceName() async {
    try {
      if (kIsWeb) {
        final webInfo = await _deviceInfo.webBrowserInfo;
        return webInfo.browserName.name;
      }

      final platform = DevicePlatform.current;
      if (platform == DevicePlatform.ios) {
        final iosInfo = await _deviceInfo.iosInfo;
        return iosInfo.name;
      } else {
        final androidInfo = await _deviceInfo.androidInfo;
        return '${androidInfo.manufacturer} ${androidInfo.model}';
      }
    } catch (e) {
      debugPrint('[DevicesService] Failed to get device name: $e');
      return 'Unknown Device';
    }
  }
}
