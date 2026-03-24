import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/messages/message_models.dart';
import '../../services/messages/messages_api.dart';

/// Chat thread screen — messages for a specific mission.
class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.missionId,
    required this.missionTitle,
  });

  final String missionId;
  final String missionTitle;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messagesApi = MessagesApi();
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<Message> _messages = [];
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final msgs = await _messagesApi.getMessages(widget.missionId);
      if (mounted) {
        setState(() { _messages = msgs; _loading = false; });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty) return;
    _inputCtrl.clear();
    setState(() => _sending = true);
    try {
      final msg = await _messagesApi.sendMessage(widget.missionId, text);
      if (mounted) {
        setState(() { _messages.add(msg); _sending = false; });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final currentUserId = auth.userId ?? '';

    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: WkColors.bgSecondary,
        elevation: 0,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(0.5),
          child: Divider(height: 0.5, color: WkColors.bgQuaternary),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go('/messages'),
        ),
        title: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.missionTitle,
              style: const TextStyle(
                fontFamily: 'General Sans',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: WkColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.only(right: 4),
                  decoration: BoxDecoration(
                    color: WkColors.availableGreen,
                    shape: BoxShape.circle,
                  ),
                ),
                const Text(
                  'En ligne',
                  style: TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 11,
                    color: WkColors.availableGreen,
                  ),
                ),
              ],
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: WkColors.brandRed))
                : _messages.isEmpty
                    ? const _EmptyChat()
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) => _MessageBubble(
                          message: _messages[i],
                          isMe: _messages[i].senderId == currentUserId,
                        ),
                      ),
          ),
          // Input bar — premium
          Container(
            padding: EdgeInsets.only(
              left: 12,
              right: 12,
              top: 10,
              bottom: MediaQuery.of(context).viewInsets.bottom + 10,
            ),
            decoration: const BoxDecoration(
              color: WkColors.bgSecondary,
              border: Border(
                top: BorderSide(color: WkColors.bgQuaternary, width: 0.5),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: WkColors.bgTertiary,
                        borderRadius: BorderRadius.circular(WkRadius.pill),
                        border: Border.all(
                          color: WkColors.bgQuaternary,
                          width: 0.5,
                        ),
                      ),
                      child: TextField(
                        controller: _inputCtrl,
                        style: const TextStyle(
                          fontFamily: 'General Sans',
                          color: WkColors.textPrimary,
                          fontSize: 14,
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Écris ton message…',
                          hintStyle: TextStyle(color: WkColors.textTertiary, fontSize: 14),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: InputBorder.none,
                        ),
                        onSubmitted: (_) => _send(),
                        maxLines: null,
                        textInputAction: TextInputAction.send,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sending ? null : _send,
                    child: AnimatedContainer(
                      duration: WkDuration.fast,
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: _sending ? null : WkColors.gradientPremium,
                        color: _sending ? WkColors.bgTertiary : null,
                        shape: BoxShape.circle,
                        boxShadow: _sending ? [] : WkColors.shadowPremium,
                      ),
                      child: _sending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                            )
                          : const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.isMe});
  final Message message;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
            Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: isMe ? WkColors.gradientPremium : null,
              color: isMe ? null : WkColors.bgSecondary,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 16),
              ),
              boxShadow: isMe ? WkColors.shadowPremium : WkColors.shadowCard,
            ),
            child: Text(
              message.text,
              style: TextStyle(
                fontFamily: 'General Sans',
                color: isMe ? Colors.white : WkColors.textPrimary,
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  const _EmptyChat();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, color: WkColors.textTertiary, size: 48),
          SizedBox(height: 12),
          Text(
            'Commencez la conversation',
            style: TextStyle(color: WkColors.textSecondary, fontSize: 15),
          ),
        ],
      ),
    );
  }
}
