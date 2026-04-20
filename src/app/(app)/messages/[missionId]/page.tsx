"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatMessage } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useMissionChatSocket } from "@/hooks/use-mission-chat-socket";
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
 * Realtime via Socket.IO (/chat namespace, room mission:{id}). HTTP
 * polling is kept as a fallback at 15s when the socket is connected,
 * 3s otherwise, so that a dead socket (CORS, expired JWT, blocked
 * network) never leaves the thread stale.
 */
export default function ChatThreadPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleIncomingMessage = useCallback(
    (incoming: unknown) => {
      const msg = incoming as ChatMessage | null;
      if (!msg || typeof msg !== "object" || !("id" in msg) || !("missionId" in msg)) return;
      if (msg.missionId !== missionId) return;
      queryClient.setQueryData<ChatMessage[]>(["thread", missionId], (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((m) => m.id === msg.id)) return list;
        return [...list, msg];
      });
    },
    [missionId, queryClient],
  );

  const { isConnected, status: socketStatus } = useMissionChatSocket({
    missionId: missionId ?? null,
    enabled: !!missionId && isAuthenticated,
    onNewMessage: handleIncomingMessage,
  });

  const { data: messagesRaw, isLoading } = useQuery({
    queryKey: ["thread", missionId],
    queryFn: () => api.getThread(missionId),
    refetchInterval: isConnected ? 15_000 : 3_000,
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-workon-ink truncate">
            Mission #{missionId?.slice(0, 8)}
          </p>
          <p className="text-[10px] text-workon-muted">
            {messages.length} messages
          </p>
        </div>
        <LiveStatusBadge status={socketStatus} isConnected={isConnected} />
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

function LiveStatusBadge({
  status,
  isConnected,
}: {
  status: "idle" | "connecting" | "connected" | "error" | "disconnected";
  isConnected: boolean;
}) {
  const label =
    status === "connecting"
      ? "Connexion…"
      : isConnected
        ? "Live"
        : status === "error"
          ? "Hors ligne"
          : "Polling";
  const dot = isConnected
    ? "bg-emerald-500"
    : status === "connecting"
      ? "bg-amber-400 animate-pulse"
      : status === "error"
        ? "bg-red-500"
        : "bg-workon-muted";
  return (
    <div
      className="shrink-0 flex items-center gap-1.5 rounded-full border border-workon-border bg-workon-bg px-2 py-0.5"
      aria-live="polite"
      aria-label={`État du chat: ${label}`}
      data-testid="chat-live-status"
      data-status={status}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] font-medium text-workon-muted">{label}</span>
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
