import Link from "next/link";
import { Star } from "lucide-react";
import { TrustPill, type TrustPillVariant } from "@/components/ui/trust-pill";
import type { FeaturedWorker } from "@/lib/public-api";
import { cn } from "@/lib/utils";

/**
 * HeroWorkerCard — large photo-first worker card matching the target
 * mockups ("hero worker cards with photos + trust pills + big red
 * Réserver CTA"). Designed for use on the landing hero and on
 * employer discovery surfaces.
 *
 * This is the promotional / conversion-oriented card. The dashboard
 * card in @/components/worker/worker-card.tsx stays the compact
 * card for authenticated surfaces.
 */

export interface HeroWorkerCardProps {
  worker: FeaturedWorker;
  /** Optional override for the trust pill variant. Otherwise derived
   *  from worker.trustTier. */
  trustVariant?: TrustPillVariant;
  className?: string;
}

function deriveTrustVariant(worker: FeaturedWorker): TrustPillVariant {
  const tier = worker.trustTier;
  if (tier === "PREMIUM") return "premium";
  if (tier === "TRUSTED") return "trusted";
  if (tier === "VERIFIED") return "verified";
  if ((worker.ratingCount ?? 0) === 0) return "nouveau";
  return "fiable";
}

export function HeroWorkerCard({
  worker,
  trustVariant,
  className,
}: HeroWorkerCardProps) {
  const initials =
    `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
  const variant = trustVariant ?? deriveTrustVariant(worker);
  const hasReviews = (worker.ratingCount ?? 0) > 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white border border-[#EAE6DF] shadow-card transition-all hover:-translate-y-1 hover:shadow-soft hover:border-[#134021]/30",
        className,
      )}
    >
      {/* Photo / avatar */}
      <div className="relative h-56 bg-gradient-to-br from-[#134021]/10 via-[#134021]/5 to-transparent">
        {worker.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={worker.photoUrl}
            alt={`${worker.firstName} ${worker.lastName[0] ?? ""}.`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-bold text-[#134021]/70">
              {initials}
            </span>
          </div>
        )}
        {/* Trust pill floating on photo */}
        <div className="absolute top-3 left-3">
          <TrustPill variant={variant} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[17px] text-[#1B1A18] truncate">
              {worker.firstName} {worker.lastName[0]}.
            </p>
            {worker.sector && (
              <p className="text-sm text-[#706E6A] truncate">{worker.sector}</p>
            )}
            {worker.city && (
              <p className="text-xs text-[#706E6A]/70 mt-0.5">
                📍 {worker.city}
              </p>
            )}
          </div>
          {hasReviews && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-bold text-[#1B1A18]">
                {worker.ratingAvg.toFixed(1)}
              </span>
              <span className="text-xs text-[#706E6A]">
                ({worker.ratingCount})
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-[#706E6A]">
            {worker.completedMissions} mission
            {worker.completedMissions !== 1 ? "s" : ""} complétée
            {worker.completedMissions !== 1 ? "s" : ""}
          </span>
          <Link
            href={`/p/${worker.slug}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#134021] hover:bg-[#0F3319] text-white text-sm font-semibold h-10 px-5 shadow-md shadow-[#134021]/25 transition-all group-hover:shadow-lg group-hover:shadow-[#134021]/35"
          >
            Réserver
          </Link>
        </div>
      </div>
    </div>
  );
}
