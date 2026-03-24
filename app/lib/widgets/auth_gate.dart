import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/providers/auth_provider.dart';

/// Wraps a child widget and redirects to /onboarding if user is not logged in.
///
/// Usage:
/// ```dart
/// AuthGate(
///   child: TalentSwipeScreen(),
/// )
/// ```
class AuthGate extends StatelessWidget {
  const AuthGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go('/onboarding');
        }
      });
      return const SizedBox.shrink();
    }
    return child;
  }
}

/// Helper function to gate an action behind authentication.
///
/// If user is logged in, executes [action].
/// Otherwise, navigates to /onboarding.
void requireAuth(BuildContext context, VoidCallback action) {
  final auth = context.read<AuthProvider>();
  if (auth.isLoggedIn) {
    action();
  } else {
    context.go('/onboarding');
  }
}
