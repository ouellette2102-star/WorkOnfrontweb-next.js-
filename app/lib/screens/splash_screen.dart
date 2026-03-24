import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/workon_colors.dart';
import '../services/auth/auth_service.dart';
import '../services/auth/token_storage.dart';
import '../widgets/wk_logo.dart';

/// Splash screen — checks token then routes to /home or /onboarding.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await TokenStorage.initialize();

    if (!mounted) return;

    if (!TokenStorage.hasToken) {
      context.go('/onboarding');
      return;
    }

    // Token exists — validate with /auth/me
    try {
      await AuthService.tryRestoreSession();
      if (!mounted) return;
      if (AuthService.hasSession) {
        context.go('/home');
      } else {
        context.go('/onboarding');
      }
    } catch (_) {
      await TokenStorage.clearToken();
      if (!mounted) return;
      context.go('/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/workon_splash_logo.png',
              width: 80,
              height: 80,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.phone_in_talk,
                color: WkColors.brandRed,
                size: 60,
              ),
            ),
            const SizedBox(height: 20),
            const WkLogoHero(),
            const SizedBox(height: 32),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: WkColors.brandRed,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
