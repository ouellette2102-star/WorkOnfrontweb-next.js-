import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/user/user_api.dart';

/// Edit profile screen — PATCH /users/me.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _aboutCtrl;

  File? _pickedImage;
  String? _pictureUrl; // pictureUrl from backend after upload
  bool _isLoading = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    _firstNameCtrl = TextEditingController(text: auth.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: auth.lastName ?? '');
    _phoneCtrl = TextEditingController();
    _cityCtrl = TextEditingController();
    _aboutCtrl = TextEditingController();
    // Pre-load existing profile data
    _loadCurrentProfile();
  }

  Future<void> _loadCurrentProfile() async {
    try {
      final data = await UserApi().fetchMe();
      if (mounted) {
        final fullName = data['fullName']?.toString() ?? '';
        final parts = fullName.split(' ');
        _firstNameCtrl.text = parts.isNotEmpty ? parts.first : '';
        _lastNameCtrl.text = parts.length > 1 ? parts.sublist(1).join(' ') : '';
        _phoneCtrl.text = data['phone']?.toString() ?? '';
        _cityCtrl.text = data['city']?.toString() ?? '';
        _aboutCtrl.text = data['bio']?.toString() ?? '';
        // Pre-fill picture URL if available
        _pictureUrl = data['pictureUrl']?.toString();
        setState(() {});
      }
    } catch (_) {}
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (picked != null && mounted) {
      setState(() => _pickedImage = File(picked.path));
    }
  }

  Future<void> _save() async {
    setState(() { _isLoading = true; _error = null; _success = null; });

    try {
      // Step 1: upload photo if a new one was selected
      if (_pickedImage != null) {
        try {
          final result = await UserApi().uploadPicture(_pickedImage!);
          if (mounted) {
            setState(() => _pictureUrl = result['pictureUrl']?.toString());
          }
        } on UserApiException catch (e) {
          // Photo upload failure is non-fatal for profile text update,
          // but we surface it clearly to the user.
          if (mounted) {
            setState(() {
              _isLoading = false;
              _error = 'Erreur upload photo : ${e.message}. Les autres champs ont bien été sauvegardés.';
            });
          }
          // Continue to patch text fields even if photo fails
        }
      }

      // Step 2: patch text fields (only if at least one is non-empty)
      final fullName = '${_firstNameCtrl.text.trim()} ${_lastNameCtrl.text.trim()}'.trim();
      final phone = _phoneCtrl.text.trim().isNotEmpty ? _phoneCtrl.text.trim() : null;
      final city = _cityCtrl.text.trim().isNotEmpty ? _cityCtrl.text.trim() : null;
      final bio = _aboutCtrl.text.trim().isNotEmpty ? _aboutCtrl.text.trim() : null;

      final hasTextChanges = fullName.isNotEmpty || phone != null || city != null || bio != null;
      if (hasTextChanges) {
        await UserApi().patchMe(
          fullName: fullName.isNotEmpty ? fullName : null,
          phone: phone,
          city: city,
          bio: bio,
        );
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
          _success = 'Profil mis à jour avec succès !';
        });
        // Pop after brief delay
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Impossible de mettre à jour le profil. Réessayez.';
        });
      }
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _cityCtrl.dispose();
    _aboutCtrl.dispose();
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
          'Modifier mon profil',
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
          children: [
            // Avatar with image picker
            GestureDetector(
              onTap: _pickImage,
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: WkColors.bgTertiary,
                    backgroundImage: _pickedImage != null
                        ? FileImage(_pickedImage!) as ImageProvider
                        : (_pictureUrl != null && _pictureUrl!.isNotEmpty
                            ? NetworkImage(_pictureUrl!) as ImageProvider
                            : null),
                    child: (_pickedImage == null &&
                            (_pictureUrl == null || _pictureUrl!.isEmpty))
                        ? const Icon(Icons.person, color: WkColors.textSecondary, size: 44)
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: WkColors.brandRed,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 16),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Touchez pour changer la photo',
              style: TextStyle(fontSize: 12, color: WkColors.textTertiary),
            ),
            const SizedBox(height: 28),
            _Field(ctrl: _firstNameCtrl, label: 'Prénom'),
            const SizedBox(height: 12),
            _Field(ctrl: _lastNameCtrl, label: 'Nom'),
            const SizedBox(height: 12),
            _Field(ctrl: _phoneCtrl, label: 'Téléphone', keyboardType: TextInputType.phone),
            const SizedBox(height: 12),
            _Field(ctrl: _cityCtrl, label: 'Ville'),
            const SizedBox(height: 12),
            _Field(ctrl: _aboutCtrl, label: 'À propos de moi', maxLines: 3),
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
            if (_success != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: WkColors.successSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: WkColors.success, size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_success!, style: const TextStyle(color: WkColors.success, fontSize: 13))),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 32),
            WorkOnButton.primary(
              label: _isLoading ? 'Enregistrement...' : 'Enregistrer les modifications',
              onPressed: _isLoading ? null : _save,
              isFullWidth: true,
              size: WorkOnButtonSize.large,
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.ctrl, required this.label, this.keyboardType, this.maxLines = 1});
  final TextEditingController ctrl;
  final String label;
  final TextInputType? keyboardType;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
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
