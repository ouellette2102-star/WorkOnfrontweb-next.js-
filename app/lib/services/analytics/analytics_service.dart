/// Lightweight analytics service for WorkOn.
///
/// **PR-23:** Minimal event tracking + attribution persistence.
///
/// This service provides:
/// - Structured event tracking with parameters
/// - Automatic attribution attachment from deep links
/// - Safe execution (never crashes the app)
/// - Console logging for debugging
/// - Ready for future Firebase/Amplitude/Mixpanel integration
///
/// ## Usage
///
/// ```dart
/// // Track simple event
/// AnalyticsService.track(AnalyticsEvent.appOpen);
///
/// // Track event with parameters
/// AnalyticsService.track(
///   AnalyticsEvent.missionViewed,
///   params: {'mission_id': '123', 'category': 'cleaning'},
/// );
///
/// // Track with user ID
/// AnalyticsService.setUserId('user123');
/// ```
library;

import 'package:flutter/foundation.dart';

import '../deep_linking/deep_link_service.dart';

/// Supported analytics events.
///
/// Each event represents a key user action in the funnel.
enum AnalyticsEvent {
  // ─────────────────────────────────────────────────────────────────────────
  // App Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  
  /// App opened (cold start or resume from background).
  appOpen('app_open'),
  
  /// App sent to background.
  appBackground('app_background'),

  // ─────────────────────────────────────────────────────────────────────────
  // Authentication Funnel
  // ─────────────────────────────────────────────────────────────────────────
  
  /// User started sign up flow (reached sign up screen).
  signUpStarted('sign_up_started'),
  
  /// User completed sign up successfully.
  signUpCompleted('sign_up_completed'),
  
  /// User failed to sign up (validation error, email exists, etc.).
  signUpFailed('sign_up_failed'),
  
  /// User logged in successfully.
  loginSuccess('login_success'),
  
  /// User failed to log in.
  loginFailed('login_failed'),
  
  /// User logged out.
  logout('logout'),

  // ─────────────────────────────────────────────────────────────────────────
  // Mission Funnel
  // ─────────────────────────────────────────────────────────────────────────
  
  /// User viewed a mission detail.
  missionViewed('mission_viewed'),
  
  /// User created a new mission.
  missionCreated('mission_created'),
  
  /// User saved/bookmarked a mission.
  missionSaved('mission_saved'),

  // ─────────────────────────────────────────────────────────────────────────
  // Worker Funnel
  // ─────────────────────────────────────────────────────────────────────────
  
  /// Worker submitted an offer for a mission.
  offerSubmitted('offer_submitted'),
  
  /// Worker was accepted for a mission.
  workerAccepted('worker_accepted'),
  
  /// Worker started a mission.
  missionStarted('mission_started'),
  
  /// Worker completed a mission.
  missionCompleted('mission_completed'),

  // ─────────────────────────────────────────────────────────────────────────
  // Payment Funnel
  // ─────────────────────────────────────────────────────────────────────────
  
  /// User initiated payment.
  paymentStarted('payment_started'),
  
  /// Payment completed successfully.
  paymentSuccess('payment_success'),
  
  /// Payment failed.
  paymentFailed('payment_failed'),
  
  /// Payment cancelled by user.
  paymentCancelled('payment_cancelled'),

  // ─────────────────────────────────────────────────────────────────────────
  // Deep Links & Attribution
  // ─────────────────────────────────────────────────────────────────────────
  
  /// Deep link opened (with UTM params if present).
  deepLinkOpened('deep_link_opened'),
  
  /// Invite link shared.
  inviteShared('invite_shared'),

  // ─────────────────────────────────────────────────────────────────────────
  // Engagement
  // ─────────────────────────────────────────────────────────────────────────
  
  /// User performed a search.
  searchPerformed('search_performed'),
  
  /// User opened chat.
  chatOpened('chat_opened'),
  
  /// User sent a message.
  messageSent('message_sent'),
  
  /// User left a review.
  reviewSubmitted('review_submitted'),
  ;

  const AnalyticsEvent(this.name);
  
  /// Event name as sent to analytics backend.
  final String name;
}

/// Lightweight analytics service.
///
/// All operations are safe (wrapped in try-catch) and non-blocking.
/// Events are logged to console in debug mode and can be wired to
/// Firebase Analytics, Amplitude, or other providers.
abstract final class AnalyticsService {
  /// Current user ID (set after authentication).
  static String? _userId;

  /// Cached attribution data.
  static Attribution? _attribution;

  /// Whether analytics is enabled.
  static bool _enabled = true;

  /// Whether verbose logging is enabled.
  static bool _verbose = kDebugMode;

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /// Enables or disables analytics.
  static void setEnabled(bool enabled) {
    _enabled = enabled;
    _log('Analytics ${enabled ? 'enabled' : 'disabled'}');
  }

  /// Enables or disables verbose logging.
  static void setVerbose(bool verbose) {
    _verbose = verbose;
  }

  /// Sets the current user ID for all subsequent events.
  static void setUserId(String? userId) {
    _userId = userId;
    _log('User ID set: ${userId != null ? '${userId.substring(0, 8)}...' : 'null'}');
    
    // NOTE (Post-MVP): When Firebase is configured:
    // FirebaseAnalytics.instance.setUserId(id: userId);
  }

  /// Clears the user ID (on logout).
  static void clearUserId() {
    _userId = null;
    _log('User ID cleared');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Attribution
  // ─────────────────────────────────────────────────────────────────────────

  /// Loads attribution data from persistent storage.
  ///
  /// Call this at app startup to attach attribution to all events.
  static Future<void> loadAttribution() async {
    try {
      _attribution = await DeepLinkService.getAttribution();
      if (_attribution != null && _attribution!.hasData) {
        _log('Attribution loaded: $_attribution');
      }
    } catch (e) {
      _logError('Failed to load attribution', e);
    }
  }

  /// Returns current attribution as event parameters.
  static Map<String, dynamic> _getAttributionParams() {
    if (_attribution == null || !_attribution!.hasData) {
      return {};
    }

    final params = <String, dynamic>{};
    if (_attribution!.utmSource != null) {
      params['utm_source'] = _attribution!.utmSource;
    }
    if (_attribution!.utmMedium != null) {
      params['utm_medium'] = _attribution!.utmMedium;
    }
    if (_attribution!.utmCampaign != null) {
      params['utm_campaign'] = _attribution!.utmCampaign;
    }
    if (_attribution!.utmContent != null) {
      params['utm_content'] = _attribution!.utmContent;
    }
    if (_attribution!.referralCode != null) {
      params['referral_code'] = _attribution!.referralCode;
    }
    return params;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event Tracking
  // ─────────────────────────────────────────────────────────────────────────

  /// Tracks an analytics event.
  ///
  /// Events are:
  /// - Logged to console in debug mode
  /// - Sent to analytics backend when configured
  /// - Enriched with attribution data automatically
  ///
  /// **Never throws** - all errors are caught and logged.
  ///
  /// [event] The event to track.
  /// [params] Optional parameters to attach to the event.
  /// [includeAttribution] Whether to include attribution data (default: true).
  static void track(
    AnalyticsEvent event, {
    Map<String, dynamic>? params,
    bool includeAttribution = true,
  }) {
    if (!_enabled) return;

    try {
      // Build final parameters
      final finalParams = <String, dynamic>{
        'timestamp': DateTime.now().toIso8601String(),
        if (_userId != null) 'user_id': _userId,
        if (includeAttribution) ..._getAttributionParams(),
        if (params != null) ...params,
      };

      // Log to console
      _log('📊 ${event.name} $finalParams');

      // NOTE (Post-MVP): When Firebase Analytics is configured:
      // FirebaseAnalytics.instance.logEvent(
      //   name: event.name,
      //   parameters: finalParams.map((k, v) => MapEntry(k, v?.toString())),
      // );

      // NOTE (Post-MVP): When Amplitude is configured:
      // Amplitude.getInstance().logEvent(event.name, eventProperties: finalParams);

    } catch (e) {
      _logError('Failed to track ${event.name}', e);
    }
  }

  /// Tracks a custom event (not in the enum).
  ///
  /// Use sparingly - prefer [AnalyticsEvent] enum for type safety.
  static void trackCustom(
    String eventName, {
    Map<String, dynamic>? params,
    bool includeAttribution = true,
  }) {
    if (!_enabled) return;

    try {
      final finalParams = <String, dynamic>{
        'timestamp': DateTime.now().toIso8601String(),
        if (_userId != null) 'user_id': _userId,
        if (includeAttribution) ..._getAttributionParams(),
        if (params != null) ...params,
      };

      _log('📊 [custom] $eventName $finalParams');

    } catch (e) {
      _logError('Failed to track custom event $eventName', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen Tracking
  // ─────────────────────────────────────────────────────────────────────────

  /// Tracks a screen view.
  ///
  /// [screenName] The name of the screen.
  /// [screenClass] Optional class name (for Firebase).
  static void trackScreen(String screenName, {String? screenClass}) {
    if (!_enabled) return;

    try {
      _log('📱 Screen: $screenName');

      // NOTE (Post-MVP): When Firebase is configured:
      // FirebaseAnalytics.instance.setCurrentScreen(
      //   screenName: screenName,
      //   screenClassOverride: screenClass,
      // );

    } catch (e) {
      _logError('Failed to track screen $screenName', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // User Properties
  // ─────────────────────────────────────────────────────────────────────────

  /// Sets a user property.
  ///
  /// [name] The property name.
  /// [value] The property value.
  static void setUserProperty(String name, String? value) {
    if (!_enabled) return;

    try {
      _log('👤 Property: $name = $value');

      // NOTE (Post-MVP): When Firebase is configured:
      // FirebaseAnalytics.instance.setUserProperty(name: name, value: value);

    } catch (e) {
      _logError('Failed to set user property $name', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience Methods
  // ─────────────────────────────────────────────────────────────────────────

  /// Tracks app open event.
  static void trackAppOpen() {
    track(AnalyticsEvent.appOpen);
  }

  /// Tracks successful sign up.
  static void trackSignUpCompleted({String? method}) {
    track(
      AnalyticsEvent.signUpCompleted,
      params: {if (method != null) 'method': method},
    );
  }

  /// Tracks successful login.
  static void trackLoginSuccess({String? method}) {
    track(
      AnalyticsEvent.loginSuccess,
      params: {if (method != null) 'method': method},
    );
  }

  /// Tracks mission viewed.
  static void trackMissionViewed({
    required String missionId,
    String? category,
    double? price,
  }) {
    track(
      AnalyticsEvent.missionViewed,
      params: {
        'mission_id': missionId,
        if (category != null) 'category': category,
        if (price != null) 'price': price,
      },
    );
  }

  /// Tracks offer submitted.
  static void trackOfferSubmitted({
    required String missionId,
    double? offerAmount,
  }) {
    track(
      AnalyticsEvent.offerSubmitted,
      params: {
        'mission_id': missionId,
        if (offerAmount != null) 'offer_amount': offerAmount,
      },
    );
  }

  /// Tracks payment started.
  static void trackPaymentStarted({
    required String missionId,
    required double amount,
    required String currency,
  }) {
    track(
      AnalyticsEvent.paymentStarted,
      params: {
        'mission_id': missionId,
        'amount': amount,
        'currency': currency,
      },
    );
  }

  /// Tracks payment success.
  static void trackPaymentSuccess({
    required String missionId,
    required double amount,
    required String currency,
    String? transactionId,
  }) {
    track(
      AnalyticsEvent.paymentSuccess,
      params: {
        'mission_id': missionId,
        'amount': amount,
        'currency': currency,
        if (transactionId != null) 'transaction_id': transactionId,
      },
    );
  }

  /// Tracks payment failure.
  static void trackPaymentFailed({
    required String missionId,
    required double amount,
    String? errorCode,
    String? errorMessage,
  }) {
    track(
      AnalyticsEvent.paymentFailed,
      params: {
        'mission_id': missionId,
        'amount': amount,
        if (errorCode != null) 'error_code': errorCode,
        if (errorMessage != null) 'error_message': errorMessage,
      },
    );
  }

  /// Tracks deep link opened.
  static void trackDeepLinkOpened({
    required String linkType,
    String? targetId,
    Map<String, String>? utmParams,
  }) {
    track(
      AnalyticsEvent.deepLinkOpened,
      params: {
        'link_type': linkType,
        if (targetId != null) 'target_id': targetId,
        if (utmParams != null) ...utmParams,
      },
      // Don't double-attach attribution for deep link events
      includeAttribution: false,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────────────────

  static void _log(String message) {
    if (_verbose) {
      debugPrint('[Analytics] $message');
    }
  }

  static void _logError(String message, Object error) {
    debugPrint('[Analytics] ⚠️ $message: $error');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reset (for testing)
  // ─────────────────────────────────────────────────────────────────────────

  /// Resets all analytics state.
  @visibleForTesting
  static void reset() {
    _userId = null;
    _attribution = null;
    _enabled = true;
    _verbose = kDebugMode;
  }
}

