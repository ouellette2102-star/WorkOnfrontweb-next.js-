import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/ui_tokens.dart';
import '../config/workon_colors.dart';
import '../core/providers/auth_provider.dart';
import '../widgets/wk_logo.dart';

/// WorkOn hamburger drawer menu.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Drawer(
      backgroundColor: WkColors.bgSecondary,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Logo header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              child: const WkLogoDrawer(),
            ),
            const Divider(color: WkColors.glassBorder, height: 1),
            const SizedBox(height: 12),
            if (!auth.isLoggedIn) ...[
              _DrawerItem(
                icon: Icons.person_add_outlined,
                label: 'M\'inscrire',
                onTap: () {
                  Navigator.of(context).pop();
                  context.go('/onboarding');
                },
              ),
              _DrawerItem(
                icon: Icons.login_outlined,
                label: 'Se connecter',
                onTap: () {
                  Navigator.of(context).pop();
                  context.go('/sign-in');
                },
              ),
            ] else ...[
              // User info
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        gradient: WkColors.gradientPremium,
                        shape: BoxShape.circle,
                      ),
                      child: CircleAvatar(
                        radius: 21,
                        backgroundColor: WkColors.bgTertiary,
                        child: const Icon(
                          Icons.person_rounded,
                          color: WkColors.textSecondary,
                          size: 21,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auth.displayName.isNotEmpty ? auth.displayName : 'Utilisateur',
                            style: const TextStyle(
                              fontFamily: 'General Sans',
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: WkColors.textPrimary,
                            ),
                          ),
                          Text(
                            auth.userEmail ?? '',
                            style: const TextStyle(
                              fontSize: 12,
                              color: WkColors.textSecondary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Divider(color: WkColors.glassBorder, height: 1),
              const SizedBox(height: 8),
              _DrawerItem(
                icon: Icons.person_outline,
                label: 'Mon profil',
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/profile/me');
                },
              ),
              _DrawerItem(
                icon: Icons.dashboard_outlined,
                label: 'Mon dashboard',
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/dashboard');
                },
              ),
              _DrawerItem(
                icon: Icons.notifications_outlined,
                label: 'Notifications',
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/notifications');
                },
              ),
            ],
            const Spacer(),
            if (auth.isLoggedIn) ...[
              const Divider(color: WkColors.glassBorder, height: 1),
              _DrawerItem(
                icon: Icons.logout,
                label: 'Déconnexion',
                color: WkColors.error,
                onTap: () async {
                  Navigator.of(context).pop();
                  await context.read<AuthProvider>().logout();
                  if (context.mounted) context.go('/onboarding');
                },
              ),
            ],
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? WkColors.textPrimary;
    return ListTile(
      leading: Icon(icon, color: c, size: 22),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: c,
          fontFamily: 'General Sans',
        ),
      ),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      minLeadingWidth: 24,
    );
  }
}
