/// Discovery Service for WorkOn.
///
/// Unified data source for Swipe and Map discovery views.
/// Uses [MissionsApi] internally - single source of truth.
///
/// **PR-DISCOVERY:** Initial implementation.
library;

import 'dart:async';

import 'package:flutter/foundation.dart';

import '../location/location_service.dart';
import '../missions/missions_api.dart';
import '../missions/mission_models.dart';

/// Discovery state enum.
enum DiscoveryState {
  /// Initial state, not loaded.
  idle,

  /// Currently loading missions.
  loading,

  /// Missions loaded successfully.
  ready,

  /// No missions found.
  empty,

  /// Error occurred.
  error,
}

/// Discovery Service - Provides missions for Swipe and Map views.
///
/// Single data source for both UI modes.
/// Caches results to avoid redundant API calls when switching views.
class DiscoveryService extends ChangeNotifier {
  DiscoveryService._();

  static DiscoveryService? _instance;

  /// Singleton instance.
  static DiscoveryService get instance {
    _instance ??= DiscoveryService._();
    return _instance!;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  final MissionsApi _api = MissionsApi();

  DiscoveryState _state = DiscoveryState.idle;

  /// Current state.
  DiscoveryState get state => _state;

  List<Mission> _missions = [];

  /// Current missions list.
  List<Mission> get missions => List.unmodifiable(_missions);

  /// Missions count.
  int get count => _missions.length;

  /// Has missions.
  bool get hasMissions => _missions.isNotEmpty;

  String? _errorMessage;

  /// Error message if state is error.
  String? get errorMessage => _errorMessage;

  /// Current search parameters.
  double _latitude = 0;
  double _longitude = 0;
  double _radiusKm = 15;
  String? _category;

  /// Last loaded timestamp.
  DateTime? _lastLoadedAt;

  /// Cache duration (5 minutes).
  static const Duration _cacheDuration = Duration(minutes: 5);

  /// Check if cache is still valid.
  bool get _isCacheValid {
    if (_lastLoadedAt == null) return false;
    return DateTime.now().difference(_lastLoadedAt!) < _cacheDuration;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ignored missions (swiped left)
  // ─────────────────────────────────────────────────────────────────────────

  final Set<String> _ignoredMissionIds = {};

  /// Missions visible in swipe view (excludes ignored).
  List<Mission> get swipeableMissions {
    return _missions.where((m) => !_ignoredMissionIds.contains(m.id)).toList();
  }

  /// Mark mission as ignored (swiped left).
  void ignoreMission(String missionId) {
    _ignoredMissionIds.add(missionId);
    debugPrint('[DiscoveryService] Mission ignored: $missionId');
    notifyListeners();
  }

  /// Clear ignored missions.
  void clearIgnored() {
    _ignoredMissionIds.clear();
    debugPrint('[DiscoveryService] Ignored missions cleared');
    notifyListeners();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Load missions
  // ─────────────────────────────────────────────────────────────────────────

  /// Load nearby missions.
  ///
  /// Uses cached results if available and not expired.
  /// Set [forceRefresh] to true to bypass cache.
  Future<void> loadNearby({
    double? latitude,
    double? longitude,
    double radiusKm = 15,
    String? category,
    bool forceRefresh = false,
  }) async {
    // Use provided location or get current
    double lat = latitude ?? 0;
    double lng = longitude ?? 0;

    if (lat == 0 || lng == 0) {
      final pos = await _getCurrentPosition();
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
      } else {
        // Fallback to Montreal
        lat = 45.5017;
        lng = -73.5673;
      }
    }

    // Check if same search params and cache valid
    if (!forceRefresh &&
        _isCacheValid &&
        _latitude == lat &&
        _longitude == lng &&
        _radiusKm == radiusKm &&
        _category == category) {
      debugPrint('[DiscoveryService] Using cached results (${_missions.length} missions)');
      return;
    }

    // Update params
    _latitude = lat;
    _longitude = lng;
    _radiusKm = radiusKm;
    _category = category;

    // Load
    _state = DiscoveryState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      debugPrint('[DiscoveryService] Loading nearby missions (lat: $lat, lng: $lng, radius: $radiusKm km)');

      final results = await _api.fetchNearby(
        latitude: lat,
        longitude: lng,
        radiusKm: radiusKm,
        category: category,
      );

      _missions = results;
      _lastLoadedAt = DateTime.now();

      if (_missions.isEmpty) {
        _state = DiscoveryState.empty;
        debugPrint('[DiscoveryService] No missions found');
      } else {
        _state = DiscoveryState.ready;
        debugPrint('[DiscoveryService] Loaded ${_missions.length} missions');
      }
    } catch (e) {
      debugPrint('[DiscoveryService] Error loading missions: $e');
      _state = DiscoveryState.error;
      _errorMessage = 'Impossible de charger les missions';
    }

    notifyListeners();
  }

  /// Refresh missions (force reload).
  Future<void> refresh() async {
    await loadNearby(
      latitude: _latitude,
      longitude: _longitude,
      radiusKm: _radiusKm,
      category: _category,
      forceRefresh: true,
    );
  }

  /// Get current position from LocationService.
  Future<({double latitude, double longitude})?> _getCurrentPosition() async {
    try {
      final pos = await LocationService.instance.getCurrentPosition();
      if (pos != null) {
        return (latitude: pos.latitude, longitude: pos.longitude);
      }
    } catch (e) {
      debugPrint('[DiscoveryService] Error getting position: $e');
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  /// Reset service state.
  void reset() {
    _missions = [];
    _ignoredMissionIds.clear();
    _state = DiscoveryState.idle;
    _errorMessage = null;
    _lastLoadedAt = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _instance = null;
    super.dispose();
  }
}

