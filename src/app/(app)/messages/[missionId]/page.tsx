"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatMessage } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Chat thread page — messages for a specific mission.
 *
 * Fetches from GET /messages-local/thread/:missionId.
 * Sends via POST /messages-local.
 * Marks as read via PATCH /messages-local/read/:missionId.
 *
 * Polls every 3 seconds for new messages (HTTP fallback).
 * WebSocket upgrade will be added in PR #102.
 */
export default function ChatThreadPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messagesRaw, isLoading } = useQuery({
    queryKey: ["thread", missionId],
    queryFn: () => api.getThread(missionId),
    refetchInterval: 3_000,
    enabled: !!missionId,
  });

  // Legacy DM stubs (lm_dm_*) were migrated to Conversation in PR #243;
  // the API can now return 410 Gone or a non-array error shape for those
  // IDs, so we normalise to an array before any .map/.length access.
  const messages: ChatMessage[] = Array.isArray(messagesRaw) ? messagesRaw : [];

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (missionId && messages.length > 0) {
      api.markRead(missionId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
    }
  }, [missionId, messages.length, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.sendMessage({ missionId, content }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["thread", missionId] });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem)]">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-workon-border bg-white">
        <Link href="/messages" className="shrink-0 text-workon-muted hover:text-workon-ink">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium text-workon-ink truncate">
            Mission #{missionId?.slice(0, 8)}
          </p>
          <p className="text-[10px] text-workon-muted">
            {messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-workon-muted py-8">
            Commencez la conversation
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
          ))
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-workon-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Écrire un message..."
            className="flex-1 rounded-2xl border border-workon-border bg-workon-bg px-4 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:ring-1 focus:ring-workon-primary-ring"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="shrink-0 h-10 w-10 rounded-full bg-workon-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-workon-primary-hover transition-colors"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message: msg, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-workon-primary text-white rounded-br-md"
            : "bg-white border border-workon-border text-workon-ink rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            isOwn ? "text-white/60" : "text-workon-muted"
          }`}
        >
          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </div>
  );
}
