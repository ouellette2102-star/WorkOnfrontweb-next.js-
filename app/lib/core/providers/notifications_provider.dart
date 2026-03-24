/// Notifications state provider for WorkOn.
library;

import 'package:flutter/foundation.dart';

import '../../services/auth/token_storage.dart';

/// Provider for notification state (unread count, badge).
class NotificationsProvider extends ChangeNotifier {
  int _unreadCount = 0;

  int get unreadCount => _unreadCount;
  bool get hasUnread => _unreadCount > 0;

  /// Updates the unread count and notifies listeners.
  void setUnreadCount(int count) {
    if (_unreadCount != count) {
      _unreadCount = count;
      notifyListeners();
    }
  }

  /// Decrements unread count when a notification is read.
  void markOneRead() {
    if (_unreadCount > 0) {
      _unreadCount--;
      notifyListeners();
    }
  }

  /// Clears all unread.
  void markAllRead() {
    _unreadCount = 0;
    notifyListeners();
  }

  /// Whether the user is logged in (guard for fetch).
  bool get canFetch => TokenStorage.hasToken;
}
