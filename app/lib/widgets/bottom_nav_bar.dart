/// WorkOn Bottom Navigation Bar — PR #3
///
/// Premium 5-tab navigation following the PRD architecture:
/// Explorer | Map | + Publier | Messages | Profil
///
/// Changes from original:
/// - Reordered tabs: Explorer | Map | + | Messages | Profil
/// - Central button: + icon (contextual publish) replacing phone
/// - Tab 5: Profil (direct access) replacing drawer-only access
/// - Premium height: 68px + SafeArea
/// - Gradient accent on active tab indicator
/// - All routes and auth guards preserved
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/workon_colors.dart';
import '../config/ui_tokens.dart';
import '../core/providers/notifications_provider.dart';
import '../widgets/auth_gate.dart';

// ─────────────────────────────────────────────────────────────────────────────
// TAB DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Tab indices — explicit constants for clarity and refactor safety.
abstract final class WkNavTab {
  static const int explorer = 0;
  static const int map = 1;
  static const int publish = 2; // Central action — never a "current" tab
  static const int messages = 3;
  static const int profile = 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV BAR
// ─────────────────────────────────────────────────────────────────────────────

/// WorkOn premium bottom navigation bar.
class WorkOnBottomNavBar extends StatelessWidget {
  const WorkOnBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final notifCount = context.watch<NotificationsProvider>().unreadCount;

    return Container(
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        border: const Border(
          top: BorderSide(color: WkColors.bgQuaternary, width: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: WkSpacing.bottomNavHeight,
          child: Row(
            children: [
              // Tab 0 — Explorer (Swipe + Feed)
              _NavItem(
                index: WkNavTab.explorer,
                current: currentIndex,
                icon: Icons.explore_outlined,
                activeIcon: Icons.explore,
                label: 'Explorer',
                onTap: () => _navigate(context, WkNavTab.explorer),
              ),

              // Tab 1 — Map
              _NavItem(
                index: WkNavTab.map,
                current: currentIndex,
                icon: Icons.map_outlined,
                activeIcon: Icons.map,
                label: 'Carte',
                onTap: () => _navigate(context, WkNavTab.map),
              ),

              // Tab 2 — Publish (central action button — gradient)
              _CentralPublishButton(
                onTap: () => _navigate(context, WkNavTab.publish),
              ),

              // Tab 3 — Messages
              _NavItem(
                index: WkNavTab.messages,
                current: currentIndex,
                icon: Icons.chat_bubble_outline_rounded,
                activeIcon: Icons.chat_bubble_rounded,
                label: 'Messages',
                badgeCount: notifCount,
                onTap: () => _navigate(context, WkNavTab.messages),
              ),

              // Tab 4 — Profil (direct access — replaces drawer-only)
              _NavItem(
                index: WkNavTab.profile,
                current: currentIndex,
                icon: Icons.person_outline_rounded,
                activeIcon: Icons.person_rounded,
                label: 'Profil',
                onTap: () => _navigate(context, WkNavTab.profile),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigate(BuildContext context, int index) {
    HapticFeedback.lightImpact();
    switch (index) {
      case WkNavTab.explorer:
        onTap(WkNavTab.explorer);
        context.go('/talent');
        break;
      case WkNavTab.map:
        onTap(WkNavTab.map);
        context.go('/map');
        break;
      case WkNavTab.publish:
        requireAuth(context, () {
          context.push('/publish');
        });
        break;
      case WkNavTab.messages:
        requireAuth(context, () {
          onTap(WkNavTab.messages);
          context.go('/messages');
        });
        break;
      case WkNavTab.profile:
        requireAuth(context, () {
          onTap(WkNavTab.profile);
          context.go('/profile/me');
        });
        break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────────────────────────────────────────

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.index,
    required this.current,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
    this.badgeCount = 0,
  });

  final int index;
  final int current;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badgeCount;
  final VoidCallback onTap;

  bool get isActive => index == current;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: WkDuration.fast,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  // Active indicator pill behind icon
                  if (isActive)
                    AnimatedContainer(
                      duration: WkDuration.normal,
                      width: 36,
                      height: 28,
                      decoration: BoxDecoration(
                        color: WkColors.brandRedSoft,
                        borderRadius: BorderRadius.circular(WkRadius.pill),
                      ),
                    ),
                  Icon(
                    isActive ? activeIcon : icon,
                    color: isActive
                        ? WkColors.brandRed
                        : WkColors.textTertiary,
                    size: WkIconSize.lg,
                  ),
                  // Notification badge
                  if (badgeCount > 0)
                    Positioned(
                      top: -3,
                      right: -8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          gradient: WkColors.gradientPremium,
                          borderRadius: BorderRadius.circular(WkRadius.pill),
                        ),
                        child: Text(
                          badgeCount > 99 ? '99+' : '$badgeCount',
                          style: const TextStyle(
                            fontFamily: 'General Sans',
                            fontSize: 9,
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: WkDuration.fast,
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive ? WkColors.brandRed : WkColors.textTertiary,
                  letterSpacing: 0.1,
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL PUBLISH BUTTON
// ─────────────────────────────────────────────────────────────────────────────

class _CentralPublishButton extends StatelessWidget {
  const _CentralPublishButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                gradient: WkColors.gradientPremium,
                shape: BoxShape.circle,
                boxShadow: WkColors.shadowPremium,
              ),
              child: const Icon(
                Icons.add_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
            const SizedBox(height: 3),
            const Text(
              'Publier',
              style: TextStyle(
                fontFamily: 'General Sans',
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: WkColors.brandOrange,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
