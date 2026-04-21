"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Zap,
  Rocket,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  ChevronRight,
} from "lucide-react";
import {
  api,
  type BoostHistoryItem,
  type BoostStatus,
  type BoostType,
} from "@/lib/api-client";
import { TaxDisclaimer } from "@/components/ui/tax-disclaimer";

/**
 * /boosts — user-facing history of one-shot paid boosts.
 *
 * Three columns:
 *   1. Active boosts (status === "PAID" AND expiresAt > now)
 *   2. Past / expired boosts (status === "PAID" AND expiresAt <= now, or
 *      status === "EXPIRED")
 *   3. Pending / failed boosts (status === "PENDING" or "FAILED")
 *
 * Drives the `getMyBoosts` API wrapper that was shipped alongside the
 * `BoostCheckoutModal` but never consumed in the UI — workers / owners
 * had no way to see what they had paid for until now.
 */

const TYPE_META: Record<
  BoostType,
  {
    label: string;
    blurb: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    bg: string;
  }
> = {
  URGENT_9: {
    label: "Mission urgente",
    blurb: "Push aux travailleurs à proximité — 24h",
    icon: Zap,
    accent: "text-amber-600",
    bg: "bg-amber-50",
  },
  TOP_48H_14: {
    label: "Top visibilité 48h",
    blurb: "En tête de carte et de la pile swipe — 48h",
    icon: Rocket,
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  VERIFY_EXPRESS_19: {
    label: "Vérification express",
    blurb: "KYC traité en moins de 24h",
    icon: ShieldCheck,
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

function formatCAD(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeRemaining(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "expiré";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) {
    const minutes = Math.max(Math.floor(diff / 60_000), 1);
    return `${minutes} min restantes`;
  }
  if (hours < 48) return `${hours}h restantes`;
  const days = Math.floor(hours / 24);
  return `${days} j restantes`;
}

type Bucketed = {
  active: BoostHistoryItem[];
  past: BoostHistoryItem[];
  pending: BoostHistoryItem[];
};

function bucketBoosts(items: BoostHistoryItem[]): Bucketed {
  const now = Date.now();
  const active: BoostHistoryItem[] = [];
  const past: BoostHistoryItem[] = [];
  const pending: BoostHistoryItem[] = [];

  for (const b of items) {
    if (b.status === "PENDING" || b.status === "FAILED") {
      pending.push(b);
      continue;
    }
    const expiresMs = b.expiresAt ? new Date(b.expiresAt).getTime() : null;
    const stillActive =
      b.status === "PAID" && expiresMs !== null && expiresMs > now;
    if (stillActive) {
      active.push(b);
    } else {
      past.push(b);
    }
  }
  return { active, past, pending };
}

function StatusBadge({ status }: { status: BoostStatus }) {
  const map: Record<BoostStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    PAID: {
      label: "Payé",
      className: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    },
    PENDING: {
      label: "En attente",
      className: "bg-amber-100 text-amber-700",
      icon: Clock,
    },
    FAILED: {
      label: "Échoué",
      className: "bg-red-100 text-red-700",
      icon: AlertCircle,
    },
    EXPIRED: {
      label: "Expiré",
      className: "bg-gray-100 text-gray-600",
      icon: Clock,
    },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.className}`}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function BoostRow({ boost }: { boost: BoostHistoryItem }) {
  const meta = TYPE_META[boost.type];
  const Icon = meta.icon;
  const active =
    boost.status === "PAID" &&
    !!boost.expiresAt &&
    new Date(boost.expiresAt).getTime() > Date.now();

  return (
    <li
      className="flex items-start gap-3 rounded-2xl border border-workon-border bg-white p-3"
      data-testid="boost-row"
      data-boost-type={boost.type}
      data-boost-status={boost.status}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}
      >
        <Icon className={`h-5 w-5 ${meta.accent}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-workon-ink">
            {meta.label}
          </span>
          <StatusBadge status={boost.status} />
          <span className="text-sm font-semibold text-workon-ink">
            {formatCAD(boost.amountCents, boost.currency)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-workon-muted">{meta.blurb}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-workon-muted">
          <span>Acheté {formatDate(boost.createdAt)}</span>
          {boost.expiresAt && (
            <span>
              {active
                ? `· ${timeRemaining(boost.expiresAt)}`
                : `· expiré le ${formatDate(boost.expiresAt)}`}
            </span>
          )}
          {boost.missionId && (
            <Link
              href={`/missions/${boost.missionId}`}
              className="inline-flex items-center gap-0.5 text-workon-primary hover:underline"
            >
              Voir la mission <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-workon-ink">{title}</h2>
        <span className="text-[11px] text-workon-muted">{count}</span>
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

export default function BoostsPage() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["my-boosts"],
    queryFn: () => api.getMyBoosts(),
  });

  const buckets = useMemo<Bucketed>(
    () => bucketBoosts(Array.isArray(data) ? data : []),
    [data],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-4" data-testid="boosts-page">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-workon-ink">Mes boosts</h1>
          <p className="mt-1 text-sm text-workon-muted">
            Historique des boosts payés — urgence, top visibilité et vérification express.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs font-medium text-workon-primary hover:underline disabled:opacity-50"
        >
          {isRefetching ? "Actualisation…" : "Actualiser"}
        </button>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Impossible de charger les boosts. Réessaie plus tard.
          </span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {buckets.active.length === 0 &&
          buckets.past.length === 0 &&
          buckets.pending.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Section title="Actifs" count={buckets.active.length}>
                {buckets.active.map((b) => (
                  <BoostRow key={b.id} boost={b} />
                ))}
              </Section>
              <Section title="En attente" count={buckets.pending.length}>
                {buckets.pending.map((b) => (
                  <BoostRow key={b.id} boost={b} />
                ))}
              </Section>
              <Section title="Historique" count={buckets.past.length}>
                {buckets.past.map((b) => (
                  <BoostRow key={b.id} boost={b} />
                ))}
              </Section>
            </>
          )}

          <UpsellCards />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-workon-border bg-white p-10 text-center"
      data-testid="boosts-empty-state"
    >
      <Inbox className="mb-3 h-8 w-8 text-workon-muted" />
      <h2 className="text-sm font-semibold text-workon-ink">
        Aucun boost pour l&apos;instant
      </h2>
      <p className="mt-1 max-w-sm text-xs text-workon-muted">
        Booste une mission pour gagner en visibilité ou accélérer ta
        vérification d&apos;identité.
      </p>
    </div>
  );
}

function UpsellCards() {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-workon-ink">
        Options disponibles
      </h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <UpsellCard
          type="URGENT_9"
          price="$9"
          href="/missions/mine"
          ctaLabel="Flagger une mission"
        />
        <UpsellCard
          type="TOP_48H_14"
          price="$14"
          href="/missions/mine"
          ctaLabel="Booster une mission"
        />
        <UpsellCard
          type="VERIFY_EXPRESS_19"
          price="$19"
          href="/settings/subscription"
          ctaLabel="Activer KYC express"
        />
      </div>
    </section>
  );
}

function UpsellCard({
  type,
  price,
  href,
  ctaLabel,
}: {
  type: BoostType;
  price: string;
  href: string;
  ctaLabel: string;
}) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-2xl border border-workon-border bg-white p-3 transition-colors hover:border-workon-primary/50"
      data-testid={`boost-upsell-${type}`}
    >
      <div>
        <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${meta.bg}`}>
          <Icon className={`h-4 w-4 ${meta.accent}`} />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-workon-ink">
            {meta.label}
          </span>
          <span className="text-sm font-bold text-workon-ink">{price}</span>
        </div>
        <TaxDisclaimer compact className="mt-0.5 block" />
        <p className="mt-1 text-[11px] text-workon-muted">{meta.blurb}</p>
      </div>
      <span className="mt-3 inline-flex items-center gap-0.5 text-xs font-medium text-workon-primary">
        {ctaLabel} <ChevronRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
