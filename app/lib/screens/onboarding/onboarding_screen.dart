import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/metrics/metrics_api.dart';
import '../../services/metrics/metrics_models.dart';
import '../../widgets/wk_logo.dart';

/// Landing onboarding screen — "Rejoignez la communauté WorkOn".
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  RatioMetrics? _ratio;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final ratio = await const MetricsApi().getRatio();
      if (mounted) setState(() => _ratio = ratio);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: Stack(
        children: [
          // Atmospheric dark background — warm depth, no flat red
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0.0, -0.6),
                radius: 1.2,
                colors: [
                  Color(0xFF2A1010), // warm dark center
                  Color(0xFF0D0D0F), // deep black edges
                ],
                stops: [0.0, 1.0],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: WkSpacing.xxxl),
                  // Brand logo
                  const WkLogo(fontSize: 26),
                  const SizedBox(height: WkSpacing.xxxl),
                  // Title — clean and readable
                  const Text(
                    'Rejoignez\nla communauté',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                      height: 1.15,
                      letterSpacing: -0.8,
                    ),
                  ),
                  const SizedBox(height: WkSpacing.md),
                  // Subtitle
                  const Text(
                    'Trouvez ou proposez des missions locales.\nProfessionnels vérifiés, en toute confiance.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 15,
                      color: WkColors.textSecondary,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 40),
                  // Stats row
                  _StatsRow(ratio: _ratio),
                  const Spacer(),
                  // CTA button
                  WorkOnButton.primary(
                    label: 'Commencer',
                    onPressed: () => context.go('/onboarding/account-type'),
                    isFullWidth: true,
                    size: WorkOnButtonSize.large,
                  ),
                  const SizedBox(height: 16),
                  // Sign in link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Déjà un compte ? ',
                        style: TextStyle(
                          color: WkColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.go('/sign-in'),
                        child: const Text(
                          'Se connecter',
                          style: TextStyle(
                            color: WkColors.brandRed,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({this.ratio});
  final RatioMetrics? ratio;

  @override
  Widget build(BuildContext context) {
    final workers = ratio?.workers ?? 2453;
    final employers = ratio?.employers ?? 182;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: WkSpacing.lg,
        vertical: WkSpacing.md,
      ),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(WkRadius.lg),
        border: Border.all(color: WkColors.glassBorder, width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _StatItem(
            icon: Icons.bolt_rounded,
            iconColor: WkColors.brandOrange,
            value: _format(workers),
            label: 'Actifs',
          ),
          Container(width: 0.5, height: 28, color: WkColors.glassBorder),
          _StatItem(
            icon: Icons.check_circle_outline_rounded,
            iconColor: WkColors.success,
            value: _format(employers),
            label: 'Missions',
          ),
          Container(width: 0.5, height: 28, color: WkColors.glassBorder),
          const _StatItem(
            icon: Icons.verified_user_outlined,
            iconColor: WkColors.verifiedBlue,
            value: '100%',
            label: 'Sécurisé',
          ),
        ],
      ),
    );
  }

  String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return n.toString();
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: iconColor, size: 14),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 11,
            color: WkColors.textTertiary,
          ),
        ),
      ],
    );
  }
}
