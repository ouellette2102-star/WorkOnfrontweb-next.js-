/// Payments service for WorkOn.
///
/// High-level service for payment operations.
/// Wraps [PaymentsApi] with error handling and state management.
///
/// **PR-RC1:** Initial implementation.
library;

import 'package:flutter/foundation.dart';

import '/services/auth/auth_errors.dart';
import 'payment_models.dart';
import 'payments_api.dart';

/// Result type for payment operations.
sealed class PaymentResult {
  const PaymentResult();
}

/// Successful payment intent creation.
class PaymentIntentSuccess extends PaymentResult {
  final PaymentIntentResponse intent;
  const PaymentIntentSuccess(this.intent);
}

/// Payment operation failed.
class PaymentFailure extends PaymentResult {
  final String message;
  final bool isAuthError;
  const PaymentFailure(this.message, {this.isAuthError = false});
}

/// Payments service providing high-level payment operations.
///
/// ## Usage
///
/// ```dart
/// // Create payment intent for a mission
/// final result = await PaymentsService.createPaymentIntent(missionId: 'mission123');
///
/// switch (result) {
///   case PaymentIntentSuccess(:final intent):
///     // Use intent.clientSecret with Stripe SDK to confirm payment
///     print('Client secret: ${intent.clientSecret}');
///   case PaymentFailure(:final message):
///     // Show error to user
///     print('Error: $message');
/// }
/// ```
abstract final class PaymentsService {
  // ─────────────────────────────────────────────────────────────────────────
  // API Instance
  // ─────────────────────────────────────────────────────────────────────────

  static final PaymentsApi _api = PaymentsApi();

  /// Exposes API for direct calls if needed.
  static PaymentsApi get api => _api;

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /// Creates a Stripe PaymentIntent for a completed mission.
  ///
  /// The returned [PaymentIntentResponse] contains the `clientSecret` needed
  /// to confirm the payment with the Stripe SDK on the client side.
  ///
  /// Returns [PaymentIntentSuccess] on success with the intent details.
  /// Returns [PaymentFailure] on error with user-friendly message.
  ///
  /// Example:
  /// ```dart
  /// final result = await PaymentsService.createPaymentIntent(
  ///   missionId: mission.id,
  /// );
  ///
  /// if (result is PaymentIntentSuccess) {
  ///   // Confirm with Stripe SDK
  ///   await Stripe.instance.confirmPayment(
  ///     paymentIntentClientSecret: result.intent.clientSecret,
  ///   );
  /// }
  /// ```
  static Future<PaymentResult> createPaymentIntent({
    required String missionId,
  }) async {
    debugPrint('[PaymentsService] Creating payment intent for: $missionId');

    try {
      final intent = await _api.createPaymentIntent(missionId: missionId);
      debugPrint('[PaymentsService] Payment intent created: ${intent.paymentIntentId}');
      return PaymentIntentSuccess(intent);
    } on UnauthorizedException {
      debugPrint('[PaymentsService] Unauthorized');
      return const PaymentFailure(
        'Session expirée. Reconnecte-toi.',
        isAuthError: true,
      );
    } on PaymentsApiException catch (e) {
      debugPrint('[PaymentsService] API error: ${e.message}');
      return PaymentFailure(e.message);
    } catch (e) {
      debugPrint('[PaymentsService] Unexpected error: $e');
      return const PaymentFailure('Une erreur est survenue. Réessaie.');
    }
  }
}


