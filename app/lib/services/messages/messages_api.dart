/// Messages API client for WorkOn.
///
/// **PR-F19:** Initial implementation.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../auth/token_storage.dart';
import 'message_models.dart';

/// API client for messaging endpoints.
class MessagesApi {
  const MessagesApi();

  /// PR-INBOX: Fetches all conversations for the current user.
  ///
  /// Calls `GET /messages/conversations` with Bearer token.
  /// Returns conversations sorted by most recent message first.
  Future<List<Conversation>> getConversations() async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MessagesApi] getConversations: no token');
      throw const MessagesApiException('Token non disponible');
    }

    // PR-B2: Use messages-local endpoint (LocalUser system)
    final uri = ApiClient.buildUri('/messages-local/conversations');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MessagesApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MessagesApi] getConversations: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const MessagesApiException('Session expirée');
      }

      if (response.statusCode >= 500) {
        throw MessagesApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MessagesApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data =
          body is List ? body : (body['conversations'] ?? body['data'] ?? []);

      return data
          .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      debugPrint('[MessagesApi] getConversations: timeout');
      throw const MessagesApiException('Connexion timeout');
    } on MessagesApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MessagesApi] getConversations: error: $e');
      throw MessagesApiException('Erreur réseau: $e');
    }
  }

  /// Fetches messages for a mission thread.
  ///
  /// **PR-4:** Aligned to backend endpoint `GET /messages/thread/:missionId`.
  /// [missionId] is the mission ID (previously called conversationId).
  Future<List<Message>> getMessages(String missionId) async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MessagesApi] getMessages: no token');
      throw const MessagesApiException('Token non disponible');
    }

    // PR-B2: Use messages-local endpoint (LocalUser system)
    final uri = ApiClient.buildUri('/messages-local/thread/$missionId');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MessagesApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MessagesApi] getMessages: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const MessagesApiException('Session expirée');
      }

      if (response.statusCode == 404) {
        throw const MessagesApiException('Mission introuvable');
      }

      if (response.statusCode >= 500) {
        throw MessagesApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200) {
        throw MessagesApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body);
      final List<dynamic> data =
          body is List ? body : (body['messages'] ?? body['data'] ?? []);

      return data
          .map((json) => Message.fromJson(json as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      debugPrint('[MessagesApi] getMessages: timeout');
      throw const MessagesApiException('Connexion timeout');
    } on MessagesApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MessagesApi] getMessages: error: $e');
      throw MessagesApiException('Erreur réseau: $e');
    }
  }

  /// Sends a message in a mission thread.
  ///
  /// **PR-4:** Aligned to backend endpoint `POST /messages`.
  /// [missionId] is the mission ID (previously called conversationId).
  /// [content] is the message text.
  Future<Message> sendMessage(String missionId, String content) async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MessagesApi] sendMessage: no token');
      throw const MessagesApiException('Token non disponible');
    }

    // PR-B2: Use messages-local endpoint (LocalUser system)
    final uri = ApiClient.buildUri('/messages-local');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MessagesApi] POST $uri');
      final response = await ApiClient.client
          .post(
            uri,
            headers: headers,
            body: jsonEncode({
              'missionId': missionId,
              'content': content,
            }),
          )
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MessagesApi] sendMessage: ${response.statusCode}');

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const MessagesApiException('Session expirée');
      }

      if (response.statusCode == 404) {
        throw const MessagesApiException('Mission introuvable');
      }

      if (response.statusCode >= 500) {
        throw MessagesApiException('Erreur serveur: ${response.statusCode}');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw MessagesApiException('Erreur: ${response.statusCode}');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final messageData = body['message'] ?? body;
      return Message.fromJson(messageData as Map<String, dynamic>);
    } on TimeoutException {
      debugPrint('[MessagesApi] sendMessage: timeout');
      throw const MessagesApiException('Connexion timeout');
    } on MessagesApiException {
      rethrow;
    } catch (e) {
      debugPrint('[MessagesApi] sendMessage: error: $e');
      throw MessagesApiException('Erreur réseau: $e');
    }
  }

  /// PR-F3: Gets the count of unread messages for the current user.
  ///
  /// Calls `GET /messages/unread-count` with Bearer token.
  /// Returns 0 if no unread messages or on error (graceful degradation).
  Future<int> getUnreadCount() async {
    // FIX-TOKEN-SYNC: Use TokenStorage directly
    final token = TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[MessagesApi] getUnreadCount: no token');
      return 0;
    }

    // PR-B2: Use messages-local endpoint (LocalUser system)
    final uri = ApiClient.buildUri('/messages-local/unread-count');
    final headers = {
      ...ApiClient.defaultHeaders,
      'Authorization': 'Bearer $token',
    };

    try {
      debugPrint('[MessagesApi] GET $uri');
      final response = await ApiClient.client
          .get(uri, headers: headers)
          .timeout(ApiClient.connectionTimeout);

      debugPrint('[MessagesApi] getUnreadCount: ${response.statusCode}');

      if (response.statusCode != 200) {
        debugPrint('[MessagesApi] getUnreadCount: non-200, returning 0');
        return 0;
      }

      final body = jsonDecode(response.body);
      final count = body['count'] ?? body['unreadCount'] ?? 0;
      return count is int ? count : int.tryParse(count.toString()) ?? 0;
    } on TimeoutException {
      debugPrint('[MessagesApi] getUnreadCount: timeout');
      return 0;
    } catch (e) {
      debugPrint('[MessagesApi] getUnreadCount: error: $e');
      return 0;
    }
  }
}

/// Exception thrown by [MessagesApi] operations.
class MessagesApiException implements Exception {
  const MessagesApiException(this.message);

  final String message;

  @override
  String toString() => 'MessagesApiException: $message';
}

