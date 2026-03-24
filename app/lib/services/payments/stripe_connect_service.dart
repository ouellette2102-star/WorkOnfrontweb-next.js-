/// Stripe Connect Service for WorkOn.
///
/// Business logic layer for Stripe Connect operations.
/// Manages Worker payout account onboarding and status.
///
/// **FL-STRIPE-CONNECT:** Initial implementation.
library;

import 'package:flutter/foundation.dart';

import 'stripe_connect_api.dart';

/// Service for managing Stripe Connect operations.
///
/// Provides caching for status and convenience methods for UI.
///
/// ## Usage
///
/// ```dart
/// // Check if Worker needs onboarding
/// final status = await StripeConnectService.getStatus();
/// if (status.needsAction) {
///   final url = await StripeConnectService.getOnboardingUrl();
///   // Open WebView with url
/// }
/// ```
class StripeConnectService {
  StripeConnectService._();

  static final _api = const StripeConnectApi();

  /// Cached status.
  static StripeConnectStatus? _cachedStatus;

  /// Cache timestamp.
  static DateTime? _cacheTimestamp;

  /// Cache duration (2 minutes).
  static const _cacheDuration = Duration(minutes: 2);

  /// Clears the cached status.
  static void clearCache() {
    _cachedStatus = null;
    _cacheTimestamp = null;
    debugPrint('[StripeConnectService] Cache cleared');
  }

  /// Returns true if cache is still valid.
  static bool _isCacheValid() {
    if (_cachedStatus == null || _cacheTimestamp == null) return false;
    return DateTime.now().difference(_cacheTimestamp!) < _cacheDuration;
  }

  /// Gets the current Worker's Stripe Connect status.
  ///
  /// Returns cached value if available and valid.
  /// Set [forceRefresh] to true to bypass cache.
  static Future<StripeConnectStatus> getStatus({
    bool forceRefresh = false,
  }) async {
    // Check cache
    if (!forceRefresh && _isCacheValid() && _cachedStatus != null) {
      debugPrint('[StripeConnectService] Returning cached status');
      return _cachedStatus!;
    }

    // Fetch from API
    debugPrint('[StripeConnectService] Fetching status');
    try {
      final status = await _api.getStatus();
      _cachedStatus = status;
      _cacheTimestamp = DateTime.now();
      return status;
    } catch (e) {
      debugPrint('[StripeConnectService] getStatus error: $e');
      // Return cached if available, even if stale
      if (_cachedStatus != null) {
        debugPrint('[StripeConnectService] Returning stale cache');
        return _cachedStatus!;
      }
      rethrow;
    }
  }

  /// Gets the cached status synchronously (may be null).
  static StripeConnectStatus? getCachedStatus() {
    return _cachedStatus;
  }

  /// Gets the onboarding URL for the Worker.
  ///
  /// The Worker should open this URL in a WebView or browser
  /// to complete identity verification.
  static Future<String> getOnboardingUrl() async {
    debugPrint('[StripeConnectService] Getting onboarding URL');
    final url = await _api.getOnboardingLink();
    
    // Clear cache so status is refreshed after onboarding
    clearCache();
    
    return url;
  }

  /// Refreshes an expired onboarding link.
  static Future<String> refreshOnboardingUrl() async {
    debugPrint('[StripeConnectService] Refreshing onboarding URL');
    final url = await _api.refreshOnboardingLink();
    
    // Clear cache so status is refreshed
    clearCache();
    
    return url;
  }

  /// Checks if the Worker can receive payments.
  ///
  /// Convenience method that returns true only if:
  /// - Worker has a Stripe Connect account
  /// - Account is fully verified
  /// - Charges and payouts are enabled
  static Future<bool> canReceivePayments() async {
    try {
      final status = await getStatus();
      return status.isFullyEnabled;
    } catch (e) {
      debugPrint('[StripeConnectService] canReceivePayments error: $e');
      return false;
    }
  }

  /// Checks if the Worker needs to complete onboarding.
  static Future<bool> needsOnboarding() async {
    try {
      final status = await getStatus();
      return !status.hasAccount || status.needsAction;
    } catch (e) {
      debugPrint('[StripeConnectService] needsOnboarding error: $e');
      return true; // Assume needs onboarding on error
    }
  }

  /// Creates a Connect PaymentIntent with automatic split.
  ///
  /// Use this instead of regular PaymentsService when paying
  /// for missions where the Worker has a Connect account.
  static Future<ConnectPaymentIntentResponse> createPaymentIntent({
    required String missionId,
    required int amountInCents,
  }) async {
    debugPrint('[StripeConnectService] Creating payment intent');
    return _api.createConnectPaymentIntent(
      missionId: missionId,
      amountInCents: amountInCents,
    );
  }
}
