/// Mission models for WorkOn.
///
/// Data structures matching the backend `/api/v1/missions-local` endpoints.
///
/// **PR-F05:** Initial implementation for missions feed.
library;

/// Mission status enum matching backend MissionStatus.
enum MissionStatus {
  open,
  assigned,
  inProgress,
  completed,
  paid,
  cancelled;

  /// Parse from string (backend format — snake_case).
  static MissionStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'open':
        return MissionStatus.open;
      case 'assigned':
        return MissionStatus.assigned;
      case 'in_progress':
        return MissionStatus.inProgress;
      case 'completed':
        return MissionStatus.completed;
      case 'paid':
        return MissionStatus.paid;
      case 'cancelled':
        return MissionStatus.cancelled;
      default:
        return MissionStatus.open;
    }
  }

  /// Serialize to backend format (snake_case).
  ///
  /// Dart's `.name` gives camelCase (e.g. `inProgress`), which the backend
  /// does NOT accept. This getter always returns the snake_case form expected
  /// by `/api/v1/missions-local`.
  String get backendValue {
    switch (this) {
      case MissionStatus.open:
        return 'open';
      case MissionStatus.assigned:
        return 'assigned';
      case MissionStatus.inProgress:
        return 'in_progress';
      case MissionStatus.completed:
        return 'completed';
      case MissionStatus.paid:
        return 'paid';
      case MissionStatus.cancelled:
        return 'cancelled';
    }
  }

  /// Convert to display string (French).
  String get displayName {
    switch (this) {
      case MissionStatus.open:
        return 'Disponible';
      case MissionStatus.assigned:
        return 'Assignée';
      case MissionStatus.inProgress:
        return 'En cours';
      case MissionStatus.completed:
        return 'Terminée';
      case MissionStatus.paid:
        return 'Payée';
      case MissionStatus.cancelled:
        return 'Annulée';
    }
  }
}

/// Mission model matching backend MissionResponseDto.
class Mission {
  /// Unique mission ID.
  final String id;

  /// Mission title.
  final String title;

  /// Mission description.
  final String description;

  /// Category (e.g., 'snow_removal', 'cleaning').
  final String category;

  /// Current status.
  final MissionStatus status;

  /// Price in dollars.
  final double price;

  /// Location latitude.
  final double latitude;

  /// Location longitude.
  final double longitude;

  /// City name.
  final String city;

  /// Full address (optional).
  final String? address;

  /// ID of user who created the mission.
  final String createdByUserId;

  /// ID of assigned worker (null if not assigned).
  final String? assignedToUserId;

  /// Distance from search location in km (only for nearby search).
  final double? distanceKm;

  /// Creation timestamp.
  final DateTime createdAt;

  /// Last update timestamp.
  final DateTime updatedAt;

  const Mission({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.status,
    required this.price,
    required this.latitude,
    required this.longitude,
    required this.city,
    this.address,
    required this.createdByUserId,
    this.assignedToUserId,
    this.distanceKm,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Parse from JSON (backend response).
  factory Mission.fromJson(Map<String, dynamic> json) {
    return Mission(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? '',
      status: MissionStatus.fromString(json['status'] as String? ?? 'open'),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      city: json['city'] as String? ?? '',
      address: json['address'] as String?,
      createdByUserId: json['createdByUserId'] as String? ?? '',
      assignedToUserId: json['assignedToUserId'] as String?,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  /// Convert to JSON.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'status': status.backendValue,
      'price': price,
      'latitude': latitude,
      'longitude': longitude,
      'city': city,
      'address': address,
      'createdByUserId': createdByUserId,
      'assignedToUserId': assignedToUserId,
      'distanceKm': distanceKm,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Get formatted price string.
  String get formattedPrice => '\$${price.toStringAsFixed(2)}';

  /// Get formatted distance string.
  String? get formattedDistance {
    if (distanceKm == null) return null;
    if (distanceKm! < 1) {
      return '${(distanceKm! * 1000).round()} m';
    }
    return '${distanceKm!.toStringAsFixed(1)} km';
  }

  @override
  String toString() => 'Mission($id, $title, $status)';
}

