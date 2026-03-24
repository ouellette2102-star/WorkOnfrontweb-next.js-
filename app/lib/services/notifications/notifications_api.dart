/// Notifications API client for WorkOn.
///
/// GET /api/v1/notifications
/// GET /api/v1/notifications/unread-count
/// PATCH /api/v1/notifications/:id/read
/// PATCH /api/v1/notifications/read-all
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../auth/auth_errors.dart';

class NotificationsApiException implements Exception {
  final String message;
  const NotificationsApiException([this.message = 'Notifications API error']);
  @override
  String toString() => message;
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.referenceId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? json['message']?.toString() ?? '',
        type: json['type']?.toString() ?? 'general',
        isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? false,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
            : DateTime.now(),
        referenceId: json['referenceId']?.toString() ?? json['missionId']?.toString(),
      );

  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final DateTime createdAt;
  final String? referenceId;

  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inHours < 1) return 'Il y a ${diff.inMinutes} min';
    if (diff.inDays < 1) return 'Il y a ${diff.inHours}h';
    if (diff.inDays == 1) return 'Hier';
    return 'Il y a ${diff.inDays} jours';
  }
}

class NotificationsApi {
  const NotificationsApi();

  /// GET /api/v1/notifications
  Future<List<AppNotification>> getNotifications({int limit = 50}) async {
    final uri = ApiClient.buildUri('/notifications').replace(
      queryParameters: {'limit': '$limit'},
    );

    try {
      final response = await ApiClient.authenticatedGet(uri)
          .timeout(ApiClient.connectionTimeout);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final list = body is List ? body : (body['data'] ?? body['notifications'] ?? []);
        return (list as List)
            .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
            .toList();
      }
      if (response.statusCode == 401) throw const UnauthorizedException();
      throw NotificationsApiException('Erreur: ${response.statusCode}');
    } on UnauthorizedException {
      rethrow;
    } catch (e) {
      if (e is NotificationsApiException) rethrow;
      throw NotificationsApiException('Erreur réseau: $e');
    }
  }

  /// GET /api/v1/notifications/unread-count
  Future<int> getUnreadCount() async {
    final uri = ApiClient.buildUri('/notifications/unread-count');

    try {
      final response = await ApiClient.authenticatedGet(uri)
          .timeout(ApiClient.connectionTimeout);

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return (body['count'] as num?)?.toInt() ??
               (body['unreadCount'] as num?)?.toInt() ?? 0;
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  /// PATCH /api/v1/notifications/:id/read
  ///
  /// Fire-and-forget: failure is non-fatal but logged.
  Future<void> markAsRead(String notificationId) async {
    final uri = ApiClient.buildUri('/notifications/$notificationId/read');
    try {
      final response = await ApiClient.authenticatedPatch(uri)
          .timeout(ApiClient.connectionTimeout);
      if (response.statusCode != 200 && response.statusCode != 204) {
        debugPrint('[NotificationsApi] markAsRead failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[NotificationsApi] markAsRead error: $e');
    }
  }

  /// PATCH /api/v1/notifications/read-all
  ///
  /// Fire-and-forget: failure is non-fatal but logged.
  Future<void> markAllAsRead() async {
    final uri = ApiClient.buildUri('/notifications/read-all');
    try {
      final response = await ApiClient.authenticatedPatch(uri)
          .timeout(ApiClient.connectionTimeout);
      if (response.statusCode != 200 && response.statusCode != 204) {
        debugPrint('[NotificationsApi] markAllAsRead failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[NotificationsApi] markAllAsRead error: $e');
    }
  }
}
