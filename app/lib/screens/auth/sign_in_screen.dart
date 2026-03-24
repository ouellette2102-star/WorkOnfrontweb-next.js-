import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/auth/auth_errors.dart';
import '../../services/auth/auth_service.dart';
import '../../widgets/wk_logo.dart';

/// Sign-in screen — email + password login.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _error;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await AuthService.login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      if (!mounted) return;
      context.go('/home');
    } on InvalidCredentialsException {
      setState(() => _error = 'Email ou mot de passe incorrect.');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Erreur de connexion. Réessayez.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _forgotPassword() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Entrez votre email d\'abord.');
      return;
    }
    try {
      await AuthService.forgotPassword(email: email);
      if (!mounted) return;
      // Navigate to reset password screen with email pre-filled
      context.go('/reset-password?email=${Uri.encodeComponent(email)}');
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Impossible d\'envoyer l\'email.');
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const WkLogoAppBar(),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                const Text(
                  'Connexion',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    color: WkColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Accédez à votre compte WorkOn.',
                  style: TextStyle(fontSize: 14, color: WkColors.textSecondary),
                ),
                const SizedBox(height: 32),
                // Email
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: WkColors.textPrimary),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Email requis' : null,
                  decoration: _inputDecoration('Email'),
                ),
                const SizedBox(height: 14),
                // Password
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: WkColors.textPrimary),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Mot de passe requis' : null,
                  decoration: _inputDecoration('Mot de passe').copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        color: WkColors.textTertiary,
                        size: 20,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _forgotPassword,
                    child: const Text(
                      'Mot de passe oublié ?',
                      style: TextStyle(color: WkColors.brandRed, fontSize: 13),
                    ),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: const TextStyle(color: WkColors.error, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 24),
                WorkOnButton.primary(
                  label: _isLoading ? 'Connexion...' : 'Se connecter',
                  onPressed: _isLoading ? null : _login,
                  isFullWidth: true,
                  size: WorkOnButtonSize.large,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Pas encore de compte ? ',
                      style: TextStyle(color: WkColors.textSecondary, fontSize: 14),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/onboarding'),
                      child: const Text(
                        'S\'inscrire',
                        style: TextStyle(
                          color: WkColors.brandRed,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: WkColors.textSecondary, fontSize: 14),
      filled: true,
      fillColor: WkColors.bgSecondary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: WkColors.glassBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: WkColors.glassBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: WkColors.brandRed),
      ),
    );
  }
}
