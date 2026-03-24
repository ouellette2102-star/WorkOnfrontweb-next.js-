/// Applied missions local storage service for WorkOn.
///
/// Provides persistent local storage for mission IDs that the user has applied to.
/// Works as a fallback when backend doesn't provide "already applied" flag.
///
/// **PR-F15:** Initial implementation.
library;

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Service for persisting applied mission IDs locally.
///
/// Uses SharedPreferences for storage.
///
/// ## Usage
///
/// ```dart
/// // Initialize at app startup
/// await AppliedMissionsStore.initialize();
///
/// // Check if mission was applied to
/// final hasApplied = AppliedMissionsStore.hasApplied('mission-id');
///
/// // Mark as applied
/// await AppliedMissionsStore.markApplied('mission-id');
///
/// // Listen to changes
/// AppliedMissionsStore.appliedIdsListenable.addListener(() {
///   final appliedIds = AppliedMissionsStore.appliedIds;
/// });
/// ```
abstract final class AppliedMissionsStore {
  // ─────────────────────────────────────────────────────────────────────────
  // Storage Key
  // ─────────────────────────────────────────────────────────────────────────

  static const String _storageKey = 'workon_applied_mission_ids';

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  /// In-memory set of applied mission IDs.
  static final Set<String> _appliedIds = {};

  /// ValueNotifier for reactive updates.
  static final ValueNotifier<Set<String>> _notifier = ValueNotifier({});

  /// SharedPreferences instance.
  static SharedPreferences? _prefs;

  /// Whether storage has been initialized.
  static bool _initialized = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Public Getters
  // ─────────────────────────────────────────────────────────────────────────

  /// Returns a copy of the current applied mission IDs.
  static Set<String> get appliedIds => Set.unmodifiable(_appliedIds);

  /// Returns the number of applied missions.
  static int get count => _appliedIds.length;

  /// Exposes applied IDs as a listenable for reactive updates.
  static ValueListenable<Set<String>> get appliedIdsListenable => _notifier;

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  /// Initializes the applied missions store.
  ///
  /// Must be called once at app startup.
  static Future<void> initialize() async {
    if (_initialized) {
      debugPrint('[AppliedMissionsStore] Already initialized');
      return;
    }

    try {
      _prefs = await SharedPreferences.getInstance();
      _initialized = true;

      // Load applied IDs from storage
      final storedIds = _prefs?.getStringList(_storageKey);
      if (storedIds != null && storedIds.isNotEmpty) {
        _appliedIds.addAll(storedIds);
        _notifier.value = Set.from(_appliedIds);
      }

      debugPrint('[AppliedMissionsStore] Initialized with ${_appliedIds.length} applied missions');
    } catch (e) {
      debugPrint('[AppliedMissionsStore] Init error: $e');
      _initialized = true; // Prevent retry loop
    }
  }

  /// Ensures storage is initialized before use.
  static Future<void> _ensureInitialized() async {
    if (!_initialized) {
      await initialize();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /// Returns `true` if the user has applied to this mission.
  static bool hasApplied(String missionId) {
    return _appliedIds.contains(missionId);
  }

  /// Marks a mission as applied.
  static Future<void> markApplied(String missionId) async {
    await _ensureInitialized();

    if (_appliedIds.contains(missionId)) return;

    _appliedIds.add(missionId);
    await _persist();
    _notifier.value = Set.from(_appliedIds);

    debugPrint('[AppliedMissionsStore] Marked applied: $missionId');
  }

  /// Syncs with backend data (merges backend list into local store).
  ///
  /// Call this after fetching offers from backend.
  static Future<void> syncFromBackend(List<String> backendMissionIds) async {
    await _ensureInitialized();

    var changed = false;
    for (final id in backendMissionIds) {
      if (!_appliedIds.contains(id)) {
        _appliedIds.add(id);
        changed = true;
      }
    }

    if (changed) {
      await _persist();
      _notifier.value = Set.from(_appliedIds);
      debugPrint('[AppliedMissionsStore] Synced ${backendMissionIds.length} IDs from backend');
    }
  }

  /// Clears all applied missions (e.g., on logout).
  static Future<void> clear() async {
    await _ensureInitialized();

    _appliedIds.clear();
    await _persist();
    _notifier.value = {};

    debugPrint('[AppliedMissionsStore] Cleared all applied missions');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /// Persists the current applied IDs to SharedPreferences.
  static Future<void> _persist() async {
    await _prefs?.setStringList(_storageKey, _appliedIds.toList());
  }
}

