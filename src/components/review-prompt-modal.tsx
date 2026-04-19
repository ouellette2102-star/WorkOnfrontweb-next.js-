"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type PendingReview = {
  missionId: string;
  missionTitle: string;
  missionStatus: string;
  missionCompletedAt: string;
  counterpartUserId: string;
  counterpartName: string | null;
  counterpartRoleRelativeToViewer: "worker" | "employer";
};

type Props = {
  open: boolean;
  pending: PendingReview;
  onSubmitted: (missionId: string) => void;
  onSkip: (missionId: string) => void;
  onClose: () => void;
};

/**
 * ReviewPromptModal — surfaced after login/nav events for every completed
 * mission the user hasn't rated yet. Stars are required; comment is
 * optional up to 500 chars.
 */
export function ReviewPromptModal({
  open,
  pending,
  onSubmitted,
  onSkip,
  onClose,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when pending mission changes
  useEffect(() => {
    setRating(0);
    setHover(0);
    setComment("");
  }, [pending.missionId]);

  if (!open) return null;

  const counterpartLabel =
    pending.counterpartName ??
    (pending.counterpartRoleRelativeToViewer === "worker"
      ? "le travailleur"
      : "le client");

  const prompt =
    pending.counterpartRoleRelativeToViewer === "worker"
      ? `Comment s'est passé votre mission avec ${counterpartLabel} ?`
      : `Votre expérience avec ${counterpartLabel} ?`;

  async function handleSubmit() {
    if (rating < 1) {
      toast.error("Choisissez de 1 à 5 étoiles");
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({
        missionId: pending.missionId,
        toUserId: pending.counterpartUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Merci — avis publié");
      onSubmitted(pending.missionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-title"
      data-testid="review-prompt-modal"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="review-prompt-title"
              className="text-lg font-heading font-bold text-workon-ink"
            >
              Noter votre mission
            </h3>
            <p className="mt-1 text-sm text-workon-muted">
              {pending.missionTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-workon-muted hover:bg-workon-bg"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-workon-ink">{prompt}</p>

        <div
          className="mt-4 flex items-center gap-1"
          data-testid="review-prompt-stars"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className={`rounded-full p-1 transition-colors ${
                  active ? "text-amber-500" : "text-workon-border"
                } hover:bg-workon-bg`}
              >
                <Star
                  className="h-8 w-8"
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Un détail utile pour les prochains utilisateurs… (optionnel)"
          data-testid="review-prompt-comment"
          className="mt-4 w-full rounded-xl border border-workon-border bg-white p-3 text-sm text-workon-ink placeholder:text-workon-muted focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/20"
        />
        <p className="mt-1 text-right text-xs text-workon-muted">
          {comment.length}/500
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onSkip(pending.missionId)}
            disabled={submitting}
            className="rounded-xl border border-workon-border px-4 py-2.5 text-sm font-medium text-workon-ink hover:bg-workon-bg"
            data-testid="review-prompt-skip"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            data-testid="review-prompt-submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-workon-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-workon-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publier l&apos;avis
          </button>
        </div>
      </div>
    </div>
  );
}
