/// Legal consent persistence for WorkOn.
///
/// **PR-13:** Local storage for offline support.
/// **PR-S1:** Syncs with backend Compliance API (primary source of truth).
///
/// Architecture:
/// - Backend API is the source of truth for consent
/// - Version is ALWAYS fetched from backend, never hardcoded
/// - Local storage caches consent status for offline/startup
library;

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'consent_api.dart';

/// Manages legal consent with backend sync.
///
/// **Flow:**
/// 1. [syncFromBackend]: Fetch versions from backend, check status, accept if needed
/// 2. [acceptAll]: Accept both TERMS and PRIVACY via backend
/// 3. [hasConsented]: Check if consent is valid (local cache + version check)
class ConsentStore {
  ConsentStore._();

  static const String _keyPrefix = 'legal_consent_';

  // Storage keys
  static const String keyTosAccepted = '${_keyPrefix}tos_accepted';
  static const String keyPrivacyAccepted = '${_keyPrefix}privacy_accepted';
  static const String keyConsentTimestamp = '${_keyPrefix}timestamp';
  static const String keyTermsVersion = '${_keyPrefix}terms_version';
  static const String keyPrivacyVersion = '${_keyPrefix}privacy_version';
  static const String keyLastSyncAt = '${_keyPrefix}last_sync';

  static SharedPreferences? _prefs;
  static final ComplianceApi _api = ComplianceApi();

  // Cached status from last sync
  static ConsentStatus? _cachedStatus;
  static LegalVersions? _cachedVersions;

  /// Initializes the consent store.
  static Future<void> initialize() async {
    _prefs ??= await SharedPreferences.getInstance();
    debugPrint('[ConsentStore] Initialized');
  }

  /// Ensures prefs is initialized before use.
  static Future<SharedPreferences> _ensurePrefs() async {
    if (_prefs == null) {
      await initialize();
    }
    return _prefs!;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-S1: Backend Sync
  // ─────────────────────────────────────────────────────────────────────────

  /// Fetches versions from backend.
  ///
  /// Call this to get active versions before accepting.
  static Future<LegalVersions> fetchVersions() async {
    debugPrint('[ConsentStore] Fetching versions from backend...');
    final versions = await _api.getVersions();
    _cachedVersions = versions;
    return versions;
  }

  /// Syncs consent status from backend.
  ///
  /// 1. Fetches active versions
  /// 2. Fetches user's consent status
  /// 3. If not complete, accepts missing documents
  /// 4. Updates local cache
  ///
  /// Returns true if consent is now complete.
  static Future<bool> syncFromBackend() async {
    debugPrint('[ConsentStore] Syncing from backend...');

    try {
      // 1. Fetch active versions
      final versions = await _api.getVersions();
      _cachedVersions = versions;

      // 2. Fetch status
      ConsentStatus status;
      try {
        status = await _api.getStatus();
        _cachedStatus = status;
      } catch (e) {
        debugPrint('[ConsentStore] getStatus failed: $e');
        // If status fails, assume we need to accept
        status = const ConsentStatus(
          isComplete: false,
          documents: {},
          missing: [LegalDocumentType.TERMS, LegalDocumentType.PRIVACY],
        );
      }

      // 3. If already complete, just update local cache
      if (status.isComplete) {
        debugPrint('[ConsentStore] Consent already complete');
        await _updateLocalCache(status, versions);
        return true;
      }

      // 4. Accept missing documents
      debugPrint('[ConsentStore] Missing: ${status.missing}');
      for (final docType in status.missing) {
        await _api.acceptWithRetry(docType);
      }

      // 5. Verify and update cache
      final newStatus = await _api.getStatus();
      _cachedStatus = newStatus;
      await _updateLocalCache(newStatus, versions);

      debugPrint('[ConsentStore] Sync complete: isComplete=${newStatus.isComplete}');
      return newStatus.isComplete;
    } catch (e) {
      debugPrint('[ConsentStore] Sync failed: $e');
      return false;
    }
  }

  /// Updates local cache with backend state.
  static Future<void> _updateLocalCache(
    ConsentStatus status,
    LegalVersions versions,
  ) async {
    final prefs = await _ensurePrefs();

    final termsStatus = status.documents[LegalDocumentType.TERMS];
    final privacyStatus = status.documents[LegalDocumentType.PRIVACY];

    await prefs.setBool(keyTosAccepted, termsStatus?.accepted ?? false);
    await prefs.setBool(keyPrivacyAccepted, privacyStatus?.accepted ?? false);

    if (termsStatus?.acceptedAt != null) {
      await prefs.setString(
        keyConsentTimestamp,
        termsStatus!.acceptedAt!.toIso8601String(),
      );
    }

    // Store accepted versions
    if (termsStatus?.version != null) {
      await prefs.setString(keyTermsVersion, termsStatus!.version!);
    }
    if (privacyStatus?.version != null) {
      await prefs.setString(keyPrivacyVersion, privacyStatus!.version!);
    }

    await prefs.setString(keyLastSyncAt, DateTime.now().toIso8601String());

    debugPrint('[ConsentStore] Local cache updated');
  }

  /// Accepts a single document via backend API.
  ///
  /// Uses [acceptWithRetry] to handle VERSION_MISMATCH.
  static Future<AcceptResult> acceptDocument(LegalDocumentType type) async {
    debugPrint('[ConsentStore] Accepting ${type.value}...');
    final result = await _api.acceptWithRetry(type);

    // Update local cache
    final prefs = await _ensurePrefs();
    if (type == LegalDocumentType.TERMS) {
      await prefs.setBool(keyTosAccepted, true);
      await prefs.setString(keyTermsVersion, result.version);
    } else {
      await prefs.setBool(keyPrivacyAccepted, true);
      await prefs.setString(keyPrivacyVersion, result.version);
    }
    await prefs.setString(
      keyConsentTimestamp,
      result.acceptedAt.toIso8601String(),
    );

    debugPrint('[ConsentStore] ${type.value} accepted: v${result.version}');
    return result;
  }

  /// Accepts both TERMS and PRIVACY via backend.
  ///
  /// Uses retry logic to handle VERSION_MISMATCH.
  static Future<void> acceptAll() async {
    debugPrint('[ConsentStore] Accepting all documents...');

    await _api.acceptAllWithRetry();

    // Update local cache
    final prefs = await _ensurePrefs();
    final versions = _cachedVersions ?? await _api.getVersions();

    await prefs.setBool(keyTosAccepted, true);
    await prefs.setBool(keyPrivacyAccepted, true);
    await prefs.setString(keyTermsVersion, versions.termsVersion);
    await prefs.setString(keyPrivacyVersion, versions.privacyVersion);
    await prefs.setString(keyConsentTimestamp, DateTime.now().toIso8601String());
    await prefs.setString(keyLastSyncAt, DateTime.now().toIso8601String());

    debugPrint('[ConsentStore] All documents accepted');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Consent Status
  // ─────────────────────────────────────────────────────────────────────────

  /// Returns true if the user has accepted both TOS and Privacy Policy.
  ///
  /// Checks local cache. Use [syncFromBackend] to verify with backend.
  static Future<bool> hasConsented() async {
    // If we have cached status from backend, use it
    if (_cachedStatus != null) {
      return _cachedStatus!.isComplete;
    }

    // Fallback to local cache
    final prefs = await _ensurePrefs();
    final tosAccepted = prefs.getBool(keyTosAccepted) ?? false;
    final privacyAccepted = prefs.getBool(keyPrivacyAccepted) ?? false;
    final termsVersion = prefs.getString(keyTermsVersion);
    final privacyVersion = prefs.getString(keyPrivacyVersion);

    // Must have accepted both AND have version stored
    if (!tosAccepted || !privacyAccepted) {
      return false;
    }

    // Must have versions stored (proves it came from backend)
    if (termsVersion == null || termsVersion.isEmpty) {
      return false;
    }
    if (privacyVersion == null || privacyVersion.isEmpty) {
      return false;
    }

    return true;
  }

  /// Returns cached consent status.
  static ConsentStatus? get cachedStatus => _cachedStatus;

  /// Returns cached versions.
  static LegalVersions? get cachedVersions => _cachedVersions;

  /// Returns true if we have a cached status.
  static bool get hasCachedStatus => _cachedStatus != null;

  /// Returns list of missing documents.
  static List<LegalDocumentType> get missingDocuments =>
      _cachedStatus?.missing ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // Legacy Methods (kept for compatibility)
  // ─────────────────────────────────────────────────────────────────────────

  /// @deprecated Use [acceptAll] instead.
  static Future<void> recordConsent() async {
    debugPrint('[ConsentStore] recordConsent() - use acceptAll() instead');
    await acceptAll();
  }

  /// Gets the timestamp when consent was given.
  static Future<DateTime?> getConsentTimestamp() async {
    final prefs = await _ensurePrefs();
    final timestamp = prefs.getString(keyConsentTimestamp);
    if (timestamp == null) return null;

    try {
      return DateTime.parse(timestamp);
    } catch (e) {
      debugPrint('[ConsentStore] Invalid timestamp: $timestamp');
      return null;
    }
  }

  /// Gets the version of TERMS that was consented to.
  static Future<String?> getTermsVersion() async {
    final prefs = await _ensurePrefs();
    return prefs.getString(keyTermsVersion);
  }

  /// Gets the version of PRIVACY that was consented to.
  static Future<String?> getPrivacyVersion() async {
    final prefs = await _ensurePrefs();
    return prefs.getString(keyPrivacyVersion);
  }

  /// Clears consent data (e.g., on logout).
  static Future<void> clearConsent() async {
    final prefs = await _ensurePrefs();
    await prefs.remove(keyTosAccepted);
    await prefs.remove(keyPrivacyAccepted);
    await prefs.remove(keyConsentTimestamp);
    await prefs.remove(keyTermsVersion);
    await prefs.remove(keyPrivacyVersion);
    await prefs.remove(keyLastSyncAt);
    _cachedStatus = null;
    _cachedVersions = null;

    debugPrint('[ConsentStore] Consent cleared');
  }

  /// Returns a map of consent data for audit purposes.
  static Future<Map<String, dynamic>> getAuditData() async {
    final prefs = await _ensurePrefs();
    return {
      'tosAccepted': prefs.getBool(keyTosAccepted) ?? false,
      'privacyAccepted': prefs.getBool(keyPrivacyAccepted) ?? false,
      'timestamp': prefs.getString(keyConsentTimestamp),
      'termsVersion': prefs.getString(keyTermsVersion),
      'privacyVersion': prefs.getString(keyPrivacyVersion),
      'lastSyncAt': prefs.getString(keyLastSyncAt),
      'cachedStatusComplete': _cachedStatus?.isComplete,
    };
  }
}
