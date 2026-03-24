import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/catalog/catalog_api.dart';
import '../../services/catalog/catalog_models.dart';
import '../../services/location/location_service.dart';
import '../../services/missions/missions_api.dart';

/// Form to create a service demand (client side).
/// Calls POST /missions-local.
class CreateDemandForm extends StatefulWidget {
  const CreateDemandForm({super.key});

  @override
  State<CreateDemandForm> createState() => _CreateDemandFormState();
}

class _CreateDemandFormState extends State<CreateDemandForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();

  List<ServiceCategory> _categories = [];
  String? _selectedCategoryId;
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
      if (mounted) setState(() => _categories = cats);
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      // Get real GPS coordinates
      UserPosition pos;
      try {
        pos = await LocationService.instance.getCurrentPosition();
      } catch (_) {
        pos = UserPosition.defaultPosition;
      }

      await MissionsApi().createMission(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        category: _selectedCategoryId ?? 'general',
        price: double.tryParse(_budgetCtrl.text) ?? 0,
        latitude: pos.latitude,
        longitude: pos.longitude,
        city: _cityCtrl.text.trim().isNotEmpty ? _cityCtrl.text.trim() : 'Montréal',
        address: _addressCtrl.text.trim().isNotEmpty ? _addressCtrl.text.trim() : null,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Demande publiée !'),
          backgroundColor: WkColors.success,
        ),
      );
      context.go('/profile/me');
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Impossible de publier. Réessayez.';
      });
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _budgetCtrl.dispose();
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
          icon: const Icon(Icons.close, color: WkColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Publier une demande',
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
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _field(_titleCtrl, 'Titre de la demande',
                  validator: (v) => v!.isEmpty ? 'Requis' : null),
              const SizedBox(height: 12),
              // Category
              if (_categories.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: _selectedCategoryId,
                  hint: const Text('Catégorie', style: TextStyle(color: WkColors.textSecondary)),
                  dropdownColor: WkColors.bgSecondary,
                  style: const TextStyle(color: WkColors.textPrimary),
                  decoration: _inputDec(),
                  items: _categories
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.displayName)))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedCategoryId = v),
                ),
              const SizedBox(height: 12),
              _field(_descCtrl, 'Description',
                  maxLines: 3,
                  validator: (v) => v!.isEmpty ? 'Requis' : null),
              const SizedBox(height: 12),
              _field(_addressCtrl, 'Adresse'),
              const SizedBox(height: 12),
              _field(_cityCtrl, 'Ville'),
              const SizedBox(height: 12),
              _field(_budgetCtrl, 'Budget (\$)',
                  keyboardType: TextInputType.number),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: WkColors.error)),
              ],
              const SizedBox(height: 32),
              WorkOnButton.primary(
                label: _isLoading ? 'Publication...' : 'Publier la demande',
                onPressed: _isLoading ? null : _submit,
                isFullWidth: true,
                size: WorkOnButtonSize.large,
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String label, {
    int maxLines = 1,
    TextInputType? keyboardType,
    FormFieldValidator<String>? validator,
  }) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(color: WkColors.textPrimary),
      decoration: _inputDec().copyWith(labelText: label),
    );
  }

  InputDecoration _inputDec() => InputDecoration(
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
