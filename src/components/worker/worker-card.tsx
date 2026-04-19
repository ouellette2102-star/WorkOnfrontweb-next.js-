"use client";

import Link from "next/link";
import { Star, CalendarDays, MapPin, CheckCircle, Briefcase } from "lucide-react";
import type { WorkerProfile } from "@/lib/api-client";
import { TrustPill } from "@/components/ui/trust-pill";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { TrustTierBadge } from "@/components/worker/trust-tier-badge";
import { ContactWorkerButton } from "@/components/worker/contact-worker-button";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  /** Compact variant is denser (one photo-row header) and fits in carousels. */
  compact?: boolean;
}

/**
 * Worker card used on home, search, carousels.
 *
 * Both variants share the same information hierarchy:
 *   1. Photo (or colored initials fallback) + Trust Tier overlay
 *   2. Name, category, city, missions count
 *   3. Rating (or "Nouveau") pill
 *   4. Hourly rate — "À partir de X $/h" — when available
 *   5. Portfolio thumbs (up to 3) — only when data present
 *   6. Contacter (accent) + Réserver (outline) CTAs
 *
 * Root is <article>, not <Link>, so the CTAs actually fire instead of being
 * swallowed by outer navigation (nested <a> is invalid HTML).
 */
export function WorkerCard({ worker, compact }: WorkerCardProps) {
  const hasReviews = (worker.reviewCount ?? 0) > 0;
  const displayName = worker.fullName || `${worker.firstName} ${worker.lastName}`;
  const profileHref = `/worker/${worker.id}`;
  const portfolio = (worker.portfolioPhotos ?? []).slice(0, 3);

  return (
    <article
      className={cn(
        "rounded-2xl border border-workon-border bg-white overflow-hidden transition-all hover:border-workon-primary/30 hover:shadow-md shadow-sm",
        compact ? "p-3 space-y-2.5" : "p-0",
      )}
    >
      {/* Photo — open profile on click. Large variant: full-width 12rem.
          Compact variant: 80px square on the left, header next to it. */}
      {compact ? (
        <div className="flex items-start gap-3">
          <Link href={profileHref} className="relative shrink-0 block">
            {worker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={worker.photoUrl}
                alt={displayName}
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <AvatarFallback
                firstName={worker.firstName}
                lastName={worker.lastName}
                size="xl"
                className="!rounded-xl"
              />
            )}
            {worker.trustTier && worker.trustTier !== "BASIC" && (
              <div className="absolute -top-1 -right-1">
                <TrustTierBadge tier={worker.trustTier} compact />
              </div>
            )}
          </Link>

          <Link
            href={profileHref}
            className="min-w-0 flex-1 block hover:text-workon-primary transition-colors"
          >
            <h3 className="font-semibold text-base text-workon-ink truncate">
              {worker.firstName} {worker.lastName}
            </h3>
            {(worker.jobTitle || worker.category) && (
              <p className="text-xs text-workon-muted truncate mt-0.5">
                {worker.jobTitle || worker.category}
              </p>
            )}
            <div className="mt-1.5">
              {hasReviews ? (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-workon-ink">
                    {worker.averageRating.toFixed(1)}
                  </span>
                  <span className="text-workon-muted">({worker.reviewCount})</span>
                </div>
              ) : (
                <TrustPill variant="nouveau" className="!text-[10px] !px-2 !py-0.5" />
              )}
            </div>
          </Link>
        </div>
      ) : (
        <Link href={profileHref} className="block relative h-48 bg-workon-bg">
          {worker.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worker.photoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <AvatarFallback
                firstName={worker.firstName}
                lastName={worker.lastName}
                size="xl"
                className="!h-24 !w-24 !text-3xl"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
          {worker.category && (
            <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#C96646]/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              {worker.category}
            </span>
          )}
          {worker.trustTier && worker.trustTier !== "BASIC" && (
            <div className="absolute top-3 right-3">
              <TrustTierBadge tier={worker.trustTier} />
            </div>
          )}
        </Link>
      )}

      <div className={cn(compact ? "space-y-2" : "p-4 space-y-2")}>
        {!compact && (
          <>
            <Link href={profileHref} className="block hover:text-workon-primary transition-colors">
              <h3 className="font-semibold text-base text-workon-ink">
                {worker.firstName} {worker.lastName}
              </h3>
              {worker.jobTitle && (
                <p className="text-sm text-workon-muted">{worker.jobTitle}</p>
              )}
            </Link>

            <div className="flex flex-wrap items-center gap-2 text-xs text-workon-muted">
              {worker.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {worker.city}
                </span>
              )}
              {worker.completedMissions > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-workon-primary" />
                  {worker.completedMissions} mission{worker.completedMissions > 1 ? "s" : ""}
                </span>
              )}
            </div>

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
          </>
        )}

        {compact && (worker.city || worker.completedMissions > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-workon-muted">
            {worker.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {worker.city}
              </span>
            )}
            {worker.completedMissions > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-workon-primary" />
                {worker.completedMissions} mission{worker.completedMissions > 1 ? "s" : ""}
              </span>
            )}
            {compact && worker.category && !worker.city && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {worker.category}
              </span>
            )}
          </div>
        )}

        {worker.hourlyRate != null && worker.hourlyRate > 0 && (
          <p className="text-xs font-semibold text-workon-ink">
            À partir de {worker.hourlyRate} $/h
          </p>
        )}

        {portfolio.length > 0 && (
          <div className="flex gap-1.5">
            {portfolio.map((url, i) => (
              <Link
                key={`${worker.id}-thumb-${i}`}
                href={profileHref}
                className="relative flex-1 aspect-square overflow-hidden rounded-md bg-workon-bg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Réalisation ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </Link>
            ))}
          </div>
        )}

        <ContactWorkerButton
          workerId={worker.id}
          workerFirstName={worker.firstName}
          workerCategory={worker.category}
          workerCity={worker.city}
        />

        <Link
          href={`/reserve/${worker.id}`}
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-workon-primary text-workon-primary text-sm font-medium py-2 hover:bg-workon-primary/5 transition-colors"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Réserver
        </Link>
      </div>
    </article>
  );
}
