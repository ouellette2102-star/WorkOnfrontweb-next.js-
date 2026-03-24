/// Missions service for WorkOn.
///
/// Centralized service for managing missions state.
/// Provides reactive updates via [ValueNotifier].
///
/// **PR-F05:** Initial implementation for missions feed.
library;

import 'package:flutter/foundation.dart';

import 'mission_models.dart';
import 'missions_api.dart';

/// State status for missions loading.
enum MissionsStatus {
  /// Initial state, no data loaded.
  initial,

  /// Currently loading data.
  loading,

  /// Data loaded successfully.
  loaded,

  /// Error occurred while loading.
  error,
}

/// State container for missions.
class MissionsState {
  /// Current loading status.
  final MissionsStatus status;

  /// List of missions (empty if not loaded or error).
  final List<Mission> missions;

  /// Error message (null if no error).
  final String? errorMessage;

  /// Location used for the search.
  final double? latitude;
  final double? longitude;
  final double? radiusKm;

  const MissionsState({
    this.status = MissionsStatus.initial,
    this.missions = const [],
    this.errorMessage,
    this.latitude,
    this.longitude,
    this.radiusKm,
  });

  /// Initial state.
  const MissionsState.initial() : this();

  /// Loading state.
  const MissionsState.loading({
    double? latitude,
    double? longitude,
    double? radiusKm,
  }) : this(
          status: MissionsStatus.loading,
          latitude: latitude,
          longitude: longitude,
          radiusKm: radiusKm,
        );

  /// Loaded state with missions.
  MissionsState.loaded({
    required List<Mission> missions,
    double? latitude,
    double? longitude,
    double? radiusKm,
  }) : this(
          status: MissionsStatus.loaded,
          missions: missions,
          latitude: latitude,
          longitude: longitude,
          radiusKm: radiusKm,
        );

  /// Error state.
  const MissionsState.error(String message) : this(
          status: MissionsStatus.error,
          errorMessage: message,
        );

  /// Check if currently loading.
  bool get isLoading => status == MissionsStatus.loading;

  /// Check if has error.
  bool get hasError => status == MissionsStatus.error;

  /// Check if empty (loaded but no missions).
  bool get isEmpty => status == MissionsStatus.loaded && missions.isEmpty;

  /// Check if has missions.
  bool get hasMissions => missions.isNotEmpty;

  /// Copy with new values.
  MissionsState copyWith({
    MissionsStatus? status,
    List<Mission>? missions,
    String? errorMessage,
    double? latitude,
    double? longitude,
    double? radiusKm,
  }) {
    return MissionsState(
      status: status ?? this.status,
      missions: missions ?? this.missions,
      errorMessage: errorMessage,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusKm: radiusKm ?? this.radiusKm,
    );
  }
}

/// Centralized missions service.
///
/// Manages mission data and state with reactive updates.
///
/// ## Usage
///
/// ```dart
/// // Listen to state changes
/// MissionsService.stateListenable.addListener(() {
///   final state = MissionsService.state;
///   if (state.isLoading) {
///     // Show loading
///   } else if (state.hasError) {
///     // Show error
///   } else {
///     // Show missions
///   }
/// });
///
/// // Load nearby missions
/// await MissionsService.loadNearby(
///   latitude: 45.5017,
///   longitude: -73.5673,
/// );
/// ```
abstract final class MissionsService {
  // ─────────────────────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal state notifier.
  static final ValueNotifier<MissionsState> _state =
      ValueNotifier(const MissionsState.initial());

  /// Exposes state as a listenable for reactive updates.
  static ValueListenable<MissionsState> get stateListenable => _state;

  /// Returns current state.
  static MissionsState get state => _state.value;

  /// API client instance.
  static final MissionsApi _api = MissionsApi();

  /// PR-F23: Exposes API for direct calls (e.g., fetchMyAssignments)
  static MissionsApi get api => _api;

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /// Loads nearby missions.
  ///
  /// Updates [state] reactively:
  /// - Sets [MissionsStatus.loading] immediately
  /// - Sets [MissionsStatus.loaded] with missions on success
  /// - Sets [MissionsStatus.error] with message on failure
  ///
  /// **PR-F10:** Added sort and category parameters.
  ///
  /// Returns the list of missions (or empty list on error).
  static Future<List<Mission>> loadNearby({
    required double latitude,
    required double longitude,
    double radiusKm = 10,
    String? sort,
    String? category,
  }) async {
    debugPrint('[MissionsService] Loading nearby missions (radius: $radiusKm, sort: $sort, category: $category)...');

    // PR-F10: Store current filter params for refresh
    _lastSort = sort;
    _lastCategory = category;

    // Set loading state
    _state.value = MissionsState.loading(
      latitude: latitude,
      longitude: longitude,
      radiusKm: radiusKm,
    );

    try {
      final missions = await _api.fetchNearby(
        latitude: latitude,
        longitude: longitude,
        radiusKm: radiusKm,
        sort: sort,
        category: category,
      );

      _state.value = MissionsState.loaded(
        missions: missions,
        latitude: latitude,
        longitude: longitude,
        radiusKm: radiusKm,
      );

      debugPrint('[MissionsService] Loaded ${missions.length} missions');
      return missions;
    } catch (e) {
      debugPrint('[MissionsService] Error loading missions: $e');
      _state.value = MissionsState.error(_extractErrorMessage(e));
      return [];
    }
  }

  // PR-F10: Store last filter params for refresh
  static String? _lastSort;
  static String? _lastCategory;

  /// Loads user's created missions.
  static Future<List<Mission>> loadMyMissions() async {
    debugPrint('[MissionsService] Loading my missions...');

    _state.value = const MissionsState.loading();

    try {
      final missions = await _api.fetchMyMissions();
      _state.value = MissionsState.loaded(missions: missions);
      return missions;
    } catch (e) {
      debugPrint('[MissionsService] Error: $e');
      _state.value = MissionsState.error(_extractErrorMessage(e));
      return [];
    }
  }

  /// Loads user's assigned missions.
  static Future<List<Mission>> loadMyAssignments() async {
    debugPrint('[MissionsService] Loading my assignments...');

    _state.value = const MissionsState.loading();

    try {
      final missions = await _api.fetchMyAssignments();
      _state.value = MissionsState.loaded(missions: missions);
      return missions;
    } catch (e) {
      debugPrint('[MissionsService] Error: $e');
      _state.value = MissionsState.error(_extractErrorMessage(e));
      return [];
    }
  }

  /// Gets a single mission by ID.
  ///
  /// First checks cached missions, then fetches from API if not found.
  static Future<Mission?> getById(String id) async {
    // Check cache first
    final cached = _state.value.missions.where((m) => m.id == id).firstOrNull;
    if (cached != null) {
      debugPrint('[MissionsService] Mission $id found in cache');
      return cached;
    }

    // Fetch from API
    try {
      return await _api.fetchById(id);
    } catch (e) {
      debugPrint('[MissionsService] Error fetching mission $id: $e');
      return null;
    }
  }

  /// Refreshes current data.
  ///
  /// Re-fetches using the same parameters as the last load.
  ///
  /// **PR-F10:** Also restores sort and category filters.
  static Future<void> refresh() async {
    final currentState = _state.value;

    if (currentState.latitude != null && currentState.longitude != null) {
      await loadNearby(
        latitude: currentState.latitude!,
        longitude: currentState.longitude!,
        radiusKm: currentState.radiusKm ?? 10,
        sort: _lastSort,
        category: _lastCategory,
      );
    }
  }

  /// Resets the service state.
  static void reset() {
    _state.value = const MissionsState.initial();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F20: Employer Flow - Create Mission
  // ─────────────────────────────────────────────────────────────────────────

  /// Creates a new mission.
  ///
  /// Only employers and residential clients can create missions.
  ///
  /// Returns the created [Mission] on success, throws on error.
  static Future<Mission> create({
    required String title,
    required String description,
    required String category,
    required double price,
    required double latitude,
    required double longitude,
    required String city,
    String? address,
  }) async {
    debugPrint('[MissionsService] Creating mission: $title');

    final mission = await _api.createMission(
      title: title,
      description: description,
      category: category,
      price: price,
      latitude: latitude,
      longitude: longitude,
      city: city,
      address: address,
    );

    debugPrint('[MissionsService] Mission created: ${mission.id}');
    return mission;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F22: Worker Flow - Accept Mission
  // ─────────────────────────────────────────────────────────────────────────

  /// Accepts a mission (worker takes the call).
  ///
  /// Calls `POST /api/v1/missions-local/:id/accept`.
  ///
  /// On success, the mission status changes from "open" to "assigned".
  /// The caller should refresh the missions list after success.
  ///
  /// Returns the updated [Mission] on success, throws on error.
  static Future<Mission> accept(String missionId) async {
    debugPrint('[MissionsService] Accepting mission: $missionId');

    final mission = await _api.acceptMission(missionId);

    debugPrint('[MissionsService] Mission accepted: ${mission.id} -> ${mission.status}');
    return mission;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F24: Worker Flow - Start Mission
  // ─────────────────────────────────────────────────────────────────────────

  /// Starts a mission (assigned -> in_progress).
  ///
  /// Calls `POST /api/v1/missions-local/:id/start`.
  ///
  /// On success, the mission status changes from "assigned" to "in_progress".
  /// The caller should refresh the missions list after success.
  ///
  /// Returns the updated [Mission] on success, throws on error.
  static Future<Mission> start(String missionId) async {
    debugPrint('[MissionsService] Starting mission: $missionId');

    final mission = await _api.startMission(missionId);

    debugPrint('[MissionsService] Mission started: ${mission.id} -> ${mission.status}');
    return mission;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F25: Worker Flow - Complete Mission
  // ─────────────────────────────────────────────────────────────────────────

  /// Completes a mission (in_progress -> completed).
  ///
  /// Calls `POST /api/v1/missions-local/:id/complete`.
  ///
  /// On success, the mission status changes to "completed".
  /// The caller should refresh the missions list after success.
  ///
  /// Returns the updated [Mission] on success, throws on error.
  static Future<Mission> complete(String missionId) async {
    debugPrint('[MissionsService] Completing mission: $missionId');

    final mission = await _api.completeMission(missionId);

    debugPrint('[MissionsService] Mission completed: ${mission.id} -> ${mission.status}');
    return mission;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /// Extracts user-friendly error message.
  static String _extractErrorMessage(Object error) {
    if (error is MissionsApiException) {
      return error.message;
    }
    return 'Une erreur est survenue';
  }
}

