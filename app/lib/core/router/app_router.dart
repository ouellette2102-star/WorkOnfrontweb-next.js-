/// WorkOn app router — go_router declarative navigation with auth guards.
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../screens/auth/reset_password_screen.dart';
import '../../screens/auth/sign_in_screen.dart';
import '../../screens/auth/sign_up_screen.dart';
import '../../screens/booking/booking_screen.dart';
import '../../screens/booking/payment_confirmation_screen.dart';
import '../../screens/home_screen.dart';
import '../../screens/map/map_screen.dart';
import '../../screens/messages/chat_screen.dart';
import '../../screens/messages/messages_screen.dart';
import '../../screens/notifications/notifications_screen.dart';
import '../../screens/onboarding/account_type_screen.dart';
import '../../screens/onboarding/onboarding_screen.dart';
import '../../screens/onboarding/profile_ready_screen.dart';
import '../../screens/profile/dashboard_screen.dart';
import '../../screens/profile/earnings_screen.dart';
import '../../screens/profile/edit_profile_screen.dart';
import '../../screens/profile/my_profile_screen.dart';
import '../../screens/profile/review_screen.dart';
import '../../screens/profile/worker_detail_screen.dart';
import '../../screens/publish/create_demand_form.dart';
import '../../screens/publish/create_offer_form.dart';
import '../../screens/publish/publish_screen.dart';
import '../../screens/splash_screen.dart';
import '../../screens/talent/talent_swipe_screen.dart';
import '../../services/auth/token_storage.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Routes that require authentication.
const _protectedRoutes = {
  '/talent',
  '/publish',
  '/publish/demand',
  '/publish/offer',
  '/messages',
  '/profile/me',
  '/profile/edit',
  '/dashboard',
  '/earnings',
  '/notifications',
};

/// Redirect logic: if not authenticated and route is protected → /onboarding.
String? _authGuard(GoRouterState state) {
  final isLoggedIn = TokenStorage.hasToken;
  final location = state.uri.path;

  if (!isLoggedIn && _protectedRoutes.any((r) => location.startsWith(r))) {
    return '/onboarding';
  }
  return null;
}

final GoRouter appRouter = GoRouter(
  navigatorKey: navigatorKey,
  initialLocation: '/',
  redirect: (_, state) => _authGuard(state),
  errorBuilder: (context, state) => Scaffold(
    backgroundColor: const Color(0xFF0D0D0F),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFE53935), size: 48),
          const SizedBox(height: 16),
          Text(
            'Page introuvable',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontFamily: 'General Sans',
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            state.uri.path,
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
          const SizedBox(height: 24),
          TextButton(
            onPressed: () => GoRouter.of(context).go('/home'),
            child: const Text('Retour à l\'accueil', style: TextStyle(color: Color(0xFFE53935))),
          ),
        ],
      ),
    ),
  ),
  routes: [
    GoRoute(
      path: '/',
      name: 'splash',
      builder: (_, __) => const SplashScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (_, __) => const HomeScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (_, __) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/onboarding/account-type',
      name: 'account-type',
      builder: (_, __) => const AccountTypeScreen(),
    ),
    GoRoute(
      path: '/sign-up',
      name: 'sign-up',
      builder: (context, state) {
        final role = state.uri.queryParameters['role'] ?? 'worker';
        return SignUpScreen(role: role);
      },
    ),
    GoRoute(
      path: '/sign-in',
      name: 'sign-in',
      builder: (_, __) => const SignInScreen(),
    ),
    GoRoute(
      path: '/reset-password',
      name: 'reset-password',
      // Public — accessible without token (link from email)
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return ResetPasswordScreen(prefillEmail: email);
      },
    ),
    GoRoute(
      path: '/profile/ready',
      name: 'profile-ready',
      builder: (_, __) => const ProfileReadyScreen(),
    ),
    GoRoute(
      path: '/talent',
      name: 'talent',
      builder: (_, __) => const TalentSwipeScreen(),
    ),
    GoRoute(
      path: '/talent/:workerId',
      name: 'worker-detail',
      builder: (context, state) {
        final workerId = state.pathParameters['workerId']!;
        final extra = state.extra as Map<String, dynamic>?;
        return WorkerDetailScreen(workerId: workerId, workerData: extra);
      },
    ),
    GoRoute(
      path: '/talent/:workerId/book',
      name: 'booking',
      builder: (context, state) {
        final workerId = state.pathParameters['workerId']!;
        final extra = state.extra as Map<String, dynamic>?;
        return BookingScreen(workerId: workerId, workerData: extra);
      },
    ),
    GoRoute(
      path: '/booking/confirmation',
      name: 'payment-confirmation',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return PaymentConfirmationScreen(data: extra);
      },
    ),
    GoRoute(
      path: '/map',
      name: 'map',
      builder: (_, __) => const MapScreen(),
    ),
    GoRoute(
      path: '/publish',
      name: 'publish',
      builder: (_, __) => const PublishScreen(),
    ),
    GoRoute(
      path: '/publish/demand',
      name: 'create-demand',
      builder: (_, __) => const CreateDemandForm(),
    ),
    GoRoute(
      path: '/publish/offer',
      name: 'create-offer',
      builder: (_, __) => const CreateOfferForm(),
    ),
    GoRoute(
      path: '/messages',
      name: 'messages',
      builder: (_, __) => const MessagesScreen(),
    ),
    GoRoute(
      path: '/messages/:missionId',
      name: 'chat',
      builder: (context, state) {
        final missionId = state.pathParameters['missionId']!;
        final extra = state.extra as Map<String, dynamic>?;
        return ChatScreen(
          missionId: missionId,
          missionTitle: extra?['title'] as String? ?? 'Mission',
        );
      },
    ),
    GoRoute(
      path: '/profile/me',
      name: 'my-profile',
      builder: (_, __) => const MyProfileScreen(),
    ),
    GoRoute(
      path: '/profile/edit',
      name: 'edit-profile',
      builder: (_, __) => const EditProfileScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      name: 'dashboard',
      builder: (_, __) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/earnings',
      name: 'earnings',
      builder: (_, __) => const EarningsScreen(),
    ),
    GoRoute(
      path: '/notifications',
      name: 'notifications',
      builder: (_, __) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/review/:missionId',
      name: 'review',
      builder: (context, state) {
        final missionId = state.pathParameters['missionId']!;
        final extra = state.extra as Map<String, dynamic>?;
        return ReviewScreen(
          missionId: missionId,
          targetUserId: extra?['targetUserId'] as String? ?? '',
          targetName: extra?['targetName'] as String? ?? 'Utilisateur',
        );
      },
    ),
  ],
);
