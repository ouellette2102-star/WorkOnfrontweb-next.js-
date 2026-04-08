"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ChatMessage } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useMissionChatSocket } from "@/hooks/use-mission-chat-socket";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";

type Props = {
  missionId: string;
  missionTitle: string;
};

export function ConversationThread({ missionId, missionTitle }: Props) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Real-time chat socket. We connect on mount, listen for `new_message`,
  // and surface the connection status so the polling interval can be
  // relaxed when the WS path is healthy. The socket NEVER replaces the
  // HTTP path — sending and the initial fetch still go through `api.*`,
  // and polling stays on as a fallback that just runs slower when WS
  // is connected.
  const handleNewMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["thread", missionId] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [missionId, queryClient]);

  const { isConnected: wsConnected } = useMissionChatSocket({
    missionId,
    onNewMessage: handleNewMessage,
    enabled: isAuthenticated,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["thread", missionId],
    queryFn: () => api.getThread(missionId),
    // When the realtime socket is connected we trust it to push new
    // messages and slow polling down to 60s as a safety net. When the
    // socket is not connected (CORS blocked, token expired, network
    // hostile) we keep the original 10s polling so the user always
    // sees fresh messages.
    refetchInterval: wsConnected ? 60_000 : 10_000,
    refetchIntervalInBackground: false,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening thread
  useEffect(() => {
    api.markRead(missionId).catch((err) => {
      // Background mark-read — don't toast the user, but log so unread
      // drift is visible during development instead of silently hidden.
      console.warn("[messages] markRead failed for mission", missionId, err);
    });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [missionId, queryClient]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await api.sendMessage({ missionId, content });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["thread", missionId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch {
      // Could show toast here
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">{missionTitle}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/40">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: ChatMessage) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? "bg-red-600 text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isOwn ? "text-white/60" : "text-white/40"
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                        locale: frCA,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 resize-none rounded-xl border border-white/10 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
            rows={1}
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            {sending ? (
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
