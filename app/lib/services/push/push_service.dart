/// Push notifications service for WorkOn.
///
/// **PR-F20:** Initial implementation.
/// **PR-22:** Added retry/backoff, improved token management.
/// **PR-F26:** Enabled Firebase Cloud Messaging integration.
///
/// This service manages:
/// - FCM token retrieval and registration
/// - Foreground/background notification handling
/// - Navigation on notification tap
/// - Retry with exponential backoff on failure
///
/// ## Usage
///
/// ```dart
/// // Initialize at app startup (after auth)
/// await PushService.initialize();
///
/// // Register after login
/// await PushService.registerDeviceIfNeeded();
///
/// // Unregister on logout
/// await PushService.unregisterDevice();
/// ```
library;

import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';
import '../auth/token_storage.dart';
import '../messages/messages_service.dart';
import 'notification_prefs.dart';
import 'push_api.dart';
import 'push_config.dart';

/// Callback type for handling notification taps.
typedef NotificationTapCallback = void Function(Map<String, dynamic> data);

/// Push service status for UI feedback.
enum PushStatus {
  /// Not initialized yet.
  unknown,
  
  /// Ready and registered.
  ready,
  
  /// Token not available (Firebase not configured or permission denied).
  tokenUnavailable,
  
  /// Registration pending (will retry).
  pendingRegistration,
  
  /// Push disabled by configuration.
  disabled,
  
  /// Firebase not configured (missing google-services.json).
  firebaseNotConfigured,
}

/// Service that manages push notifications.
///
/// All operations are NO-OP when [PushConfig.enabled] is `false`.
abstract final class PushService {
  static const PushApi _api = PushApi();

  /// Current FCM token (null if not retrieved or disabled).
  static String? _fcmToken;

  /// Whether the service has been initialized.
  static bool _initialized = false;
  
  /// Whether Firebase is available.
  static bool _firebaseAvailable = false;

  /// Navigator key for navigation from notifications.
  static GlobalKey<NavigatorState>? _navigatorKey;

  /// Current retry count for registration.
  static int _retryCount = 0;

  /// Maximum retry attempts.
  static const int _maxRetries = 3;

  /// Base delay for exponential backoff (in seconds).
  static const int _baseRetryDelay = 5;

  /// Timer for pending retries.
  static Timer? _retryTimer;

  /// Current push status.
  static final ValueNotifier<PushStatus> _status =
      ValueNotifier(PushStatus.unknown);

  /// Exposes status as a listenable for UI updates.
  static ValueListenable<PushStatus> get statusListenable => _status;

  /// Returns current push status.
  static PushStatus get status => _status.value;

  /// Sets the navigator key for notification-triggered navigation.
  static void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  /// Returns true if push token is available.
  static bool get hasToken => _fcmToken != null && _fcmToken!.isNotEmpty;

  /// Returns true if device is registered (based on prefs).
  static Future<bool> get isRegistered async =>
      await NotificationPrefs.isDeviceRegistered();

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  /// Initializes the push service.
  ///
  /// Call this at app startup, after auth is set up.
  ///
  /// Returns `true` if initialized successfully.
  static Future<bool> initialize() async {
    if (_initialized) {
      debugPrint('[PushService] Already initialized');
      return true;
    }

    if (!PushConfig.enabled) {
      debugPrint('[PushService] Push disabled by config');
      _status.value = PushStatus.disabled;
      _initialized = true;
      return true;
    }

    try {
      debugPrint('[PushService] Initializing...');
      
      // Initialize preferences
      await NotificationPrefs.initialize();

      // Check for stored token
      final storedToken = await NotificationPrefs.getDeviceToken();
      if (storedToken != null && storedToken.isNotEmpty) {
        _fcmToken = storedToken;
        debugPrint('[PushService] Restored token from storage');
      }

      // PR-F26: Initialize Firebase
      try {
        await Firebase.initializeApp();
        _firebaseAvailable = true;
        debugPrint('[PushService] Firebase initialized');
        
        // Setup FCM
        await _setupFCM();
      } catch (e) {
        // Firebase not configured (missing google-services.json)
        debugPrint('[PushService] Firebase not available: $e');
        _firebaseAvailable = false;
        _status.value = PushStatus.firebaseNotConfigured;
        _initialized = true;
        return true; // Still "success" - just without push
      }

      _initialized = true;
      
      // Update status based on token availability
      if (_fcmToken != null) {
        _status.value = PushStatus.ready;
      } else {
        _status.value = PushStatus.tokenUnavailable;
      }
      
      debugPrint('[PushService] Initialized with FCM');
      return true;
    } catch (e) {
      debugPrint('[PushService] Initialization failed: $e');
      _status.value = PushStatus.tokenUnavailable;
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Firebase Setup (PR-F26)
  // ─────────────────────────────────────────────────────────────────────────

  /// Sets up Firebase Cloud Messaging.
  static Future<void> _setupFCM() async {
    final messaging = FirebaseMessaging.instance;

    // Request permissions (iOS)
    if (Platform.isIOS) {
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      debugPrint('[PushService] iOS permission: ${settings.authorizationStatus}');
      
      if (settings.authorizationStatus != AuthorizationStatus.authorized) {
        _status.value = PushStatus.tokenUnavailable;
        return;
      }
    }

    // Get FCM token
    try {
      _fcmToken = await messaging.getToken();
      
      if (_fcmToken != null) {
        await NotificationPrefs.setDeviceToken(_fcmToken!);
        _status.value = PushStatus.ready;
        // Log partial token for debugging (never full token in prod)
        final tokenPreview = _fcmToken!.length > 20 
            ? '${_fcmToken!.substring(0, 20)}...' 
            : _fcmToken;
        debugPrint('[PushService] FCM token retrieved: $tokenPreview');
      } else {
        _status.value = PushStatus.tokenUnavailable;
        debugPrint('[PushService] FCM token unavailable');
      }
    } catch (e) {
      debugPrint('[PushService] Error getting FCM token: $e');
      _status.value = PushStatus.tokenUnavailable;
    }

    // Listen for token refresh
    messaging.onTokenRefresh.listen((newToken) {
      debugPrint('[PushService] FCM token refreshed');
      updateToken(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[PushService] Foreground message received');
      final data = {
        ...message.data,
        'title': message.notification?.title,
        'body': message.notification?.body,
      };
      handleForegroundNotification(data);
    });

    // Handle background/terminated tap
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[PushService] Notification opened app');
      handleNotificationTap(message.data);
    });

    // Check if app was opened from notification
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[PushService] App opened from notification');
      // Delay to ensure navigation is ready
      Future.delayed(const Duration(milliseconds: 500), () {
        handleNotificationTap(initialMessage.data);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Device Registration with Retry
  // ─────────────────────────────────────────────────────────────────────────

  /// Registers the device for push notifications.
  ///
  /// Call this after successful login.
  ///
  /// Returns `true` if registered successfully or already registered.
  ///
  /// **PR-22:** Implements retry with exponential backoff.
  static Future<bool> registerDeviceIfNeeded() async {
    // Check if notifications are enabled
    final enabled = await NotificationPrefs.isGeneralEnabled();
    if (!enabled) {
      debugPrint('[PushService] registerDevice: notifications disabled by user');
      return true; // Not an error, just user preference
    }

    if (!PushConfig.enabled) {
      debugPrint('[PushService] registerDevice: push disabled by config');
      return true;
    }
    
    if (!_firebaseAvailable) {
      debugPrint('[PushService] registerDevice: Firebase not available');
      return true; // Not an error, just not configured
    }

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final authToken = TokenStorage.getToken();
    if (authToken == null || authToken.isEmpty) {
      debugPrint('[PushService] registerDevice: no auth token available');
      return false;
    }

    // Check if already registered
    final alreadyRegistered = await NotificationPrefs.isDeviceRegistered();
    final storedToken = await NotificationPrefs.getDeviceToken();
    
    if (alreadyRegistered && storedToken == _fcmToken && _fcmToken != null) {
      debugPrint('[PushService] registerDevice: already registered with same token');
      return true;
    }

    // PR-F26: Get fresh token from Firebase if needed
    if (_fcmToken == null || _fcmToken!.isEmpty) {
      try {
        _fcmToken = await FirebaseMessaging.instance.getToken();
        if (_fcmToken != null) {
          await NotificationPrefs.setDeviceToken(_fcmToken!);
        }
      } catch (e) {
        debugPrint('[PushService] Error refreshing FCM token: $e');
      }
    }

    final token = _fcmToken;

    if (token == null || token.isEmpty) {
      debugPrint('[PushService] registerDevice: no FCM token');
      _status.value = PushStatus.tokenUnavailable;
      return false;
    }

    final platform = Platform.isAndroid ? 'android' : 'ios';
    
    debugPrint('[PushService] Registering device (attempt ${_retryCount + 1}/$_maxRetries)...');
    
    final success = await _api.registerDevice(token: token, platform: platform);

    if (success) {
      debugPrint('[PushService] ✅ Device registered successfully');
      _retryCount = 0;
      _retryTimer?.cancel();
      await NotificationPrefs.setDeviceRegistered(true);
      await NotificationPrefs.setDeviceToken(token);
      _status.value = PushStatus.ready;
      return true;
    }

    // Failed - schedule retry if under limit
    debugPrint('[PushService] ❌ Device registration failed');
    return _scheduleRetry();
  }

  /// Schedules a retry with exponential backoff.
  ///
  /// Returns `false` to indicate registration is pending.
  static bool _scheduleRetry() {
    if (_retryCount >= _maxRetries) {
      debugPrint('[PushService] Max retries reached, giving up');
      _status.value = PushStatus.pendingRegistration;
      return false;
    }

    _retryCount++;
    final delay = _baseRetryDelay * (1 << (_retryCount - 1)); // Exponential backoff
    
    debugPrint('[PushService] Scheduling retry $_retryCount/$_maxRetries in ${delay}s');
    _status.value = PushStatus.pendingRegistration;

    _retryTimer?.cancel();
    _retryTimer = Timer(Duration(seconds: delay), () async {
      // FIX-TOKEN-SYNC: Use TokenStorage directly
      final retryToken = TokenStorage.getToken();
      if (retryToken != null && retryToken.isNotEmpty) {
        await registerDeviceIfNeeded();
      }
    });

    return false;
  }

  /// Retries registration manually.
  ///
  /// Resets retry count and attempts registration.
  /// Use this when user manually toggles notifications on.
  static Future<bool> retryRegistration() async {
    _retryCount = 0;
    _retryTimer?.cancel();
    return registerDeviceIfNeeded();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Device Unregistration
  // ─────────────────────────────────────────────────────────────────────────

  /// Unregisters the device from push notifications.
  ///
  /// Call this on logout or when user disables notifications.
  ///
  /// **PR-22:** Also cancels pending retries.
  static Future<void> unregisterDevice() async {
    // Cancel any pending retries
    _retryTimer?.cancel();
    _retryCount = 0;

    if (!PushConfig.enabled) {
      debugPrint('[PushService] unregisterDevice: push disabled');
      return;
    }

    final token = _fcmToken ?? await NotificationPrefs.getDeviceToken();
    
    if (token == null || token.isEmpty) {
      debugPrint('[PushService] unregisterDevice: no token to unregister');
      await NotificationPrefs.setDeviceRegistered(false);
      return;
    }

    debugPrint('[PushService] Unregistering device...');
    final success = await _api.unregisterDevice(token: token);

    if (success) {
      debugPrint('[PushService] ✅ Device unregistered successfully');
    } else {
      debugPrint('[PushService] ⚠️ Device unregistration failed (non-critical)');
    }

    // Always mark as unregistered locally
    await NotificationPrefs.setDeviceRegistered(false);
    
    // Keep token for potential re-registration, but clear registered state
    debugPrint('[PushService] Device unregistered');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Token Management
  // ─────────────────────────────────────────────────────────────────────────

  /// Updates the FCM token (called on token refresh).
  ///
  /// If already registered, re-registers with new token.
  static Future<void> updateToken(String newToken) async {
    debugPrint('[PushService] Token updated');
    
    final oldToken = _fcmToken;
    _fcmToken = newToken;
    await NotificationPrefs.setDeviceToken(newToken);
    
    // If we were registered, re-register with new token
    final wasRegistered = await NotificationPrefs.isDeviceRegistered();
    if (wasRegistered && oldToken != newToken) {
      debugPrint('[PushService] Re-registering with new token');
      // Reset retry count for new token
      _retryCount = 0;
      await registerDeviceIfNeeded();
    }
  }

  /// Sets a token manually (for testing or manual configuration).
  @visibleForTesting
  static Future<void> setToken(String? token) async {
    _fcmToken = token;
    if (token != null) {
      await NotificationPrefs.setDeviceToken(token);
      _status.value = PushStatus.ready;
    } else {
      _status.value = PushStatus.tokenUnavailable;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notification Handling
  // ─────────────────────────────────────────────────────────────────────────

  /// Handles a notification tap.
  ///
  /// Called when user taps a notification (foreground or background).
  static void handleNotificationTap(Map<String, dynamic> data) {
    debugPrint('[PushService] Notification tapped: ${data.keys}');

    final type = data['type']?.toString();
    final conversationId = data['conversationId']?.toString();
    final missionId = data['missionId']?.toString();

    if (type == 'message' && conversationId != null) {
      _navigateToChat(conversationId, data);
    } else if (type == 'mission' && missionId != null) {
      _navigateToMission(missionId);
    } else {
      _navigateToMessages();
    }
  }

  /// Handles a foreground notification.
  ///
  /// Shows a snackbar if configured.
  /// PR-PUSH: Suppresses notification if user is already in the same chat.
  static void handleForegroundNotification(Map<String, dynamic> data) {
    debugPrint('[PushService] Foreground notification: ${data.keys}');

    if (!PushConfig.showForegroundSnackbar) return;

    final type = data['type']?.toString();
    final conversationId = data['conversationId']?.toString();
    final missionId = data['missionId']?.toString();

    // PR-PUSH: Suppress chat notification if user is already in this chat
    if (type == 'message' && conversationId != null) {
      final currentChat = MessagesService.currentConversationId;
      if (currentChat != null && currentChat == conversationId) {
        debugPrint('[PushService] Suppressed: already in chat $conversationId');
        return;
      }
    }

    final title = data['title']?.toString() ?? 'Nouveau message';
    final body = data['body']?.toString() ?? '';

    _showNotificationSnackbar(
      title: title,
      body: body,
      onTap: () {
        if (conversationId != null) {
          _navigateToChat(conversationId, data);
        } else if (missionId != null) {
          _navigateToMission(missionId);
        } else {
          _navigateToMessages();
        }
      },
    );
  }

  /// Shows a snackbar for foreground notifications.
  static void _showNotificationSnackbar({
    required String title,
    required String body,
    VoidCallback? onTap,
  }) {
    final context = _navigatorKey?.currentContext;
    if (context == null) {
      debugPrint('[PushService] Cannot show snackbar: no context');
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            onTap?.call();
          },
          child: Row(
            children: [
              const Icon(Icons.message, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (body.isNotEmpty)
                      Text(
                        body,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Voir',
          textColor: Colors.white,
          onPressed: () {
            onTap?.call();
          },
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  /// Navigates to the chat screen.
  static void _navigateToChat(String conversationId, Map<String, dynamic> data) {
    final context = _navigatorKey?.currentContext;
    if (context == null) {
      debugPrint('[PushService] Cannot navigate: no context');
      return;
    }

    final senderName = data['senderName']?.toString() ?? 'Conversation';

    context.pushNamed(
      'chat',
      pathParameters: {'missionId': conversationId},
      extra: {'title': senderName},
    );
  }

  /// Navigates to the chat screen for a given mission.
  ///
  /// Mission notifications open the mission's chat thread — the primary
  /// interaction point for a mission in V1.
  static void _navigateToMission(String missionId) {
    final context = _navigatorKey?.currentContext;
    if (context == null) {
      debugPrint('[PushService] Cannot navigate: no context');
      return;
    }

    context.pushNamed(
      'chat',
      pathParameters: {'missionId': missionId},
      extra: {'title': 'Mission'},
    );
  }

  /// Navigates to the messages list.
  static void _navigateToMessages() {
    final context = _navigatorKey?.currentContext;
    if (context == null) {
      debugPrint('[PushService] Cannot navigate: no context');
      return;
    }

    context.goNamed('messages');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  /// Resets the service state (for testing or logout).
  @visibleForTesting
  static void reset() {
    _initialized = false;
    _firebaseAvailable = false;
    _fcmToken = null;
    _retryCount = 0;
    _retryTimer?.cancel();
    _retryTimer = null;
    _status.value = PushStatus.unknown;
  }

  /// Disposes resources.
  ///
  /// Call on app termination.
  static void dispose() {
    _retryTimer?.cancel();
    _retryTimer = null;
  }
}
