"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Brush,
  Clock3,
  CreditCard,
  Droplets,
  FileCheck,
  Leaf,
  MapPin,
  PackageCheck,
  Paintbrush,
  PlugZap,
  Rocket,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  trackMissionCardClick,
  type MissionCardSource,
} from "@/lib/analytics";

export type MissionCardInput = {
  id: string;
  title: string;
  category: string;
  city?: string;
  createdAt: string;
  description?: string;
  status?: string;
  price?: number;
  priceRange?: string;
  distanceKm?: number | null;
  isUrgent?: boolean;
  boostedUntil?: string | null;
  firstPhotoUrl?: string | null;
  offersCount?: number;
  durationMinutes?: number | null;
  materialProvided?: boolean | null;
};

export type MissionCardVariant = "client" | "pro";

interface MissionCardProps {
  mission: MissionCardInput;
  variant?: MissionCardVariant;
  href?: string;
  showCTA?: boolean;
  source?: MissionCardSource;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: {
    label: "Ouverte",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  assigned: {
    label: "Assignee",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  in_progress: {
    label: "En cours",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  completed: {
    label: "Terminee",
    color: "border-violet-200 bg-violet-50 text-violet-700",
  },
  paid: {
    label: "Payee",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "Annulee",
    color: "border-stone-200 bg-stone-50 text-stone-500",
  },
};

const categoryIcons: Record<string, LucideIcon> = {
  cleaning: Sparkles,
  menage: Sparkles,
  snow_removal: Snowflake,
  deneigement: Snowflake,
  moving: PackageCheck,
  handyman: Wrench,
  reparation: Wrench,
  gardening: Leaf,
  paysagement: Leaf,
  painting: Paintbrush,
  delivery: Truck,
  plumbing: Droplets,
  plomberie: Droplets,
  electrical: PlugZap,
  electricite: PlugZap,
  construction: Briefcase,
  "construction-legere": Wrench,
  lavage: Droplets,
  renovation: Brush,
  other: Briefcase,
};

const NEW_THRESHOLD_MS = 6 * 60 * 60 * 1000;

const categoryLabels: Record<string, string> = {
  cleaning: "Ménage",
  menage: "Ménage",
  snow_removal: "Déneigement",
  deneigement: "Déneigement",
  moving: "Déménagement",
  handyman: "Réparations",
  reparation: "Réparation",
  gardening: "Jardinage",
  paysagement: "Paysagement",
  painting: "Peinture",
  delivery: "Livraison",
  plumbing: "Plomberie",
  plomberie: "Plomberie",
  electrical: "Électricité",
  electricite: "Électricité",
  construction: "Construction",
  "construction-legere": "Construction légère",
  lavage: "Lavage",
  renovation: "Rénovation",
  other: "Autres services",
};

export function MissionCard({
  mission,
  variant = "pro",
  href,
  showCTA = true,
  source = "other",
  className,
}: MissionCardProps) {
  const [now] = useState(() => Date.now());
  const destination = href ?? `/missions/${mission.id}`;
  const createdAt = new Date(mission.createdAt);
  const ageMs = now - createdAt.getTime();
  const isNew = ageMs >= 0 && ageMs < NEW_THRESHOLD_MS;
  const isBoosted =
    !!mission.boostedUntil &&
    new Date(mission.boostedUntil).getTime() > now;
  const isUrgent = !!mission.isUrgent;
  const isCancelled = mission.status === "cancelled";
  const status = mission.status ? statusConfig[mission.status] : undefined;
  const Icon = categoryIcons[mission.category] ?? categoryIcons.other;
  const categoryLabel = formatCategoryLabel(mission.category);
  const hasPhoto = !!mission.firstPhotoUrl;
  const priceLabel = formatPriceLabel(mission.priceRange, mission.price);
  const ctaLabel = variant === "client" ? "Recevoir des offres" : "Postuler";
  const primaryTone = variant === "client" ? "copper" : "primary";

  const handleClick = (viaCTA: boolean) => () => {
    trackMissionCardClick({
      missionId: mission.id,
      variant,
      source,
      hasPhoto,
      viaCTA,
    });
  };

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[24px] border bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
        isUrgent
          ? "border-workon-copper/40"
          : isBoosted
            ? "border-workon-gold/40"
            : "border-workon-border",
        isCancelled && "opacity-65",
        className,
      )}
      data-testid="mission-card"
      data-variant={variant}
      data-urgent={isUrgent ? "true" : undefined}
      data-boosted={isBoosted ? "true" : undefined}
    >
      <Link
        href={destination}
        className="block p-4"
        data-testid="mission-card-body"
        onClick={handleClick(false)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {isUrgent && (
              <SignalBadge tone="urgent" icon={Zap}>
                Urgent
              </SignalBadge>
            )}
            {isNew && !isUrgent && (
              <SignalBadge tone="new" icon={Sparkles}>
                Nouveau
              </SignalBadge>
            )}
            {isBoosted && !isUrgent && !isNew && (
              <SignalBadge tone="boosted" icon={Rocket}>
                Top
              </SignalBadge>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-workon-primary-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-workon-primary">
              <Icon className="h-3 w-3" />
              {categoryLabel}
            </span>
            {status && (
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  status.color,
                )}
              >
                {status.label}
              </span>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-workon-stone">
              {variant === "pro" ? "Gain" : "Budget"}
            </p>
            <p className="font-heading text-xl font-bold leading-none text-workon-copper">
              {priceLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          {hasPhoto ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-workon-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mission.firstPhotoUrl!}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-workon-border bg-gradient-to-br from-workon-bg-cream to-workon-surface text-workon-primary">
              <Icon className="h-9 w-9" strokeWidth={1.8} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "line-clamp-2 text-base font-bold leading-snug text-workon-ink",
                isCancelled && "line-through",
              )}
              data-testid="mission-card-title"
            >
              {mission.title}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-workon-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-workon-copper" />
                {mission.city || "Ville a confirmer"}
              </span>
              {mission.distanceKm != null && (
                <span>a {mission.distanceKm.toFixed(1)} km</span>
              )}
            </p>
            {mission.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-workon-muted">
                {mission.description}
              </p>
            )}
          </div>
        </div>

        <div
          className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-workon-border bg-workon-bg"
          data-testid="mission-card-stats"
        >
          <Stat
            icon={CreditCard}
            label={variant === "pro" ? "Gain" : "Budget"}
            value={priceLabel}
            emphasis
          />
          <Stat
            icon={Clock3}
            label="Temps"
            value={formatDuration(mission.durationMinutes)}
          />
          <Stat
            icon={PackageCheck}
            label="Materiel"
            value={formatMaterial(mission.materialProvided)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-workon-stone">
            <ShieldCheck className="h-3.5 w-3.5 text-workon-trust-green" />
            Paiement sécurisé
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-workon-stone">
            <FileCheck className="h-3.5 w-3.5 text-workon-primary" />
            Contrat protégé
          </span>
          {mission.offersCount != null && mission.offersCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 font-bold text-workon-primary"
              data-testid="mission-card-social-proof"
            >
              <Users className="h-3.5 w-3.5" />
              {mission.offersCount} offre{mission.offersCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Link>

      {showCTA && !isCancelled && (
        <div className="border-t border-workon-border bg-white p-3">
          <Link
            href={destination}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white shadow-md transition-all active:translate-y-0.5",
              primaryTone === "primary"
                ? "bg-workon-primary shadow-workon-primary/20 hover:bg-workon-primary-hover"
                : "bg-workon-copper shadow-workon-copper/20 hover:bg-workon-copper-hover",
            )}
            data-testid="mission-card-cta"
            onClick={handleClick(true)}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="border-r border-workon-border px-2 py-3 text-center last:border-r-0">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-workon-stone" />
      <p className="text-[9px] font-bold uppercase tracking-wide text-workon-stone">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-bold leading-tight",
          emphasis ? "text-base text-workon-copper" : "text-sm text-workon-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SignalBadge({
  tone,
  icon: Icon,
  children,
}: {
  tone: "urgent" | "new" | "boosted";
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const styles =
    tone === "urgent"
      ? "bg-workon-accent-subtle text-workon-copper"
      : tone === "new"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-workon-gold/15 text-workon-gold";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        styles,
      )}
      data-testid={`mission-${tone}-badge`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "À préciser";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function formatMaterial(value: boolean | null | undefined): string {
  if (value == null) return "À préciser";
  return value ? "Fourni" : "Non fourni";
}

function formatCategoryLabel(value: string): string {
  if (!value) return "Autres services";
  if (categoryLabels[value]) return categoryLabels[value];

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriceLabel(priceRange?: string, price?: number): string {
  if (priceRange) {
    const trimmed = priceRange.trim();
    const dollarPrefix = trimmed.match(/^\$\s*(.+)$/);
    if (dollarPrefix) return `${dollarPrefix[1]} $`;
    return trimmed.replace(/\s*\$$/, " $");
  }
  if (price != null) return `${price} $`;
  return "À préciser";
}
