"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { CreateReviewApiResponse } from "@/types/review";

type ReviewFormProps = {
  missionId: string;
  workerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ReviewForm({
  missionId,
  workerId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Veuillez selectionner une note");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          workerId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data: CreateReviewApiResponse = await response.json();

      if (data.ok) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("Erreur lors de l'envoi de l'avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6 text-center">
        <div className="mb-3 text-4xl">🎉</div>
        <h3 className="mb-2 text-xl font-bold text-green-400">Merci pour votre avis !</h3>
        <p className="text-white/70">Votre feedback aide la communaute WorkOn.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating stars */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Note *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  value <= (hoverRating || rating)
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-white/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre experience..."
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-white/40 focus:border-red-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/40">{comment.length}/500</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 bg-red-600 hover:bg-red-500"
        >
          {isSubmitting ? "Envoi..." : "Envoyer l'avis"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}

