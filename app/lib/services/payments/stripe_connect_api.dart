/// Stripe Connect API client for WorkOn.
///
/// Handles Worker onboarding and payout account management.
/// Workers need to complete Stripe Connect onboarding to receive payments.
///
/// **FL-STRIPE-CONNECT:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';

/// Exception thrown by [StripeConnectApi].
class StripeConnectException implements Exception {
  final String message;
  final int? statusCode;

  const StripeConnectException(this.message, [this.statusCode]);

  @override
  String toString() => 'StripeConnectException: $message';
}

/// Status of a Worker's Stripe Connect account.
class StripeConnectStatus {
  const StripeConnectStatus({
    required this.hasAccount,
    this.accountId,
    required this.onboarded,
    required this.chargesEnabled,
    required this.payoutsEnabled,
    required this.detailsSubmitted,
    this.requirementsNeeded = const [],
  });

  /// Creates a [StripeConnectStatus] from JSON.
  factory StripeConnectStatus.fromJson(Map<String, dynamic> json) {
    return StripeConnectStatus(
      hasAccount: json['hasAccount'] as bool? ?? false,
      accountId: json['accountId'] as String?,
      onboarded: json['onboarded'] as bool? ?? false,
      chargesEnabled: json['chargesEnabled'] as bool? ?? false,
      payoutsEnabled: json['payoutsEnabled'] as bool? ?? false,
      detailsSubmitted: json['detailsSubmitted'] as bool? ?? false,
      requirementsNeeded: (json['requirementsNeeded'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  /// Returns an empty/default status.
  const StripeConnectStatus.empty()
      : hasAccount = false,
        accountId = null,
        onboarded = false,
        chargesEnabled = false,
        payoutsEnabled = false,
        detailsSubmitted = false,
        requirementsNeeded = const [];

  /// Worker has created a Stripe Connect account.
  final bool hasAccount;

  /// Stripe Connect account ID (acct_xxx).
  final String? accountId;

  /// Worker has completed onboarding.
  final bool onboarded;

  /// Worker can receive charges (accept payments).
  final bool chargesEnabled;

  /// Worker can receive payouts (withdrawals).
  final bool payoutsEnabled;

  /// Worker has submitted all required details.
  final bool detailsSubmitted;

  /// List of still-required fields/documents.
  final List<String> requirementsNeeded;

  /// Returns true if Worker can receive payments.
  bool get isFullyEnabled => chargesEnabled && payoutsEnabled;

  /// Returns true if Worker needs to complete more steps.
  bool get needsAction =>
      hasAccount && !onboarded ||
      requirementsNeeded.isNotEmpty ||
      !chargesEnabled ||
      !payoutsEnabled;

  /// Human-readable status for UI.
  String get statusText {
    if (!hasAccount) return 'Non configuré';
    if (!detailsSubmitted) return 'Incomplet';
    if (requirementsNeeded.isNotEmpty) return 'Documents requis';
    if (!chargesEnabled) return 'En attente de vérification';
    if (!payoutsEnabled) return 'Paiements bientôt actifs';
    return 'Actif';
  }

  Map<String, dynamic> toJson() => {
        'hasAccount': hasAccount,
        'accountId': accountId,
        'onboarded': onboarded,
        'chargesEnabled': chargesEnabled,
        'payoutsEnabled': payoutsEnabled,
        'detailsSubmitted': detailsSubmitted,
        'requirementsNeeded': requirementsNeeded,
      };

  @override
  String toString() => 'StripeConnectStatus(status: $statusText)';
}

/// Response for Connect Payment Intent creation.
class ConnectPaymentIntentResponse {
  const ConnectPaymentIntentResponse({
    required this.paymentIntentId,
    required this.clientSecret,
    required this.amount,
    required this.currency,
    required this.platformFee,
    required this.workerReceives,
  });

  factory ConnectPaymentIntentResponse.fromJson(Map<String, dynamic> json) {
    return ConnectPaymentIntentResponse(
      paymentIntentId: json['paymentIntentId'] as String,
      clientSecret: json['clientSecret'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String? ?? 'CAD',
      platformFee: (json['platformFee'] as num?)?.toInt() ?? 0,
      workerReceives: (json['workerReceives'] as num?)?.toInt() ?? 0,
    );
  }

  /// Stripe PaymentIntent ID.
  final String paymentIntentId;

  /// Client secret for Payment Sheet.
  final String clientSecret;

  /// Total amount in cents.
  final int amount;

  /// Currency code.
  final String currency;

  /// Platform fee in cents (12%).
  final int platformFee;

  /// Amount Worker receives in cents (88%).
  final int workerReceives;

  /// Formatted total amount.
  String get formattedAmount => '\$${(amount / 100).toStringAsFixed(2)}';

  /// Formatted worker amount.
  String get formattedWorkerReceives =>
      '\$${(workerReceives / 100).toStringAsFixed(2)}';

  /// Formatted platform fee.
  String get formattedPlatformFee =>
      '\$${(platformFee / 100).toStringAsFixed(2)}';
}

/// API client for Stripe Connect operations.
///
/// ## Usage
///
/// ```dart
/// final api = StripeConnectApi();
///
/// // Check status
/// final status = await api.getStatus();
///
/// // Get onboarding link
/// final onboardingUrl = await api.getOnboardingLink();
///
/// // Create payment with split
/// final intent = await api.createConnectPaymentIntent(missionId, amount);
/// ```
class StripeConnectApi {
  const StripeConnectApi();

  /// Gets the current Worker's Stripe Connect status.
  ///
  /// Calls `GET /api/v1/payments/stripe/connect/status`.
  Future<StripeConnectStatus> getStatus() async {
    debugPrint('[StripeConnectApi] Fetching status');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/payments/stripe/connect/status');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[StripeConnectApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[StripeConnectApi] getStatus: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 404) {
        return const StripeConnectStatus.empty();
      }

      if (response.statusCode != 200) {
        throw StripeConnectException(
          'Erreur ${response.statusCode}',
          response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return StripeConnectStatus.fromJson(json);
    } on TimeoutException {
      throw const StripeConnectException('Connexion impossible');
    } on http.ClientException {
      throw const StripeConnectException('Erreur réseau');
    } on Exception catch (e) {
      if (e is StripeConnectException || e is AuthException) rethrow;
      debugPrint('[StripeConnectApi] getStatus error: $e');
      throw const StripeConnectException('Une erreur est survenue');
    }
  }

  /// Gets or creates a Stripe Connect onboarding link.
  ///
  /// Calls `GET /api/v1/payments/stripe/connect/onboarding`.
  ///
  /// Returns a URL that the Worker should open in a WebView or browser
  /// to complete identity verification on Stripe.
  Future<String> getOnboardingLink() async {
    debugPrint('[StripeConnectApi] Fetching onboarding link');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/payments/stripe/connect/onboarding');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[StripeConnectApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[StripeConnectApi] getOnboardingLink: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        throw StripeConnectException(
          'Erreur ${response.statusCode}',
          response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final url = json['url'] as String?;
      if (url == null || url.isEmpty) {
        throw const StripeConnectException('URL non reçue');
      }

      return url;
    } on TimeoutException {
      throw const StripeConnectException('Connexion impossible');
    } on http.ClientException {
      throw const StripeConnectException('Erreur réseau');
    } on Exception catch (e) {
      if (e is StripeConnectException || e is AuthException) rethrow;
      debugPrint('[StripeConnectApi] getOnboardingLink error: $e');
      throw const StripeConnectException('Une erreur est survenue');
    }
  }

  /// Refreshes an expired onboarding link.
  ///
  /// Calls `POST /api/v1/payments/stripe/connect/refresh`.
  Future<String> refreshOnboardingLink() async {
    debugPrint('[StripeConnectApi] Refreshing onboarding link');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/payments/stripe/connect/refresh');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[StripeConnectApi] POST $uri');
      final response = await ApiClient.client
          .post(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint(
          '[StripeConnectApi] refreshOnboardingLink: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        throw StripeConnectException(
          'Erreur ${response.statusCode}',
          response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final url = json['url'] as String?;
      if (url == null || url.isEmpty) {
        throw const StripeConnectException('URL non reçue');
      }

      return url;
    } on TimeoutException {
      throw const StripeConnectException('Connexion impossible');
    } on http.ClientException {
      throw const StripeConnectException('Erreur réseau');
    } on Exception catch (e) {
      if (e is StripeConnectException || e is AuthException) rethrow;
      debugPrint('[StripeConnectApi] refreshOnboardingLink error: $e');
      throw const StripeConnectException('Une erreur est survenue');
    }
  }

  /// Creates a Connect PaymentIntent with automatic split.
  ///
  /// Calls `POST /api/v1/payments/stripe/connect/intent`.
  ///
  /// The payment will automatically transfer (amount - 12% fee) to the Worker
  /// once the payment succeeds.
  Future<ConnectPaymentIntentResponse> createConnectPaymentIntent({
    required String missionId,
    required int amountInCents,
  }) async {
    debugPrint(
        '[StripeConnectApi] Creating connect payment intent for mission: $missionId');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/payments/stripe/connect/intent');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };
    final body = jsonEncode({
      'missionId': missionId,
      'amount': amountInCents,
    });

    try {
      debugPrint('[StripeConnectApi] POST $uri');
      final response = await ApiClient.client
          .post(uri, headers: headers, body: body)
          .timeout(ApiClient.connectionTimeout);

      debugPrint(
          '[StripeConnectApi] createConnectPaymentIntent: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 400) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final message = json['message'] as String? ?? 'Requête invalide';
        throw StripeConnectException(message, 400);
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw StripeConnectException(
          'Erreur ${response.statusCode}',
          response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return ConnectPaymentIntentResponse.fromJson(json);
    } on TimeoutException {
      throw const StripeConnectException('Connexion impossible');
    } on http.ClientException {
      throw const StripeConnectException('Erreur réseau');
    } on Exception catch (e) {
      if (e is StripeConnectException || e is AuthException) rethrow;
      debugPrint('[StripeConnectApi] createConnectPaymentIntent error: $e');
      throw const StripeConnectException('Une erreur est survenue');
    }
  }
}
