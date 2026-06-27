"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  MessageCircle,
  Search,
  Send,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { api, type OfferResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getBudgetComparison,
  getMissionSummary,
  getOfferAction,
  getOfferDisplayId,
  getOfferLinks,
  statusConfig,
} from "./_offer-ui";

type OfferFilter = "all" | "pending" | "accepted" | "declined";

const filterOptions: Array<{ value: OfferFilter; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "accepted", label: "Acceptees" },
  { value: "declined", label: "Refusees" },
];

export default function MyOffersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<OfferFilter>("all");

  const {
    data: offers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => api.getMyOffers(),
    enabled: isAuthenticated,
  });

  const offerViews = useMemo(() => {
    return (offers ?? []).map((offer) => getOfferCardView(offer));
  }, [offers]);

  const stats = useMemo(() => {
    const pending = offerViews.filter((item) => item.offer.status === "PENDING");
    const accepted = offerViews.filter((item) => item.offer.status === "ACCEPTED");
    const totalPendingValue = pending.reduce(
      (sum, item) => sum + item.offer.price,
      0,
    );
    const averageOffer =
      offerViews.length > 0
        ? offerViews.reduce((sum, item) => sum + item.offer.price, 0) / offerViews.length
        : 0;

    return {
      pending: pending.length,
      accepted: accepted.length,
      totalPendingValue,
      averageOffer,
    };
  }, [offerViews]);

  const filteredOffers = useMemo(() => {
    const statusOrder: Record<OfferResponse["status"], number> = {
      PENDING: 0,
      ACCEPTED: 1,
      DECLINED: 2,
    };

    return offerViews
      .filter((item) => {
        if (filter === "pending") return item.offer.status === "PENDING";
        if (filter === "accepted") return item.offer.status === "ACCEPTED";
        if (filter === "declined") return item.offer.status === "DECLINED";
        return true;
      })
      .sort((a, b) => {
        const statusDelta = statusOrder[a.offer.status] - statusOrder[b.offer.status];
        if (statusDelta !== 0) return statusDelta;

        return (
          new Date(b.offer.createdAt).getTime() -
          new Date(a.offer.createdAt).getTime()
        );
      });
  }, [filter, offerViews]);

  const loading = authLoading || isLoading;

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-workon-primary">
              Offres
            </p>
            <h1 className="text-3xl font-bold text-workon-ink md:text-4xl">
              Mes offres
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-workon-muted md:text-base">
              Suis tes propositions, leur valeur et les prochaines etapes avec les clients.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/worker/missions">
              <Search className="h-4 w-4" />
              Trouver une mission
            </Link>
          </Button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            icon={Clock3}
            label="A suivre"
            value={String(stats.pending)}
            detail="Offres en attente"
          />
          <MetricTile
            icon={CheckCircle2}
            label="Acceptees"
            value={String(stats.accepted)}
            detail="Offres gagnees"
          />
          <MetricTile
            icon={DollarSign}
            label="Valeur en jeu"
            value={formatCurrency(stats.totalPendingValue)}
            detail="Total en attente"
          />
          <MetricTile
            icon={TrendingUp}
            label="Offre moyenne"
            value={formatCurrency(stats.averageOffer)}
            detail="Toutes propositions"
          />
        </section>

        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-workon-border bg-white p-2 shadow-sm">
          {filterOptions.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "bg-workon-primary text-white shadow-sm"
                    : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">
              Erreur lors du chargement des offres
            </p>
          </div>
        )}

        {!loading && !error && offerViews.length === 0 && <EmptyOffers />}

        {!loading && !error && offerViews.length > 0 && filteredOffers.length === 0 && (
          <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-workon-gray/40" />
            <h2 className="text-xl font-semibold text-workon-ink">
              Rien dans ce filtre
            </h2>
            <p className="mt-2 text-sm text-workon-muted">
              Change de filtre pour revoir toutes tes propositions.
            </p>
          </div>
        )}

        {filteredOffers.length > 0 && (
          <div className="space-y-4 pt-28 sm:pt-0">
            {filteredOffers.map((item) => (
              <OfferCard key={item.offer.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({ item }: { item: ReturnType<typeof getOfferCardView> }) {
  const { offer, mission, status, action, budget, links, displayId } = item;

  return (
    <article className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm transition hover:border-workon-primary/40 hover:shadow-md md:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={status.badgeClassName}>
                {status.label}
              </Badge>
              <span className="text-xs font-semibold uppercase text-workon-muted">
                {displayId}
              </span>
              {mission.status && (
                <span className="rounded-full bg-workon-bg-cream px-2 py-1 text-xs font-semibold uppercase text-workon-muted">
                  Mission {mission.status}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold leading-snug text-workon-ink">
              {mission.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-workon-muted">
              {mission.category && (
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {mission.category}
                </span>
              )}
              {mission.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {mission.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                Envoyee {formatRelativeTime(offer.createdAt)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InfoPill
              icon={DollarSign}
              label={budget.label}
              value={budget.value}
              detail={budget.detail}
            />
            <InfoPill
              icon={FileText}
              label="Mission"
              value={mission.category}
              detail={
                mission.createdAt
                  ? `Publiee le ${formatDate(mission.createdAt)}`
                  : "Mission active"
              }
            />
            <InfoPill
              icon={Send}
              label="Proposition"
              value={offer.message ? "Message inclus" : "Sans message"}
              detail={formatDate(offer.createdAt)}
            />
          </div>

          {(offer.message || mission.description) && (
            <div className="grid gap-3 lg:grid-cols-2">
              {offer.message && (
                <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-workon-muted">
                    Message envoye
                  </p>
                  <p className="line-clamp-3 text-sm leading-relaxed text-workon-ink">
                    {offer.message}
                  </p>
                </div>
              )}
              {mission.description && (
                <div className="rounded-2xl border border-workon-border bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-workon-muted">
                    Brief mission
                  </p>
                  <p className="line-clamp-3 text-sm leading-relaxed text-workon-muted">
                    {mission.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl bg-workon-bg-cream px-4 py-4 text-left lg:text-right">
            <p className="text-xs font-semibold text-workon-muted">Ton offre</p>
            <p className="text-3xl font-bold text-workon-ink">
              {formatCurrency(offer.price)}
            </p>
            <p className="mt-1 text-xs font-semibold text-workon-muted">
              {budget.detail}
            </p>
          </div>

          <div className={`rounded-2xl border p-4 ${status.panelClassName}`}>
            <div className="flex items-start gap-3">
              <OfferActionIcon offer={offer} />
              <div>
                <p className="font-semibold text-workon-ink">{action.label}</p>
                <p className="text-sm text-workon-muted">{action.description}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {links.messagesHref && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={links.messagesHref}>
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Link>
                </Button>
              )}
              {offer.status === "ACCEPTED" && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={links.contractsHref}>
                    <FileText className="h-4 w-4" />
                    Contrats
                  </Link>
                </Button>
              )}
              {links.missionHref && (
                <Button asChild className="w-full">
                  <Link href={links.missionHref}>
                    {action.primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-workon-bg-cream text-workon-primary sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-sm font-semibold text-workon-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-workon-ink sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-workon-muted">{detail}</p>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-workon-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="truncate font-semibold text-workon-ink">{value}</p>
      <p className="mt-1 truncate text-sm text-workon-muted">{detail}</p>
    </div>
  );
}

function EmptyOffers() {
  return (
    <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
      <FileText className="mx-auto mb-4 h-14 w-14 text-workon-gray/40" />
      <h2 className="mb-2 text-xl font-semibold text-workon-ink">
        Aucune offre envoyee
      </h2>
      <p className="mx-auto max-w-xl text-workon-muted">
        Tes propositions apparaitront ici des que tu repondras a une mission.
        Commence par parcourir les demandes ouvertes pres de toi.
      </p>
      <Button asChild className="mt-6">
        <Link href="/worker/missions">
          <Search className="h-4 w-4" />
          Trouver une mission
        </Link>
      </Button>
    </div>
  );
}

function OfferActionIcon({ offer }: { offer: OfferResponse }) {
  const className = "mt-0.5 h-5 w-5 shrink-0 text-workon-primary";

  if (offer.status === "ACCEPTED") {
    return <CheckCircle2 className={className} />;
  }
  if (offer.status === "DECLINED") {
    return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />;
  }
  return <Clock3 className={className} />;
}

function getOfferCardView(offer: OfferResponse) {
  return {
    offer,
    status: statusConfig[offer.status],
    action: getOfferAction(offer),
    budget: getBudgetComparison(offer),
    mission: getMissionSummary(offer),
    links: getOfferLinks(offer),
    displayId: getOfferDisplayId(offer.id),
  };
}
