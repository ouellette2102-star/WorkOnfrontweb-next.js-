import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/auth/auth_errors.dart';
import '../../services/auth/auth_service.dart';
import '../../services/catalog/catalog_api.dart';
import '../../widgets/consent_modal.dart';

/// Sign-up screen — "Créez votre profil".
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key, required this.role});

  final String role;

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  String? _selectedCategory;
  List<String> _categories = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await const CatalogApi().getCategories();
      if (mounted) {
        setState(() => _categories = cats
            .map((c) => c.name)
            .where((n) => n.isNotEmpty)
            .toList());
      }
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final name =
          '${_firstNameCtrl.text.trim()} ${_lastNameCtrl.text.trim()}';
      await AuthService.register(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
        name: name.trim(),
      );
      if (!mounted) return;
      // Show consent modal
      final accepted = await showConsentModal(context);
      if (!mounted) return;
      if (accepted == true) {
        context.go('/profile/ready');
      }
    } on EmailAlreadyInUseException {
      setState(() => _error = 'Cet email est déjà utilisé.');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Une erreur est survenue. Réessayez.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _cityCtrl.dispose();
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
                const SizedBox(height: 16),
                const Text(
                  'Créez votre profil',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: WkColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Complétez votre profil pour commencer\nà recevoir ou publier des missions.',
                  style: TextStyle(
                    fontSize: 14,
                    color: WkColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                // Avatar placeholder
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: WkColors.bgTertiary,
                        child: const Icon(Icons.person, color: WkColors.textSecondary, size: 40),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 26,
                          height: 26,
                          decoration: const BoxDecoration(
                            color: WkColors.brandRed,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add, color: Colors.white, size: 16),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                // Form fields
                _WkField(controller: _firstNameCtrl, label: 'Prénom', validator: _required),
                const SizedBox(height: 12),
                _WkField(controller: _lastNameCtrl, label: 'Nom', validator: _required),
                const SizedBox(height: 12),
                _WkField(
                  controller: _emailCtrl,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  validator: _required,
                ),
                const SizedBox(height: 12),
                _WkField(
                  controller: _phoneCtrl,
                  label: 'Téléphone',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                _WkField(controller: _cityCtrl, label: 'Ville'),
                const SizedBox(height: 12),
                // Métier dropdown
                if (_categories.isNotEmpty)
                  _CategoryDropdown(
                    categories: _categories,
                    value: _selectedCategory,
                    onChanged: (v) => setState(() => _selectedCategory = v),
                  )
                else
                  _WkField(label: 'Métier', controller: TextEditingController()),
                const SizedBox(height: 12),
                _WkField(
                  controller: _passwordCtrl,
                  label: 'Mot de passe',
                  obscureText: true,
                  validator: (v) => (v == null || v.length < 8)
                      ? '8 caractères minimum'
                      : null,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: const TextStyle(color: WkColors.error, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 32),
                WorkOnButton.primary(
                  label: _isLoading ? 'Inscription...' : 'Finaliser mon inscription',
                  onPressed: _isLoading ? null : _submit,
                  isFullWidth: true,
                  size: WorkOnButtonSize.large,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'Champ requis' : null;
}

class _WkField extends StatelessWidget {
  const _WkField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.validator,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final FormFieldValidator<String>? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      style: const TextStyle(color: WkColors.textPrimary, fontSize: 15),
      decoration: InputDecoration(
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
      ),
    );
  }
}

class _CategoryDropdown extends StatelessWidget {
  const _CategoryDropdown({
    required this.categories,
    required this.value,
    required this.onChanged,
  });

  final List<String> categories;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      hint: const Text('Métier', style: TextStyle(color: WkColors.textSecondary)),
      dropdownColor: WkColors.bgSecondary,
      style: const TextStyle(color: WkColors.textPrimary, fontSize: 15),
      decoration: InputDecoration(
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
      ),
      items: categories
          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
          .toList(),
      onChanged: onChanged,
    );
  }
}
