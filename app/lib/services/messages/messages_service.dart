/// Messages service for WorkOn.
///
/// Manages conversations and messages with polling support.
///
/// **PR-F19:** Initial implementation.
library;

import 'dart:async';

import 'package:flutter/foundation.dart';

import '../auth/auth_service.dart';
import 'message_models.dart';
import 'messages_api.dart';

/// Service that manages messaging state and polling.
abstract final class MessagesService {
  static const MessagesApi _api = MessagesApi();

  // ─────────────────────────────────────────────────────────────────────────
  // Conversations
  // ─────────────────────────────────────────────────────────────────────────

  static final ValueNotifier<List<Conversation>> _conversations =
      ValueNotifier([]);

  /// Exposes conversations as a listenable.
  static ValueListenable<List<Conversation>> get conversationsListenable =>
      _conversations;

  /// Returns current conversations.
  static List<Conversation> get conversations => _conversations.value;

  /// Fetches conversations from backend.
  ///
  /// Returns [MessagesResult] indicating success or failure.
  static Future<MessagesResult<List<Conversation>>> fetchConversations() async {
    try {
      debugPrint('[MessagesService] Fetching conversations...');
      final data = await _api.getConversations();
      _conversations.value = data;
      debugPrint('[MessagesService] Loaded ${data.length} conversations');
      return MessagesResult.success(data);
    } on MessagesApiException catch (e) {
      debugPrint('[MessagesService] fetchConversations error: ${e.message}');
      return MessagesResult.failure(e.message);
    } catch (e) {
      debugPrint('[MessagesService] fetchConversations unexpected: $e');
      return MessagesResult.failure('Une erreur est survenue');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────

  static final ValueNotifier<List<Message>> _messages = ValueNotifier([]);

  /// Exposes messages as a listenable.
  static ValueListenable<List<Message>> get messagesListenable => _messages;

  /// Returns current messages.
  static List<Message> get messages => _messages.value;

  /// Current conversation ID being viewed.
  static String? _currentConversationId;

  /// PR-PUSH: Public getter for current conversation ID.
  /// Used by PushService to suppress notifications for active chat.
  static String? get currentConversationId => _currentConversationId;

  /// Sets the current conversation and loads messages.
  static Future<MessagesResult<List<Message>>> openConversation(
      String conversationId) async {
    _currentConversationId = conversationId;
    _messages.value = [];

    try {
      debugPrint('[MessagesService] Opening conversation: $conversationId');
      final data = await _api.getMessages(conversationId);
      _messages.value = data;
      debugPrint('[MessagesService] Loaded ${data.length} messages');
      return MessagesResult.success(data);
    } on MessagesApiException catch (e) {
      debugPrint('[MessagesService] openConversation error: ${e.message}');
      return MessagesResult.failure(e.message);
    } catch (e) {
      debugPrint('[MessagesService] openConversation unexpected: $e');
      return MessagesResult.failure('Une erreur est survenue');
    }
  }

  /// Refreshes messages for the current conversation.
  static Future<MessagesResult<List<Message>>> refreshMessages() async {
    if (_currentConversationId == null) {
      return MessagesResult.failure('Pas de conversation ouverte');
    }

    try {
      debugPrint(
          '[MessagesService] Refreshing messages: $_currentConversationId');
      final data = await _api.getMessages(_currentConversationId!);
      _messages.value = data;
      return MessagesResult.success(data);
    } on MessagesApiException catch (e) {
      debugPrint('[MessagesService] refreshMessages error: ${e.message}');
      return MessagesResult.failure(e.message);
    } catch (e) {
      debugPrint('[MessagesService] refreshMessages unexpected: $e');
      return MessagesResult.failure('Une erreur est survenue');
    }
  }

  /// Sends a message (optimistic update).
  ///
  /// 1. Adds message locally immediately
  /// 2. Sends to backend
  /// 3. Updates with real ID on success, or marks failed
  static Future<MessagesResult<Message>> sendMessage(String text) async {
    if (_currentConversationId == null) {
      return MessagesResult.failure('Pas de conversation ouverte');
    }

    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      return MessagesResult.failure('Message vide');
    }

    // Get current user ID
    final userId = AuthService.currentUserId ?? 'unknown';

    // Create optimistic message
    final optimisticMsg = Message.optimistic(
      conversationId: _currentConversationId!,
      senderId: userId,
      text: trimmed,
    );

    // Add to list immediately
    _messages.value = [..._messages.value, optimisticMsg];

    try {
      debugPrint('[MessagesService] Sending message...');
      final sentMsg = await _api.sendMessage(_currentConversationId!, trimmed);

      // Replace optimistic message with real one
      _messages.value = _messages.value.map((m) {
        if (m.id == optimisticMsg.id) {
          return sentMsg;
        }
        return m;
      }).toList();

      debugPrint('[MessagesService] Message sent: ${sentMsg.id}');
      return MessagesResult.success(sentMsg);
    } on MessagesApiException catch (e) {
      debugPrint('[MessagesService] sendMessage error: ${e.message}');

      // Mark message as failed
      _messages.value = _messages.value.map((m) {
        if (m.id == optimisticMsg.id) {
          return m.copyWith(isSending: false, sendFailed: true);
        }
        return m;
      }).toList();

      return MessagesResult.failure(e.message);
    } catch (e) {
      debugPrint('[MessagesService] sendMessage unexpected: $e');

      // Mark message as failed
      _messages.value = _messages.value.map((m) {
        if (m.id == optimisticMsg.id) {
          return m.copyWith(isSending: false, sendFailed: true);
        }
        return m;
      }).toList();

      return MessagesResult.failure('Impossible d\'envoyer le message');
    }
  }

  /// Clears current conversation state.
  static void closeConversation() {
    _currentConversationId = null;
    _messages.value = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Polling
  // ─────────────────────────────────────────────────────────────────────────

  static Timer? _pollingTimer;

  /// Starts polling for new messages.
  ///
  /// Call this when entering a chat screen.
  static void startPolling({Duration interval = const Duration(seconds: 10)}) {
    stopPolling(); // Cancel any existing timer

    debugPrint('[MessagesService] Starting polling (${interval.inSeconds}s)');
    _pollingTimer = Timer.periodic(interval, (_) {
      if (_currentConversationId != null) {
        refreshMessages();
      }
    });
  }

  /// Stops polling for new messages.
  ///
  /// Call this when leaving a chat screen.
  static void stopPolling() {
    if (_pollingTimer != null) {
      debugPrint('[MessagesService] Stopping polling');
      _pollingTimer?.cancel();
      _pollingTimer = null;
    }
  }

  /// Resets all messaging state (call on logout).
  static void reset() {
    stopPolling();
    _currentConversationId = null;
    _conversations.value = [];
    _messages.value = [];
  }
}

/// Result type for messaging operations.
class MessagesResult<T> {
  const MessagesResult._({
    required this.isSuccess,
    this.data,
    this.errorMessage,
  });

  factory MessagesResult.success(T data) {
    return MessagesResult._(isSuccess: true, data: data);
  }

  factory MessagesResult.failure(String errorMessage) {
    return MessagesResult._(isSuccess: false, errorMessage: errorMessage);
  }

  final bool isSuccess;
  final T? data;
  final String? errorMessage;
}

