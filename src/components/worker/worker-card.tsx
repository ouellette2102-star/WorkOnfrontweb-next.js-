"use client";

import Link from "next/link";
import { Star, Shield } from "lucide-react";
import type { WorkerProfile } from "@/lib/api-client";
import { TrustPill } from "@/components/ui/trust-pill";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  compact?: boolean;
}

export function WorkerCard({ worker, compact }: WorkerCardProps) {
  const hasReviews = (worker.reviewCount ?? 0) > 0;

  return (
    <Link
      href={`/worker/${worker.id}`}
      className={cn(
        "block rounded-2xl border border-workon-border bg-white overflow-hidden transition-all hover:border-workon-primary/30 hover:shadow-md shadow-sm",
        compact ? "p-3" : "p-0",
      )}
    >
      {/* Photo */}
      {!compact && worker.photoUrl && (
        <div className="relative h-48 bg-workon-bg">
          <img
            src={worker.photoUrl}
            alt={worker.fullName || `${worker.firstName} ${worker.lastName}`}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
        </div>
      )}

      <div className={cn("space-y-2", compact ? "" : "p-4")}>
        {/* Name + Rating */}
        <div>
          <h3 className="font-semibold text-base text-workon-ink">
            {worker.firstName} {worker.lastName}
          </h3>
          {worker.jobTitle && (
            <p className="text-sm text-workon-muted">{worker.jobTitle}</p>
          )}
          {worker.city && (
            <p className="text-xs text-workon-muted">{worker.city}</p>
          )}
        </div>

        {/* Rating — honest: stars only if there are reviews, else a neutral pill */}
        {hasReviews ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.round(worker.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200",
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-workon-ink">
              {worker.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-workon-muted">
              ({worker.reviewCount} avis)
            </span>
          </div>
        ) : (
          <TrustPill variant="nouveau" />
        )}

        {/* Badges */}
        {worker.badges && worker.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.badges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1 rounded-full bg-workon-bg px-2.5 py-0.5 text-xs font-medium text-workon-ink"
              >
                <Shield className="h-3 w-3 text-workon-primary" />
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
