/// User service for WorkOn.
///
/// Manages user context and role resolution.
///
/// **PR#10:** Initial implementation with default role (worker).
/// **PR#12:** Added backend role resolution via UserApi.
/// **PR#13:** Improved role parsing with 'type' field support and logging.
library;

import 'package:flutter/foundation.dart';

import '../auth/auth_service.dart';
import '../auth/token_storage.dart';
import 'user_api.dart';
import 'user_context.dart';

/// Service that manages user context and role.
///
/// This service:
/// - Holds the current user context (userId, email, role)
/// - Exposes reactive updates via [ValueNotifier]
/// - Resolves user role (currently defaults to worker)
///
/// ## Usage
///
/// ```dart
/// // Listen for user context changes
/// UserService.contextListenable.addListener(() {
///   final ctx = UserService.context;
///   print('User role: ${ctx.role}');
/// });
///
/// // Set user context after auth
/// await UserService.setFromAuth(userId: 'usr_123', email: 'user@example.com');
///
/// // Reset on logout
/// UserService.reset();
/// ```
///
/// ## Role Resolution
///
/// Currently defaults to [UserRole.worker] for all users.
/// Future PRs may implement actual role fetching from backend.
abstract final class UserService {
  // ─────────────────────────────────────────────────────────────────────────
  // User Context State
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal notifier for user context changes.
  static final ValueNotifier<UserContext> _context =
      ValueNotifier(const UserContext.unknown());

  /// Exposes user context as a listenable for reactive updates.
  ///
  /// Use this to listen for context changes:
  /// ```dart
  /// UserService.contextListenable.addListener(() {
  ///   final ctx = UserService.context;
  ///   // Handle context change
  /// });
  /// ```
  static ValueListenable<UserContext> get contextListenable => _context;

  /// Returns the current user context.
  static UserContext get context => _context.value;

  // ─────────────────────────────────────────────────────────────────────────
  // Context Management
  // ─────────────────────────────────────────────────────────────────────────

  /// Sets the user context from authentication data.
  ///
  /// This method:
  /// 1. Sets status to loading
  /// 2. Resolves the user role (currently defaults to worker)
  /// 3. Sets status to ready with resolved role
  ///
  /// **Never throws** - falls back to default role on any error.
  ///
  /// Example:
  /// ```dart
  /// await UserService.setFromAuth(
  ///   userId: 'usr_123',
  ///   email: 'user@example.com',
  /// );
  /// ```
  static Future<void> setFromAuth({
    required String userId,
    String? email,
  }) async {
    // Set loading state
    _context.value = const UserContext.loading();

    try {
      // Resolve role (currently defaults to worker)
      // NOTE (Post-MVP): Implement actual role resolution from backend
      final role = await _resolveRole(userId);

      // Set ready state with resolved role
      _context.value = UserContext.fromAuth(
        userId: userId,
        email: email,
        role: role,
      );
    } catch (_) {
      // On any error, fall back to default role
      _context.value = UserContext.fromAuth(
        userId: userId,
        email: email,
        role: UserRole.worker,
      );
    }
  }

  /// Resolves the user role.
  ///
  /// **Current implementation:** Returns [UserRole.worker] as default.
  ///
  /// **Future implementation:** Will call backend to fetch actual role.
  /// This is a safe placeholder that does not require new API endpoints.
  static Future<UserRole> _resolveRole(String userId) async {
    // Safe default: all users are workers until backend returns role
    return UserRole.worker;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Backend Role Resolution (PR#12)
  // ─────────────────────────────────────────────────────────────────────────

  /// API client for user operations.
  static const UserApi _api = UserApi();

  /// Refreshes user context from backend if possible.
  ///
  /// This method:
  /// 1. Checks if a valid session with token exists
  /// 2. Calls backend to fetch user profile
  /// 3. Extracts and updates role from response
  ///
  /// **Never throws** - falls back gracefully on any error.
  /// Role remains unchanged (or defaults to worker) if fetch fails.
  ///
  /// Example:
  /// ```dart
  /// // After login, enrich context with backend data
  /// await UserService.refreshFromBackendIfPossible();
  /// print('Role: ${UserService.context.role}');
  /// ```
  static Future<void> refreshFromBackendIfPossible() async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[UserService] refreshFromBackendIfPossible: no token available');
      return;
    }

    // Skip if context is not ready (no userId)
    final currentContext = _context.value;
    if (!currentContext.isReady || currentContext.userId == null) {
      debugPrint('[UserService] refreshFromBackendIfPossible: context not ready');
      return;
    }

    try {
      debugPrint('[UserService] refreshFromBackendIfPossible: fetching profile...');
      // Fetch profile from backend
      final profile = await _api.fetchMe();

      // Extract role from response
      final role = _parseRoleFromProfile(profile);
      debugPrint('[UserService] refreshFromBackendIfPossible: resolved role = $role');

      // Update context with resolved role (keep existing userId/email)
      _context.value = UserContext.fromAuth(
        userId: currentContext.userId!,
        email: currentContext.email,
        role: role,
      );
    } catch (e) {
      // On any error, keep current context unchanged
      // Role remains as set by setFromAuth (default: worker)
      debugPrint('[UserService] refreshFromBackendIfPossible: error (ignored): $e');
    }
  }

  /// Parses user role from backend profile response.
  ///
  /// Looks for role in these fields (in order):
  /// - `role`
  /// - `userRole`
  /// - `accountType`
  ///
  /// Maps string values to [UserRole]:
  /// - "worker" → [UserRole.worker]
  /// - "employer" → [UserRole.employer]
  /// - "residential" → [UserRole.residential]
  ///
  /// Returns current role or [UserRole.worker] if not found/invalid.
  static UserRole _parseRoleFromProfile(Map<String, dynamic> profile) {
    // Try different field names
    final roleValue = profile['role'] ??
        profile['userRole'] ??
        profile['accountType'] ??
        profile['type'];

    // Convert to string if not already
    final roleString = roleValue?.toString().toLowerCase();

    // Map to UserRole
    switch (roleString) {
      case 'worker':
        return UserRole.worker;
      case 'employer':
        return UserRole.employer;
      case 'residential':
        return UserRole.residential;
      default:
        // Unknown/missing role - keep default
        return _context.value.role;
    }
  }

  /// Resets the user context to unknown state.
  ///
  /// Call this on logout to clear user context.
  ///
  /// Example:
  /// ```dart
  /// UserService.reset();
  /// assert(UserService.context.isUnknown);
  /// ```
  static void reset() {
    _context.value = const UserContext.unknown();
  }

  /// Sets the user context directly (for testing).
  ///
  /// Prefer [setFromAuth] for normal usage.
  @visibleForTesting
  static void setContext(UserContext ctx) {
    _context.value = ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile Update (PR#18)
  // ─────────────────────────────────────────────────────────────────────────

  /// Result type for profile update operations.
  static ProfileUpdateResult? _lastUpdateResult;

  /// Gets the last profile update result.
  static ProfileUpdateResult? get lastUpdateResult => _lastUpdateResult;

  /// Updates the user profile via PATCH /users/me.
  ///
  /// Returns [ProfileUpdateResult] indicating success or failure.
  ///
  /// **Never throws** - errors are captured in the result.
  ///
  /// Example:
  /// ```dart
  /// final result = await UserService.updateProfile(
  ///   fullName: 'John Doe',
  ///   phone: '514-555-1234',
  /// );
  /// if (result.isSuccess) {
  ///   // Profile updated
  /// } else {
  ///   // Show error: result.errorMessage
  /// }
  /// ```
  static Future<ProfileUpdateResult> updateProfile({
    String? fullName,
    String? phone,
    String? city,
    String? bio,
    String? gender,
  }) async {
    try {
      debugPrint('[UserService] updateProfile: starting...');

      // Call API
      final updated = await _api.patchMe(
        fullName: fullName,
        phone: phone,
        city: city,
        bio: bio,
        gender: gender,
      );

      debugPrint('[UserService] updateProfile: success');

      // Optionally refresh context from backend
      await refreshFromBackendIfPossible();

      _lastUpdateResult = ProfileUpdateResult.success(updated);
      return _lastUpdateResult!;
    } on UserApiException catch (e) {
      debugPrint('[UserService] updateProfile: API error: ${e.message}');

      // Map error to user-friendly message
      String errorMessage;
      if (e.message.contains('Unauthorized')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e.message.contains('timeout')) {
        errorMessage = 'Connexion impossible. Vérifiez votre réseau.';
      } else if (e.message.contains('Server error')) {
        errorMessage = 'Erreur serveur. Réessayez plus tard.';
      } else {
        errorMessage = 'Une erreur est survenue. Réessayez.';
      }

      _lastUpdateResult = ProfileUpdateResult.failure(errorMessage);
      return _lastUpdateResult!;
    } catch (e) {
      debugPrint('[UserService] updateProfile: unexpected error: $e');
      _lastUpdateResult = ProfileUpdateResult.failure(
        'Une erreur inattendue est survenue.',
      );
      return _lastUpdateResult!;
    }
  }

  /// Fetches the current user profile for pre-filling forms.
  ///
  /// Returns a Map with profile data, or null on error.
  static Future<Map<String, dynamic>?> fetchCurrentProfile() async {
    try {
      debugPrint('[UserService] fetchCurrentProfile: starting...');
      final profile = await _api.fetchMe();
      debugPrint('[UserService] fetchCurrentProfile: success');
      return profile;
    } catch (e) {
      debugPrint('[UserService] fetchCurrentProfile: error: $e');
      return null;
    }
  }
}

/// Result of a profile update operation.
class ProfileUpdateResult {
  const ProfileUpdateResult._({
    required this.isSuccess,
    this.data,
    this.errorMessage,
  });

  /// Creates a success result.
  factory ProfileUpdateResult.success(Map<String, dynamic> data) {
    return ProfileUpdateResult._(isSuccess: true, data: data);
  }

  /// Creates a failure result.
  factory ProfileUpdateResult.failure(String errorMessage) {
    return ProfileUpdateResult._(isSuccess: false, errorMessage: errorMessage);
  }

  /// Whether the update was successful.
  final bool isSuccess;

  /// The updated profile data (on success).
  final Map<String, dynamic>? data;

  /// The error message (on failure).
  final String? errorMessage;
}

