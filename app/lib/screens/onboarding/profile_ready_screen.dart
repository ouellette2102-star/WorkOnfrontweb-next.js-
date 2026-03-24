import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../core/providers/auth_provider.dart';

/// "Votre profil est prêt!" screen shown after successful registration.
class ProfileReadyScreen extends StatelessWidget {
  const ProfileReadyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userId = auth.userId ?? 'user';
    final profileLink = '${AppConfig.profileBaseUrl}/$userId';
    final name = auth.displayName.isNotEmpty ? auth.displayName : 'Votre profil';

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: Stack(
        children: [
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
                  const SizedBox(height: 40),
                  const Text(
                    'WorkOn',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'Votre profil est prêt !',
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 30,
                      fontWeight: FontWeight.w700,
                      color: WkColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Partagez votre lien unique et commencez\nà recevoir des demandes de contrats.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: WkColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Profile card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: WkColors.bgSecondary,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: WkColors.glassBorder),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: WkColors.bgTertiary,
                              child: const Icon(Icons.person, color: WkColors.textSecondary, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'Work',
                                        style: TextStyle(
                                          fontFamily: 'General Sans',
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: WkColors.textPrimary,
                                        ),
                                      ),
                                      const Text(
                                        'On',
                                        style: TextStyle(
                                          fontFamily: 'General Sans',
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: WkColors.brandRed,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    name,
                                    style: const TextStyle(
                                      fontFamily: 'General Sans',
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: WkColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    auth.role.name,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: WkColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: WkColors.brandRedSoft,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Nouveau',
                                style: TextStyle(
                                  color: WkColors.brandRed,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  Clipboard.setData(ClipboardData(text: profileLink));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Lien copié !')),
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: WkColors.bgTertiary,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.link, color: WkColors.textSecondary, size: 14),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          profileLink,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: WkColors.textSecondary,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const Icon(Icons.copy, color: WkColors.textTertiary, size: 14),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  WorkOnButton.primary(
                    label: 'Commencer',
                    onPressed: () => context.go('/home'),
                    isFullWidth: true,
                    size: WorkOnButtonSize.large,
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
