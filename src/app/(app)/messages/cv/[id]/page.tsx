"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useConversationSocket } from "@/hooks/use-conversation-socket";
import { cn } from "@/lib/utils";

/**
 * Chat thread for a pure Conversation (post-swipe-match DM).
 *
 * Fetches from GET /conversations/:id/messages.
 * Sends via POST /conversations/:id/messages.
 * Marks read via PATCH /conversations/:id/read.
 */
export default function ConversationThreadPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isConnected } = useConversationSocket({
    conversationId,
    enabled: !!conversationId,
    onNewMessage: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", conversationId],
      });
    },
  });

  const {
    data,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => api.getConversationMessages(conversationId),
    refetchInterval: isConnected ? 15_000 : 3_000,
    enabled: !!conversationId,
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      api.markConversationRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }).catch(() => undefined);
    }
    // This effect is intentionally keyed by count so read state updates after new messages land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.sendConversationMessage(conversationId, content),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", conversationId],
      });
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
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                <Users className="h-3 w-3" />
                Match
              </span>
              <LiveStatusBadge isConnected={isConnected} />
            </div>
            <h1 className="mt-1 truncate text-sm font-black text-workon-ink">
              Discussion directe
            </h1>
            <p className="text-[11px] font-medium text-workon-muted">
              {messages.length} message{messages.length > 1 ? "s" : ""} dans le fil
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Actualiser la discussion"
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
          <ThreadFact icon={ShieldCheck} label="Match conserve" value="Le contexte reste dans WorkOn" />
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
              title="Chargement de la discussion"
              text="On recupere les derniers messages du match."
              spinning
            />
          ) : isError ? (
            <ThreadState
              icon={TriangleAlert}
              title="Impossible de charger la discussion"
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
              title="Commence la discussion"
              text="Envoie le premier message pour convertir ce match en prochaine decision."
            />
          ) : (
            messages.map((msg) => (
              <ConversationBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
              />
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
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary text-white transition hover:bg-workon-primary-hover disabled:opacity-50"
              aria-label="Envoyer"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-workon-muted">
            <span>La discussion reste reliee au match WorkOn.</span>
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

function LiveStatusBadge({ isConnected }: { isConnected: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-workon-border bg-white px-2 py-1"
      aria-live="polite"
      aria-label={`Etat du chat: ${isConnected ? "Live" : "Polling"}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "bg-emerald-500" : "bg-workon-muted")} />
      <span className="text-[10px] font-bold text-workon-muted">
        {isConnected ? "Live" : "Polling"}
      </span>
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

function ConversationBubble({
  message: msg,
  isOwn,
}: {
  message: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  };
  isOwn: boolean;
}) {
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
          {formatDistanceToNow(new Date(msg.createdAt), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </div>
  );
}
