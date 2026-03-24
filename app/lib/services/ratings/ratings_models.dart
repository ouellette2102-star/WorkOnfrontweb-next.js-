/// Ratings models for WorkOn.
///
/// **PR-F21:** Initial implementation.
library;

/// Summary of a user's ratings.
class RatingSummary {
  const RatingSummary({
    required this.average,
    required this.count,
    this.distribution,
  });

  /// Creates a RatingSummary from JSON.
  factory RatingSummary.fromJson(Map<String, dynamic> json) {
    // Handle nested data object
    final data = json['data'] ?? json;

    // Parse distribution if present
    Map<int, int>? dist;
    final distJson = data['distribution'] ?? data['breakdown'];
    if (distJson is Map) {
      dist = {};
      for (final entry in distJson.entries) {
        final key = int.tryParse(entry.key.toString());
        if (key != null) {
          dist[key] = entry.value as int? ?? 0;
        }
      }
    }

    return RatingSummary(
      average: (data['average'] ?? data['avg'] ?? data['rating'] ?? 0.0)
          .toDouble(),
      count: data['count'] ?? data['total'] ?? data['reviewCount'] ?? 0,
      distribution: dist,
    );
  }

  /// Creates an empty summary.
  const RatingSummary.empty()
      : average = 0.0,
        count = 0,
        distribution = null;

  /// Average rating (1.0 - 5.0).
  final double average;

  /// Total number of reviews.
  final int count;

  /// Distribution by rating (1-5) → count. Optional.
  final Map<int, int>? distribution;

  /// Formatted average for display (e.g., "4.8").
  String get formattedAverage => average.toStringAsFixed(1);

  /// Formatted count (e.g., "12 avis" or "Aucun avis").
  String get formattedCount {
    if (count == 0) return 'Aucun avis';
    if (count == 1) return '1 avis';
    return '$count avis';
  }

  /// Gets percentage for a rating level (for histogram).
  double getPercentage(int rating) {
    if (distribution == null || count == 0) return 0.0;
    final levelCount = distribution![rating] ?? 0;
    return levelCount / count;
  }
}

/// Represents a single review.
class Review {
  const Review({
    required this.id,
    required this.rating,
    required this.createdAt,
    this.authorId,
    this.authorName,
    this.authorAvatar,
    this.comment,
    this.tags,
    this.missionId,
    this.missionTitle,
  });

  /// Creates a Review from JSON.
  factory Review.fromJson(Map<String, dynamic> json) {
    // Handle nested author object
    final author = json['author'] as Map<String, dynamic>?;

    // Parse tags
    List<String>? tagsList;
    final tagsJson = json['tags'] ?? json['labels'];
    if (tagsJson is List) {
      tagsList = tagsJson.map((e) => e.toString()).toList();
    }

    return Review(
      id: json['id']?.toString() ?? '',
      rating: (json['rating'] ?? json['score'] ?? 0).toDouble(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      authorId: author?['id']?.toString() ?? json['authorId']?.toString(),
      authorName: author?['fullName'] ??
          author?['name'] ??
          json['authorName'] ??
          'Utilisateur',
      authorAvatar: author?['avatar'] ?? author?['avatarUrl'] ?? json['authorAvatar'],
      comment: json['comment']?.toString() ?? json['text']?.toString(),
      tags: tagsList,
      missionId: json['missionId']?.toString(),
      missionTitle: json['missionTitle']?.toString(),
    );
  }

  final String id;
  final double rating;
  final DateTime createdAt;
  final String? authorId;
  final String? authorName;
  final String? authorAvatar;
  final String? comment;
  final List<String>? tags;
  final String? missionId;
  final String? missionTitle;

  /// Formatted rating (e.g., "4.5").
  String get formattedRating => rating.toStringAsFixed(1);

  /// Formatted date.
  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(createdAt);

    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours} h';
    if (diff.inDays == 1) return 'Hier';
    if (diff.inDays < 7) return 'Il y a ${diff.inDays} jours';
    if (diff.inDays < 30) return 'Il y a ${diff.inDays ~/ 7} sem.';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  /// Author initials for fallback avatar.
  String get authorInitials {
    final name = authorName ?? 'U';
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }
}

/// Request model for creating a review.
class CreateReviewRequest {
  const CreateReviewRequest({
    required this.toUserId,
    required this.rating,
    this.missionId,
    this.comment,
    this.tags,
  });

  final String toUserId;
  final int rating; // 1-5
  final String? missionId;
  final String? comment;
  final List<String>? tags;

  /// Converts to JSON for API request.
  Map<String, dynamic> toJson() {
    return {
      'toUserId': toUserId,
      'rating': rating,
      if (missionId != null) 'missionId': missionId,
      if (comment != null && comment!.isNotEmpty) 'comment': comment,
      if (tags != null && tags!.isNotEmpty) 'tags': tags,
    };
  }

  /// Validates the request.
  String? validate() {
    if (rating < 1 || rating > 5) {
      return 'La note doit être entre 1 et 5';
    }
    if (comment != null && comment!.length > 500) {
      return 'Le commentaire ne peut pas dépasser 500 caractères';
    }
    return null;
  }
}

