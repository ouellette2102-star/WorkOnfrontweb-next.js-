import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../config/workon_widgets.dart';
import '../../services/ratings/ratings_api.dart';
import '../../services/ratings/ratings_models.dart';

/// ReviewScreen — laisser un avis post-mission.
/// Accessible depuis la liste des missions complétées.
/// POST /reviews
class ReviewScreen extends StatefulWidget {
  const ReviewScreen({
    super.key,
    required this.missionId,
    required this.targetUserId,
    required this.targetName,
  });

  final String missionId;
  final String targetUserId;
  final String targetName;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int _rating = 0;
  final _commentCtrl = TextEditingController();
  final List<String> _availableTags = [
    'Ponctuel',
    'Professionnel',
    'Communicatif',
    'Soigné',
    'Efficace',
    'Aimable',
  ];
  final Set<String> _selectedTags = {};
  bool _isSaving = false;
  String? _error;

  Future<void> _submit() async {
    if (_rating == 0) {
      setState(() => _error = 'Veuillez choisir une note.');
      return;
    }
    setState(() { _isSaving = true; _error = null; });

    try {
      await RatingsApi().createReview(
        CreateReviewRequest(
          toUserId: widget.targetUserId,
          rating: _rating,
          missionId: widget.missionId,
          comment: _commentCtrl.text.trim().isNotEmpty
              ? _commentCtrl.text.trim()
              : null,
          tags: _selectedTags.isNotEmpty ? _selectedTags.toList() : null,
        ),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Avis publié ! Merci pour votre retour.'),
          backgroundColor: WkColors.success,
        ),
      );
      context.go('/profile/me');
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _error = e.toString().contains('déjà') 
              ? 'Vous avez déjà laissé un avis pour cette mission.'
              : 'Impossible de publier l\'avis. Réessayez.';
        });
      }
    }
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
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
          'Laisser un avis',
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
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Avatar + name
            CircleAvatar(
              radius: 36,
              backgroundColor: WkColors.bgTertiary,
              child: const Icon(Icons.person, color: WkColors.textSecondary, size: 36),
            ),
            const SizedBox(height: 12),
            Text(
              widget.targetName,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Comment évaluez-vous cette expérience ?',
              style: TextStyle(color: WkColors.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 24),
            // Star rating
            RatingBar.builder(
              initialRating: _rating.toDouble(),
              minRating: 1,
              itemCount: 5,
              itemSize: 44,
              unratedColor: WkColors.bgTertiary,
              itemBuilder: (_, __) => const Icon(Icons.star, color: Color(0xFFFBBF24)),
              onRatingUpdate: (r) => setState(() => _rating = r.toInt()),
            ),
            const SizedBox(height: 8),
            Text(
              _rating > 0 ? _ratingLabel(_rating) : 'Touchez une étoile pour noter',
              style: TextStyle(
                color: _rating > 0 ? WkColors.textPrimary : WkColors.textTertiary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 24),
            // Tags
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Points forts (optionnel)',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: WkColors.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availableTags.map((tag) {
                final selected = _selectedTags.contains(tag);
                return GestureDetector(
                  onTap: () => setState(() {
                    selected ? _selectedTags.remove(tag) : _selectedTags.add(tag);
                  }),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? WkColors.brandRed : WkColors.bgSecondary,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? WkColors.brandRed : WkColors.glassBorder,
                      ),
                    ),
                    child: Text(
                      tag,
                      style: TextStyle(
                        color: selected ? Colors.white : WkColors.textSecondary,
                        fontSize: 13,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            // Comment
            TextField(
              controller: _commentCtrl,
              maxLines: 4,
              maxLength: 500,
              style: const TextStyle(color: WkColors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                labelText: 'Commentaire (optionnel)',
                hintText: 'Décrivez votre expérience...',
                hintStyle: const TextStyle(color: WkColors.textTertiary, fontSize: 13),
                labelStyle: const TextStyle(color: WkColors.textSecondary, fontSize: 14),
                filled: true,
                fillColor: WkColors.bgSecondary,
                counterStyle: const TextStyle(color: WkColors.textTertiary, fontSize: 11),
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
              label: _isSaving ? 'Publication...' : 'Publier mon avis',
              onPressed: (_isSaving || _rating == 0) ? null : _submit,
              isFullWidth: true,
              size: WorkOnButtonSize.large,
              isLoading: _isSaving,
            ),
            const SizedBox(height: 16),
            const Text(
              'Votre avis aide la communauté WorkOn à trouver\nles meilleurs professionnels.',
              textAlign: TextAlign.center,
              style: TextStyle(color: WkColors.textTertiary, fontSize: 12, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  String _ratingLabel(int rating) {
    switch (rating) {
      case 1: return 'Très insatisfait';
      case 2: return 'Insatisfait';
      case 3: return 'Correct';
      case 4: return 'Satisfait';
      case 5: return 'Excellent !';
      default: return '';
    }
  }
}
