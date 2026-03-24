/// Catalog service for WorkOn.
///
/// Provides cached access to categories and skills.
/// Singleton pattern with automatic refresh.
///
/// **FL-1:** Initial implementation.
library;

import 'package:flutter/foundation.dart';

import 'catalog_api.dart';
import 'catalog_models.dart';

/// Service for accessing catalog data with caching.
///
/// ## Usage
///
/// ```dart
/// // Initialize at app startup (non-blocking)
/// CatalogService.initialize();
///
/// // Get categories (from cache or API)
/// final categories = await CatalogService.getCategories();
///
/// // Get category names for dropdown
/// final names = CatalogService.categoryNames;
/// ```
abstract final class CatalogService {
  static final CatalogApi _api = const CatalogApi();

  /// Cached categories.
  static List<ServiceCategory> _categories = [];

  /// Cached skills.
  static List<Skill> _skills = [];

  /// Whether categories have been loaded.
  static bool _categoriesLoaded = false;

  /// Whether skills have been loaded.
  static bool _skillsLoaded = false;

  /// Notifier for catalog changes.
  static final ValueNotifier<int> catalogNotifier = ValueNotifier(0);

  /// Returns cached categories (may be empty if not loaded).
  static List<ServiceCategory> get categories => List.unmodifiable(_categories);

  /// Returns cached skills (may be empty if not loaded).
  static List<Skill> get skills => List.unmodifiable(_skills);

  /// Returns category names as a list (for dropdowns).
  static List<String> get categoryNames =>
      _categories.map((c) => c.name).toList();

  /// Returns a map of category name to display name (with icon).
  static Map<String, String> get categoryDisplayNames => {
        for (final c in _categories) c.name: c.displayName,
      };

  /// Returns category by name (case-insensitive).
  static ServiceCategory? getCategoryByName(String name) {
    final lowerName = name.toLowerCase();
    try {
      return _categories.firstWhere(
        (c) => c.name.toLowerCase() == lowerName,
      );
    } catch (_) {
      return null;
    }
  }

  /// Initializes the catalog service (non-blocking).
  ///
  /// Loads categories in background. Safe to call multiple times.
  static Future<void> initialize() async {
    if (_categoriesLoaded) return;

    try {
      debugPrint('[CatalogService] Initializing...');
      await loadCategories();
    } catch (e) {
      debugPrint('[CatalogService] Init failed: $e');
      // Non-blocking - app continues with empty categories
    }
  }

  /// Loads categories from API.
  ///
  /// Updates cache and notifies listeners.
  static Future<List<ServiceCategory>> loadCategories({bool forceRefresh = false}) async {
    if (_categoriesLoaded && !forceRefresh) {
      return _categories;
    }

    try {
      debugPrint('[CatalogService] Loading categories...');
      _categories = await _api.getCategories();
      _categoriesLoaded = true;
      catalogNotifier.value++;
      debugPrint('[CatalogService] Loaded ${_categories.length} categories');
      return _categories;
    } catch (e) {
      debugPrint('[CatalogService] Failed to load categories: $e');
      rethrow;
    }
  }

  /// Gets categories (loads if not cached).
  static Future<List<ServiceCategory>> getCategories() async {
    if (!_categoriesLoaded) {
      await loadCategories();
    }
    return _categories;
  }

  /// Loads skills from API.
  ///
  /// Optionally filters by category.
  static Future<List<Skill>> loadSkills({
    String? categoryId,
    bool forceRefresh = false,
  }) async {
    if (_skillsLoaded && !forceRefresh && categoryId == null) {
      return _skills;
    }

    try {
      debugPrint('[CatalogService] Loading skills (categoryId: $categoryId)...');
      final skills = await _api.getSkills(categoryId: categoryId);
      
      if (categoryId == null) {
        _skills = skills;
        _skillsLoaded = true;
      }
      
      catalogNotifier.value++;
      debugPrint('[CatalogService] Loaded ${skills.length} skills');
      return skills;
    } catch (e) {
      debugPrint('[CatalogService] Failed to load skills: $e');
      rethrow;
    }
  }

  /// Gets skills (loads if not cached).
  static Future<List<Skill>> getSkills({String? categoryId}) async {
    if (categoryId != null) {
      // Always fetch filtered skills from API
      return _api.getSkills(categoryId: categoryId);
    }
    
    if (!_skillsLoaded) {
      await loadSkills();
    }
    return _skills;
  }

  /// Resets the cache.
  static void reset() {
    _categories = [];
    _skills = [];
    _categoriesLoaded = false;
    _skillsLoaded = false;
    catalogNotifier.value++;
    debugPrint('[CatalogService] Cache reset');
  }

  /// Checks if catalog is available.
  static Future<bool> isAvailable() async {
    try {
      final health = await _api.getHealth();
      return (health['categoriesCount'] ?? 0) > 0;
    } catch (_) {
      return false;
    }
  }
}
