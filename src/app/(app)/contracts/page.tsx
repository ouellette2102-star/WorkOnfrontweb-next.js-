"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  PenLine,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { api, type ContractResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatRelativeTime,
  getContractAction,
  getContractDisplayId,
  getContractLinks,
  getContractParties,
  getContractSortTime,
  getContractStatusGroup,
  getContractStatusRank,
  getContractTimeframe,
  getCounterparty,
  getMaterialLabel,
  getMissionSummary,
  getSignatureProgress,
  getViewerRole,
  statusConfig,
  type ContractViewerRole,
} from "./_contract-ui";

type ContractFilter = "all" | "action" | "pending" | "active" | "completed" | "closed";
type ContractStatusGroup = ReturnType<typeof getContractStatusGroup>;
type ContractCardView = {
  contract: ContractResponse;
  role: ContractViewerRole;
  action: ReturnType<typeof getContractAction>;
  status: (typeof statusConfig)[ContractResponse["status"]];
  statusGroup: ContractStatusGroup;
  displayId: string;
  mission: ReturnType<typeof getMissionSummary>;
  parties: ReturnType<typeof getContractParties>;
  counterparty: ReturnType<typeof getCounterparty>;
  signatureProgress: ReturnType<typeof getSignatureProgress>;
  timeframe: string;
  links: ReturnType<typeof getContractLinks>;
};

const filterOptions: Array<{
  value: ContractFilter;
  label: string;
  detail: string;
}> = [
  { value: "all", label: "Tous", detail: "Vue complete" },
  { value: "action", label: "A traiter", detail: "Priorite" },
  { value: "pending", label: "En attente", detail: "Brouillons/signatures" },
  { value: "active", label: "Actifs", detail: "Signes" },
  { value: "completed", label: "Termines", detail: "Livres" },
  { value: "closed", label: "Archives", detail: "Refuses/annules" },
];

export default function ContractsPage() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const [filter, setFilter] = useState<ContractFilter>("all");
  const {
    data: contracts,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => api.getMyContracts(),
    enabled: isAuthenticated,
  });

  const contractViews = useMemo(() => {
    return (contracts ?? []).map((contract) =>
      getContractCardView(contract, user?.id),
    );
  }, [contracts, user?.id]);

  const stats = useMemo(() => {
    const totalAmount = contractViews.reduce(
      (sum, item) => sum + (item.contract.amount ?? 0),
      0,
    );
    const sorted = sortContracts(contractViews);
    const focus =
      sorted.find((item) => item.action.needsAction) ??
      sorted.find((item) => item.contract.status === "ACCEPTED") ??
      sorted[0] ??
      null;

    return {
      total: contractViews.length,
      actionRequired: contractViews.filter((item) => item.action.needsAction).length,
      pending: contractViews.filter(
        (item) => item.statusGroup === "pending",
      ).length,
      active: contractViews.filter((item) => item.statusGroup === "active").length,
      completed: contractViews.filter(
        (item) => item.statusGroup === "completed",
      ).length,
      closed: contractViews.filter((item) => item.statusGroup === "closed").length,
      totalAmount,
      focus,
    };
  }, [contractViews]);

  const filterCounts = useMemo(
    () => ({
      all: stats.total,
      action: stats.actionRequired,
      pending: stats.pending,
      active: stats.active,
      completed: stats.completed,
      closed: stats.closed,
    }),
    [stats],
  );

  const filteredContracts = useMemo(() => {
    return sortContracts(
      contractViews.filter((item) => {
        if (filter === "action") return item.action.needsAction;
        if (filter === "pending") return item.statusGroup === "pending";
        if (filter === "active") return item.statusGroup === "active";
        if (filter === "completed") return item.statusGroup === "completed";
        if (filter === "closed") return item.statusGroup === "closed";
        return true;
      }),
    );
  }, [contractViews, filter]);

  const loading = authLoading || isLoading;

  return (
    <div
      className="min-h-screen bg-workon-bg px-4 pb-36 pt-5 sm:px-6 lg:px-8"
      data-testid="contracts-page"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="workon-dark-panel overflow-hidden rounded-[28px] p-4 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <FileText className="h-3.5 w-3.5 text-workon-gold" />
                  Dossiers contractuels
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  Mes contrats
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
                  Suis les signatures, les parties, les montants et la prochaine action
                  de chaque mission avant de passer au paiement.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching || !isAuthenticated}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Actualiser
                </button>
                <Button asChild className="rounded-full bg-white px-5 text-workon-primary hover:bg-workon-bg-cream">
                  <Link href="/missions">
                    <Sparkles className="h-4 w-4" />
                    Missions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <HeroMetric
                icon={PenLine}
                label="A traiter"
                value={stats.actionRequired}
                detail="Action requise"
              />
              <HeroMetric
                icon={Clock3}
                label="En attente"
                value={stats.pending}
                detail="Brouillons et signatures"
              />
              <HeroMetric
                icon={ShieldCheck}
                label="Actifs"
                value={stats.active}
                detail="Contrats signes"
              />
              <HeroMetric
                icon={DollarSign}
                label="Valeur totale"
                value={formatCurrency(stats.totalAmount)}
                detail="Contrats visibles"
              />
            </section>
          </div>
        </header>

        {!loading && !error && stats.focus && (
          <section
            className="grid gap-3 rounded-[24px] border border-workon-border bg-white p-3 shadow-sm sm:p-4 lg:grid-cols-[1fr_auto] lg:items-center"
            data-testid="contracts-next-action"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary sm:h-11 sm:w-11">
                <ContractActionIcon
                  contract={stats.focus.contract}
                  role={stats.focus.role}
                  className="h-5 w-5"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                  {stats.focus.action.needsAction ? "Prochaine action" : "Dernier suivi"}
                </p>
                <h2 className="mt-1 truncate text-base font-black text-workon-ink sm:text-lg">
                  {stats.focus.mission.title}
                </h2>
                <p className="mt-1 text-xs text-workon-muted sm:text-sm">
                  {stats.focus.action.description} - {stats.focus.timeframe} -{" "}
                  {formatRelativeTime(stats.focus.contract.updatedAt)}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/contracts/${stats.focus.contract.id}`}>
                Ouvrir le contrat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        <section className="rounded-[24px] border border-workon-border bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
            {filterOptions.map((option) => {
              const selected = filter === option.value;
              const count = filterCounts[option.value];

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(option.value)}
                  data-testid={`contracts-filter-${option.value}`}
                  className={cn(
                    "min-w-0 rounded-2xl px-3 py-3 text-left transition",
                    selected
                      ? "bg-workon-primary text-white shadow-sm"
                      : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black">{option.label}</span>
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black",
                        selected
                          ? "bg-white/18 text-white"
                          : "bg-workon-primary/10 text-workon-primary",
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 hidden text-xs font-semibold sm:block",
                      selected ? "text-white/70" : "text-workon-muted",
                    )}
                  >
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {loading && <ContractsLoading />}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <TriangleAlert className="mx-auto mb-3 h-9 w-9 text-red-600" />
            <h2 className="text-lg font-bold text-red-800">
              Impossible de charger les contrats
            </h2>
            <p className="mt-1 text-sm text-red-700">
              Relance l&apos;actualisation ou reessaie dans quelques instants.
            </p>
            <Button
              type="button"
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 rounded-full border-red-200 bg-white text-red-700 hover:bg-red-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Reessayer
            </Button>
          </div>
        )}

        {!loading && !error && contractViews.length === 0 && <EmptyContracts />}

        {!loading && !error && contractViews.length > 0 && filteredContracts.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-workon-border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-primary">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black text-workon-ink">
              Rien dans ce filtre
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-workon-muted">
              Change de filtre pour revoir tous tes contrats et leurs actions.
            </p>
          </div>
        )}

        {filteredContracts.length > 0 && (
          <section className="space-y-4" data-testid="contracts-list">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                  {filterOptions.find((option) => option.value === filter)?.label}
                </h2>
                <p className="text-sm text-workon-muted">
                  {filteredContracts.length} contrat
                  {filteredContracts.length > 1 ? "s" : ""} dans cette vue
                </p>
              </div>
              <Badge variant="outline" className="border-workon-border bg-white text-workon-muted">
                {stats.total} au total
              </Badge>
            </div>

            <div className="space-y-4">
              {filteredContracts.map((item) => (
                <ContractCard key={item.contract.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ContractCard({ item }: { item: ContractCardView }) {
  const {
    contract,
    mission,
    parties,
    status,
    action,
    links,
    displayId,
    timeframe,
    signatureProgress,
  } = item;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[26px] border bg-white shadow-sm transition hover:border-workon-primary/40 hover:shadow-md",
        action.needsAction ? "border-workon-copper/35 ring-1 ring-workon-copper/10" : "border-workon-border",
      )}
      data-testid="contract-card"
      data-status={contract.status}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-workon-border bg-workon-bg-cream px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-workon-muted">
          <StatusDot tone={action.needsAction ? "action" : item.statusGroup} />
          <span className="truncate">{action.description}</span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-workon-muted">
          Mis a jour {formatRelativeTime(contract.updatedAt)}
        </span>
      </div>

      <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:p-6">
        <div className="min-w-0 space-y-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={status.badgeClassName}>
                {status.label}
              </Badge>
              {action.needsAction && (
                <Badge className="border-transparent bg-workon-copper text-white">
                  Action requise
                </Badge>
              )}
              <span className="text-xs font-semibold uppercase text-workon-muted">
                {displayId}
              </span>
              {mission.category && (
                <span className="rounded-full bg-workon-primary-subtle px-2.5 py-1 text-[11px] font-bold uppercase text-workon-primary">
                  {mission.category}
                </span>
              )}
            </div>

            <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black leading-snug text-workon-ink sm:text-2xl">
              {mission.title}
            </h2>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-workon-muted">
              {mission.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-workon-copper" />
                  {mission.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-workon-copper" />
                {timeframe}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-workon-copper" />
                Cree le {formatDate(contract.createdAt)}
              </span>
            </div>

            {mission.description && (
              <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-workon-muted">
                {mission.description}
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <PartyLine
              icon={UserRound}
              label={parties.employer.label}
              name={parties.employer.name}
              detail={parties.employer.detail ?? parties.employer.city ?? "Profil client"}
            />
            <PartyLine
              icon={BriefcaseBusiness}
              label={parties.worker.label}
              name={parties.worker.name}
              detail={
                parties.worker.ratingAverage
                  ? `${parties.worker.ratingAverage.toFixed(1)} / 5 - ${parties.worker.reviewCount} avis`
                  : parties.worker.detail ?? parties.worker.city ?? "Profil pro"
              }
            />
          </div>

          <div className="grid gap-3 border-y border-workon-border py-4 sm:grid-cols-3">
            <ContractFact
              icon={DollarSign}
              label="Montant"
              value={formatCurrency(contract.amount)}
              detail={
                contract.hourlyRate !== null
                  ? `${formatCurrency(contract.hourlyRate)} / h`
                  : "Prix forfaitaire"
              }
            />
            <ContractFact
              icon={Clock3}
              label="Duree"
              value={formatDuration(mission.durationMinutes)}
              detail={getMaterialLabel(mission.materialProvided)}
            />
            <ContractFact
              icon={ShieldCheck}
              label="Signatures"
              value={signatureProgress.label}
              detail={status.description}
            />
          </div>

          {contract.terms && (
            <div className="rounded-2xl bg-workon-bg-cream p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-workon-primary">
                Termes
              </p>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-workon-ink">
                {contract.terms}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl bg-workon-bg-cream p-4 lg:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-workon-muted">
              Valeur du contrat
            </p>
            <p className="mt-1 font-[family-name:var(--font-cabinet)] text-3xl font-black text-workon-ink">
              {formatCurrency(contract.amount)}
            </p>
            <p className="mt-1 text-xs font-semibold text-workon-muted">
              {timeframe}
            </p>
          </div>

          <SignatureProgress progress={signatureProgress} />

          <div className={`rounded-2xl border p-4 ${status.panelClassName}`}>
            <div className="flex items-start gap-3">
              <ContractActionIcon contract={contract} role={item.role} />
              <div>
                <p className="font-bold text-workon-ink">{action.label}</p>
                <p className="text-sm leading-relaxed text-workon-muted">
                  {action.description}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {links.messagesHref && (
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href={links.messagesHref}>
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Link>
                </Button>
              )}
              {links.missionHref && (
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href={links.missionHref}>
                    <BriefcaseBusiness className="h-4 w-4" />
                    Mission
                  </Link>
                </Button>
              )}
              <Button asChild className="w-full rounded-full">
                <Link href={`/contracts/${contract.id}`}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-sm">
      <div className="mb-3 hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-workon-gold sm:flex">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate text-xs font-semibold text-white/64">{label}</p>
      <p className="mt-1 truncate text-xl font-black sm:text-2xl">{value}</p>
      <p className="mt-1 hidden truncate text-[11px] font-semibold text-white/55 sm:block">
        {detail}
      </p>
    </div>
  );
}

function PartyLine({
  icon: Icon,
  label,
  name,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-workon-bg-cream px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-workon-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-workon-muted">
          {label}
        </p>
        <p className="truncate font-bold text-workon-ink">{name}</p>
        <p className="truncate text-sm text-workon-muted">{detail}</p>
      </div>
    </div>
  );
}

function ContractFact({
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
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-workon-muted">
        <Icon className="h-4 w-4 text-workon-copper" />
        {label}
      </div>
      <p className="truncate font-bold text-workon-ink">{value}</p>
      <p className="mt-1 truncate text-sm text-workon-muted">{detail}</p>
    </div>
  );
}

function SignatureProgress({
  progress,
}: {
  progress: ReturnType<typeof getSignatureProgress>;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-workon-muted">
          Signature
        </p>
        <p className="text-sm font-black text-workon-primary">{progress.label}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-workon-bg-cream">
        <div
          className="h-full rounded-full bg-workon-primary transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {progress.steps.map((step) => (
          <div
            key={step.key}
            className="flex min-w-0 items-center gap-2 text-xs font-semibold text-workon-muted"
          >
            {step.signed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />
            )}
            <span className="truncate">
              {step.label}: {step.signed ? "signe" : step.pendingLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractsLoading() {
  return (
    <div className="space-y-4" aria-label="Chargement des contrats">
      <div className="h-20 animate-pulse rounded-[24px] border border-workon-border bg-white" />
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-72 animate-pulse rounded-[26px] border border-workon-border bg-white"
        />
      ))}
    </div>
  );
}

function EmptyContracts() {
  return (
    <section
      className="rounded-[28px] border border-dashed border-workon-border bg-white p-8 text-center shadow-sm"
      data-testid="contracts-empty-state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-primary">
        <FileText className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-black text-workon-ink">
        Aucun contrat
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-workon-muted">
        Tes contrats apparaitront ici des qu&apos;une mission sera acceptee.
        Tu pourras y suivre les signatures, les montants et les prochaines actions.
      </p>
      <Button asChild className="mt-5 rounded-full">
        <Link href="/missions">
          <Sparkles className="h-4 w-4" />
          Voir les missions
        </Link>
      </Button>
    </section>
  );
}

function ContractActionIcon({
  contract,
  role,
  className,
}: {
  contract: ContractResponse;
  role: ContractViewerRole;
  className?: string;
}) {
  const iconClassName = cn("mt-0.5 h-5 w-5 shrink-0 text-workon-primary", className);

  if (contract.status === "PENDING" && role === "worker") {
    return <PenLine className={iconClassName} />;
  }
  if (contract.status === "DRAFT" && role === "employer") {
    return <Send className={iconClassName} />;
  }
  if (contract.status === "ACCEPTED" || contract.status === "COMPLETED") {
    return <CheckCircle2 className={iconClassName} />;
  }
  return <FileText className={iconClassName} />;
}

function StatusDot({
  tone,
}: {
  tone: "action" | ContractStatusGroup;
}) {
  const className =
    tone === "action"
      ? "bg-workon-copper"
      : tone === "pending"
        ? "bg-amber-500"
        : tone === "active"
          ? "bg-emerald-500"
          : tone === "completed"
            ? "bg-blue-500"
            : "bg-workon-muted";

  return <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />;
}

function getContractCardView(
  contract: ContractResponse,
  userId?: string,
): ContractCardView {
  const role = getViewerRole(contract, userId);

  return {
    contract,
    role,
    action: getContractAction(contract, role),
    status: statusConfig[contract.status],
    statusGroup: getContractStatusGroup(contract.status),
    displayId: getContractDisplayId(contract.id),
    mission: getMissionSummary(contract),
    parties: getContractParties(contract),
    counterparty: getCounterparty(contract, role),
    signatureProgress: getSignatureProgress(contract),
    timeframe: getContractTimeframe(contract),
    links: getContractLinks(contract),
  };
}

function sortContracts(items: ContractCardView[]) {
  return [...items].sort((a, b) => {
    if (a.action.needsAction !== b.action.needsAction) {
      return a.action.needsAction ? -1 : 1;
    }

    const rankDelta =
      getContractStatusRank(a.contract.status) -
      getContractStatusRank(b.contract.status);
    if (rankDelta !== 0) return rankDelta;

    return getContractSortTime(b.contract) - getContractSortTime(a.contract);
  });
}
