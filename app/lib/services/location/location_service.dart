/// Location Service for WorkOn.
///
/// Minimal wrapper around geolocator for requesting location permissions
/// and getting user's current position.
///
/// **PR-F13:** Initial implementation.
library;

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// Simple position data class.
class UserPosition {
  const UserPosition({
    required this.latitude,
    required this.longitude,
  });

  final double latitude;
  final double longitude;

  /// Default fallback position (Montreal).
  static const defaultPosition = UserPosition(
    latitude: 45.5017,
    longitude: -73.5673,
  );

  @override
  String toString() => 'UserPosition($latitude, $longitude)';
}

/// Location permission status.
enum LocationPermissionStatus {
  /// Permission granted.
  granted,

  /// Permission denied by user.
  denied,

  /// Permission denied forever (user must go to settings).
  deniedForever,

  /// Location services are disabled on device.
  serviceDisabled,
}

/// Singleton service for location operations.
class LocationService {
  LocationService._();

  static final LocationService _instance = LocationService._();
  static LocationService get instance => _instance;

  /// Cached position.
  UserPosition? _cachedPosition;

  /// Current permission status.
  LocationPermissionStatus? _permissionStatus;

  /// Get cached position or null if not available.
  UserPosition? get cachedPosition => _cachedPosition;

  /// Get permission status.
  LocationPermissionStatus? get permissionStatus => _permissionStatus;

  /// Check and request location permission.
  ///
  /// Returns the permission status after checking/requesting.
  Future<LocationPermissionStatus> checkAndRequestPermission() async {
    // Skip on web - return denied gracefully.
    if (kIsWeb) {
      debugPrint('[LocationService] Web platform - skipping permission check');
      _permissionStatus = LocationPermissionStatus.denied;
      return _permissionStatus!;
    }

    try {
      // Check if location services are enabled.
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('[LocationService] Location services disabled');
        _permissionStatus = LocationPermissionStatus.serviceDisabled;
        return _permissionStatus!;
      }

      // Check current permission status.
      var permission = await Geolocator.checkPermission();
      debugPrint('[LocationService] Current permission: $permission');

      // If denied, request permission.
      if (permission == LocationPermission.denied) {
        debugPrint('[LocationService] Requesting permission...');
        permission = await Geolocator.requestPermission();
        debugPrint('[LocationService] Permission after request: $permission');
      }

      // Map to our enum.
      switch (permission) {
        case LocationPermission.always:
        case LocationPermission.whileInUse:
          _permissionStatus = LocationPermissionStatus.granted;
          break;
        case LocationPermission.denied:
          _permissionStatus = LocationPermissionStatus.denied;
          break;
        case LocationPermission.deniedForever:
          _permissionStatus = LocationPermissionStatus.deniedForever;
          break;
        case LocationPermission.unableToDetermine:
          _permissionStatus = LocationPermissionStatus.denied;
          break;
      }

      return _permissionStatus!;
    } catch (e, stack) {
      debugPrint('[LocationService] Error checking permission: $e');
      debugPrint('[LocationService] Stack: $stack');
      _permissionStatus = LocationPermissionStatus.denied;
      return _permissionStatus!;
    }
  }

  /// Get current position.
  ///
  /// Returns cached position if available and fresh enough.
  /// Falls back to default position if permission denied or error occurs.
  Future<UserPosition> getCurrentPosition({
    bool forceRefresh = false,
  }) async {
    // Return cached if available and not forcing refresh.
    if (!forceRefresh && _cachedPosition != null) {
      debugPrint('[LocationService] Returning cached position');
      return _cachedPosition!;
    }

    // Check permission first.
    final status = await checkAndRequestPermission();
    if (status != LocationPermissionStatus.granted) {
      debugPrint('[LocationService] Permission not granted, using default');
      return UserPosition.defaultPosition;
    }

    // Skip on web.
    if (kIsWeb) {
      return UserPosition.defaultPosition;
    }

    try {
      debugPrint('[LocationService] Getting current position...');
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 4),
        ),
      );

      _cachedPosition = UserPosition(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      debugPrint('[LocationService] Got position: $_cachedPosition');
      return _cachedPosition!;
    } catch (e, stack) {
      debugPrint('[LocationService] Error getting position: $e');
      debugPrint('[LocationService] Stack: $stack');
      // Return cached if available, otherwise default.
      return _cachedPosition ?? UserPosition.defaultPosition;
    }
  }

  /// Check if we have granted permission.
  bool get hasPermission =>
      _permissionStatus == LocationPermissionStatus.granted;

  /// Open app settings (for when permission is denied forever).
  Future<bool> openSettings() async {
    if (kIsWeb) return false;
    return Geolocator.openAppSettings();
  }

  /// Open location settings (for when service is disabled).
  Future<bool> openLocationSettings() async {
    if (kIsWeb) return false;
    return Geolocator.openLocationSettings();
  }

  /// Clear cached position.
  void clearCache() {
    _cachedPosition = null;
    _permissionStatus = null;
  }
}

