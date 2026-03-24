/// Centralized application configuration for WorkOn.
///
/// Usage :
///   Production  : flutter run                               (default)
///   Dev local   : flutter run --dart-define=APP_ENV=dev
///   Dev device  : flutter run --dart-define=APP_ENV=dev --dart-define=LOCAL_IP=192.168.x.x
library;

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Environment
// ─────────────────────────────────────────────────────────────────────────────

enum AppEnv { dev, staging, prod }

/// Application configuration — single source of truth for API URLs, keys.
abstract final class AppConfig {
  // ─────────────────────────────────────────────────────────────────────────
  // Environment detection (via --dart-define=APP_ENV=dev|staging|prod)
  // ─────────────────────────────────────────────────────────────────────────

  static const String _envName = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'prod',
  );

  static AppEnv get env {
    switch (_envName.toLowerCase()) {
      case 'dev':
      case 'development':
        return AppEnv.dev;
      case 'staging':
        return AppEnv.staging;
      default:
        return AppEnv.prod;
    }
  }

  static bool get isProd => env == AppEnv.prod;
  static bool get isDev => env == AppEnv.dev;
  static bool get isStaging => env == AppEnv.staging;

  // ─────────────────────────────────────────────────────────────────────────
  // Local IP override (appareil physique)
  // Usage : flutter run --dart-define=APP_ENV=dev --dart-define=LOCAL_IP=192.168.1.42
  // ─────────────────────────────────────────────────────────────────────────

  static const String _localIp = String.fromEnvironment(
    'LOCAL_IP',
    defaultValue: '',
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Backend URLs
  // ─────────────────────────────────────────────────────────────────────────

  /// Production (Railway)
  static const String _prodApiUrl =
      'https://workon-backend-production-8908.up.railway.app/api/v1';

  /// Staging (Railway staging)
  static const String _stagingApiUrl =
      'https://workon-backend-staging.up.railway.app/api/v1';

  /// Local dev — URL adaptée selon la plateforme :
  ///   Android emulator → 10.0.2.2  (alias de localhost sur l'hôte)
  ///   iOS simulator    → localhost  (accès direct à l'hôte)
  ///   Physical device  → LOCAL_IP   (IP de la machine sur le réseau local)
  static String get _devApiUrl {
    // Priorité 1 : IP explicite fournie via --dart-define=LOCAL_IP=...
    if (_localIp.isNotEmpty) {
      return 'http://$_localIp:3000/api/v1';
    }
    // Priorité 2 : Détection automatique selon plateforme
    try {
      if (Platform.isAndroid) {
        // 10.0.2.2 = alias vers localhost de la machine hôte dans l'émulateur Android
        return 'http://10.0.2.2:3000/api/v1';
      }
      // iOS simulator et macOS accèdent directement à localhost
      return 'http://localhost:3000/api/v1';
    } catch (_) {
      // Web ou plateforme inconnue
      return 'http://localhost:3000/api/v1';
    }
  }

  /// URL active selon l'environnement courant.
  static String get activeApiUrl {
    if (isDev) return _devApiUrl;
    if (isStaging) return _stagingApiUrl;
    return _prodApiUrl;
  }

  /// Alias utilisé par ApiClient.
  static String get apiUrl => activeApiUrl;

  // ─────────────────────────────────────────────────────────────────────────
  // Timeouts
  // ─────────────────────────────────────────────────────────────────────────

  static const Duration connectionTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // ─────────────────────────────────────────────────────────────────────────
  // App Identity
  // ─────────────────────────────────────────────────────────────────────────

  static const String appName = 'WorkOn';
  static const String appVersion = '1.0.0';
  static const String profileBaseUrl = 'https://workon.app/u';

  // ─────────────────────────────────────────────────────────────────────────
  // Stripe
  // ─────────────────────────────────────────────────────────────────────────

  /// Clé publique Stripe — injectée via --dart-define=STRIPE_PUBLISHABLE_KEY=pk_live_...
  /// Ne JAMAIS committer de valeur réelle ici. Ne JAMAIS mettre sk_live_.
  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const String stripeMerchantName = appName;

  // ─────────────────────────────────────────────────────────────────────────
  // Google Maps
  // ─────────────────────────────────────────────────────────────────────────

  /// Clé Google Maps — injectée via --dart-define=GOOGLE_MAPS_API_KEY=AIza...
  /// Ne JAMAIS committer de valeur réelle ici.
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Debug helpers
  // ─────────────────────────────────────────────────────────────────────────

  /// Affiche la configuration active dans la console (debug uniquement).
  static void debugPrintConfig() {
    if (!kDebugMode) return;
    debugPrint('[AppConfig] ENV       : $_envName → ${env.name}');
    debugPrint('[AppConfig] API_URL   : $activeApiUrl');
    debugPrint('[AppConfig] LOCAL_IP  : ${_localIp.isEmpty ? "(auto)" : _localIp}');

    if (stripePublishableKey.isEmpty) {
      debugPrint('[AppConfig] ⚠️  STRIPE_PUBLISHABLE_KEY manquante — passer --dart-define=STRIPE_PUBLISHABLE_KEY=pk_live_...');
    }
    if (googleMapsApiKey.isEmpty) {
      debugPrint('[AppConfig] ⚠️  GOOGLE_MAPS_API_KEY manquante — passer --dart-define=GOOGLE_MAPS_API_KEY=AIza...');
    }
  }
}
