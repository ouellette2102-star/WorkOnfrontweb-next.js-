import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../services/messages/messages_api.dart';
import '../../services/messages/message_models.dart';
import '../../widgets/wk_skeleton_loader.dart';

/// Messages screen — list of conversations.
class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Conversation> _conversations = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final convs = await MessagesApi().getConversations();
      if (mounted) setState(() { _conversations = convs; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = 'Impossible de charger les messages.'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'Messages',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? ListView.builder(
              padding: const EdgeInsets.all(WkSpacing.md),
              itemCount: 5,
              itemBuilder: (_, __) => Padding(
                padding: const EdgeInsets.only(bottom: WkSpacing.sm),
                child: WkSkeletonLoader.listItem(),
              ),
            )
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _conversations.isEmpty
                  ? const _EmptyView()
                  : RefreshIndicator(
                      color: WkColors.brandRed,
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _conversations.length,
                        separatorBuilder: (_, __) => const Divider(
                          color: WkColors.glassBorder,
                          height: 1,
                          indent: 72,
                        ),
                        itemBuilder: (_, i) => _ConversationTile(
                          conversation: _conversations[i],
                        ),
                      ),
                    ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({required this.conversation});
  final Conversation conversation;

  @override
  Widget build(BuildContext context) {
    final hasUnread = (conversation.unreadCount ?? 0) > 0;

    return InkWell(
      onTap: () => context.goNamed(
        'chat',
        pathParameters: {'missionId': conversation.missionId ?? ''},
        extra: {'title': conversation.participantName},
      ),
      borderRadius: BorderRadius.circular(WkRadius.lg),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.all(12),
        decoration: hasUnread
            ? BoxDecoration(
                color: WkColors.brandOrangeSoft,
                borderRadius: BorderRadius.circular(WkRadius.lg),
                border: Border.all(color: WkColors.brandOrangeMuted, width: 0.5),
              )
            : null,
        child: Row(
          children: [
            // Avatar
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: WkColors.bgTertiary,
                shape: BoxShape.circle,
                border: hasUnread
                    ? Border.all(color: WkColors.brandOrange, width: 1.5)
                    : null,
              ),
              child: const Icon(Icons.person_rounded, color: WkColors.textSecondary, size: 24),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    conversation.participantName,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 15,
                      fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w500,
                      color: WkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    conversation.lastMessage ?? 'Aucun message',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 13,
                      color: hasUnread ? WkColors.textSecondary : WkColors.textTertiary,
                      fontWeight: hasUnread ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Time + unread badge
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (conversation.lastMessageAt != null)
                  Text(
                    conversation.formattedTime,
                    style: TextStyle(
                      fontFamily: 'General Sans',
                      fontSize: 11,
                      color: hasUnread ? WkColors.brandOrange : WkColors.textTertiary,
                      fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                const SizedBox(height: 4),
                if (hasUnread)
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: const BoxDecoration(
                      gradient: WkColors.gradientPremium,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${conversation.unreadCount}',
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
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
          Icon(Icons.chat_bubble_outline, color: WkColors.textTertiary, size: 56),
          SizedBox(height: 16),
          Text('Aucune conversation', style: TextStyle(color: WkColors.textSecondary, fontSize: 16)),
          SizedBox(height: 8),
          Text('Vos échanges apparaîtront ici', style: TextStyle(color: WkColors.textTertiary, fontSize: 13)),
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
          TextButton(
            onPressed: onRetry,
            child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed)),
          ),
        ],
      ),
    );
  }
}
