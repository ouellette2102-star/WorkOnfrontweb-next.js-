/// Message models for WorkOn messaging.
///
/// **PR-F19:** Initial implementation.
library;

/// Represents a conversation between two users.
class Conversation {
  const Conversation({
    required this.id,
    required this.participantId,
    required this.participantName,
    this.participantAvatar,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.missionId,
    this.missionTitle,
  });

  /// Creates a Conversation from JSON.
  factory Conversation.fromJson(Map<String, dynamic> json) {
    // Handle nested participant object or flat fields
    final participant = json['participant'] as Map<String, dynamic>?;
    final mission = json['mission'] as Map<String, dynamic>?;

    return Conversation(
      id: json['id']?.toString() ?? '',
      participantId: participant?['id']?.toString() ??
          json['participantId']?.toString() ??
          json['otherUserId']?.toString() ??
          '',
      participantName: participant?['fullName'] ??
          participant?['name'] ??
          json['participantName'] ??
          json['otherUserName'] ??
          'Utilisateur',
      participantAvatar: participant?['avatar'] ??
          participant?['avatarUrl'] ??
          json['participantAvatar'] ??
          json['otherUserAvatar'],
      lastMessage: json['lastMessage']?.toString(),
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'].toString())
          : json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'].toString())
              : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      missionId: mission?['id']?.toString() ?? json['missionId']?.toString(),
      missionTitle: mission?['title'] ?? json['missionTitle'],
    );
  }

  final String id;
  final String participantId;
  final String participantName;
  final String? participantAvatar;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final String? missionId;
  final String? missionTitle;

  /// Gets initials from participant name.
  String get initials {
    final parts = participantName.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  /// Formatted last message time.
  String get formattedTime {
    if (lastMessageAt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(lastMessageAt!);

    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inHours < 1) return 'Il y a ${diff.inMinutes} min';
    if (diff.inDays < 1) {
      return '${lastMessageAt!.hour.toString().padLeft(2, '0')}:${lastMessageAt!.minute.toString().padLeft(2, '0')}';
    }
    if (diff.inDays == 1) return 'Hier';
    if (diff.inDays < 7) return 'Il y a ${diff.inDays} j';
    return '${lastMessageAt!.day}/${lastMessageAt!.month}';
  }
}

/// Represents a single message in a conversation.
class Message {
  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.text,
    required this.createdAt,
    this.isRead = false,
    this.isSending = false,
    this.sendFailed = false,
  });

  /// Creates a Message from JSON.
  ///
  /// **PR-4:** Handles both `conversationId` and `missionId` from backend.
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id']?.toString() ?? '',
      // PR-4: Backend uses missionId, Flutter uses conversationId (same concept)
      conversationId: json['conversationId']?.toString() ??
          json['missionId']?.toString() ??
          '',
      senderId: json['senderId']?.toString() ??
          json['authorId']?.toString() ??
          json['userId']?.toString() ??
          '',
      text: json['text']?.toString() ??
          json['content']?.toString() ??
          json['message']?.toString() ??
          '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? false,
    );
  }

  /// Creates a temporary message for optimistic UI.
  factory Message.optimistic({
    required String conversationId,
    required String senderId,
    required String text,
  }) {
    return Message(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      createdAt: DateTime.now(),
      isSending: true,
    );
  }

  final String id;
  final String conversationId;
  final String senderId;
  final String text;
  final DateTime createdAt;
  final bool isRead;
  final bool isSending;
  final bool sendFailed;

  /// Formatted time for display.
  String get formattedTime {
    return '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  }

  /// Creates a copy with updated fields.
  Message copyWith({
    String? id,
    bool? isSending,
    bool? sendFailed,
  }) {
    return Message(
      id: id ?? this.id,
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      createdAt: createdAt,
      isRead: isRead,
      isSending: isSending ?? this.isSending,
      sendFailed: sendFailed ?? this.sendFailed,
    );
  }
}

