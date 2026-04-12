"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, MessageCircle, Loader2 } from "lucide-react";
import type { ReviewSummary, ReviewResponse } from "@/lib/api-client";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? "fill-[#D4922A] text-[#D4922A]" : "text-workon-border"}`}
        />
      ))}
    </div>
  );
}

function DistributionBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-right text-sm font-medium text-workon-muted">{star}</span>
      <Star className="h-3.5 w-3.5 fill-[#D4922A] text-[#D4922A]" />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-workon-border/30">
        <div
          className="h-full rounded-full bg-[#D4922A] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-workon-muted">{count}</span>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-20 rounded-lg bg-workon-border/40" />
          <div className="h-4 w-24 rounded bg-workon-border/40" />
          <div className="h-3 w-16 rounded bg-workon-border/30" />
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="h-3 w-4 rounded bg-workon-border/30" />
              <div className="h-2 flex-1 rounded-full bg-workon-border/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-workon-border/40" />
        <div className="h-3 w-20 rounded bg-workon-border/30" />
      </div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-4 rounded bg-workon-border/30" />
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-workon-border/30" />
        <div className="h-3 w-3/4 rounded bg-workon-border/30" />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery<ReviewSummary>({
    queryKey: ["review-summary", userId],
    queryFn: () => api.getReviewSummary(userId!),
    enabled: !!userId,
  });

  const {
    data: reviews,
    isLoading: reviewsLoading,
  } = useQuery<ReviewResponse[]>({
    queryKey: ["reviews", userId],
    queryFn: () => api.getReviews(userId!),
    enabled: !!userId,
  });

  const isLoading = summaryLoading || reviewsLoading;

  // Find max count in distribution for bar scaling
  const distributionValues = summary
    ? [5, 4, 3, 2, 1].map((s) => summary.distribution[String(s)] ?? 0)
    : [];
  const maxDistribution = Math.max(...distributionValues, 1);

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-workon-ink">Mes avis</h1>
          <p className="mt-1 text-workon-muted">
            Les avis laissés par vos clients et partenaires
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <SummarySkeleton />
            {[1, 2, 3].map((i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Summary card */}
            {summary && summary.totalReviews > 0 && (
              <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  {/* Average rating */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-5xl font-heading font-bold text-workon-ink">
                      {summary.averageRating.toFixed(1)}
                    </span>
                    <StarRating rating={Math.round(summary.averageRating)} size="lg" />
                    <span className="text-sm text-workon-muted">
                      {summary.totalReviews} avis
                    </span>
                  </div>

                  {/* Distribution bars */}
                  <div className="flex-1 space-y-1.5 w-full">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <DistributionBar
                        key={star}
                        star={star}
                        count={summary.distribution[String(star)] ?? 0}
                        max={maxDistribution}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!reviews || reviews.length === 0) && (
              <EmptyState
                icon={MessageCircle}
                title="Aucun avis pour le moment"
                description="Complétez des missions pour recevoir vos premiers avis."
                actionLabel="Trouver des missions"
                actionHref="/search"
              />
            )}

            {/* Reviews list */}
            {reviews && reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-workon-ink">{review.reviewerName}</span>
                      <span className="text-xs text-workon-muted">
                        {new Date(review.createdAt).toLocaleDateString("fr-CA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-workon-muted">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
