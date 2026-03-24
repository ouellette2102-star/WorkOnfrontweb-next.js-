/// Authentication service for WorkOn.
///
/// Provides a high-level API for user authentication including login,
/// registration, token validation, and logout.
///
/// **Architecture:**
/// - Uses [AuthRepository] abstraction for backend operations
/// - Manages in-memory session state
/// - Exposes typed errors for error handling
/// - Exposes [AuthState] via [ValueNotifier] for reactive updates (PR#7)
/// - Updates [UserService] context on auth events (PR#10)
/// - Exposes [AppSession] for session access (PR#11)
/// - Enriches user role from backend after auth (PR#12)
/// - Persists tokens with [TokenStorage] (PR-F04)
/// - Automatic token refresh on 401 (PR-F17)
///
/// **Current State (PR-F17):** Tokens refresh automatically when expired.
library;

import 'package:flutter/foundation.dart';

import '../analytics/analytics_service.dart';
import '../push/push_service.dart';
import '../user/user_service.dart';
import 'app_session.dart';
import 'auth_errors.dart';
import 'auth_models.dart';
import 'auth_repository.dart';
import 'auth_state.dart';
import 'real_auth_repository.dart';
import 'token_storage.dart';

/// Authentication service handling user login, registration, and session.
///
/// ## Usage
///
/// ```dart
/// // Initialize (typically done once at app startup)
/// AuthService.initialize();
///
/// // Login
/// final session = await AuthService.login(
///   email: 'user@example.com',
///   password: 'password123',
/// );
///
/// // Check authentication state
/// if (AuthService.isAuthenticated) {
///   print('Logged in as ${AuthService.currentUser?.email}');
/// }
///
/// // Logout
/// await AuthService.logout();
/// ```
///
/// ## Repository Pattern
///
/// This service delegates to [RealAuthRepository] which connects to the
/// Railway backend. For testing, use [initialize] to inject a mock.
abstract final class AuthService {
  // ─────────────────────────────────────────────────────────────────────────
  // Repository (Dependency Injection Point)
  // ─────────────────────────────────────────────────────────────────────────

  /// The repository used for authentication operations.
  ///
  /// Defaults to [RealAuthRepository] which connects to Railway backend.
  static AuthRepository _repository = RealAuthRepository();

  /// Initializes the AuthService with a custom repository.
  ///
  /// Primarily used for testing to inject a mock implementation.
  /// Production code uses the default [RealAuthRepository].
  static void initialize({AuthRepository? repository}) {
    if (repository != null) {
      _repository = repository;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auth State (PR#7)
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal notifier for auth state changes.
  static final ValueNotifier<AuthState> _state =
      ValueNotifier(const AuthState.unknown());

  /// Exposes auth state as a listenable for reactive updates.
  ///
  /// Use this to listen for auth state changes without polling:
  /// ```dart
  /// AuthService.stateListenable.addListener(() {
  ///   final state = AuthService.state;
  ///   // Handle state change
  /// });
  /// ```
  static ValueListenable<AuthState> get stateListenable => _state;

  /// Returns the current auth state.
  ///
  /// Check [AuthState.status] to determine if user is authenticated.
  static AuthState get state => _state.value;

  /// Updates the auth state.
  ///
  /// Notifies all listeners of the change.
  static void setAuthState(AuthState next) {
    _state.value = next;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // App Session (PR#11)
  // ─────────────────────────────────────────────────────────────────────────

  /// Internal notifier for app session changes.
  static final ValueNotifier<AppSession> _session =
      ValueNotifier(const AppSession.none());

  /// Exposes app session as a listenable for reactive updates.
  ///
  /// Use this to listen for session changes:
  /// ```dart
  /// AuthService.sessionListenable.addListener(() {
  ///   final session = AuthService.session;
  ///   if (session.hasSession) {
  ///     // User is logged in
  ///   }
  /// });
  /// ```
  static ValueListenable<AppSession> get sessionListenable => _session;

  /// Returns the current app session.
  static AppSession get session => _session.value;

  /// Returns `true` if an authenticated session exists.
  ///
  /// Convenience getter equivalent to `session.hasSession`.
  static bool get hasSession => _session.value.hasSession;

  /// Updates the app session.
  ///
  /// Internal method - use login/logout methods instead.
  static void _setSession(AppSession next) {
    _session.value = next;
  }

  /// Sets the in-memory session during bootstrap without extra network calls.
  ///
  /// Used by AuthBootstrap after /auth/me validation to ensure
  /// [hasSession] and [session] are ready before protected API calls.
  static void setSessionFromBootstrap({
    required AuthUser user,
    required AuthTokens tokens,
  }) {
    _currentSession = AuthSession(user: user, tokens: tokens);
    _setSession(AppSession.fromToken(tokens.accessToken));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session State (In-Memory)
  // ─────────────────────────────────────────────────────────────────────────

  /// Current authentication session (null if not logged in).
  static AuthSession? _currentSession;

  /// Returns the current session, or null if not authenticated.
  static AuthSession? get currentSession => _currentSession;

  /// Returns `true` if a user is currently authenticated.
  static bool get isAuthenticated => _currentSession != null;

  /// Alias for [isAuthenticated] for backward compatibility.
  static bool get isLoggedIn => isAuthenticated;

  /// Returns the current user, or null if not authenticated.
  static AuthUser? get currentUser => _currentSession?.user;

  /// Returns the current user's ID, or null if not authenticated.
  static String? get currentUserId => _currentSession?.user.id;

  /// Returns the current tokens, or null if not authenticated.
  static AuthTokens? get currentTokens => _currentSession?.tokens;

  /// Returns the current access token, or null if not authenticated.
  static String? get accessToken => _currentSession?.tokens.accessToken;

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication Methods
  // ─────────────────────────────────────────────────────────────────────────

  /// Authenticates a user with email and password.
  ///
  /// Returns the authenticated [AuthUser] on success.
  /// Updates [currentSession], [currentUser], and [currentTokens].
  ///
  /// Throws:
  /// - [InvalidCredentialsException] if credentials are incorrect.
  /// - [AuthNetworkException] if connection fails.
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   final user = await AuthService.login(
  ///     email: 'user@example.com',
  ///     password: 'password123',
  ///   );
  ///   print('Welcome, ${user.name}!');
  /// } on InvalidCredentialsException {
  ///   print('Wrong email or password');
  /// }
  /// ```
  static Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final session = await _repository.login(
      email: email,
      password: password,
    );

    _currentSession = session;
    // PR#7: Update auth state on successful login
    setAuthState(AuthState.authenticated(
      userId: session.user.id,
      email: session.user.email,
    ));
    // PR#10: Update user context
    await UserService.setFromAuth(
      userId: session.user.id,
      email: session.user.email,
    );
    // PR#11: Update app session
    _setSession(AppSession.fromToken(session.tokens.accessToken));
    // PR-F04: Persist tokens
    await TokenStorage.saveTokens(
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      expiresAt: session.tokens.expiresAt,
    );
    // PR#12: Enrich user role from backend (fire-and-forget, non-blocking)
    UserService.refreshFromBackendIfPossible();
    // PR-F20: Register device for push notifications (fire-and-forget)
    PushService.registerDeviceIfNeeded();
    // PR-23: Track login success
    AnalyticsService.setUserId(session.user.id);
    AnalyticsService.trackLoginSuccess(method: 'email');
    return session.user;
  }

  /// Registers a new user account.
  ///
  /// Returns the newly created [AuthUser] on success.
  /// Automatically logs in the user (sets [currentSession]).
  ///
  /// Throws:
  /// - [EmailAlreadyInUseException] if email is already registered.
  /// - [AuthNetworkException] if connection fails.
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   final user = await AuthService.register(
  ///     email: 'newuser@example.com',
  ///     password: 'securePassword123',
  ///     name: 'John Doe',
  ///   );
  ///   print('Account created for ${user.email}');
  /// } on EmailAlreadyInUseException {
  ///   print('This email is already registered');
  /// }
  /// ```
  static Future<AuthUser> register({
    required String email,
    required String password,
    String? name,
  }) async {
    final session = await _repository.register(
      email: email,
      password: password,
      name: name,
    );

    _currentSession = session;
    // PR#7: Update auth state on successful registration
    setAuthState(AuthState.authenticated(
      userId: session.user.id,
      email: session.user.email,
    ));
    // PR#10: Update user context
    await UserService.setFromAuth(
      userId: session.user.id,
      email: session.user.email,
    );
    // PR#11: Update app session
    _setSession(AppSession.fromToken(session.tokens.accessToken));
    // PR-F04: Persist tokens
    await TokenStorage.saveTokens(
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      expiresAt: session.tokens.expiresAt,
    );
    // PR#12: Enrich user role from backend (fire-and-forget, non-blocking)
    UserService.refreshFromBackendIfPossible();
    // PR-F20: Register device for push notifications (fire-and-forget)
    PushService.registerDeviceIfNeeded();
    // PR-23: Track sign up completed
    AnalyticsService.setUserId(session.user.id);
    AnalyticsService.trackSignUpCompleted(method: 'email');
    return session.user;
  }

  /// Fetches the current user's profile using the stored access token.
  ///
  /// If [accessToken] is provided, uses that token instead of the stored one.
  /// Updates [currentUser] with the fetched data.
  ///
  /// Returns the [AuthUser] associated with the token.
  ///
  /// Throws:
  /// - [UnauthorizedException] if the token is invalid or expired.
  /// - [AuthException] if no token is available.
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   final user = await AuthService.me();
  ///   print('Current user: ${user.email}');
  /// } on UnauthorizedException {
  ///   // Token expired, redirect to login
  /// }
  /// ```
  static Future<AuthUser> me({String? accessToken}) async {
    final token = accessToken ?? _currentSession?.tokens.accessToken;

    if (token == null) {
      throw const UnauthorizedException();
    }

    final user = await _repository.me(accessToken: token);

    // Update session user if we have an active session
    if (_currentSession != null) {
      _currentSession = AuthSession(
        user: user,
        tokens: _currentSession!.tokens,
      );
    }

    return user;
  }

  /// Logs out the current user and clears the session.
  ///
  /// This method:
  /// 1. Notifies the repository to invalidate server session (if applicable)
  /// 2. Clears local session state
  ///
  /// Always succeeds locally even if server logout fails (fire-and-forget).
  ///
  /// Example:
  /// ```dart
  /// await AuthService.logout();
  /// // User is now logged out
  /// assert(!AuthService.isAuthenticated);
  /// ```
  static Future<void> logout() async {
    final token = _currentSession?.tokens.accessToken;

    // PR-23: Track logout before clearing session
    AnalyticsService.track(AnalyticsEvent.logout);
    AnalyticsService.clearUserId();

    // PR-F20: Unregister device from push (fire-and-forget, before clearing session)
    await PushService.unregisterDevice();

    // Clear local session first (ensures logout even if network fails)
    _currentSession = null;
    // PR#7: Update auth state on logout
    setAuthState(const AuthState.unauthenticated());
    // PR#10: Reset user context
    UserService.reset();
    // PR#11: Clear app session
    _setSession(const AppSession.none());
    // PR-F04: Clear persisted tokens
    await TokenStorage.clearToken();

    // Attempt server logout (fire-and-forget)
    try {
      await _repository.logout(accessToken: token);
    } catch (_) {
      // Ignore errors - local logout is sufficient
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F14: Password Reset
  // ─────────────────────────────────────────────────────────────────────────

  /// Requests a password reset email/code.
  ///
  /// Sends a verification code to the user's email address.
  ///
  /// Throws [AuthException] on failure (network, invalid email, etc.).
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   await AuthService.forgotPassword(email: 'user@example.com');
  ///   print('Code sent!');
  /// } on AuthException catch (e) {
  ///   print('Error: ${e.message}');
  /// }
  /// ```
  static Future<void> forgotPassword({required String email}) async {
    final trimmedEmail = email.trim();
    
    if (trimmedEmail.isEmpty) {
      throw const AuthException('Adresse email requise');
    }
    
    // Basic email validation
    if (!trimmedEmail.contains('@') || !trimmedEmail.contains('.')) {
      throw const AuthException('Adresse email invalide');
    }
    
    debugPrint('[AuthService] Requesting password reset for $trimmedEmail');
    await _repository.forgotPassword(email: trimmedEmail);
    debugPrint('[AuthService] Password reset code sent');
  }

  /// Resets the user's password using a verification code.
  ///
  /// Verifies the code and sets a new password.
  /// Does NOT auto-login after reset (user must login manually).
  ///
  /// Throws [AuthException] on failure (invalid code, weak password, etc.).
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   await AuthService.resetPassword(
  ///     email: 'user@example.com',
  ///     code: '1234',
  ///     newPassword: 'newSecurePassword123',
  ///   );
  ///   print('Password reset successful!');
  /// } on AuthException catch (e) {
  ///   print('Error: ${e.message}');
  /// }
  /// ```
  static Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    final trimmedEmail = email.trim();
    final trimmedCode = code.trim();
    
    if (trimmedEmail.isEmpty) {
      throw const AuthException('Adresse email requise');
    }
    
    if (trimmedCode.isEmpty) {
      throw const AuthException('Code de vérification requis');
    }
    
    if (newPassword.length < 8) {
      throw const AuthException('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    debugPrint('[AuthService] Resetting password for $trimmedEmail');
    await _repository.resetPassword(
      email: trimmedEmail,
      code: trimmedCode,
      newPassword: newPassword,
    );
    debugPrint('[AuthService] Password reset successful');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────────────────

  /// Restores a session from stored tokens.
  ///
  /// Use this at app startup to restore a previously authenticated session.
  /// Validates the token by calling [me] to ensure it's still valid.
  ///
  /// Returns `true` if session was restored successfully.
  /// Returns `false` if token is invalid or expired.
  static Future<bool> restoreSession(AuthTokens tokens) async {
    try {
      final user = await _repository.me(accessToken: tokens.accessToken);
      _currentSession = AuthSession(user: user, tokens: tokens);
      return true;
    } on AuthException {
      _currentSession = null;
      return false;
    }
  }

  /// Attempts to restore session from persisted storage.
  ///
  /// Call this at app startup to automatically log in returning users.
  /// Initializes [TokenStorage], checks for stored token, validates with backend.
  /// 
  /// **Uber-grade flow:**
  /// 1. If access token exists → try /auth/me
  /// 2. If /auth/me fails with 401 → try refresh token
  /// 3. If refresh succeeds → retry /auth/me with new token
  /// 4. If refresh fails → clear tokens and return false
  ///
  /// Returns `true` if session was restored successfully.
  /// Returns `false` if no token stored, token invalid, or network error.
  ///
  /// **Never throws** - all errors result in `false`.
  ///
  /// Example (in main.dart):
  /// ```dart
  /// void main() async {
  ///   WidgetsFlutterBinding.ensureInitialized();
  ///   await AuthService.tryRestoreSession();
  ///   runApp(MyApp());
  /// }
  /// ```
  static Future<bool> tryRestoreSession() async {
    try {
      // Initialize token storage
      final hasToken = await TokenStorage.initialize();
      if (!hasToken) {
        debugPrint('[AuthService] No stored token found');
        return false;
      }

      // Get stored token
      var accessToken = TokenStorage.getToken();
      if (accessToken == null || accessToken.isEmpty) {
        debugPrint('[AuthService] Stored token is empty');
        return false;
      }

      // Check if expired locally - try refresh first before giving up
      if (TokenStorage.isExpired) {
        debugPrint('[AuthService] Stored token is expired, attempting refresh...');
        final refreshed = await tryRefreshTokens();
        if (!refreshed) {
          debugPrint('[AuthService] Refresh failed, clearing tokens');
          await TokenStorage.clearToken();
          return false;
        }
        // Get the new token after refresh
        accessToken = TokenStorage.getToken();
        if (accessToken == null || accessToken.isEmpty) {
          debugPrint('[AuthService] No token after refresh');
          return false;
        }
        debugPrint('[AuthService] Token refreshed successfully');
      }

      // Validate with backend (with retry on 401)
      debugPrint('[AuthService] Validating stored token with backend...');
      AuthUser user;
      try {
        user = await _repository.me(accessToken: accessToken);
      } on UnauthorizedException {
        // Token rejected by backend - try refresh once
        debugPrint('[AuthService] Token rejected (401), attempting refresh...');
        final refreshed = await tryRefreshTokens();
        if (!refreshed) {
          debugPrint('[AuthService] Refresh failed after 401');
          await TokenStorage.clearToken();
          return false;
        }
        // Retry /auth/me with new token
        accessToken = TokenStorage.getToken();
        if (accessToken == null || accessToken.isEmpty) {
          debugPrint('[AuthService] No token after refresh');
          return false;
        }
        debugPrint('[AuthService] Retrying /auth/me with refreshed token...');
        user = await _repository.me(accessToken: accessToken);
      }

      // Restore session
      final tokens = AuthTokens(
        accessToken: accessToken,
        refreshToken: TokenStorage.getRefreshToken() ?? '',
        expiresAt: TokenStorage.getExpiry(),
      );
      _currentSession = AuthSession(user: user, tokens: tokens);

      // Update state
      setAuthState(AuthState.authenticated(
        userId: user.id,
        email: user.email,
      ));
      _setSession(AppSession.fromToken(accessToken));
      await UserService.setFromAuth(userId: user.id, email: user.email);
      UserService.refreshFromBackendIfPossible();
      // PR-22: Register device for push notifications on session restore (fire-and-forget)
      PushService.registerDeviceIfNeeded();

      debugPrint('[AuthService] Session restored for ${user.email}');
      return true;
    } catch (e) {
      debugPrint('[AuthService] Failed to restore session: $e');
      // Clear invalid stored token
      await TokenStorage.clearToken();
      return false;
    }
  }

  /// Clears all session state.
  ///
  /// Use for testing or forced logout without server notification.
  static Future<void> reset() async {
    _currentSession = null;
    setAuthState(const AuthState.unknown());
    UserService.reset(); // PR#10
    _setSession(const AppSession.none()); // PR#11
    await TokenStorage.clearToken(); // PR-F04
  }

  /// Resets the repository to default [RealAuthRepository].
  ///
  /// Use after testing to restore production state.
  static Future<void> resetRepository() async {
    _repository = RealAuthRepository();
    _currentSession = null;
    setAuthState(const AuthState.unknown());
    UserService.reset(); // PR#10
    _setSession(const AppSession.none()); // PR#11
    await TokenStorage.clearToken(); // PR-F04
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F2: Email Change
  // ─────────────────────────────────────────────────────────────────────────

  /// Requests an email change by sending OTP to the new email address.
  ///
  /// This is the first step of the email change flow.
  /// After calling this, the user should enter the 6-digit OTP code
  /// and call [verifyEmailOtp].
  ///
  /// Throws [AuthException] on validation error or rate limit.
  /// Throws [UnauthorizedException] if not authenticated.
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   await AuthService.requestEmailChange(newEmail: 'new@example.com');
  ///   // Navigate to OTP verification screen
  /// } on AuthException catch (e) {
  ///   print('Error: ${e.message}');
  /// }
  /// ```
  static Future<void> requestEmailChange({required String newEmail}) async {
    final trimmedEmail = newEmail.trim();
    
    if (trimmedEmail.isEmpty) {
      throw const AuthException('Adresse email requise');
    }
    
    // Basic email validation
    if (!trimmedEmail.contains('@') || !trimmedEmail.contains('.')) {
      throw const AuthException('Adresse email invalide');
    }
    
    debugPrint('[AuthService] Requesting email change to $trimmedEmail');
    await _repository.requestEmailChange(newEmail: trimmedEmail);
    debugPrint('[AuthService] OTP sent to new email');
  }

  /// Verifies the OTP code and updates the user's email.
  ///
  /// This is the second step of the email change flow.
  /// Call this after receiving the 6-digit OTP code via email.
  ///
  /// Throws [AuthException] with specific error codes:
  /// - OTP_INVALID: Wrong code
  /// - OTP_EXPIRED: Code expired (10 min)
  /// - OTP_LOCKED: Too many attempts
  /// - EMAIL_IN_USE: Email already taken
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   await AuthService.verifyEmailOtp(
  ///     newEmail: 'new@example.com',
  ///     code: '123456',
  ///   );
  ///   print('Email updated successfully!');
  /// } on AuthException catch (e) {
  ///   print('Error: ${e.message}');
  /// }
  /// ```
  static Future<void> verifyEmailOtp({
    required String newEmail,
    required String code,
  }) async {
    final trimmedCode = code.trim();
    
    if (trimmedCode.isEmpty) {
      throw const AuthException('Code de vérification requis');
    }
    
    if (trimmedCode.length != 6) {
      throw const AuthException('Le code doit contenir 6 chiffres');
    }
    
    debugPrint('[AuthService] Verifying OTP for email change to $newEmail');
    await _repository.verifyEmailOtp(newEmail: newEmail, code: trimmedCode);
    
    // Update local session email if we have a session
    if (_currentSession != null) {
      _currentSession = AuthSession(
        user: AuthUser(
          id: _currentSession!.user.id,
          email: newEmail,
          name: _currentSession!.user.name,
        ),
        tokens: _currentSession!.tokens,
      );
      
      // Update auth state
      setAuthState(AuthState.authenticated(
        userId: _currentSession!.user.id,
        email: newEmail,
      ));
      
      // Update user service
      await UserService.setFromAuth(
        userId: _currentSession!.user.id,
        email: newEmail,
      );
    }
    
    debugPrint('[AuthService] Email changed successfully');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F2: Account Deletion
  // ─────────────────────────────────────────────────────────────────────────

  /// Permanently deletes the user's account.
  ///
  /// This action is IRREVERSIBLE. The user's data will be anonymized/deleted
  /// in compliance with GDPR.
  ///
  /// After successful deletion, the session is cleared and the user
  /// is logged out.
  ///
  /// Throws [AuthException] on failure.
  /// Throws [UnauthorizedException] if not authenticated.
  ///
  /// Example:
  /// ```dart
  /// try {
  ///   await AuthService.deleteAccount();
  ///   // Navigate to onboarding/login screen
  /// } on AuthException catch (e) {
  ///   print('Error: ${e.message}');
  /// }
  /// ```
  static Future<void> deleteAccount() async {
    debugPrint('[AuthService] Deleting account...');
    
    // Call backend to delete account
    await _repository.deleteAccount();
    
    // Clear all local state (similar to logout)
    await PushService.unregisterDevice();
    _currentSession = null;
    setAuthState(const AuthState.unauthenticated());
    UserService.reset();
    _setSession(const AppSession.none());
    await TokenStorage.clearToken();
    
    debugPrint('[AuthService] Account deleted successfully');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Validation (PR#6)
  // ─────────────────────────────────────────────────────────────────────────

  /// Checks if the current session is valid by calling the backend.
  ///
  /// This method:
  /// 1. Checks if a session exists locally
  /// 2. Validates the token with /auth/me
  /// 3. Returns result without throwing
  ///
  /// Returns `true` if session is valid and backend confirms.
  /// Returns `false` on any error (no session, expired, network, etc.).
  ///
  /// **Never throws** - all exceptions are caught and return `false`.
  ///
  /// Example:
  /// ```dart
  /// if (await AuthService.hasValidSession()) {
  ///   // User is authenticated
  /// } else {
  ///   // Redirect to login
  /// }
  /// ```
  static Future<bool> hasValidSession() async {
    // No session = not valid
    if (_currentSession == null) {
      return false;
    }

    // No token = not valid
    final token = _currentSession?.tokens.accessToken;
    if (token == null || token.isEmpty) {
      return false;
    }

    // Check if token is expired locally (quick check)
    if (_currentSession!.tokens.isExpired) {
      _currentSession = null;
      return false;
    }

    // Validate with backend
    try {
      await _repository.me(accessToken: token);
      return true;
    } catch (_) {
      // Any error = session invalid
      // Don't clear session here - let caller decide
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auth State Refresh (PR#7)
  // ─────────────────────────────────────────────────────────────────────────

  /// Refreshes the auth state based on current session validity.
  ///
  /// This method:
  /// 1. Calls [hasValidSession] to check if session is valid
  /// 2. Updates [state] to [AuthStatus.authenticated] or [AuthStatus.unauthenticated]
  /// 3. Returns the result
  ///
  /// **Never throws** - all exceptions result in unauthenticated state.
  ///
  /// Returns `true` if session is valid and state is authenticated.
  /// Returns `false` if session is invalid and state is unauthenticated.
  ///
  /// Example:
  /// ```dart
  /// final isValid = await AuthService.refreshAuthState();
  /// // AuthService.state is now updated
  /// ```
  static Future<bool> refreshAuthState() async {
    try {
      final isValid = await hasValidSession();

      if (isValid && _currentSession != null) {
        setAuthState(AuthState.authenticated(
          userId: _currentSession!.user.id,
          email: _currentSession!.user.email,
        ));
        return true;
      } else {
        setAuthState(const AuthState.unauthenticated());
        return false;
      }
    } catch (_) {
      // On any error, set unauthenticated
      setAuthState(const AuthState.unauthenticated());
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PR-F17: Token Refresh
  // ─────────────────────────────────────────────────────────────────────────

  /// Attempts to refresh the access token using the stored refresh token.
  ///
  /// This method:
  /// 1. Gets refresh token from storage
  /// 2. Calls backend to get new tokens
  /// 3. Updates storage and session with new tokens
  ///
  /// Returns `true` if refresh succeeded, `false` otherwise.
  ///
  /// **Never throws** - all errors return `false`.
  ///
  /// Example:
  /// ```dart
  /// if (await AuthService.tryRefreshTokens()) {
  ///   // Tokens refreshed, retry request
  /// } else {
  ///   // Refresh failed, logout
  /// }
  /// ```
  static Future<bool> tryRefreshTokens() async {
    try {
      // Get refresh token from storage
      final refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        debugPrint('[AuthService] No refresh token available');
        return false;
      }

      debugPrint('[AuthService] Attempting token refresh...');

      // Call repository to refresh
      final newTokens = await _repository.refreshTokens(refreshToken: refreshToken);

      // Update storage
      await TokenStorage.saveTokens(
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt,
      );

      // Update in-memory session if exists
      if (_currentSession != null) {
        _currentSession = AuthSession(
          user: _currentSession!.user,
          tokens: newTokens,
        );
      }

      // Update app session
      _setSession(AppSession.fromToken(newTokens.accessToken));

      debugPrint('[AuthService] Token refresh successful');
      return true;
    } on UnauthorizedException {
      debugPrint('[AuthService] Refresh token invalid/expired');
      return false;
    } on AuthException catch (e) {
      debugPrint('[AuthService] Token refresh auth error: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('[AuthService] Token refresh error: $e');
      return false;
    }
  }
}
