"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewSummary, ReviewResponse } from "@/lib/api-client";

type PendingReview = {
  missionId: string;
  missionTitle: string;
  missionStatus: string;
  missionCompletedAt: string;
  counterpartUserId: string;
  counterpartName: string | null;
  counterpartRoleRelativeToViewer: "worker" | "employer";
};

type ReviewFilter = "all" | "five" | "positive" | "attention";

const filterOptions: Array<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "five", label: "5 etoiles" },
  { value: "positive", label: "4+ etoiles" },
  { value: "attention", label: "A surveiller" },
];

const ratingLabels: Record<number, string> = {
  1: "A corriger",
  2: "Fragile",
  3: "Correct",
  4: "Solide",
  5: "Excellent",
};

function StarRating({
  rating,
  size = "sm",
  label,
}: {
  rating: number;
  size?: "sm" | "lg";
  label?: string;
}) {
  const cls = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-label={label ?? `${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Star
          key={item}
          className={`${cls} ${
            item <= rounded
              ? "fill-[#D4922A] text-[#D4922A]"
              : "text-workon-border"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function DistributionBar({
  star,
  count,
  max,
}: {
  star: number;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-right text-sm font-semibold text-workon-muted">
        {star}
      </span>
      <Star className="h-3.5 w-3.5 fill-[#D4922A] text-[#D4922A]" />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-workon-border/30">
        <div
          className="h-full rounded-full bg-[#D4922A] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-semibold text-workon-muted">
        {count}
      </span>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-44 animate-pulse rounded-[28px] bg-workon-surface-dark/90" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-2xl border border-workon-border bg-white" />
        ))}
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-36 animate-pulse rounded-3xl border border-workon-border bg-white" />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const {
    data: summary,
    isFetching: summaryFetching,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery<ReviewSummary>({
    queryKey: ["review-summary", userId],
    queryFn: () => api.getReviewSummary(userId!),
    enabled: !!userId,
  });

  const {
    data: reviews,
    isFetching: reviewsFetching,
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useQuery<ReviewResponse[]>({
    queryKey: ["reviews", userId],
    queryFn: () => api.getReviews(userId!),
    enabled: !!userId,
  });

  const {
    data: pendingReviews = [],
    isFetching: pendingFetching,
    isError: pendingError,
    refetch: refetchPending,
  } = useQuery<PendingReview[]>({
    queryKey: ["reviews-pending-for-me", "reviews-page"],
    queryFn: () => api.getPendingReviews(),
    enabled: !!userId,
  });

  const reviewsReceived = useMemo(() => {
    return [...(reviews ?? [])].sort(
      (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt),
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviewsReceived.filter((review) => {
      if (filter === "five") return review.rating === 5;
      if (filter === "positive") return review.rating >= 4;
      if (filter === "attention") return review.rating <= 3;
      return true;
    });
  }, [filter, reviewsReceived]);

  const distributionValues = summary
    ? [5, 4, 3, 2, 1].map((star) => summary.distribution[String(star)] ?? 0)
    : [];
  const maxDistribution = Math.max(...distributionValues, 1);

  const stats = useMemo(() => {
    const computedAverage =
      reviewsReceived.length > 0
        ? reviewsReceived.reduce((sum, review) => sum + review.rating, 0) /
          reviewsReceived.length
        : 0;
    const averageRating = summary?.averageRating ?? computedAverage;
    const totalReviews = summary?.totalReviews ?? reviewsReceived.length;
    const fiveStarCount =
      summary?.distribution?.["5"] ??
      reviewsReceived.filter((review) => review.rating === 5).length;
    const attentionCount = reviewsReceived.filter((review) => review.rating <= 3).length;

    return {
      totalReviews,
      averageRating,
      fiveStarCount,
      attentionCount,
      pendingCount: pendingReviews.length,
      latestReview: reviewsReceived[0],
    };
  }, [pendingReviews.length, reviewsReceived, summary]);

  const isLoading = authLoading || summaryLoading || reviewsLoading || (!userId && authLoading);
  const hasError = summaryError || reviewsError;
  const isRefreshing = summaryFetching || reviewsFetching || pendingFetching;

  const refresh = () => {
    refetchSummary();
    refetchReviews();
    refetchPending();
  };

  return (
    <div
      className="min-h-screen bg-workon-bg px-4 pb-32 pt-6 sm:px-6 lg:px-8"
      data-testid="reviews-page"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {isLoading && <SummarySkeleton />}

        {!isLoading && hasError && (
          <ErrorPanel isRefreshing={isRefreshing} onRefresh={refresh} />
        )}

        {!isLoading && !hasError && (
          <>
            <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                    <Star className="h-4 w-4 fill-[#D4922A] text-[#D4922A]" />
                    Reputation WorkOn
                  </p>
                  <h1 className="text-3xl font-bold text-white md:text-4xl">
                    Mes avis
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
                    Suis les avis recus, repere les signaux forts et reponds aux missions terminees qui attendent encore une evaluation.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="inverse"
                    onClick={refresh}
                    disabled={isRefreshing}
                    className="bg-white/10"
                  >
                    <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    Actualiser
                  </Button>
                  <Button asChild className="bg-white text-workon-primary hover:bg-workon-bg-cream">
                    <Link href="/missions/mine">
                      Voir mes missions
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricTile
                icon={Star}
                label="Note moyenne"
                value={stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : "-"}
                detail={stats.totalReviews > 0 ? `${stats.totalReviews} avis recus` : "Aucun avis"}
              />
              <MetricTile
                icon={ThumbsUp}
                label="5 etoiles"
                value={String(stats.fiveStarCount)}
                detail="Experience excellente"
              />
              <MetricTile
                icon={MessageCircle}
                label="A donner"
                value={String(stats.pendingCount)}
                detail="Missions terminees"
              />
              <MetricTile
                icon={ShieldCheck}
                label="A surveiller"
                value={String(stats.attentionCount)}
                detail="Avis de 3 etoiles ou moins"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <SummaryPanel
                summary={summary}
                reviews={reviewsReceived}
                maxDistribution={maxDistribution}
              />
              <PendingReviewsPanel
                pendingReviews={pendingReviews}
                pendingError={pendingError}
              />
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-workon-border bg-white p-2 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-4 gap-1 md:flex md:overflow-x-auto">
                {filterOptions.map((option) => {
                  const selected = filter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFilter(option.value)}
                      data-testid={`reviews-filter-${option.value}`}
                      className={`min-w-0 rounded-xl px-2 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm md:shrink-0 ${
                        selected
                          ? "bg-workon-primary text-white shadow-sm"
                          : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <Badge variant="outline" className="justify-center border-workon-border bg-white text-workon-muted md:justify-start">
                {filteredReviews.length} avis affiches
              </Badge>
            </section>

            {reviewsReceived.length === 0 && (
              <EmptyState
                icon={MessageCircle}
                title="Aucun avis pour le moment"
                description="Completez des missions pour recevoir vos premiers avis."
                actionLabel="Trouver des missions"
                actionHref="/missions/mine"
              />
            )}

            {reviewsReceived.length > 0 && filteredReviews.length === 0 && (
              <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm">
                <Star className="mx-auto mb-4 h-12 w-12 text-workon-gray/40" />
                <h2 className="text-xl font-semibold text-workon-ink">
                  Rien dans ce filtre
                </h2>
                <p className="mt-2 text-sm text-workon-muted">
                  Change de filtre pour revoir tous tes avis recus.
                </p>
              </div>
            )}

            {filteredReviews.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({
  summary,
  reviews,
  maxDistribution,
}: {
  summary?: ReviewSummary;
  reviews: ReviewResponse[];
  maxDistribution: number;
}) {
  const totalReviews = summary?.totalReviews ?? reviews.length;
  const averageRating =
    summary?.averageRating ??
    (reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0);
  const hasReviews = totalReviews > 0;
  const latest = reviews[0];

  return (
    <article
      className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm sm:p-6"
      data-testid="reviews-summary-panel"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex min-w-[180px] flex-col items-start gap-2 rounded-2xl bg-workon-bg-cream p-5">
          <p className="text-sm font-semibold text-workon-muted">Reputation</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-workon-ink">
              {hasReviews ? averageRating.toFixed(1) : "-"}
            </span>
            <span className="pb-2 text-sm font-semibold text-workon-muted">/ 5</span>
          </div>
          <StarRating rating={averageRating} size="lg" label={`Note moyenne ${averageRating.toFixed(1)} sur 5`} />
          <p className="text-sm text-workon-muted">
            {hasReviews ? `${totalReviews} avis recus` : "Aucun avis recu"}
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-workon-ink">
              Distribution des notes
            </h2>
            <p className="mt-1 text-sm leading-6 text-workon-muted">
              Les avis aident a convertir les prochains clients et a detecter les missions a ameliorer.
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <DistributionBar
                key={star}
                star={star}
                count={summary?.distribution[String(star)] ?? reviews.filter((review) => review.rating === star).length}
                max={maxDistribution}
              />
            ))}
          </div>
        </div>
      </div>

      {latest && (
        <div className="mt-5 rounded-2xl border border-workon-border bg-white px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-workon-ink">
                Dernier avis de {latest.reviewerName}
              </p>
              <p className="text-sm text-workon-muted">
                {formatDate(latest.createdAt)}
              </p>
            </div>
            <StarRating rating={latest.rating} label={`${latest.rating} sur 5`} />
          </div>
        </div>
      )}
    </article>
  );
}

function PendingReviewsPanel({
  pendingReviews,
  pendingError,
}: {
  pendingReviews: PendingReview[];
  pendingError: boolean;
}) {
  return (
    <article
      className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm sm:p-6"
      data-testid="pending-reviews-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-workon-primary">
            <MessageCircle className="h-4 w-4" />
            Avis a donner
          </p>
          <h2 className="text-xl font-bold text-workon-ink">
            Missions terminees
          </h2>
          <p className="mt-1 text-sm leading-6 text-workon-muted">
            Les evaluations rapides gardent la confiance visible des deux cotes.
          </p>
        </div>
        <Badge className="border-transparent bg-workon-primary text-white">
          {pendingReviews.length}
        </Badge>
      </div>

      {pendingError ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Impossible de charger les avis en attente pour l&apos;instant.
        </div>
      ) : pendingReviews.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-workon-trust-green" />
            <div>
              <p className="font-semibold text-workon-ink">Aucun avis en attente</p>
              <p className="mt-1 text-sm text-workon-muted">
                Tout est a jour pour tes missions terminees.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {pendingReviews.slice(0, 3).map((pending) => (
            <PendingReviewRow key={pending.missionId} pending={pending} />
          ))}
          {pendingReviews.length > 3 && (
            <p className="text-sm font-semibold text-workon-muted">
              + {pendingReviews.length - 3} autre{pendingReviews.length - 3 > 1 ? "s" : ""} mission{pendingReviews.length - 3 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function PendingReviewRow({ pending }: { pending: PendingReview }) {
  return (
    <Link
      href={`/missions/${pending.missionId}`}
      className="block rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/40 hover:bg-workon-bg-cream"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-workon-ink">
            {pending.missionTitle}
          </p>
          <p className="mt-1 text-sm text-workon-muted">
            {pending.counterpartName ?? "Partenaire WorkOn"} - {formatDate(pending.missionCompletedAt)}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-workon-primary" />
      </div>
    </Link>
  );
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const tone = getRatingTone(review.rating);
  const label = ratingLabels[review.rating] ?? `${review.rating} etoiles`;

  return (
    <article
      className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm transition hover:border-workon-primary/35 hover:shadow-md"
      data-testid="review-card"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={tone.badgeClassName}>
              {label}
            </Badge>
            <span className="text-xs font-semibold uppercase text-workon-muted">
              {formatDate(review.createdAt)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-workon-ink">
            {review.reviewerName}
          </h3>
        </div>
        <StarRating rating={review.rating} label={`${review.rating} sur 5`} />
      </div>

      {review.comment ? (
        <blockquote className="mt-4 rounded-2xl border border-workon-border bg-workon-bg-cream p-4 text-sm leading-6 text-workon-ink">
          &quot;{review.comment}&quot;
        </blockquote>
      ) : (
        <p className="mt-4 rounded-2xl border border-workon-border bg-workon-bg-cream p-4 text-sm text-workon-muted">
          Avis sans commentaire. La note reste conservee dans ton historique.
        </p>
      )}

      <QualityInsight rating={review.rating} />
    </article>
  );
}

function QualityInsight({ rating }: { rating: number }) {
  const positive = rating >= 4;
  const Icon = positive ? Sparkles : TriangleAlert;

  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-3 rounded-2xl border p-4",
        positive
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          positive ? "text-emerald-600" : "text-amber-700",
        )}
      />
      <div>
        <p className="font-semibold text-workon-ink">
          {positive ? "Signal de confiance" : "Point a suivre"}
        </p>
        <p className="text-sm leading-6 text-workon-muted">
          {positive
            ? "Cet avis peut rassurer le prochain client sur la qualite du service."
            : "Regarde les messages et la mission liee pour comprendre ce qui peut etre corrige."}
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-workon-bg-cream text-workon-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-workon-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-workon-ink">{value}</p>
      <p className="mt-1 text-xs text-workon-muted">{detail}</p>
    </div>
  );
}

function ErrorPanel({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
      <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-red-600" />
      <h1 className="text-2xl font-bold text-red-900">
        Impossible de charger les avis
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-700">
        La page garde les donnees existantes, mais le service des avis ne repond pas correctement pour l&apos;instant.
      </p>
      <Button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="mt-5"
      >
        <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        Reessayer
      </Button>
    </section>
  );
}

function getRatingTone(rating: number) {
  if (rating >= 4) {
    return {
      badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
    };
  }

  if (rating === 3) {
    return {
      badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
    };
  }

  return {
    badgeClassName: "border-red-200 bg-red-100 text-red-800",
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
