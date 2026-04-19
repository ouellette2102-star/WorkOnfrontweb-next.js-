"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle, Sparkles, User2, X } from "lucide-react";
import type { SwipeCandidate } from "@/lib/api-client";

type Props = {
  open: boolean;
  candidate: SwipeCandidate;
  matchId: string;
  onDismiss: () => void;
};

/**
 * MatchCelebrationModal — fires on a mutual swipe match. Replaces the
 * previous toast-only signal with a proper CTA surface so users can
 * immediately act on the match (message / profile) instead of losing
 * the moment to a disappearing notification.
 */
export function MatchCelebrationModal({
  open,
  candidate,
  matchId,
  onDismiss,
}: Props) {
  const router = useRouter();

  if (!open) return null;

  const fullName =
    [candidate.firstName, candidate.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Votre match";

  function goMessage() {
    onDismiss();
    router.push(`/messages/cv/${matchId}`);
  }

  function goProfile() {
    onDismiss();
    router.push(`/worker/${candidate.id}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-celebration-title"
      data-testid="match-celebration-modal"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Celebratory banner */}
        <div className="relative bg-gradient-to-br from-workon-accent to-workon-accent-hover px-6 py-7 text-white">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fermer"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white/80 hover:bg-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/80">
            <Sparkles className="h-4 w-4" />
            Nouveau match
          </div>
          <h2
            id="match-celebration-title"
            className="mt-2 text-3xl font-heading font-bold"
          >
            C&apos;est réciproque !
          </h2>
          <p className="mt-1 text-sm text-white/85">
            Vous et {fullName} vous êtes choisis mutuellement.
          </p>
        </div>

        <div className="flex items-center gap-4 px-6 py-5 bg-workon-bg">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
            {candidate.pictureUrl ? (
              <Image
                src={candidate.pictureUrl}
                alt={fullName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-workon-primary">
                {candidate.firstName?.[0]}
                {candidate.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-workon-ink">{fullName}</p>
            {candidate.jobTitle && (
              <p className="truncate text-sm text-workon-muted">
                {candidate.jobTitle}
              </p>
            )}
            {candidate.city && (
              <p className="text-xs text-workon-muted">{candidate.city}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 p-6">
          <button
            type="button"
            onClick={goMessage}
            data-testid="match-celebration-message"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-workon-primary px-4 py-3 text-sm font-semibold text-white hover:bg-workon-primary/90"
          >
            <MessageCircle className="h-4 w-4" />
            Envoyer un message
          </button>
          <button
            type="button"
            onClick={goProfile}
            data-testid="match-celebration-profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-workon-border bg-white px-4 py-3 text-sm font-semibold text-workon-ink hover:bg-workon-bg"
          >
            <User2 className="h-4 w-4" />
            Voir le profil
          </button>
          <button
            type="button"
            onClick={onDismiss}
            data-testid="match-celebration-continue"
            className="text-sm font-medium text-workon-muted hover:text-workon-ink py-2"
          >
            Continuer à swiper
          </button>
        </div>
      </div>
    </div>
  );
}
