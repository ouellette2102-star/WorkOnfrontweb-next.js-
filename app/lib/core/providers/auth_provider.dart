/// Auth state provider for WorkOn.
///
/// Bridges [AuthService] reactive state with Flutter's Provider system.
library;

import 'package:flutter/foundation.dart';

import '../../services/auth/auth_service.dart';
import '../../services/auth/auth_state.dart';
import '../../services/auth/token_storage.dart';
import '../../services/user/user_context.dart';
import '../../services/user/user_service.dart';

export '../../services/auth/auth_state.dart';
export '../../services/user/user_context.dart';

/// Provider that exposes authentication state to the widget tree.
class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    AuthService.stateListenable.addListener(_onAuthStateChanged);
    UserService.contextListenable.addListener(_onUserContextChanged);
  }

  void _onAuthStateChanged() => notifyListeners();
  void _onUserContextChanged() => notifyListeners();

  // ─────────────────────────────────────────────────────────────────────────
  // Auth State
  // ─────────────────────────────────────────────────────────────────────────

  AuthState get authState => AuthService.state;
  bool get isLoggedIn => AuthService.hasSession;
  bool get isLoading => authState.status == AuthStatus.unknown;

  // ─────────────────────────────────────────────────────────────────────────
  // User Info (from UserService context)
  // ─────────────────────────────────────────────────────────────────────────

  UserContext get userContext => UserService.context;

  String? get userId => userContext.userId;
  String? get userEmail => userContext.email;
  UserRole get role => userContext.role;

  bool get isWorker => role == UserRole.worker;
  bool get isEmployer =>
      role == UserRole.employer || role == UserRole.residential;

  String? get firstName => AuthService.currentUser?.name?.split(' ').first;
  String? get lastName {
    final parts = AuthService.currentUser?.name?.split(' ');
    return (parts != null && parts.length > 1) ? parts.last : null;
  }

  String get displayName => AuthService.currentUser?.name ?? userEmail ?? '';

  // ─────────────────────────────────────────────────────────────────────────
  // Token
  // ─────────────────────────────────────────────────────────────────────────

  String? get token => TokenStorage.getToken();

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> logout() async {
    await AuthService.logout();
    notifyListeners();
  }

  @override
  void dispose() {
    AuthService.stateListenable.removeListener(_onAuthStateChanged);
    UserService.contextListenable.removeListener(_onUserContextChanged);
    super.dispose();
  }
}
