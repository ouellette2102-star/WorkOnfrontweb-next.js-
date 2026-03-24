import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/location/location_service.dart';
import '../../services/missions/missions_api.dart';
import '../../services/payments/stripe_service.dart';
import '../../widgets/wk_badge.dart';
import '../../widgets/wk_rating_display.dart';

/// "Réservez en 1 tap" booking screen.
/// Flow : crée une mission → crée un PaymentIntent → présente la Stripe Payment Sheet.
class BookingScreen extends StatefulWidget {
  const BookingScreen({
    super.key,
    required this.workerId,
    this.workerData,
  });

  final String workerId;
  final Map<String, dynamic>? workerData;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  bool _isLoading = false;
  String? _error;

  // ─────────────────────────────────────────────────────────────────────────
  // Worker data helpers
  // ─────────────────────────────────────────────────────────────────────────

  String get _workerName {
    final d = widget.workerData;
    if (d == null) return 'Travailleur';
    return '${d['firstName'] ?? ''} ${d['lastName'] ?? ''}'.trim();
  }

  String get _jobTitle => (widget.workerData?['jobTitle'] as String?) ?? 'Service';
  String get _city => (widget.workerData?['city'] as String?) ?? 'Montréal';
  double get _rating => (widget.workerData?['rating'] as num?)?.toDouble() ?? 0.0;
  int get _completionPct => (widget.workerData?['completionPct'] as num?)?.toInt() ?? 0;
  double get _hourlyRate => (widget.workerData?['hourlyRate'] as num?)?.toDouble() ?? 150.0;

  // Estimated 2h deposit = hourly rate × 2 (configurable)
  double get _depositAmount => _hourlyRate * 2;

  // ─────────────────────────────────────────────────────────────────────────
  // Payment flow (réel — Stripe Payment Sheet)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _pay() async {
    setState(() { _isLoading = true; _error = null; });

    try {
      // Step 1 — Obtain real GPS coordinates (fallback = Montréal if denied)
      final position = await LocationService.instance.getCurrentPosition();

      // Step 2 — Create the mission in the backend
      final mission = await MissionsApi().createMission(
        title: 'Service demandé : $_jobTitle',
        description: 'Demande de service pour $_workerName ($_jobTitle)',
        category: _jobTitle,
        price: _depositAmount,
        latitude: position.latitude,
        longitude: position.longitude,
        city: _city,
      );

      if (!mounted) return;

      // Step 3 — Présenter la Stripe Payment Sheet
      final result = await StripeService.payForMission(missionId: mission.id);

      if (!mounted) return;

      switch (result) {
        case PaymentSheetSuccess():
          context.goNamed(
            'payment-confirmation',
            extra: {
              'workerName': _workerName,
              'jobTitle': _jobTitle,
              'amount': _depositAmount,
              'missionId': mission.id,
            },
          );
        case PaymentSheetCancelled():
          setState(() { _isLoading = false; });
        case PaymentSheetError(:final message, :final isAuthError):
          setState(() {
            _isLoading = false;
            _error = isAuthError
                ? 'Session expirée. Reconnecte-toi.'
                : message;
          });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Erreur lors de la réservation. Réessayez.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Réservez en 1 tap',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: WkColors.bgSecondary,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: WkColors.glassBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _jobTitle,
                              style: const TextStyle(
                                fontFamily: 'General Sans',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: WkColors.textPrimary,
                              ),
                            ),
                            Text(
                              '$_city · $_workerName',
                              style: const TextStyle(
                                fontSize: 13,
                                color: WkColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${_hourlyRate.toInt()}\$/h',
                            style: const TextStyle(
                              fontFamily: 'General Sans',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: WkColors.brandRed,
                            ),
                          ),
                          const Text(
                            'Dépôt 2h',
                            style: TextStyle(fontSize: 12, color: WkColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    children: [
                      if (_completionPct > 0) WkBadge.reliable(),
                      WkBadge.verified(),
                      if (_rating > 0)
                        WkRatingDisplay.compact(rating: _rating),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Map mini-preview (placeholder until Google Maps configured)
            Container(
              height: 140,
              decoration: BoxDecoration(
                color: WkColors.bgTertiary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: WkColors.glassBorder),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.location_on, color: WkColors.brandRed, size: 36),
                    const SizedBox(height: 6),
                    Text(
                      _city,
                      style: const TextStyle(
                        color: WkColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Rayon de service : +10 km. Adresse exacte demandée après confirmation.',
              style: TextStyle(fontSize: 12, color: WkColors.textTertiary),
            ),
            const SizedBox(height: 20),
            // Contract details — corrected labels
            const Text(
              'Détails du contrat',
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _ContractRow(label: 'Service', value: _jobTitle),
            _ContractRow(label: 'Travailleur', value: _workerName),
            _ContractRow(label: 'Tarif horaire', value: '${_hourlyRate.toInt()} \$/h'),
            _ContractRow(
              label: 'Dépôt sécurisé (2h)',
              value: '${_depositAmount.toInt()} \$',
              color: WkColors.brandRed,
            ),
            _ContractRow(label: 'Adresse', value: 'Confirmée après réservation'),
            const Divider(color: WkColors.glassBorder, height: 24),
            _ContractRow(
              label: 'Total dépôt',
              value: '${_depositAmount.toInt()} \$',
              color: WkColors.textPrimary,
              bold: true,
            ),
            const SizedBox(height: 24),
            // Escrow security card — PRD trust mechanic
            Container(
              padding: const EdgeInsets.all(WkSpacing.cardPadding),
              decoration: BoxDecoration(
                color: WkColors.availableGreenSoft,
                borderRadius: BorderRadius.circular(WkRadius.card),
                border: Border.all(
                  color: WkColors.availableGreen.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.security_rounded,
                    color: WkColors.availableGreen,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Paiement sécurisé par dépôt',
                          style: TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: WkColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          WkCopy.escrowExplain,
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 11,
                            color: WkColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: WkColors.errorSoft,
                  borderRadius: BorderRadius.circular(WkRadius.md),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: WkColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(
                          fontFamily: 'General Sans',
                          color: WkColors.error,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            // Pay button — solid red CTA
            GestureDetector(
              onTap: _isLoading ? null : _pay,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  color: _isLoading ? WkColors.bgTertiary : WkColors.brandRed,
                  borderRadius: BorderRadius.circular(WkRadius.pill),
                ),
                child: Center(
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.lock_rounded, color: Colors.white, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'Payer le dépôt — ${_depositAmount.toInt()} \$',
                              style: const TextStyle(
                                fontFamily: 'General Sans',
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outlined, color: WkColors.textTertiary, size: 12),
                const SizedBox(width: 5),
                const Text(
                  WkCopy.securedByStripe,
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    color: WkColors.textTertiary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Center(
              child: Text(
                WkCopy.neutralPlatform,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'General Sans',
                  color: WkColors.textDisabled,
                  fontSize: 11,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _FooterLink('Conditions'),
                _FooterLink('Confidentialité'),
                _FooterLink('Litiges'),
                _FooterLink('Support'),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ContractRow extends StatelessWidget {
  const _ContractRow({
    required this.label,
    required this.value,
    this.color,
    this.bold = false,
  });

  final String label;
  final String value;
  final Color? color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: bold ? WkColors.textPrimary : WkColors.textSecondary,
              fontSize: 14,
              fontWeight: bold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color ?? WkColors.textPrimary,
              fontSize: 14,
              fontWeight: bold ? FontWeight.w700 : FontWeight.w600,
              fontFamily: 'General Sans',
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  const _FooterLink(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: WkColors.textTertiary,
        fontSize: 11,
        decoration: TextDecoration.underline,
        decorationColor: WkColors.textTertiary,
      ),
    );
  }
}
