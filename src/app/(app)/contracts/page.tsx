"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  MessageCircle,
  PenLine,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api, type ContractResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  getContractAction,
  getContractDisplayId,
  getContractLinks,
  getCounterparty,
  getMissionSummary,
  getViewerRole,
  statusConfig,
  type ContractViewerRole,
} from "./_contract-ui";

type ContractFilter = "all" | "action" | "pending" | "active" | "completed";

const filterOptions: Array<{ value: ContractFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "action", label: "A traiter" },
  { value: "pending", label: "En attente" },
  { value: "active", label: "Actifs" },
  { value: "completed", label: "Termines" },
];

export default function ContractsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ContractFilter>("all");
  const { data: contracts, isLoading, error } = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => api.getMyContracts(),
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

    return {
      actionRequired: contractViews.filter((item) => item.action.needsAction).length,
      pending: contractViews.filter((item) =>
        ["DRAFT", "PENDING"].includes(item.contract.status),
      ).length,
      active: contractViews.filter((item) => item.contract.status === "ACCEPTED").length,
      totalAmount,
    };
  }, [contractViews]);

  const filteredContracts = useMemo(() => {
    return contractViews
      .filter((item) => {
        if (filter === "action") return item.action.needsAction;
        if (filter === "pending") return ["DRAFT", "PENDING"].includes(item.contract.status);
        if (filter === "active") return item.contract.status === "ACCEPTED";
        if (filter === "completed") return item.contract.status === "COMPLETED";
        return true;
      })
      .sort((a, b) => {
        if (a.action.needsAction !== b.action.needsAction) {
          return a.action.needsAction ? -1 : 1;
        }

        return (
          new Date(b.contract.updatedAt).getTime() -
          new Date(a.contract.updatedAt).getTime()
        );
      });
  }, [contractViews, filter]);

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-workon-primary">
              Contrats
            </p>
            <h1 className="text-3xl font-bold text-workon-ink md:text-4xl">
              Mes contrats
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-workon-muted md:text-base">
              Suis les signatures, les montants et les prochaines actions liees a tes missions.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/missions">
              <FileText className="h-4 w-4" />
              Missions
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={PenLine}
            label="A traiter"
            value={String(stats.actionRequired)}
            detail="Action requise"
          />
          <MetricTile
            icon={Clock3}
            label="En attente"
            value={String(stats.pending)}
            detail="Brouillons et signatures"
          />
          <MetricTile
            icon={ShieldCheck}
            label="Actifs"
            value={String(stats.active)}
            detail="Contrats signes"
          />
          <MetricTile
            icon={DollarSign}
            label="Valeur"
            value={formatCurrency(stats.totalAmount)}
            detail="Total visible"
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

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">
              Erreur lors du chargement des contrats
            </p>
          </div>
        )}

        {!isLoading && !error && contractViews.length === 0 && (
          <EmptyContracts />
        )}

        {!isLoading && !error && contractViews.length > 0 && filteredContracts.length === 0 && (
          <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-workon-gray/40" />
            <h2 className="text-xl font-semibold text-workon-ink">
              Rien dans ce filtre
            </h2>
            <p className="mt-2 text-sm text-workon-muted">
              Change de filtre pour revoir tous tes contrats.
            </p>
          </div>
        )}

        {filteredContracts.length > 0 && (
          <div className="space-y-4">
            {filteredContracts.map((item) => (
              <ContractCard key={item.contract.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({
  item,
}: {
  item: ReturnType<typeof getContractCardView>;
}) {
  const { contract, mission, counterparty, status, action, links, displayId } = item;

  return (
    <article className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm transition hover:border-workon-primary/40 hover:shadow-md md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={status.badgeClassName}>
                  {status.label}
                </Badge>
                {action.needsAction && (
                  <Badge className="border-transparent bg-workon-primary text-white">
                    Action requise
                  </Badge>
                )}
                <span className="text-xs font-semibold uppercase text-workon-muted">
                  {displayId}
                </span>
              </div>
              <h2 className="truncate text-xl font-bold text-workon-ink">
                {mission.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-workon-muted">
                {mission.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {mission.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  Mis a jour le {formatDate(contract.updatedAt)}
                </span>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-workon-bg-cream px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-semibold text-workon-muted">Montant</p>
              <p className="text-2xl font-bold text-workon-ink">
                {formatCurrency(contract.amount)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InfoPill
              icon={UserRound}
              label={counterparty.label}
              value={counterparty.name}
              detail={counterparty.detail ?? counterparty.city ?? "Profil WorkOn"}
            />
            <InfoPill
              icon={FileText}
              label="Portee"
              value={mission.category ?? "Mission"}
              detail={`${formatDuration(mission.durationMinutes)} - ${
                mission.materialProvided === null
                  ? "Materiel a confirmer"
                  : mission.materialProvided
                    ? "Materiel fourni"
                    : "Materiel a apporter"
              }`}
            />
            <InfoPill
              icon={ShieldCheck}
              label="Signatures"
              value={`${contract.signedByEmployer ? "Client OK" : "Client"} - ${
                contract.signedByWorker ? "Pro OK" : "Pro"
              }`}
              detail={status.description}
            />
          </div>

          <div className={`rounded-2xl border p-4 ${status.panelClassName}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ContractActionIcon contract={contract} role={item.role} />
                <div>
                  <p className="font-semibold text-workon-ink">{action.label}</p>
                  <p className="text-sm text-workon-muted">{action.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {links.messagesHref && (
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href={links.messagesHref}>
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                )}
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/contracts/${contract.id}`}>
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
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
  icon: typeof PenLine;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-workon-bg-cream text-workon-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-workon-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-workon-ink">{value}</p>
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
  icon: typeof UserRound;
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

function EmptyContracts() {
  return (
    <div className="rounded-3xl border border-workon-border bg-white p-12 text-center shadow-sm">
      <FileText className="mx-auto mb-4 h-14 w-14 text-workon-gray/40" />
      <h2 className="mb-2 text-xl font-semibold text-workon-ink">
        Aucun contrat
      </h2>
      <p className="text-workon-muted">
        Tes contrats apparaitront ici des qu&apos;une mission sera acceptee.
      </p>
    </div>
  );
}

function ContractActionIcon({
  contract,
  role,
}: {
  contract: ContractResponse;
  role: ContractViewerRole;
}) {
  const className = "mt-0.5 h-5 w-5 shrink-0 text-workon-primary";

  if (contract.status === "PENDING" && role === "worker") {
    return <PenLine className={className} />;
  }
  if (contract.status === "DRAFT" && role === "employer") {
    return <Send className={className} />;
  }
  if (contract.status === "ACCEPTED") {
    return <CheckCircle2 className={className} />;
  }
  return <FileText className={className} />;
}

function getContractCardView(contract: ContractResponse, userId?: string) {
  const role = getViewerRole(contract, userId);

  return {
    contract,
    role,
    action: getContractAction(contract, role),
    status: statusConfig[contract.status],
    displayId: getContractDisplayId(contract.id),
    mission: getMissionSummary(contract),
    counterparty: getCounterparty(contract, role),
    links: getContractLinks(contract),
  };
}
