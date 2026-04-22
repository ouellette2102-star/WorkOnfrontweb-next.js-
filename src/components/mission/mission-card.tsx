"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Zap,
  Rocket,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Loose input shape accepted by the shared card. Compatible with both
 * `MissionResponse` (authenticated API) and `PublicMission` (public
 * feed) without forcing either to be converted at the call site.
 */
export type MissionCardInput = {
  id: string;
  title: string;
  category: string;
  city: string;
  createdAt: string;
  description?: string;
  status?: string;
  /** Price as number — `MissionResponse.price` (CAD, before tax). */
  price?: number;
  /** Pre-formatted range — `PublicMission.priceRange` (e.g. "$80–$120"). */
  priceRange?: string;
  /** Straight-line distance in km from the viewer (authenticated only). */
  distanceKm?: number | null;
  /** Active URGENT_9 boost window — public feed flag. */
  isUrgent?: boolean;
  /** Active TOP_48H boost window — public feed flag. */
  boostedUntil?: string | null;
};

/**
 * Card persona. `pro` = worker browsing available work (green CTA
 * "Postuler"). `client` = owner viewing their own request (accent CTA
 * "Recevoir des offres").
 */
export type MissionCardVariant = "client" | "pro";

interface MissionCardProps {
  mission: MissionCardInput;
  variant?: MissionCardVariant;
  /** Override destination. Defaults to `/missions/{id}`. */
  href?: string;
  /** Hide the bottom CTA (e.g. inside a parent link or recap list). */
  showCTA?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Visual lookup tables                                               */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouverte",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  assigned:    { label: "Assignée", color: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { label: "En cours", color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed:   { label: "Terminée", color: "bg-purple-50 text-purple-700 border-purple-200" },
  paid:        { label: "Payée",    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:   { label: "Annulée",  color: "bg-gray-50 text-gray-400 border-gray-200" },
};

const categoryIcons: Record<string, string> = {
  cleaning: "🧹",
  snow_removal: "❄️",
  moving: "📦",
  handyman: "🔧",
  gardening: "🌿",
  painting: "🎨",
  delivery: "🚚",
  plumbing: "🚰",
  electrical: "⚡",
  other: "⚡",
};

/** Warm gradient lookup per category — placeholder until PR B ships real photos. */
const categoryGradients: Record<string, string> = {
  cleaning:     "from-sky-100 to-sky-200",
  snow_removal: "from-slate-100 to-blue-200",
  moving:       "from-orange-100 to-amber-200",
  handyman:     "from-amber-100 to-orange-200",
  gardening:    "from-emerald-100 to-lime-200",
  painting:     "from-pink-100 to-rose-200",
  delivery:     "from-indigo-100 to-sky-200",
  plumbing:     "from-cyan-100 to-blue-200",
  electrical:   "from-yellow-100 to-amber-200",
  other:        "from-stone-100 to-stone-200",
};

/** Under 6h = "NOUVEAU". */
const NEW_THRESHOLD_MS = 6 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MissionCard({
  mission,
  variant = "pro",
  href,
  showCTA = true,
  className,
}: MissionCardProps) {
  // Freeze "now" at first render so the card stays idempotent on re-renders.
  const [now] = useState(() => Date.now());

  const isCancelled = mission.status === "cancelled";
  const createdAt = new Date(mission.createdAt);
  const ageMs = now - createdAt.getTime();
  const isNew = ageMs >= 0 && ageMs < NEW_THRESHOLD_MS;
  const isBoosted =
    !!mission.boostedUntil &&
    new Date(mission.boostedUntil).getTime() > now;
  const isUrgent = !!mission.isUrgent;

  const status = mission.status ? statusConfig[mission.status] : undefined;
  const icon = categoryIcons[mission.category] ?? "⚡";
  const gradient = categoryGradients[mission.category] ?? categoryGradients.other;

  const priceLabel =
    mission.priceRange ??
    (mission.price != null ? `${mission.price}$` : null);

  const destination = href ?? `/missions/${mission.id}`;

  const ctaLabel = variant === "client" ? "Recevoir des offres" : "Postuler";
  const ctaStyles =
    variant === "client"
      ? "bg-workon-accent text-white hover:bg-workon-accent-hover shadow-[0_4px_12px_rgba(201,102,70,0.35)]"
      : "bg-workon-primary text-white hover:bg-workon-primary-hover shadow-[0_4px_12px_rgba(19,64,33,0.35)]";

  // Border accent follows the strongest signal: urgent > boosted > variant.
  const borderAccent = isUrgent
    ? "border-amber-300 hover:border-amber-400"
    : isBoosted
      ? "border-blue-300 hover:border-blue-400"
      : variant === "client"
        ? "border-workon-border hover:border-workon-accent/40"
        : "border-workon-border hover:border-workon-primary/40";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
        borderAccent,
        isCancelled && "opacity-60",
        className,
      )}
      data-testid="mission-card"
      data-variant={variant}
      data-urgent={isUrgent ? "true" : undefined}
      data-boosted={isBoosted ? "true" : undefined}
    >
      <Link
        href={destination}
        className="flex flex-1 flex-col gap-3 p-4"
        data-testid="mission-card-body"
      >
        {/* Top signals row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isUrgent && (
            <Badge tone="urgent" icon={<Zap className="h-3 w-3" />}>
              Urgent
            </Badge>
          )}
          {isNew && !isUrgent && (
            <Badge tone="new" icon={<Sparkles className="h-3 w-3" />}>
              Nouveau
            </Badge>
          )}
          {isBoosted && !isUrgent && !isNew && (
            <Badge tone="boosted" icon={<Rocket className="h-3 w-3" />}>
              Top
            </Badge>
          )}
          <span
            className="inline-flex items-center rounded-full bg-workon-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-workon-primary"
            data-testid="mission-category-chip"
          >
            {mission.category}
          </span>
          {status && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                status.color,
              )}
            >
              {status.label}
            </span>
          )}
        </div>

        {/* Hero row: icon tile + title */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl sm:h-16 sm:w-16 sm:text-3xl",
              gradient,
            )}
            aria-hidden
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "line-clamp-2 text-base font-semibold leading-snug text-workon-ink sm:text-lg",
                isCancelled && "line-through",
              )}
              data-testid="mission-card-title"
            >
              {mission.title}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-workon-muted">
              <MapPin className="h-3 w-3" />
              {mission.city}
            </p>
          </div>
        </div>

        {/* Budget hero — the single most important signal on the card */}
        {priceLabel && (
          <div
            className="flex items-end justify-between gap-2 rounded-xl border border-workon-border/70 bg-gradient-to-br from-workon-bg to-white px-3 py-2.5"
            data-testid="mission-card-budget"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-workon-muted">
                {variant === "pro" ? "Gain potentiel" : "Estimation"}
              </p>
              <p className="text-2xl font-extrabold leading-none text-workon-accent sm:text-3xl">
                {priceLabel}
              </p>
            </div>
            {mission.distanceKm != null && (
              <div className="flex flex-col items-end text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-workon-muted">
                  Distance
                </p>
                <p className="text-base font-bold text-workon-ink sm:text-lg">
                  {mission.distanceKm.toFixed(1)} km
                </p>
              </div>
            )}
          </div>
        )}

        {/* Description snippet — small, greyed, only if present */}
        {mission.description && (
          <p className="line-clamp-2 text-xs text-workon-muted">
            {mission.description}
          </p>
        )}
      </Link>

      {/* Inline CTA — big, shadowed, full-bleed on mobile */}
      {showCTA && !isCancelled && (
        <div className="border-t border-workon-border/70 bg-white p-3">
          <Link
            href={destination}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all active:translate-y-0.5 sm:h-12 sm:text-base",
              ctaStyles,
            )}
            data-testid="mission-card-cta"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function Badge({
  tone,
  icon,
  children,
}: {
  tone: "urgent" | "new" | "boosted";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles =
    tone === "urgent"
      ? "bg-amber-100 text-amber-800"
      : tone === "new"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-blue-100 text-blue-800";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles,
      )}
      data-testid={`mission-${tone}-badge`}
    >
      {icon}
      {children}
    </span>
  );
}
