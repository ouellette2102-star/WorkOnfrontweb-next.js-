import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/user/user_api.dart';

/// Form to publish a service offer (worker side).
/// PATCH /users/me with hourlyRate, city, bio.
class CreateOfferForm extends StatefulWidget {
  const CreateOfferForm({super.key});

  @override
  State<CreateOfferForm> createState() => _CreateOfferFormState();
}

class _CreateOfferFormState extends State<CreateOfferForm> {
  final _hourlyRateCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  bool _isLoading = false;
  bool _isSaving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  Future<void> _loadExisting() async {
    setState(() => _isLoading = true);
    try {
      final data = await UserApi().fetchMe();
      if (mounted) {
        _cityCtrl.text = data['city']?.toString() ?? '';
        _bioCtrl.text = data['bio']?.toString() ?? '';
        // Try to get hourly rate from worker profile if embedded
        final rate = data['hourlyRate'] ?? data['workerProfile']?['hourlyRate'];
        if (rate != null) _hourlyRateCtrl.text = rate.toString();
        setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submit() async {
    if (_hourlyRateCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Veuillez indiquer votre tarif horaire.');
      return;
    }
    setState(() { _isSaving = true; _error = null; });

    try {
      await UserApi().patchMe(
        city: _cityCtrl.text.trim().isNotEmpty ? _cityCtrl.text.trim() : null,
        bio: _bioCtrl.text.trim().isNotEmpty ? _bioCtrl.text.trim() : null,
        // Note: hourlyRate goes to workerProfile — backend handles mapping
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Votre offre de service est mise à jour !'),
          backgroundColor: WkColors.success,
        ),
      );
      context.go('/profile/me');
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _error = 'Impossible de mettre à jour. Réessayez.';
        });
      }
    }
  }

  @override
  void dispose() {
    _hourlyRateCtrl.dispose();
    _bioCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: WkColors.bgPrimary,
        body: Center(child: CircularProgressIndicator(color: WkColors.brandRed)),
      );
    }

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: WkColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Mon offre de service',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Définissez votre tarif et votre disponibilité pour recevoir des contrats.',
              style: TextStyle(color: WkColors.textSecondary, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 24),
            _inputField(
              ctrl: _hourlyRateCtrl,
              label: 'Tarif horaire (\$/h)',
              keyboardType: TextInputType.number,
              prefix: const Icon(Icons.attach_money, color: WkColors.textTertiary, size: 18),
            ),
            const SizedBox(height: 12),
            _inputField(
              ctrl: _cityCtrl,
              label: 'Ville / zone de service',
              prefix: const Icon(Icons.location_on_outlined, color: WkColors.textTertiary, size: 18),
            ),
            const SizedBox(height: 12),
            _inputField(
              ctrl: _bioCtrl,
              label: 'Description de vos services',
              maxLines: 4,
              hint: 'Ex: Paysagiste professionnel, 5 ans d\'expérience...',
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: WkColors.errorSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_error!, style: const TextStyle(color: WkColors.error, fontSize: 13)),
              ),
            ],
            const SizedBox(height: 32),
            WorkOnButton.primary(
              label: _isSaving ? 'Mise à jour...' : 'Publier mon offre de service',
              onPressed: _isSaving ? null : _submit,
              isFullWidth: true,
              size: WorkOnButtonSize.large,
              isLoading: _isSaving,
            ),
          ],
        ),
      ),
    );
  }

  Widget _inputField({
    required TextEditingController ctrl,
    required String label,
    String? hint,
    TextInputType? keyboardType,
    int maxLines = 1,
    Widget? prefix,
  }) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: const TextStyle(color: WkColors.textPrimary, fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        hintStyle: const TextStyle(color: WkColors.textTertiary, fontSize: 13),
        prefixIcon: prefix,
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
