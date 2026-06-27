"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Briefcase,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { api, type ChatMessage } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useMissionChatSocket } from "@/hooks/use-mission-chat-socket";
import { cn } from "@/lib/utils";

/**
 * Chat thread page — messages for a specific mission.
 *
 * Fetches from GET /messages-local/thread/:missionId.
 * Sends via POST /messages-local.
 * Marks as read via PATCH /messages-local/read/:missionId.
 *
 * Realtime via Socket.IO (/chat namespace, room mission:{id}). HTTP
 * polling is kept as a fallback at 15s when the socket is connected,
 * 3s otherwise, so that a dead socket never leaves the thread stale.
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

  const {
    data: messagesRaw,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["thread", missionId],
    queryFn: () => api.getThread(missionId),
    refetchInterval: isConnected ? 15_000 : 3_000,
    enabled: !!missionId,
  });

  // Legacy DM stubs can return non-array shapes. Normalize before rendering.
  const messages: ChatMessage[] = Array.isArray(messagesRaw) ? messagesRaw : [];

  useEffect(() => {
    if (missionId && messages.length > 0) {
      api.markRead(missionId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }).catch(() => undefined);
    }
  }, [missionId, messages.length, queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4rem)] flex-col bg-workon-bg">
      <header className="border-b border-workon-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/messages"
            aria-label="Retour aux messages"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-workon-border bg-white text-workon-muted transition hover:bg-workon-bg-cream hover:text-workon-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-workon-primary/20 bg-workon-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-workon-primary">
                <Briefcase className="h-3 w-3" />
                Mission
              </span>
              <LiveStatusBadge status={socketStatus} isConnected={isConnected} />
            </div>
            <h1 className="mt-1 truncate text-sm font-black text-workon-ink">
              Mission #{missionId?.slice(0, 8)}
            </h1>
            <p className="text-[11px] font-medium text-workon-muted">
              {messages.length} message{messages.length > 1 ? "s" : ""} dans le fil
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Actualiser la conversation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-workon-border bg-white text-workon-muted transition hover:bg-workon-bg-cream hover:text-workon-ink disabled:opacity-60"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      <div className="border-b border-workon-border bg-white px-4 py-2">
        <div className="mx-auto grid max-w-4xl gap-2 sm:grid-cols-2">
          <ThreadFact icon={ShieldCheck} label="Preuve conservee" value="Messages gardes avec la mission" />
          <ThreadFact
            icon={Clock3}
            label="Synchronisation"
            value={isConnected ? "Live actif" : "Polling de secours"}
          />
        </div>
      </div>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          {isLoading ? (
            <ThreadState
              icon={Loader2}
              title="Chargement de la conversation"
              text="On recupere les derniers messages mission."
              spinning
            />
          ) : isError ? (
            <ThreadState
              icon={TriangleAlert}
              title="Impossible de charger la conversation"
              text="Verifie ta connexion et relance l'actualisation."
              tone="danger"
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2 text-sm font-bold text-workon-ink transition hover:bg-workon-bg-cream disabled:opacity-60"
                >
                  {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reessayer
                </button>
              }
            />
          ) : messages.length === 0 ? (
            <ThreadState
              icon={MessageCircle}
              title="Commence la conversation"
              text="Envoie le premier message pour garder la decision liee a cette mission."
            />
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
            ))
          )}
        </div>
      </main>

      <footer className="border-t border-workon-border bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-[22px] border border-workon-border bg-workon-bg p-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Ecrire un message</span>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleSend();
                }}
                placeholder="Ecrire un message..."
                className="h-11 w-full rounded-2xl border border-transparent bg-white px-4 text-sm text-workon-ink outline-none placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary-ring"
              />
            </label>
            <button
              type="button"
              aria-label="Envoyer le message"
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary text-white transition hover:bg-workon-primary-hover disabled:opacity-50"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-workon-muted">
            <span>Les messages restent attaches au contexte de mission.</span>
            {sendMessage.isError && (
              <span className="font-bold text-red-600">Message non envoye. Reessaie.</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThreadFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-workon-border bg-workon-bg-cream px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-workon-primary" />
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-workon-stone">
          {label}
        </span>
        <span className="block truncate text-xs font-bold text-workon-ink">{value}</span>
      </span>
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
      ? "Connexion"
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
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-workon-border bg-white px-2 py-1"
      aria-live="polite"
      aria-label={`Etat du chat: ${label}`}
      data-testid="chat-live-status"
      data-status={status}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] font-bold text-workon-muted">{label}</span>
    </span>
  );
}

function ThreadState({
  icon: Icon,
  title,
  text,
  tone = "neutral",
  spinning = false,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "neutral" | "danger";
  spinning?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-500" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-workon-muted">
        {text}
      </p>
      {action}
    </div>
  );
}

function MessageBubble({ message: msg, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={cn(
          "max-w-[82%] rounded-[22px] px-4 py-3 shadow-sm sm:max-w-[68%]",
          isOwn
            ? "rounded-br-md bg-workon-primary text-white"
            : "rounded-bl-md border border-workon-border bg-white text-workon-ink",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
        <p className={cn("mt-2 text-[10px]", isOwn ? "text-white/65" : "text-workon-muted")}>
          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </div>
  );
}
