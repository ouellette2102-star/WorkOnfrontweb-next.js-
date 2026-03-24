import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:provider/provider.dart';

import 'config/app_config.dart';
import 'config/workon_theme.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/notifications_provider.dart';
import 'core/router/app_router.dart';
import 'services/auth/token_storage.dart';
import 'services/push/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Log active config (debug only)
  AppConfig.debugPrintConfig();

  // Initialize token storage before anything else
  await TokenStorage.initialize();

  // Initialize Stripe SDK (graceful fallback if theme not configured)
  try {
    Stripe.publishableKey = AppConfig.stripePublishableKey;
    await Stripe.instance.applySettings();
  } catch (_) {
    // Stripe not ready — payment sheet disabled, app continues
    debugPrint('[main] Stripe initialization failed — payments disabled');
  }

  // Initialize Firebase (graceful fallback if google-services.json not configured)
  try {
    await Firebase.initializeApp();
    await PushService.initialize();
    // Wire navigator key so push notifications can navigate
    PushService.setNavigatorKey(navigatorKey);
  } catch (_) {
    // Firebase not configured — push notifications disabled, app continues
  }

  runApp(const WorkOnApp());
}

class WorkOnApp extends StatelessWidget {
  const WorkOnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
      ],
      child: MaterialApp.router(
        title: 'WorkOn',
        theme: WkTheme.dark,
        darkTheme: WkTheme.dark,
        themeMode: ThemeMode.dark,
        routerConfig: appRouter,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
