/// Offer models for WorkOn.
///
/// Data models for user applications/offers.
///
/// **PR-F16:** Initial implementation.
/// **PR-02:** Added ApplicantInfo for employer applications view.
library;

import '../missions/mission_models.dart';

/// PR-02: Applicant/worker info for employer view.
class ApplicantInfo {
  final String id;
  final String? name;
  final String? email;
  final String? phone;
  final String? avatarUrl;
  final double? rating;
  final int? reviewCount;
  final String? bio;

  const ApplicantInfo({
    required this.id,
    this.name,
    this.email,
    this.phone,
    this.avatarUrl,
    this.rating,
    this.reviewCount,
    this.bio,
  });

  factory ApplicantInfo.fromJson(Map<String, dynamic> json) {
    return ApplicantInfo(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: json['name']?.toString() ?? 
          json['fullName']?.toString() ?? 
          json['full_name']?.toString() ??
          json['username']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      avatarUrl: json['avatarUrl']?.toString() ?? 
          json['avatar_url']?.toString() ??
          json['profileImage']?.toString(),
      rating: (json['rating'] as num?)?.toDouble() ?? 
          (json['avgRating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] as int? ?? 
          json['review_count'] as int?,
      bio: json['bio']?.toString() ?? json['description']?.toString(),
    );
  }

  /// Returns display name or fallback.
  String get displayName => name ?? 'Utilisateur';

  /// Returns initials for avatar placeholder.
  String get initials {
    if (name == null || name!.isEmpty) return '?';
    final parts = name!.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name![0].toUpperCase();
  }
}

/// Status of an offer/application.
enum OfferStatus {
  pending,
  accepted,
  rejected,
  cancelled,
  expired,
  unknown;

  static OfferStatus fromString(String? value) {
    if (value == null) return OfferStatus.unknown;
    switch (value.toLowerCase()) {
      case 'pending':
      case 'en_attente':
        return OfferStatus.pending;
      case 'accepted':
      case 'accepté':
      case 'acceptee':
        return OfferStatus.accepted;
      case 'rejected':
      case 'refusé':
      case 'refusee':
        return OfferStatus.rejected;
      case 'cancelled':
      case 'annulé':
      case 'annulee':
        return OfferStatus.cancelled;
      case 'expired':
      case 'expiré':
      case 'expiree':
        return OfferStatus.expired;
      default:
        return OfferStatus.unknown;
    }
  }

  String get displayName {
    switch (this) {
      case OfferStatus.pending:
        return 'En attente';
      case OfferStatus.accepted:
        return 'Acceptée';
      case OfferStatus.rejected:
        return 'Refusée';
      case OfferStatus.cancelled:
        return 'Annulée';
      case OfferStatus.expired:
        return 'Expirée';
      case OfferStatus.unknown:
        return 'Inconnu';
    }
  }
}

/// Represents a user's application/offer for a mission.
class Offer {
  final String id;
  final String missionId;
  final String? userId;
  final OfferStatus status;
  final String? message;
  final DateTime createdAt;
  final DateTime? updatedAt;

  /// Optional embedded mission data (if backend includes it).
  final Mission? mission;

  /// PR-02: Applicant info (for employer view).
  final ApplicantInfo? applicant;

  const Offer({
    required this.id,
    required this.missionId,
    this.userId,
    required this.status,
    this.message,
    required this.createdAt,
    this.updatedAt,
    this.mission,
    this.applicant,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    // Parse mission if embedded
    Mission? mission;
    if (json['mission'] is Map<String, dynamic>) {
      try {
        mission = Mission.fromJson(json['mission'] as Map<String, dynamic>);
      } catch (e) {
        // Ignore parse errors for embedded mission
      }
    }

    // PR-02: Parse applicant info if embedded
    ApplicantInfo? applicant;
    final userData = json['user'] ?? json['applicant'] ?? json['worker'];
    if (userData is Map<String, dynamic>) {
      try {
        applicant = ApplicantInfo.fromJson(userData);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return Offer(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      missionId: (json['missionId'] ?? json['mission_id'] ?? 
          (json['mission'] is Map ? json['mission']['id'] : '') ?? '').toString(),
      userId: json['userId']?.toString() ?? json['user_id']?.toString(),
      status: OfferStatus.fromString(json['status']?.toString()),
      message: json['message']?.toString(),
      createdAt: _parseDate(json['createdAt'] ?? json['created_at']) ?? DateTime.now(),
      updatedAt: _parseDate(json['updatedAt'] ?? json['updated_at']),
      mission: mission,
      applicant: applicant,
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) {
      return DateTime.tryParse(value);
    }
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    return null;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'missionId': missionId,
        'userId': userId,
        'status': status.name,
        'message': message,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };

  /// Returns true if the offer is still active (not rejected/cancelled/expired).
  bool get isActive =>
      status == OfferStatus.pending || status == OfferStatus.accepted;

  @override
  String toString() => 'Offer(id: $id, missionId: $missionId, status: $status)';
}

