import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../widgets/wk_logo.dart';
import '../../widgets/wk_primary_button.dart';
import '../../config/workon_widgets.dart';

/// Account type selection — Travailleur ou Employeur.
class AccountTypeScreen extends StatefulWidget {
  const AccountTypeScreen({super.key});

  @override
  State<AccountTypeScreen> createState() => _AccountTypeScreenState();
}

class _AccountTypeScreenState extends State<AccountTypeScreen> {
  String _selectedRole = 'worker';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF3D0000), WkColors.bgPrimary],
                stops: [0.0, 0.4],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 32),
                  const WkLogoAppBar(),
                  const SizedBox(height: 32),
                  const Text(
                    'Type de compte',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                      height: 1.2,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Faites-nous savoir comment vous\nsouhaitez utiliser WorkOn.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: WkColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Role cards
                  _RoleCard(
                    icon: Icons.build_outlined,
                    title: 'Trouver des missions',
                    subtitle: 'Recevoir des contrats, offrir vos services',
                    role: 'worker',
                    selected: _selectedRole == 'worker',
                    onTap: () => setState(() => _selectedRole = 'worker'),
                  ),
                  const SizedBox(height: 12),
                  _RoleCard(
                    icon: Icons.business_center_outlined,
                    title: 'Publier des missions',
                    subtitle: 'Engager des professionnels qualifiés',
                    role: 'employer',
                    selected: _selectedRole == 'employer',
                    onTap: () => setState(() => _selectedRole = 'employer'),
                  ),
                  const SizedBox(height: 24),
                  // Trust badges
                  _TrustBadge(icon: Icons.verified_outlined, text: 'Vérification d\'Identité'),
                  const SizedBox(height: 8),
                  _TrustBadge(icon: Icons.security_outlined, text: 'Assurances & conformité'),
                  const SizedBox(height: 8),
                  _TrustBadge(icon: Icons.description_outlined, text: 'Contrat sécurisé WorkOn'),
                  const Spacer(),
                  WkPrimaryButton(
                    label: 'Finaliser mon inscription',
                    onPressed: () => context.go('/sign-up?role=$_selectedRole'),
                  ),
                  const SizedBox(height: WkSpacing.xxxl),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.role,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String role;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? WkColors.brandOrangeSoft : WkColors.bgSecondary,
          borderRadius: BorderRadius.circular(WkRadius.cardLarge),
          border: Border.all(
            color: selected ? WkColors.brandOrange : WkColors.bgQuaternary,
            width: selected ? 1.5 : 0.5,
          ),
          boxShadow: selected ? WkColors.shadowPremium : WkColors.shadowCard,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: selected ? WkColors.gradientPremium : null,
                color: selected ? null : WkColors.bgTertiary,
                borderRadius: BorderRadius.circular(WkRadius.md),
                boxShadow: selected ? WkColors.shadowPremium : null,
              ),
              child: Icon(icon, color: Colors.white, size: 24),
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
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: WkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
                      color: WkColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              selected
                  ? Icons.check_circle_rounded
                  : Icons.circle_outlined,
              color: selected ? WkColors.brandOrange : WkColors.textTertiary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

class _TrustBadge extends StatelessWidget {
  const _TrustBadge({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.check_circle, color: WkColors.success, size: 18),
        const SizedBox(width: 10),
        Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            color: WkColors.textSecondary,
          ),
        ),
        const Spacer(),
        const Icon(Icons.chevron_right, color: WkColors.textTertiary, size: 18),
      ],
    );
  }
}
