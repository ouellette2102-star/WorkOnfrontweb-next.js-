/// Catalog models for WorkOn.
///
/// Data structures for categories and skills from the backend catalog API.
///
/// **FL-1:** Initial implementation.
library;

/// Represents a service category.
/// Note: Named `ServiceCategory` to avoid conflict with Flutter's `Category`.
class ServiceCategory {
  const ServiceCategory({
    required this.id,
    required this.name,
    this.nameEn,
    this.icon,
    this.residentialAllowed = true,
    this.legalNotes,
  });

  /// Creates a [ServiceCategory] from JSON.
  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      nameEn: json['nameEn'] as String?,
      icon: json['icon'] as String?,
      residentialAllowed: json['residentialAllowed'] as bool? ?? true,
      legalNotes: json['legalNotes'] as String?,
    );
  }

  /// Unique category ID.
  final String id;

  /// Category name (French).
  final String name;

  /// Category name (English).
  final String? nameEn;

  /// Emoji icon for the category.
  final String? icon;

  /// Whether residential clients can use this category.
  final bool residentialAllowed;

  /// Legal notes/requirements for this category.
  final String? legalNotes;

  /// Display name with optional icon.
  String get displayName => icon != null ? '$icon $name' : name;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'nameEn': nameEn,
        'icon': icon,
        'residentialAllowed': residentialAllowed,
        'legalNotes': legalNotes,
      };

  @override
  String toString() => 'Category(id: $id, name: $name)';
}

/// Represents a skill/service within a category.
class Skill {
  const Skill({
    required this.id,
    required this.name,
    this.nameEn,
    required this.categoryId,
    this.requiresPermit = false,
    this.proofType,
  });

  /// Creates a [Skill] from JSON.
  factory Skill.fromJson(Map<String, dynamic> json) {
    return Skill(
      id: json['id'] as String,
      name: json['name'] as String,
      nameEn: json['nameEn'] as String?,
      categoryId: json['categoryId'] as String,
      requiresPermit: json['requiresPermit'] as bool? ?? false,
      proofType: json['proofType'] as String?,
    );
  }

  /// Unique skill ID.
  final String id;

  /// Skill name (French).
  final String name;

  /// Skill name (English).
  final String? nameEn;

  /// Parent category ID.
  final String categoryId;

  /// Whether this skill requires a permit/license.
  final bool requiresPermit;

  /// Type of proof required (e.g., 'license', 'certification').
  final String? proofType;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'nameEn': nameEn,
        'categoryId': categoryId,
        'requiresPermit': requiresPermit,
        'proofType': proofType,
      };

  @override
  String toString() => 'Skill(id: $id, name: $name)';
}
