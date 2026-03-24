import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/auth/auth_errors.dart';
import '../../services/auth/auth_service.dart';

/// Reset password screen.
///
/// Accessible via /reset-password?email=xxx (deep link from email).
/// Calls POST /auth/reset-password with { email, code, newPassword }.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, this.prefillEmail = ''});

  final String prefillEmail;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  late final TextEditingController _emailCtrl;
  final _codeCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailCtrl = TextEditingController(text: widget.prefillEmail);
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      await AuthService.resetPassword(
        email: _emailCtrl.text.trim(),
        code: _codeCtrl.text.trim(),
        newPassword: _passwordCtrl.text,
      );
      if (!mounted) return;
      // Show success then go to sign in
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mot de passe réinitialisé. Connectez-vous.'),
          backgroundColor: WkColors.success,
        ),
      );
      context.go('/sign-in');
    } on AuthException catch (e) {
      setState(() { _isLoading = false; _error = e.message; });
    } catch (e) {
      setState(() { _isLoading = false; _error = 'Erreur inattendue. Réessayez.'; });
    }
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
          onPressed: () => context.canPop() ? context.pop() : context.go('/sign-in'),
        ),
        title: const Text(
          'WorkOn',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                const Text(
                  'Nouveau mot de passe',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: WkColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Entrez le code reçu par email et choisissez\nun nouveau mot de passe.',
                  style: TextStyle(fontSize: 14, color: WkColors.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 32),

                // Email field (pre-filled from deep link)
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: WkColors.textPrimary),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Email requis' : null,
                  decoration: _inputDecoration('Email'),
                ),
                const SizedBox(height: 14),

                // Code from email
                TextFormField(
                  controller: _codeCtrl,
                  style: const TextStyle(color: WkColors.textPrimary),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Code requis' : null,
                  decoration: _inputDecoration('Code de vérification'),
                ),
                const SizedBox(height: 14),

                // New password
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: WkColors.textPrimary),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Mot de passe requis';
                    if (v.length < 8) return '8 caractères minimum';
                    return null;
                  },
                  decoration: _inputDecoration('Nouveau mot de passe').copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: WkColors.textTertiary,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),

                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: WkColors.errorSoft,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: WkColors.error, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_error!, style: const TextStyle(color: WkColors.error, fontSize: 13))),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 28),
                WorkOnButton.primary(
                  label: _isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe',
                  onPressed: _isLoading ? null : _submit,
                  isFullWidth: true,
                  size: WorkOnButtonSize.large,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/sign-in'),
                    child: const Text(
                      'Retour à la connexion',
                      style: TextStyle(color: WkColors.textSecondary, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) => InputDecoration(
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
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: WkColors.error),
    ),
  );
}
