/// Compliance API client for WorkOn.
///
/// Syncs legal consent with backend Compliance API.
/// Version is ALWAYS fetched from backend, never hardcoded.
///
/// **PR-S1:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../api/api_client.dart';
import '../auth/auth_errors.dart';
import '../auth/token_storage.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────────────────────────────────────

/// Document types for legal consent.
enum LegalDocumentType {
  TERMS,
  PRIVACY;

  String get value => name;

  static LegalDocumentType fromString(String s) {
    switch (s.toUpperCase()) {
      case 'TERMS':
        return LegalDocumentType.TERMS;
      case 'PRIVACY':
        return LegalDocumentType.PRIVACY;
      default:
        throw ArgumentError('Unknown document type: $s');
    }
  }
}

/// Active versions of legal documents from backend.
class LegalVersions {
  final String termsVersion;
  final String privacyVersion;
  final DateTime? updatedAt;

  const LegalVersions({
    required this.termsVersion,
    required this.privacyVersion,
    this.updatedAt,
  });

  factory LegalVersions.fromJson(Map<String, dynamic> json) {
    final versions = json['versions'] as Map<String, dynamic>? ?? {};
    return LegalVersions(
      termsVersion: versions['TERMS'] as String? ?? '',
      privacyVersion: versions['PRIVACY'] as String? ?? '',
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  String getVersion(LegalDocumentType type) {
    switch (type) {
      case LegalDocumentType.TERMS:
        return termsVersion;
      case LegalDocumentType.PRIVACY:
        return privacyVersion;
    }
  }

  bool get isValid => termsVersion.isNotEmpty && privacyVersion.isNotEmpty;
}

/// Consent status for a single document.
class DocumentConsentStatus {
  final bool accepted;
  final String? version;
  final DateTime? acceptedAt;
  final String activeVersion;

  const DocumentConsentStatus({
    required this.accepted,
    this.version,
    this.acceptedAt,
    required this.activeVersion,
  });

  factory DocumentConsentStatus.fromJson(Map<String, dynamic> json) {
    return DocumentConsentStatus(
      accepted: json['accepted'] as bool? ?? false,
      version: json['version'] as String?,
      acceptedAt: json['acceptedAt'] != null
          ? DateTime.tryParse(json['acceptedAt'] as String)
          : null,
      activeVersion: json['activeVersion'] as String? ?? '',
    );
  }
}

/// Full consent status for all documents.
class ConsentStatus {
  final bool isComplete;
  final Map<LegalDocumentType, DocumentConsentStatus> documents;
  final List<LegalDocumentType> missing;

  const ConsentStatus({
    required this.isComplete,
    required this.documents,
    required this.missing,
  });

  factory ConsentStatus.fromJson(Map<String, dynamic> json) {
    final docs = <LegalDocumentType, DocumentConsentStatus>{};
    final docsJson = json['documents'] as Map<String, dynamic>? ?? {};

    for (final entry in docsJson.entries) {
      try {
        final type = LegalDocumentType.fromString(entry.key);
        docs[type] = DocumentConsentStatus.fromJson(
          entry.value as Map<String, dynamic>,
        );
      } catch (_) {
        // Ignore unknown document types
      }
    }

    final missingList = <LegalDocumentType>[];
    for (final item in (json['missing'] as List<dynamic>? ?? [])) {
      try {
        missingList.add(LegalDocumentType.fromString(item as String));
      } catch (_) {
        // Ignore unknown
      }
    }

    return ConsentStatus(
      isComplete: json['isComplete'] as bool? ?? false,
      documents: docs,
      missing: missingList,
    );
  }

  bool hasConsent(LegalDocumentType type) {
    return documents[type]?.accepted ?? false;
  }
}

/// Result of accepting a document.
class AcceptResult {
  final bool accepted;
  final String documentType;
  final String version;
  final DateTime acceptedAt;
  final bool alreadyAccepted;

  const AcceptResult({
    required this.accepted,
    required this.documentType,
    required this.version,
    required this.acceptedAt,
    this.alreadyAccepted = false,
  });

  factory AcceptResult.fromJson(Map<String, dynamic> json) {
    return AcceptResult(
      accepted: json['accepted'] as bool? ?? false,
      documentType: json['documentType'] as String? ?? '',
      version: json['version'] as String? ?? '',
      acceptedAt: DateTime.tryParse(json['acceptedAt'] as String? ?? '') ??
          DateTime.now(),
      alreadyAccepted: json['alreadyAccepted'] as bool? ?? false,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exceptions
// ─────────────────────────────────────────────────────────────────────────────

/// Exception thrown by [ComplianceApi].
class ComplianceApiException implements Exception {
  final String message;
  final String? errorCode;
  final int? statusCode;

  const ComplianceApiException(
    this.message, {
    this.errorCode,
    this.statusCode,
  });

  @override
  String toString() => 'ComplianceApiException: $message';
}

/// Exception thrown when version mismatch.
class VersionMismatchException extends ComplianceApiException {
  final String activeVersion;
  final String providedVersion;

  const VersionMismatchException({
    required this.activeVersion,
    required this.providedVersion,
  }) : super(
          'Version invalide. Version active: $activeVersion',
          errorCode: 'VERSION_MISMATCH',
          statusCode: 400,
        );
}

// ─────────────────────────────────────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────────────────────────────────────

/// API client for Compliance endpoints.
///
/// Version is ALWAYS fetched from backend via [getVersions].
/// Never hardcode version strings.
class ComplianceApi {
  /// Cached versions from last fetch.
  LegalVersions? _cachedVersions;

  /// Returns cached versions or fetches if null.
  LegalVersions? get cachedVersions => _cachedVersions;

  /// Fetches active legal document versions from backend.
  ///
  /// Calls `GET /api/v1/compliance/versions`.
  /// No authentication required.
  Future<LegalVersions> getVersions() async {
    debugPrint('[ComplianceApi] Fetching versions...');

    final uri = ApiClient.buildUri('/compliance/versions');

    try {
      final response = await ApiClient.client
          .get(uri, headers: ApiClient.defaultHeaders)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[ComplianceApi] versions response: ${response.statusCode}');

      if (response.statusCode != 200) {
        debugPrint('[ComplianceApi] versions error body: ${response.body}');
        throw ComplianceApiException(
          'Erreur lors de la récupération des versions',
          statusCode: response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final versions = LegalVersions.fromJson(json);

      if (!versions.isValid) {
        debugPrint('[ComplianceApi] Invalid versions received');
        throw const ComplianceApiException('Versions invalides du serveur');
      }

      _cachedVersions = versions;
      debugPrint(
        '[ComplianceApi] Versions: TERMS=${versions.termsVersion}, PRIVACY=${versions.privacyVersion}',
      );
      return versions;
    } on TimeoutException {
      debugPrint('[ComplianceApi] getVersions timeout');
      throw const ComplianceApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[ComplianceApi] getVersions network error: $e');
      throw const ComplianceApiException('Erreur réseau');
    } on FormatException catch (e) {
      debugPrint('[ComplianceApi] getVersions JSON error: $e');
      throw const ComplianceApiException('Réponse invalide du serveur');
    } on Exception catch (e) {
      if (e is ComplianceApiException) rethrow;
      debugPrint('[ComplianceApi] getVersions error: $e');
      throw const ComplianceApiException('Erreur inattendue');
    }
  }

  /// Fetches current user's consent status.
  ///
  /// Calls `GET /api/v1/compliance/status`.
  /// Requires authentication.
  /// **FIX-TOKEN-SYNC:** Uses TokenStorage + authenticatedGet with auto-refresh.
  Future<ConsentStatus> getStatus() async {
    debugPrint('[ComplianceApi] Fetching consent status...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[ComplianceApi] No token available in storage');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/compliance/status');

    try {
      // FIX-TOKEN-SYNC: Use authenticatedGet with auto-refresh
      final response = await ApiClient.authenticatedGet(uri);

      debugPrint('[ComplianceApi] status response: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200) {
        debugPrint('[ComplianceApi] status error body: ${response.body}');
        throw ComplianceApiException(
          'Erreur lors de la vérification du consentement',
          statusCode: response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final status = ConsentStatus.fromJson(json);
      debugPrint('[ComplianceApi] Status: isComplete=${status.isComplete}');
      return status;
    } on TimeoutException {
      debugPrint('[ComplianceApi] getStatus timeout');
      throw const ComplianceApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[ComplianceApi] getStatus network error: $e');
      throw const ComplianceApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is ComplianceApiException || e is AuthException) rethrow;
      debugPrint('[ComplianceApi] getStatus error: $e');
      throw const ComplianceApiException('Erreur inattendue');
    }
  }

  /// Accepts a legal document with the specified version.
  ///
  /// Calls `POST /api/v1/compliance/accept`.
  /// Requires authentication.
  /// **FIX-TOKEN-SYNC:** Uses TokenStorage + authenticatedPost with auto-refresh.
  ///
  /// If VERSION_MISMATCH is returned, throws [VersionMismatchException].
  Future<AcceptResult> accept(
    LegalDocumentType documentType,
    String version,
  ) async {
    debugPrint('[ComplianceApi] Accepting ${documentType.value} v$version...');

    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[ComplianceApi] No token available in storage');
      throw const UnauthorizedException();
    }

    final uri = ApiClient.buildUri('/compliance/accept');
    final body = {
      'documentType': documentType.value,
      'version': version,
    };

    try {
      // FIX-TOKEN-SYNC: Use authenticatedPost with auto-refresh
      final response = await ApiClient.authenticatedPost(uri, body: body);

      debugPrint('[ComplianceApi] accept response: ${response.statusCode}');

      if (response.statusCode == 401) {
        throw const UnauthorizedException();
      }

      if (response.statusCode == 400) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final errorCode = json['error'] as String?;

        if (errorCode == 'VERSION_MISMATCH') {
          debugPrint('[ComplianceApi] VERSION_MISMATCH detected');
          throw VersionMismatchException(
            activeVersion: json['activeVersion'] as String? ?? '',
            providedVersion: json['providedVersion'] as String? ?? version,
          );
        }

        throw ComplianceApiException(
          json['message'] as String? ?? 'Requête invalide',
          errorCode: errorCode,
          statusCode: 400,
        );
      }

      if (response.statusCode == 403) {
        // Could be CONSENT_REQUIRED for other endpoints, but not for accept
        throw const UnauthorizedException();
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        debugPrint('[ComplianceApi] accept error body: ${response.body}');
        throw ComplianceApiException(
          'Erreur lors de l\'acceptation',
          statusCode: response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final result = AcceptResult.fromJson(json);
      debugPrint(
        '[ComplianceApi] Accepted: ${result.documentType} v${result.version}',
      );
      return result;
    } on TimeoutException {
      debugPrint('[ComplianceApi] accept timeout');
      throw const ComplianceApiException('Délai de connexion dépassé');
    } on http.ClientException catch (e) {
      debugPrint('[ComplianceApi] accept network error: $e');
      throw const ComplianceApiException('Erreur réseau');
    } on Exception catch (e) {
      if (e is ComplianceApiException || e is AuthException) rethrow;
      debugPrint('[ComplianceApi] accept error: $e');
      throw const ComplianceApiException('Erreur inattendue');
    }
  }

  /// Accepts a document with automatic retry on VERSION_MISMATCH.
  ///
  /// 1. Tries to accept with provided version
  /// 2. If VERSION_MISMATCH, fetches fresh versions and retries ONCE
  /// 3. No infinite loops
  Future<AcceptResult> acceptWithRetry(LegalDocumentType documentType) async {
    // Fetch versions first
    final versions = await getVersions();
    final version = versions.getVersion(documentType);

    try {
      return await accept(documentType, version);
    } on VersionMismatchException catch (e) {
      debugPrint(
        '[ComplianceApi] VERSION_MISMATCH: active=${e.activeVersion}, provided=${e.providedVersion}',
      );

      // Retry ONCE with the active version from error
      if (e.activeVersion.isNotEmpty) {
        debugPrint('[ComplianceApi] Retrying with active version...');
        return await accept(documentType, e.activeVersion);
      }

      // Or refetch versions and try again
      debugPrint('[ComplianceApi] Refetching versions for retry...');
      final freshVersions = await getVersions();
      final freshVersion = freshVersions.getVersion(documentType);
      return await accept(documentType, freshVersion);
    }
  }

  /// Accepts both TERMS and PRIVACY with retry logic.
  Future<void> acceptAllWithRetry() async {
    await acceptWithRetry(LegalDocumentType.TERMS);
    await acceptWithRetry(LegalDocumentType.PRIVACY);
  }
}

