import 'package:flutter/material.dart';

import '../config/workon_colors.dart';
import '../config/workon_widgets.dart';
import '../services/legal/consent_api.dart';

/// Shows the CGU consent modal and accepts via backend.
/// Returns true if accepted, null/false otherwise.
Future<bool?> showConsentModal(BuildContext context) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ConsentModal(),
  );
}

class _ConsentModal extends StatefulWidget {
  const _ConsentModal();

  @override
  State<_ConsentModal> createState() => _ConsentModalState();
}

class _ConsentModalState extends State<_ConsentModal> {
  bool _isLoading = false;
  String? _error;

  Future<void> _accept() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ComplianceApi().acceptAllWithRetry();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Impossible d\'accepter. Réessayez.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: WkColors.glassBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Conditions d\'utilisation',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: WkColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'En utilisant WorkOn, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité. '
            'WorkOn fournit l\'infrastructure de mise en relation et de paiement. '
            'WorkOn n\'est pas partie au contrat de service entre les utilisateurs.',
            style: TextStyle(
              fontSize: 14,
              color: WkColors.textSecondary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.check_circle, color: WkColors.success, size: 16),
              const SizedBox(width: 8),
              const Text(
                'Paiement sécurisé par Stripe',
                style: TextStyle(fontSize: 13, color: WkColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.check_circle, color: WkColors.success, size: 16),
              const SizedBox(width: 8),
              const Text(
                'Données protégées — Loi 25 / RGPD',
                style: TextStyle(fontSize: 13, color: WkColors.textSecondary),
              ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: WkColors.error, fontSize: 13),
            ),
          ],
          const SizedBox(height: 24),
          WorkOnButton.primary(
            label: _isLoading ? 'Acceptation...' : 'Accepter et continuer',
            onPressed: _isLoading ? null : _accept,
            isFullWidth: true,
            size: WorkOnButtonSize.large,
            isLoading: _isLoading,
          ),
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text(
                'Refuser',
                style: TextStyle(color: WkColors.textTertiary, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
