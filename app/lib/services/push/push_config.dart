/// Push notifications configuration for WorkOn.
///
/// **PR-F20:** Initial implementation.
///
/// ## Configuration
///
/// To enable push notifications:
///
/// ### Android
/// 1. Add `google-services.json` to `android/app/`
/// 2. Add google-services plugin to `android/build.gradle`
/// 3. Set `PushConfig.enabled = true`
///
/// ### iOS
/// 1. Add `GoogleService-Info.plist` to `ios/Runner/`
/// 2. Enable Push Notifications capability in Xcode
/// 3. Set `PushConfig.enabled = true`
///
/// ### Backend
/// Implement these endpoints:
/// - `POST /devices/register` — body: `{ token, platform }`
/// - `DELETE /devices/unregister` — body: `{ token }`
///
/// Environment variables for backend:
/// - `FIREBASE_SERVICE_ACCOUNT` — Firebase Admin SDK credentials
/// - `FIREBASE_PROJECT_ID` — Firebase project ID
library;

/// Configuration for push notifications.
///
/// Set [enabled] to `true` only when Firebase is fully configured.
/// When `false`, all push operations are NO-OP (safe fallback).
abstract final class PushConfig {
  /// Whether push notifications are enabled.
  ///
  /// Set to `true` only after:
  /// 1. Adding google-services.json (Android)
  /// 2. Adding GoogleService-Info.plist (iOS)
  /// 3. Adding firebase_messaging to pubspec.yaml
  ///
  /// **PR-F26:** Enabled for FCM integration.
  static const bool enabled = true;

  /// Whether to show foreground notifications as snackbars.
  static const bool showForegroundSnackbar = true;

  /// Topic for general notifications (optional).
  static const String generalTopic = 'workon_general';

  /// Notification channel ID for Android.
  static const String androidChannelId = 'workon_messages';

  /// Notification channel name for Android.
  static const String androidChannelName = 'Messages WorkOn';

  /// Notification channel description for Android.
  static const String androidChannelDescription =
      'Notifications pour les nouveaux messages';
}

