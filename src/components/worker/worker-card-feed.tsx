"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Quote,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";

// Backend dayOfWeek convention: 0=Sunday, 1=Monday, ..., 6=Saturday.
const DAY_LABELS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
import type { WorkerProfile } from "@/lib/api-client";
import { TrustPill } from "@/components/ui/trust-pill";
import { ContactWorkerButton } from "@/components/worker/contact-worker-button";
import { cn } from "@/lib/utils";

interface WorkerCardFeedProps {
  worker: WorkerProfile;
  className?: string;
}

function deriveTrustPillVariant(worker: WorkerProfile) {
  const tier = worker.trustTier;
  if (tier === "PREMIUM") return "premium";
  if (tier === "TRUSTED") return "trusted";
  if (tier === "VERIFIED") return "verified";
  if ((worker.reviewCount ?? 0) === 0) return "nouveau";
  return "fiable";
}

/**
 * WorkerCardFeed — hybrid card for single-column vertical feed (home "Autour de toi").
 *
 * Always visible (conversion-optimized top fold):
 *   hero photo · name+metier · rating · tarif · primary CTA
 *
 * Collapsed behind "Voir détails ↓" accordion (opt-in depth):
 *   pourquoi choisir · contacter · avis · portfolio · footer légal
 *
 * Same data shape as WorkerCard — no backend change.
 */
export function WorkerCardFeed({ worker, className }: WorkerCardFeedProps) {
  const hasReviews = (worker.reviewCount ?? 0) > 0;
  const portfolio = (worker.portfolioPhotos ?? []).slice(0, 3);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const profileHref = `/worker/${worker.id}`;

  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) =>
      i != null ? (i - 1 + portfolio.length) % portfolio.length : null,
    );
  const next = () =>
    setLightboxIndex((i) =>
      i != null ? (i + 1) % portfolio.length : null,
    );

  const initials =
    `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
  const trustVariant = deriveTrustPillVariant(worker);

  return (
    <>
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={closeLightbox}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portfolio[lightboxIndex]}
            alt={`Réalisation ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="h-7 w-7" />
          </button>
          {portfolio.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 text-white/80 hover:text-white"
              >
                <ChevronLeft className="h-9 w-9" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 text-white/80 hover:text-white"
              >
                <ChevronRight className="h-9 w-9" />
              </button>
            </>
          )}
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {portfolio.length}
          </div>
        </div>
      )}

      <article
        className={cn(
          "rounded-2xl bg-white border border-workon-border shadow-sm overflow-hidden",
          className,
        )}
      >
        {/* 1. Photo hero — always visible */}
        <Link
          href={profileHref}
          className="block relative h-64 bg-gradient-to-br from-workon-primary/20 to-workon-primary/40"
        >
          {worker.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worker.photoUrl}
              alt={`${worker.firstName} ${worker.lastName}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl font-bold text-workon-primary/60 select-none">
                {initials}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3">
            <TrustPill variant={trustVariant} />
          </div>
          {worker.completionPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-bold text-white">
              {worker.completionPercentage}%
            </div>
          )}
        </Link>

        <div className="p-4 space-y-3">
          {/* 2. Nom + métier + ville */}
          <div>
            <Link href={profileHref}>
              <h3 className="font-bold text-lg text-workon-ink leading-tight">
                {worker.firstName} {worker.lastName}
              </h3>
            </Link>
            <p className="text-sm text-workon-muted mt-0.5 flex items-center gap-1 flex-wrap">
              {worker.jobTitle || worker.category || "Professionnel"}
              {worker.city && (
                <>
                  <span className="text-workon-border">·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {worker.city}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* 3. Étoiles + avis + missions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(worker.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-200 fill-gray-200",
                  )}
                />
              ))}
            </div>
            {hasReviews && (
              <span className="text-sm font-semibold text-workon-ink">
                {worker.averageRating.toFixed(1)}
              </span>
            )}
            <span className="text-xs text-workon-muted">
              {hasReviews ? `(${worker.reviewCount} avis)` : "Nouveau"}
            </span>
            {worker.completedMissions > 0 && (
              <span className="text-xs text-workon-muted">
                · {worker.completedMissions} mission
                {worker.completedMissions > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* 4. Badges + tarif */}
          {((worker.badges ?? []).length > 0 ||
            (worker.hourlyRate ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {(worker.badges ?? []).map((b) => (
                <span
                  key={b.type}
                  className="inline-flex items-center rounded-full border border-workon-border bg-workon-bg px-2.5 py-1 text-[11px] font-medium text-workon-ink"
                >
                  {b.label}
                </span>
              ))}
              {(worker.hourlyRate ?? 0) > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-workon-primary/10 px-2.5 py-1 text-[11px] font-semibold text-workon-primary"
                  title="Tarif horaire avant taxes TPS/TVQ"
                >
                  À partir de {worker.hourlyRate} $/h
                  <span className="ml-1 text-[9px] font-normal text-workon-primary/70">
                    (avant taxes)
                  </span>
                </span>
              )}
            </div>
          )}

          {/* 5. Primary CTA — always visible */}
          <Link
            href={`/reserve/${worker.id}`}
            className="flex items-center justify-center w-full rounded-xl bg-workon-primary text-white text-sm font-bold py-3 shadow-md shadow-workon-primary/25 hover:bg-workon-primary/90 transition-colors"
          >
            Réserver
          </Link>

          {/* 6. Accordéon "Voir détails" */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex items-center justify-center w-full gap-1.5 py-2 text-xs font-medium text-workon-muted hover:text-workon-ink transition-colors"
          >
            {expanded ? "Masquer les détails" : "Voir les détails"}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>

          {expanded && (
            <div className="space-y-3 pt-1">
              {/* Bio — public description set in /profile */}
              {worker.bio && worker.bio.trim().length > 0 && (
                <div className="rounded-xl bg-white border border-workon-border p-3">
                  <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-1.5">
                    À propos
                  </p>
                  <p className="text-xs text-workon-ink leading-relaxed whitespace-pre-line">
                    {worker.bio}
                  </p>
                </div>
              )}

              {/* Skills — from LocalUser.skills joined with catalog */}
              {(worker.skills ?? []).length > 0 && (
                <div className="rounded-xl bg-white border border-workon-border p-3">
                  <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-workon-primary" />
                    Compétences
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(worker.skills ?? []).slice(0, 8).map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center rounded-full bg-workon-primary/8 border border-workon-primary/20 px-2 py-0.5 text-[11px] font-medium text-workon-primary"
                      >
                        {s.labelFr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability preview — recurring weekly slots */}
              {(worker.availabilityPreview ?? []).length > 0 && (
                <div className="rounded-xl bg-white border border-workon-border p-3">
                  <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-workon-primary" />
                    Disponibilités
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(worker.availabilityPreview ?? []).slice(0, 4).map((slot, i) => (
                      <span
                        key={`${slot.dayOfWeek}-${slot.startTime}-${i}`}
                        className="inline-flex items-center rounded-full bg-workon-bg border border-workon-border px-2 py-0.5 text-[11px] font-medium text-workon-ink"
                      >
                        {DAY_LABELS_SHORT[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pourquoi choisir */}
              <div className="rounded-xl bg-workon-bg border border-workon-border p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2">
                  Pourquoi choisir {worker.firstName} ?
                </p>
                {[
                  "Identité vérifiée",
                  "Assurances & conformité",
                  "Contrat sécurisé WorkOn",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-workon-ink"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-workon-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Secondary CTA Contacter */}
              <ContactWorkerButton
                workerId={worker.id}
                workerFirstName={worker.firstName}
                workerCategory={worker.category}
                workerCity={worker.city}
              />

              {/* Avis */}
              {(worker.reviewCount ?? 0) > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide">
                      Avis clients
                    </p>
                    <Link
                      href={`/worker/${worker.id}#reviews`}
                      className="text-[11px] text-workon-primary hover:underline"
                    >
                      Voir tous
                    </Link>
                  </div>
                  <div className="rounded-xl border border-workon-border bg-workon-bg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < Math.round(worker.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200 fill-gray-200",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-workon-ink">
                        {worker.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-workon-muted">
                        ({worker.reviewCount} avis)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Quote className="h-3.5 w-3.5 text-workon-primary/40 shrink-0 mt-0.5" />
                      <p className="text-xs text-workon-muted italic leading-relaxed">
                        {worker.reviewCount === 1
                          ? "1 client a laissé un avis positif."
                          : `${worker.reviewCount} clients ont laissé des avis positifs.`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-workon-border bg-workon-bg/50 p-3 text-center">
                  <p className="text-xs text-workon-muted">
                    Aucun avis pour le moment
                  </p>
                  <p className="text-[10px] text-workon-muted/60 mt-0.5">
                    Soyez le premier à travailler avec {worker.firstName}
                  </p>
                </div>
              )}

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-workon-muted uppercase tracking-wide mb-2">
                    Réalisations
                  </p>
                  <div className="flex gap-1.5">
                    {portfolio.map((url, i) => (
                      <button
                        key={`${worker.id}-${i}`}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="relative flex-1 aspect-square overflow-hidden rounded-lg bg-workon-bg group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Réalisation ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer légal */}
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-workon-muted border-t border-workon-border">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                Paiement sécurisé par Stripe · WorkOn n&apos;est pas partie au
                contrat de service
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
