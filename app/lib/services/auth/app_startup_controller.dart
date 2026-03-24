/// App startup controller for WorkOn.
///
/// Orchestrates the app boot process and provides a single source of truth
/// for the app's initialization state.
///
/// **PR#8:** Initial implementation with AppBootState management.
/// **PR-STATE:** Uses cached bootstrap result to avoid double bootstrap.
library;

import 'package:flutter/foundation.dart';

import 'app_boot_state.dart';
import 'auth_bootstrap.dart';
import 'auth_service.dart';
import 'auth_state.dart';

/// Controller that orchestrates app startup and manages boot state.
///
/// This controller:
/// - Initializes authentication at app startup
/// - Listens to auth state changes
/// - Provides a unified boot state (loading → authenticated/unauthenticated)
///
/// ## Usage
///
/// ```dart
/// // Create and initialize at app startup
/// final controller = AppStartupController();
/// await controller.initialize();
///
/// // Listen for boot state changes
/// controller.bootStateListenable.addListener(() {
///   final state = controller.bootState;
///   // Handle state change
/// });
///
/// // Don't forget to dispose when done
/// controller.dispose();
/// ```
///
/// ## Lifecycle
///
/// 1. Create controller (boot state = loading)
/// 2. Call `initialize()` to start auth check
/// 3. Boot state transitions to authenticated or unauthenticated
/// 4. Auth state changes are automatically reflected in boot state
/// 5. Call `dispose()` when controller is no longer needed
class AppStartupController {
  /// Creates an [AppStartupController].
  ///
  /// The controller starts in loading state.
  /// Call [initialize] to begin the boot process.
  AppStartupController();

  // ─────────────────────────────────────────────────────────────────────────
  // Boot State
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal notifier for boot state changes.
  final ValueNotifier<AppBootState> _bootState =
      ValueNotifier(const AppBootState.loading());

  /// Exposes boot state as a listenable for reactive updates.
  ///
  /// Use this to listen for boot state changes:
  /// ```dart
  /// controller.bootStateListenable.addListener(() {
  ///   final state = controller.bootState;
  ///   // Handle state
  /// });
  /// ```
  ValueListenable<AppBootState> get bootStateListenable => _bootState;

  /// Returns the current boot state.
  AppBootState get bootState => _bootState.value;

  // ─────────────────────────────────────────────────────────────────────────
  // Subscription Management
  // ─────────────────────────────────────────────────────────────────────────

  /// Listener function for auth state changes.
  VoidCallback? _authStateListener;

  /// Whether the controller has been initialized.
  bool _isInitialized = false;

  /// Whether the controller has been disposed.
  bool _isDisposed = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  /// Initializes the app startup sequence.
  ///
  /// This method:
  /// 1. Sets boot state to loading
  /// 2. Uses cached [BootstrapResult] if available (PR-STATE)
  /// 3. Otherwise calls [AuthBootstrap.bootstrapAuth]
  /// 4. Subscribes to [AuthService.stateListenable] for ongoing updates
  /// 5. Maps [AuthState]/[BootstrapResult] to [AppBootState]
  ///
  /// **Never throws** - all exceptions result in unauthenticated state.
  ///
  /// Can only be called once. Subsequent calls are no-ops.
  ///
  /// Example:
  /// ```dart
  /// final controller = AppStartupController();
  /// await controller.initialize();
  /// // Boot state is now authenticated or unauthenticated
  /// ```
  Future<void> initialize() async {
    // Prevent double initialization
    if (_isInitialized || _isDisposed) {
      return;
    }
    _isInitialized = true;

    // Ensure we start in loading state
    _bootState.value = const AppBootState.loading();

    try {
      // Subscribe to auth state changes first
      _subscribeToAuthState();

      // PR-STATE: Use cached bootstrap result if available
      // This prevents double API calls during startup
      final cachedResult = AuthBootstrap.lastResult;
      if (cachedResult != null) {
        debugPrint('[AppStartupController] Using cached bootstrap result: $cachedResult');
        _applyBootstrapResult(cachedResult);
        return;
      }

      // Fallback: run bootstrap (should rarely happen if main() calls bootstrapAuth first)
      debugPrint('[AppStartupController] No cached result, running bootstrap...');
      final result = await AuthBootstrap.bootstrapAuth();
      _applyBootstrapResult(result);
    } catch (_) {
      // On any error, set unauthenticated
      _bootState.value = const AppBootState.unauthenticated();
    }
  }

  /// PR-STATE: Applies a [BootstrapResult] to the boot state.
  ///
  /// **FIX-LOGIN-STUCK:** Always check current AuthService.state for auth cases.
  /// The cached BootstrapResult may be stale if user just logged in after
  /// the initial bootstrap (which returned unauthenticated).
  void _applyBootstrapResult(BootstrapResult result) {
    // FIX-LOGIN-STUCK: Always sync with current auth state first.
    // This handles the case where user logged in after initial bootstrap,
    // and the cached result is stale (unauthenticated) but AuthService.state
    // is now authenticated.
    final currentAuthState = AuthService.state;
    if (currentAuthState.status == AuthStatus.authenticated) {
      debugPrint('[AppStartupController] Auth state is authenticated, overriding cached result');
      _syncFromAuthState(currentAuthState);
      return;
    }

    switch (result) {
      case BootstrapResult.authenticated:
        _syncFromAuthState(AuthService.state);
      case BootstrapResult.unauthenticated:
        _bootState.value = const AppBootState.unauthenticated();
      case BootstrapResult.networkError:
        // PR-STATE: Network error - show network error state
        // Tokens are preserved; user may still have a valid session
        _bootState.value = const AppBootState.networkError();
    }
  }

  /// Subscribes to auth state changes.
  void _subscribeToAuthState() {
    _authStateListener = () {
      if (!_isDisposed) {
        _syncFromAuthState(AuthService.state);
      }
    };
    AuthService.stateListenable.addListener(_authStateListener!);
  }

  /// Maps AuthState to AppBootState.
  void _syncFromAuthState(AuthState authState) {
    switch (authState.status) {
      case AuthStatus.authenticated:
        _bootState.value = AppBootState.authenticated(
          userId: authState.userId ?? '',
          email: authState.email ?? '',
        );
      case AuthStatus.unauthenticated:
        _bootState.value = const AppBootState.unauthenticated();
      case AuthStatus.unknown:
        // If still unknown after init, treat as unauthenticated
        // This provides deterministic behavior
        if (_isInitialized) {
          _bootState.value = const AppBootState.unauthenticated();
        }
        // Otherwise keep loading (before init completes)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Disposal
  // ─────────────────────────────────────────────────────────────────────────

  /// Disposes the controller and releases resources.
  ///
  /// Removes the auth state listener and disposes the boot state notifier.
  /// After disposal, the controller cannot be used.
  ///
  /// Example:
  /// ```dart
  /// controller.dispose();
  /// // Controller is now disposed
  /// ```
  void dispose() {
    if (_isDisposed) {
      return;
    }
    _isDisposed = true;

    // Remove auth state listener
    if (_authStateListener != null) {
      AuthService.stateListenable.removeListener(_authStateListener!);
      _authStateListener = null;
    }

    // Dispose the notifier
    _bootState.dispose();
  }
}

