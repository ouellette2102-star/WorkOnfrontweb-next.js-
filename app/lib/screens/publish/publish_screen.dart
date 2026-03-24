import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';

/// Publish modal — choice between "Offre de service" (worker) or "Demande de service" (client).
/// Accessed via the central red telephone button in BottomNavBar.
class PublishScreen extends StatelessWidget {
  const PublishScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        onTap: () => context.pop(),
        child: Container(
          color: Colors.black54,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: GestureDetector(
              onTap: () {}, // Prevent tap-through
              child: Container(
                decoration: BoxDecoration(
                  color: WkColors.bgSecondary,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(WkRadius.bottomSheet),
                  ),
                  border: Border(
                    top: BorderSide(color: WkColors.bgQuaternary, width: 0.5),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Drag handle
                      Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          color: WkColors.bgQuaternary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const Text(
                        'Publier',
                        style: TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: WkColors.textPrimary,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Que souhaitez-vous créer ?',
                        style: TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                          color: WkColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Option 1: Demande (client)
                      _PublishOption(
                        icon: Icons.assignment_add,
                        title: 'Publier une demande',
                        subtitle: 'Vous êtes client — cherchez un professionnel',
                        color: WkColors.brandRed,
                          onTap: () {
                          context.pop();
                          context.push('/publish/demand');
                        },
                      ),
                      const SizedBox(height: 12),
                      // Option 2: Offre (worker)
                      _PublishOption(
                        icon: Icons.work_outline,
                        title: 'Publier une offre de service',
                        subtitle: 'Vous êtes travailleur — proposez vos services',
                        color: const Color(0xFF2563EB),
                          onTap: () {
                          context.pop();
                          context.push('/publish/offer');
                        },
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => context.pop(),
                        child: const Text(
                          'Annuler',
                          style: TextStyle(color: WkColors.textTertiary),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PublishOption extends StatelessWidget {
  const _PublishOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isOrange = color == WkColors.brandRed;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: WkColors.bgTertiary,
          borderRadius: BorderRadius.circular(WkRadius.lg),
          border: Border.all(
            color: isOrange ? WkColors.brandOrangeMuted : WkColors.bgQuaternary,
            width: 0.8,
          ),
        ),
        child: Row(
          children: [
            // Icon container
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: isOrange ? WkColors.gradientPremium : null,
                color: isOrange ? null : color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(WkRadius.md),
                boxShadow: isOrange ? WkColors.shadowPremium : null,
              ),
              child: Icon(icon, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 12,
                      color: WkColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: WkColors.textTertiary,
              size: 15,
            ),
          ],
        ),
      ),
    );
  }
}
