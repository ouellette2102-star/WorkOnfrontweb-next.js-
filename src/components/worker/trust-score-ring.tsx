"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";

interface TrustScoreRingProps {
  size?: number;
  label?: string;
  compact?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  BASIC: "Basique",
  VERIFIED: "Verifie",
  TRUSTED: "Fiable",
  PREMIUM: "Premium",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#134021";
  if (score >= 60) return "#D4922A";
  return "#C96646";
}

export function TrustScoreRing({ size = 120, label, compact = false }: TrustScoreRingProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [animatedScore, setAnimatedScore] = useState(0);

  const { data: verification, isLoading: verLoading } = useQuery({
    queryKey: ["verification-status"],
    queryFn: () => api.getVerificationStatus(),
    enabled: !authLoading && !!user,
  });

  const { data: reviews, isLoading: revLoading } = useQuery({
    queryKey: ["review-summary", user?.id],
    queryFn: () => api.getReviewSummary(user!.id),
    enabled: !authLoading && !!user,
  });

  // Calculate trust score: averageRating (60%) + completedMissions proxy (40%)
  const score = (() => {
    if (!reviews && !verification) return 0;
    // Rating component: averageRating out of 5, normalized to 0-100, weighted 60%
    const ratingScore = reviews?.averageRating
      ? (reviews.averageRating / 5) * 100 * 0.6
      : 0;
    // Completion component: use totalReviews as proxy for completed missions
    // Cap at 20 missions for full score, weighted 40%
    const completionScore = reviews?.totalReviews
      ? Math.min(reviews.totalReviews / 20, 1) * 100 * 0.4
      : 0;
    return Math.round(ratingScore + completionScore);
  })();

  const hasData = (reviews?.totalReviews ?? 0) > 0;
  const tierLabel = verification?.trustTier
    ? TIER_LABELS[verification.trustTier] || verification.trustTier
    : "Nouveau";

  // Animate score on change
  useEffect(() => {
    if (score === 0) {
      setAnimatedScore(0);
      return;
    }
    let frame: number;
    const duration = 800;
    const start = performance.now();
    const from = animatedScore;
    const to = score;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const isLoading = authLoading || verLoading || revLoading;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center animate-pulse"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-[#EAE6DF]"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * animatedScore) / 100;
  const color = getScoreColor(score);
  const center = size / 2;
  const fontSize = compact ? size * 0.3 : size * 0.28;
  const subFontSize = compact ? size * 0.1 : size * 0.11;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#EAE6DF"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading font-black text-[#1B1A18] leading-none"
            style={{ fontSize }}
          >
            {hasData ? animatedScore : "—"}
          </span>
          {!compact && (
            <span
              className="text-[#706E6A] leading-none mt-0.5"
              style={{ fontSize: subFontSize }}
            >
              {hasData ? "/ 100" : "Nouveau"}
            </span>
          )}
        </div>
      </div>
      {/* Tier label below ring */}
      {!compact && (
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {label || tierLabel}
        </span>
      )}
    </div>
  );
}
