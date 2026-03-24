/// Stripe Payment Sheet service for WorkOn.
///
/// Handles Stripe Payment Sheet initialization and presentation.
///
/// **PR-5:** Stripe Payment Sheet integration.
library;

import 'dart:ui' show Color;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter_stripe/flutter_stripe.dart';

import '/config/app_config.dart';
import 'payment_models.dart';
import 'payments_service.dart';

/// Result of a payment sheet presentation.
sealed class PaymentSheetResult {
  const PaymentSheetResult();
}

/// Payment was successful.
class PaymentSheetSuccess extends PaymentSheetResult {
  const PaymentSheetSuccess();
}

/// User cancelled the payment sheet.
class PaymentSheetCancelled extends PaymentSheetResult {
  const PaymentSheetCancelled();
}

/// Payment failed with an error.
class PaymentSheetError extends PaymentSheetResult {
  final String message;
  final bool isAuthError;
  const PaymentSheetError(this.message, {this.isAuthError = false});
}

/// Service for Stripe Payment Sheet operations.
///
/// ## Usage
///
/// ```dart
/// // Pay for a mission
/// final result = await StripeService.payForMission(missionId: 'mission123');
///
/// switch (result) {
///   case PaymentSheetSuccess():
///     // Payment succeeded - refresh mission status
///   case PaymentSheetCancelled():
///     // User cancelled - do nothing
///   case PaymentSheetError(:final message):
///     // Show error to user
/// }
/// ```
abstract final class StripeService {
  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /// Initiates the full payment flow for a mission.
  ///
  /// 1. Creates PaymentIntent via backend
  /// 2. Initializes Stripe Payment Sheet
  /// 3. Presents Payment Sheet to user
  /// 4. Returns result (success/cancelled/error)
  ///
  /// Example:
  /// ```dart
  /// final result = await StripeService.payForMission(missionId: mission.id);
  /// if (result is PaymentSheetSuccess) {
  ///   ScaffoldMessenger.of(context).showSnackBar(
  ///     SnackBar(content: Text('Paiement réussi!')),
  ///   );
  /// }
  /// ```
  static Future<PaymentSheetResult> payForMission({
    required String missionId,
  }) async {
    debugPrint('[StripeService] Starting payment for mission: $missionId');

    // Step 1: Create PaymentIntent
    final intentResult = await PaymentsService.createPaymentIntent(
      missionId: missionId,
    );

    switch (intentResult) {
      case PaymentIntentSuccess(:final intent):
        return _presentPaymentSheet(intent);
      case PaymentFailure(:final message, :final isAuthError):
        debugPrint('[StripeService] Failed to create intent: $message');
        return PaymentSheetError(message, isAuthError: isAuthError);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /// Initializes and presents the Stripe Payment Sheet.
  static Future<PaymentSheetResult> _presentPaymentSheet(
    PaymentIntentResponse intent,
  ) async {
    try {
      debugPrint('[StripeService] Initializing payment sheet...');

      // Initialize Payment Sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: intent.clientSecret,
          merchantDisplayName: AppConfig.stripeMerchantName,
          style: ThemeMode.system,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: Color(0xFFE24A33), // WorkOn red brand color
            ),
          ),
          billingDetails: const BillingDetails(
            address: Address(
              country: 'CA',
              city: null,
              line1: null,
              line2: null,
              postalCode: null,
              state: null,
            ),
          ),
          billingDetailsCollectionConfiguration:
              const BillingDetailsCollectionConfiguration(
            name: CollectionMode.automatic,
            email: CollectionMode.automatic,
            phone: CollectionMode.never,
            address: AddressCollectionMode.never,
          ),
        ),
      );

      debugPrint('[StripeService] Presenting payment sheet...');

      // Present Payment Sheet
      await Stripe.instance.presentPaymentSheet();

      debugPrint('[StripeService] ✅ Payment succeeded');
      return const PaymentSheetSuccess();
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        debugPrint('[StripeService] User cancelled payment');
        return const PaymentSheetCancelled();
      }

      final message = _mapStripeError(e);
      debugPrint('[StripeService] Stripe error: $message');
      return PaymentSheetError(message);
    } catch (e) {
      debugPrint('[StripeService] Unexpected error: $e');
      return const PaymentSheetError('Une erreur est survenue. Réessaie.');
    }
  }

  /// Maps Stripe errors to user-friendly French messages.
  static String _mapStripeError(StripeException e) {
    final code = e.error.code;
    final message = e.error.message;

    debugPrint('[StripeService] Error code: $code, message: $message');

    switch (code) {
      case FailureCode.Canceled:
        return 'Paiement annulé';
      case FailureCode.Failed:
        if (message?.contains('card') == true ||
            message?.contains('declined') == true) {
          return 'Carte refusée. Vérifie les informations.';
        }
        if (message?.contains('network') == true) {
          return 'Erreur réseau. Vérifie ta connexion.';
        }
        return 'Paiement échoué. Réessaie.';
      case FailureCode.Timeout:
        return 'Délai dépassé. Réessaie.';
      default:
        return message ?? 'Erreur de paiement';
    }
  }
}

