/// Worker profile models for WorkOn discovery.
library;

/// A badge earned by a worker.
class WorkerBadge {
  const WorkerBadge({required this.label, required this.type});

  factory WorkerBadge.fromJson(Map<String, dynamic> json) => WorkerBadge(
        label: json['label'] as String,
        type: json['type'] as String,
      );

  final String label;
  final String type;
}

/// Public profile of a worker.
class WorkerProfile {
  const WorkerProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.fullName,
    this.jobTitle,
    this.city,
    this.photoUrl,
    required this.averageRating,
    required this.completionPercentage,
    required this.reviewCount,
    required this.completedMissions,
    required this.badges,
    this.hourlyRate,
  });

  factory WorkerProfile.fromJson(Map<String, dynamic> json) => WorkerProfile(
        id: json['id'] as String,
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        fullName: json['fullName'] as String?,
        jobTitle: json['jobTitle'] as String?,
        city: json['city'] as String?,
        photoUrl: json['photoUrl'] as String?,
        averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
        completionPercentage: (json['completionPercentage'] as num?)?.toInt() ?? 0,
        reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
        completedMissions: (json['completedMissions'] as num?)?.toInt() ?? 0,
        badges: (json['badges'] as List<dynamic>?)
                ?.map((b) => WorkerBadge.fromJson(b as Map<String, dynamic>))
                .toList() ??
            [],
        hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
      );

  final String id;
  final String firstName;
  final String lastName;
  final String? fullName;
  final String? jobTitle;
  final String? city;
  final String? photoUrl;
  final double averageRating;
  final int completionPercentage;
  final int reviewCount;
  final int completedMissions;
  final List<WorkerBadge> badges;
  final double? hourlyRate;

  String get displayName => fullName ?? '$firstName $lastName'.trim();
}

/// Paginated list of workers.
class WorkersListResponse {
  const WorkersListResponse({
    required this.workers,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory WorkersListResponse.fromJson(Map<String, dynamic> json) =>
      WorkersListResponse(
        workers: (json['workers'] as List<dynamic>)
            .map((w) => WorkerProfile.fromJson(w as Map<String, dynamic>))
            .toList(),
        total: (json['total'] as num?)?.toInt() ?? 0,
        page: (json['page'] as num?)?.toInt() ?? 1,
        limit: (json['limit'] as num?)?.toInt() ?? 20,
      );

  final List<WorkerProfile> workers;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => workers.length >= limit;
}
