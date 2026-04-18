"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ConversationItem } from "@/lib/api-client";
import { MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Conversations list — shows all mission chat threads.
 *
 * Fetches from GET /messages-local/conversations (Zod-validated).
 * Each conversation links to /messages/[missionId] for the thread view.
 */
export default function MessagesPage() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.getConversations(),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)] mb-6">
        Messages
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-workon-bg-cream flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-workon-muted" />
          </div>
          <p className="text-workon-gray text-sm">Aucune conversation</p>
          <p className="text-workon-muted text-xs mt-1">
            Les messages apparaîtront ici quand vous échangerez avec un pro
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.conversationId ?? conv.missionId ?? Math.random()}
              conversation={conv}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationRow({ conversation: conv }: { conversation: ConversationItem }) {
  const hasUnread = conv.unreadCount > 0;
  // Pure DM conversations (post-match) → /messages/cv/:id
  // Mission-chats → /messages/:missionId
  const href = conv.conversationId
    ? `/messages/cv/${conv.conversationId}`
    : `/messages/${conv.missionId}`;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
        hasUnread ? "bg-workon-primary-subtle" : "hover:bg-workon-bg-cream"
      }`}
    >
      {/* Avatar placeholder */}
      <div className="shrink-0 h-12 w-12 rounded-full bg-workon-primary/10 flex items-center justify-center text-workon-primary font-semibold text-sm">
        {conv.otherUser.firstName[0]}
        {conv.otherUser.lastName[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? "font-semibold text-workon-ink" : "text-workon-ink"}`}>
            {conv.otherUser.firstName} {conv.otherUser.lastName}
          </p>
          <span className="text-[10px] text-workon-muted shrink-0">
            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-xs text-workon-muted truncate">{conv.missionTitle}</p>
        {conv.lastMessage && (
          <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-workon-ink font-medium" : "text-workon-gray"}`}>
            {conv.lastMessage}
          </p>
        )}
      </div>

      {hasUnread && (
        <span className="shrink-0 min-w-[20px] h-[20px] rounded-full bg-workon-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
        </span>
      )}
    </Link>
  );
}
