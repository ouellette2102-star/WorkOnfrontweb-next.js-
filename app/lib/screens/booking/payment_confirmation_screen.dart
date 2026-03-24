import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';

/// Payment confirmation screen — shown after successful Stripe deposit.
class PaymentConfirmationScreen extends StatelessWidget {
  const PaymentConfirmationScreen({super.key, this.data});

  final Map<String, dynamic>? data;

  @override
  Widget build(BuildContext context) {
    final workerName = data?['workerName'] as String? ?? 'Travailleur';
    final jobTitle = data?['jobTitle'] as String? ?? 'Service';
    final amount = (data?['amount'] as num?)?.toDouble() ?? 0;

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Success icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: WkColors.successSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline,
                  color: WkColors.success,
                  size: 48,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Dépôt confirmé !',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: WkColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Votre dépôt de ${amount.toInt()}\$ a été sécurisé.\n$workerName va confirmer votre demande.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  color: WkColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              // Summary card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: WkColors.bgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: WkColors.glassBorder),
                ),
                child: Column(
                  children: [
                    _SummaryRow(label: 'Service', value: jobTitle),
                    const SizedBox(height: 8),
                    _SummaryRow(label: 'Travailleur', value: workerName),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'Dépôt sécurisé',
                      value: '${amount.toInt()} \$',
                      valueColor: WkColors.success,
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(label: 'Statut', value: 'En attente de confirmation'),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline, color: WkColors.textTertiary, size: 14),
                  const SizedBox(width: 6),
                  const Text(
                    'Paiement sécurisé par Stripe',
                    style: TextStyle(color: WkColors.textTertiary, fontSize: 12),
                  ),
                ],
              ),
              const Spacer(),
              WorkOnButton.primary(
                label: 'Voir mes demandes',
                onPressed: () => context.go('/profile/me'),
                isFullWidth: true,
                size: WorkOnButtonSize.large,
              ),
              const SizedBox(height: 12),
              WorkOnButton.secondary(
                label: 'Retour à l\'accueil',
                onPressed: () => context.go('/home'),
                isFullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: WkColors.textSecondary, fontSize: 14),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? WkColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
