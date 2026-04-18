"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, X, Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface ContactWorkerButtonProps {
  workerId: string;
  workerFirstName: string;
  workerCategory?: string;
  workerCity?: string;
}

export function ContactWorkerButton({
  workerId,
  workerFirstName,
  workerCategory,
}: ContactWorkerButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  // Contact flow is now swipe-first: the user must match before chatting.
  // Clicking "Envoyer" redirects to /swipe so the user can like the
  // worker's card. On mutual LIKE the backend auto-creates a Conversation
  // (see swipe.service.ts#ensureConversation) and the chat appears in
  // /messages. This replaces the old POST /messages-local/direct endpoint
  // that was removed 2026-04-18 (returns 410 Gone).
  const handleSend = () => {
    toast.info("Swipe pour matcher d'abord", {
      description:
        `Pour contacter ${workerFirstName}, likez son profil dans Pros. Le chat s'ouvre dès le match.`,
    });
    setOpen(false);
    setMessage("");
    router.push("/swipe");
  };

  // Silence unused — API is no longer called, but workerId stays part of the
  // component signature for the time being.
  void workerId;
  void sending;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-workon-accent text-white text-sm font-medium py-2 hover:bg-workon-accent/90 transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Contacter
      </button>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => !sending && setOpen(false)}
          />

          {/* Form */}
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-workon-border bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-workon-ink">
                  Contacter {workerFirstName}
                </h3>
                {workerCategory && (
                  <p className="text-xs text-workon-muted">{workerCategory}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => !sending && setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-workon-bg text-workon-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message field */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre besoin... (ex: J'ai besoin d'un nettoyage de bureau la semaine prochaine)"
              rows={4}
              maxLength={500}
              disabled={sending}
              className="w-full rounded-xl border border-workon-border bg-workon-bg px-3 py-2.5 text-sm text-workon-ink placeholder:text-workon-muted/60 focus:outline-none focus:ring-2 focus:ring-workon-primary/30 focus:border-workon-primary resize-none disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <p className="mt-1 text-right text-[10px] text-workon-muted">
              {message.length}/500
            </p>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-workon-primary py-3 text-sm font-semibold text-white transition hover:bg-workon-primary/90 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer le message
                </>
              )}
            </button>
          </div>
        </>
      )}
    </>
  );
}
