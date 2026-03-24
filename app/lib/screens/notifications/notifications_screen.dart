import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/workon_colors.dart';
import '../../core/providers/notifications_provider.dart';
import '../../services/notifications/notifications_api.dart';

/// Notifications screen — liste des notifications via GET /notifications.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = const NotificationsApi();
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final notifs = await _api.getNotifications();
      if (mounted) {
        setState(() { _notifications = notifs; _loading = false; });
        // Update badge count
        final unread = notifs.where((n) => !n.isRead).length;
        context.read<NotificationsProvider>().setUnreadCount(unread);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Impossible de charger les notifications.';
        });
      }
    }
  }

  Future<void> _markRead(AppNotification notif) async {
    if (notif.isRead) return;
    await _api.markAsRead(notif.id);
    setState(() {
      final idx = _notifications.indexWhere((n) => n.id == notif.id);
      if (idx >= 0) {
        _notifications = List.from(_notifications)..[idx] =
            AppNotification(
              id: notif.id,
              title: notif.title,
              body: notif.body,
              type: notif.type,
              isRead: true,
              createdAt: notif.createdAt,
              referenceId: notif.referenceId,
            );
      }
    });
    if (mounted) context.read<NotificationsProvider>().markOneRead();
  }

  Future<void> _markAllRead() async {
    await _api.markAllAsRead();
    if (!mounted) return;
    setState(() {
      _notifications = _notifications
          .map((n) => AppNotification(
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                isRead: true,
                createdAt: n.createdAt,
                referenceId: n.referenceId,
              ))
          .toList();
    });
    if (mounted) context.read<NotificationsProvider>().markAllRead();
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => !n.isRead);

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text(
                'Tout lire',
                style: TextStyle(color: WkColors.brandRed, fontSize: 13),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: WkColors.brandRed))
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _notifications.isEmpty
                  ? const _EmptyView()
                  : RefreshIndicator(
                      color: WkColors.brandRed,
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) =>
                            const Divider(color: WkColors.glassBorder, height: 1),
                        itemBuilder: (_, i) => _NotifTile(
                          notif: _notifications[i],
                          onTap: () => _markRead(_notifications[i]),
                        ),
                      ),
                    ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  const _NotifTile({required this.notif, required this.onTap});
  final AppNotification notif;
  final VoidCallback onTap;

  IconData get _icon {
    switch (notif.type) {
      case 'payment': return Icons.payment_outlined;
      case 'message': return Icons.chat_bubble_outline;
      case 'offer': return Icons.assignment_outlined;
      case 'mission': return Icons.task_alt_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: notif.isRead ? WkColors.bgTertiary : WkColors.brandRedSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          _icon,
          color: notif.isRead ? WkColors.textTertiary : WkColors.brandRed,
          size: 22,
        ),
      ),
      title: Text(
        notif.title,
        style: TextStyle(
          fontFamily: 'General Sans',
          fontSize: 14,
          fontWeight: notif.isRead ? FontWeight.w500 : FontWeight.w700,
          color: WkColors.textPrimary,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            notif.body,
            style: const TextStyle(fontSize: 12, color: WkColors.textSecondary),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(notif.timeAgo, style: const TextStyle(fontSize: 11, color: WkColors.textTertiary)),
        ],
      ),
      trailing: !notif.isRead
          ? Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: WkColors.brandRed,
                shape: BoxShape.circle,
              ),
            )
          : null,
      onTap: onTap,
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none_outlined, color: WkColors.textTertiary, size: 56),
          SizedBox(height: 16),
          Text('Aucune notification', style: TextStyle(color: WkColors.textSecondary, fontSize: 16)),
          SizedBox(height: 8),
          Text('Vous êtes à jour !', style: TextStyle(color: WkColors.textTertiary, fontSize: 13)),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: WkColors.error, size: 48),
          const SizedBox(height: 12),
          Text(error, style: const TextStyle(color: WkColors.textSecondary)),
          const SizedBox(height: 16),
          TextButton(onPressed: onRetry, child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed))),
        ],
      ),
    );
  }
}
