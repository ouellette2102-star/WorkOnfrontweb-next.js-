"use client";

import Link from "next/link";
import { Star, Shield, CalendarDays, MapPin, User, CheckCircle, Briefcase } from "lucide-react";
import type { WorkerProfile } from "@/lib/api-client";
import { TrustPill } from "@/components/ui/trust-pill";
import { ContactWorkerButton } from "@/components/worker/contact-worker-button";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  compact?: boolean;
}

export function WorkerCard({ worker, compact }: WorkerCardProps) {
  const hasReviews = (worker.reviewCount ?? 0) > 0;
  const displayName = worker.fullName || `${worker.firstName} ${worker.lastName}`;

  return (
    <Link
      href={`/worker/${worker.id}`}
      className={cn(
        "block rounded-2xl border border-workon-border bg-white overflow-hidden transition-all hover:border-workon-primary/30 hover:shadow-md shadow-sm",
        compact ? "p-3" : "p-0",
      )}
    >
      {/* Photo — show default avatar if no photo */}
      {!compact && (
        <div className="relative h-48 bg-workon-bg">
          {worker.photoUrl ? (
            <img
              src={worker.photoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-workon-primary/10">
                <User className="h-10 w-10 text-workon-primary/40" />
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          {/* Category badge overlay */}
          {worker.category && (
            <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#C96646]/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              {worker.category}
            </span>
          )}
        </div>
      )}

      <div className={cn("space-y-2", compact ? "" : "p-4")}>
        {/* Name + Job title */}
        <div>
          <h3 className="font-semibold text-base text-workon-ink">
            {worker.firstName} {worker.lastName}
          </h3>
          {worker.jobTitle && (
            <p className="text-sm text-workon-muted">{worker.jobTitle}</p>
          )}
          {compact && worker.category && !worker.jobTitle && (
            <p className="text-sm text-workon-muted">{worker.category}</p>
          )}
        </div>

        {/* Trust signals row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City */}
          {worker.city && (
            <span className="flex items-center gap-1 text-xs text-workon-muted">
              <MapPin className="h-3 w-3" />
              {worker.city}
            </span>
          )}

          {/* Completed missions */}
          {worker.completedMissions > 0 && (
            <span className="flex items-center gap-1 text-xs text-workon-muted">
              <CheckCircle className="h-3 w-3 text-workon-primary" />
              {worker.completedMissions} mission{worker.completedMissions > 1 ? "s" : ""}
            </span>
          )}

          {/* Compact category pill */}
          {compact && worker.category && (
            <span className="inline-flex items-center rounded-full bg-[#C96646]/10 px-2 py-0.5 text-xs font-medium text-[#C96646]">
              <Briefcase className="h-3 w-3 mr-1" />
              {worker.category}
            </span>
          )}
        </div>

        {/* Rating — honest: stars only if there are reviews, else a neutral pill */}
        {hasReviews ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.round(worker.averageRating)
                      ? "fill-yellow-500 text-yellow-500"
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

        {/* Badges — including trust tier */}
        {worker.badges && worker.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.badges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1 rounded-full bg-workon-primary/10 px-2.5 py-0.5 text-xs font-medium text-[#134021]"
              >
                <Shield className="h-3 w-3 text-[#134021]" />
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* Primary CTA: Contacter */}
        <ContactWorkerButton
          workerId={worker.id}
          workerFirstName={worker.firstName}
          workerCategory={worker.category}
          workerCity={worker.city}
        />

        {/* Secondary CTA: Réserver */}
        <Link
          href={`/reserve/${worker.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-workon-primary text-workon-primary text-sm font-medium py-2 hover:bg-workon-primary/5 transition-colors"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Réserver
        </Link>
      </div>
    </Link>
  );
}
