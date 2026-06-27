import Link from "next/link";
import { Star, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { TrustTierBadge } from "@/components/worker/trust-tier-badge";
import type { FeaturedWorker } from "@/lib/public-api";
import { cn } from "@/lib/utils";

/**
 * HeroWorkerCard — carte pro orientée conversion (RedPhone).
 *
 * Met en avant les signaux de réassurance déjà présents dans le modèle
 * WorkOn : niveau de confiance (Trust Tier), note + nombre d'avis,
 * disponibilité, expérience (missions réalisées), compétences et tarif.
 * Toute la carte est cliquable vers le profil public `/p/[slug]` pour
 * maximiser le taux de clic.
 */

export interface HeroWorkerCardProps {
  worker: FeaturedWorker;
  className?: string;
}

export function HeroWorkerCard({ worker, className }: HeroWorkerCardProps) {
  const initials =
    `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
  const hasReviews = (worker.ratingCount ?? 0) > 0;
  const isAvailable = (worker.availabilityPreview?.length ?? 0) > 0;
  const role = worker.jobTitle || worker.sector;
  const skills = worker.skills?.slice(0, 2) ?? [];

  return (
    <Link
      href={`/p/${worker.slug}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-[0_1px_2px_rgba(14,27,42,0.04),0_10px_28px_-14px_rgba(14,27,42,0.12)] transition-all hover:-translate-y-1 hover:border-workon-primary/40 hover:shadow-[0_20px_44px_-18px_rgba(14,27,42,0.22)]",
        className,
      )}
    >
      {/* Identité */}
      <div className="flex items-start gap-3.5">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl">
          {worker.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worker.photoUrl}
              alt={`${worker.firstName} ${worker.lastName?.[0] ?? ""}.`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#13273D] to-workon-surface-dark text-lg font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-workon-ink">
            {worker.firstName} {worker.lastName?.[0]}.
          </p>
          {role && <p className="truncate text-[13px] text-workon-gray">{role}</p>}
          {worker.city && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-workon-muted">
              <MapPin className="h-3 w-3" /> {worker.city}
            </p>
          )}
        </div>
        <TrustTierBadge tier={worker.trustTier} compact />
      </div>

      {/* Réassurance : note + disponibilité */}
      <div className="mt-4 flex items-center gap-2">
        {hasReviews ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F8FB] px-2.5 py-1 text-[12px] font-medium text-workon-ink">
            <Star className="h-3.5 w-3.5 fill-[#F6C84C] text-[#F6C84C]" />
            {worker.ratingAvg.toFixed(1)}
            <span className="text-workon-muted">({worker.ratingCount})</span>
          </span>
        ) : (
          <span className="rounded-full bg-[#EAF1FF] px-2.5 py-1 text-[12px] font-medium text-[#1E6FE0]">
            Nouveau pro
          </span>
        )}
        {isAvailable && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34D27B]/[0.12] px-2.5 py-1 text-[12px] font-medium text-[#1E9E5A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34D27B]" /> Disponible
          </span>
        )}
      </div>

      {/* Compétences */}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s.id}
              className="rounded-md border border-[#E6EAF0] bg-[#F6F8FB] px-2 py-0.5 text-[11.5px] text-workon-gray"
            >
              {s.labelFr}
            </span>
          ))}
        </div>
      )}

      {/* Expérience + tarif */}
      <div className="mt-4 flex items-center justify-between border-t border-workon-bg-cream pt-4 text-[13px]">
        <span className="inline-flex items-center gap-1.5 text-workon-gray">
          <CheckCircle2 className="h-4 w-4 text-[#2BA968]" />
          {worker.completedMissions} mission{worker.completedMissions !== 1 ? "s" : ""} réalisée{worker.completedMissions !== 1 ? "s" : ""}
        </span>
        {worker.hourlyRate != null && (
          <span className="font-semibold text-workon-ink">dès {worker.hourlyRate} $/h</span>
        )}
      </div>

      {/* CTA */}
      <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-workon-primary py-3 text-[14px] font-medium text-white transition-colors group-hover:bg-workon-primary-hover">
        Voir le profil <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
