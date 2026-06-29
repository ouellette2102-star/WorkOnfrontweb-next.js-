"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileCheck2,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
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
  getContractTimeframe,
  getMaterialLabel,
  getMissionSummary,
  getSignatureProgress,
  getViewerRole,
  statusConfig,
  type ContractViewerRole,
} from "../_contract-ui";

export default function ContractDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const contractId = params.id as string;

  const {
    data: contract,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => api.getContract(contractId),
  });

  const contractView = useMemo(() => {
    if (!contract) return null;
    const role = getViewerRole(contract, user?.id);

    return {
      contract,
      role,
      action: getContractAction(contract, role),
      status: statusConfig[contract.status],
      displayId: getContractDisplayId(contract.id),
      mission: getMissionSummary(contract),
      parties: getContractParties(contract),
      signatureProgress: getSignatureProgress(contract),
      timeframe: getContractTimeframe(contract),
      links: getContractLinks(contract),
    };
  }, [contract, user?.id]);

  const statusMutation = useMutation({
    mutationFn: (status: ContractResponse["status"]) =>
      api.updateContractStatus(contractId, status),
    onSuccess: (updatedContract) => {
      queryClient.setQueryData(["contract", contractId], updatedContract);
      queryClient.invalidateQueries({ queryKey: ["my-contracts"] });
      toast.success("Statut du contrat mis a jour");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise a jour du statut",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="flex items-center gap-3 rounded-2xl border border-workon-border bg-white px-5 py-4 text-sm font-bold text-workon-muted shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-workon-primary" />
          Chargement du contrat
        </div>
      </div>
    );
  }

  if (error || !contractView) {
    return (
      <div className="min-h-screen bg-workon-bg px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <TriangleAlert className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="text-xl font-black text-red-800">Contrat introuvable</h1>
          <p className="mt-2 text-sm text-red-700">
            Le contrat n&apos;est pas disponible ou la session n&apos;a pas acces a ce dossier.
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-full border-red-200 bg-white text-red-700 hover:bg-red-50">
            <Link href="/contracts">
              <ArrowLeft className="h-4 w-4" />
              Retour aux contrats
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const {
    contract: currentContract,
    mission,
    parties,
    links,
    status,
    action,
    signatureProgress,
    timeframe,
  } = contractView;

  return (
    <div
      className="min-h-screen bg-workon-bg px-4 pb-36 pt-5 sm:px-6 lg:px-8"
      data-testid="contract-detail-page"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-fit rounded-full pl-0">
            <Link href="/contracts">
              <ArrowLeft className="h-4 w-4" />
              Retour aux contrats
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2 text-sm font-bold text-workon-muted shadow-sm transition hover:border-workon-primary/30 hover:text-workon-ink disabled:opacity-60"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-workon-primary" />
            )}
            Actualiser
          </button>
        </div>

        <header className="workon-dark-panel overflow-hidden rounded-[28px] p-4 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("border-white/15 bg-white/10 text-white", status.badgeClassName)}>
                    {status.label}
                  </Badge>
                  {action.needsAction && (
                    <Badge className="border-transparent bg-workon-copper text-white">
                      Action requise
                    </Badge>
                  )}
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-bold uppercase text-white/70">
                    {contractView.displayId}
                  </span>
                </div>

                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  {mission.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
                  {mission.description ??
                    "Contrat associe a cette mission WorkOn. Verifie les parties, le montant et les signatures avant d'agir."}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/68">
                  {mission.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-workon-gold" />
                      {mission.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-workon-gold" />
                    {timeframe}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-workon-gold" />
                    Mis a jour {formatRelativeTime(currentContract.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/58">
                  Montant du contrat
                </p>
                <p className="mt-2 font-[family-name:var(--font-cabinet)] text-4xl font-black">
                  {formatCurrency(currentContract.amount)}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/68">
                  {currentContract.hourlyRate !== null
                    ? `${formatCurrency(currentContract.hourlyRate)} / h`
                    : "Prix forfaitaire"}
                </p>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <HeroMetric
                icon={ShieldCheck}
                label="Signature"
                value={signatureProgress.label}
                detail={status.description}
              />
              <HeroMetric
                icon={Clock3}
                label="Duree"
                value={formatDuration(mission.durationMinutes)}
                detail={getMaterialLabel(mission.materialProvided)}
              />
              <HeroMetric
                icon={UserRound}
                label="Client"
                value={parties.employer.name}
                detail={parties.employer.detail ?? parties.employer.city ?? "Profil client"}
              />
              <HeroMetric
                icon={BriefcaseBusiness}
                label="Pro"
                value={parties.worker.name}
                detail={parties.worker.detail ?? parties.worker.city ?? "Profil pro"}
              />
            </section>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <main className="space-y-6">
            <section className="rounded-[26px] border border-workon-border bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                    Progression
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                    Signatures du contrat
                  </h2>
                  <p className="mt-1 text-sm text-workon-muted">
                    Le contrat devient actif quand les deux parties ont signe.
                  </p>
                </div>
                <div className="rounded-2xl bg-workon-primary-subtle px-4 py-3 text-workon-primary">
                  <p className="text-sm font-black">{signatureProgress.percent}%</p>
                </div>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-workon-bg-cream">
                <div
                  className="h-full rounded-full bg-workon-primary transition-all"
                  style={{ width: `${signatureProgress.percent}%` }}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SignatureStep
                  label="Client"
                  name={parties.employer.name}
                  signed={currentContract.signedByEmployer}
                  pendingLabel="En attente d'envoi"
                  detail={parties.employer.detail ?? parties.employer.city ?? "Profil client"}
                />
                <SignatureStep
                  label="Professionnel"
                  name={parties.worker.name}
                  signed={currentContract.signedByWorker}
                  pendingLabel={
                    currentContract.status === "PENDING"
                      ? "Signature requise"
                      : "En attente"
                  }
                  detail={parties.worker.detail ?? parties.worker.city ?? "Profil pro"}
                />
              </div>
            </section>

            <section className="rounded-[26px] border border-workon-border bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                    Dossier
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                    Details operationnels
                  </h2>
                  <p className="mt-1 text-sm text-workon-muted">
                    Les informations utiles avant de signer, suivre ou fermer le contrat.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow
                  icon={UserRound}
                  label="Client"
                  value={parties.employer.name}
                  detail={parties.employer.detail ?? parties.employer.city ?? "Profil WorkOn"}
                />
                <DetailRow
                  icon={BriefcaseBusiness}
                  label="Professionnel"
                  value={parties.worker.name}
                  detail={parties.worker.detail ?? parties.worker.city ?? "Profil WorkOn"}
                />
                <DetailRow
                  icon={DollarSign}
                  label="Prix"
                  value={formatCurrency(currentContract.amount)}
                  detail={
                    currentContract.hourlyRate !== null
                      ? `${formatCurrency(currentContract.hourlyRate)} / h`
                      : "Montant total accepte"
                  }
                />
                <DetailRow
                  icon={Clock3}
                  label="Duree"
                  value={formatDuration(mission.durationMinutes)}
                  detail={getMaterialLabel(mission.materialProvided)}
                />
                <DetailRow
                  icon={MapPin}
                  label="Lieu"
                  value={mission.city ?? "A confirmer"}
                  detail={mission.address ?? "Adresse non affichee"}
                />
                <DetailRow
                  icon={CalendarDays}
                  label="Periode"
                  value={timeframe}
                  detail={`Cree le ${formatDate(currentContract.createdAt)}`}
                />
              </div>

              {currentContract.terms && (
                <div className="mt-5 rounded-2xl bg-workon-bg-cream p-4">
                  <h3 className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                    Termes du contrat
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-workon-ink">
                    {currentContract.terms}
                  </p>
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-6">
            <section className={`rounded-[26px] border p-5 shadow-sm ${status.panelClassName}`}>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-workon-primary">
                  <ContractActionIcon
                    contract={currentContract}
                    role={contractView.role}
                    className="h-5 w-5"
                  />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                    Action
                  </p>
                  <h2 className="mt-1 text-lg font-black text-workon-ink">
                    {action.label}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-workon-muted">
                    {action.description}
                  </p>
                </div>
              </div>

              <ContractActions
                contract={currentContract}
                role={contractView.role}
                isPending={statusMutation.isPending}
                onStatusChange={(nextStatus) => statusMutation.mutate(nextStatus)}
              />
            </section>

            <section className="rounded-[26px] border border-workon-border bg-white p-5 shadow-sm">
              <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
                Raccourcis
              </h2>
              <p className="mt-1 text-sm text-workon-muted">
                Accede au contexte complet sans perdre ce dossier.
              </p>
              <div className="mt-4 space-y-3">
                {links.messagesHref && (
                  <Button asChild variant="outline" className="w-full justify-between rounded-full">
                    <Link href={links.messagesHref}>
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {links.missionHref && (
                  <Button asChild variant="outline" className="w-full justify-between rounded-full">
                    <Link href={links.missionHref}>
                      <span className="inline-flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4" />
                        Mission
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-between rounded-full">
                  <Link href="/contracts">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tous les contrats
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ContractActions({
  contract,
  role,
  isPending,
  onStatusChange,
}: {
  contract: ContractResponse;
  role: ReturnType<typeof getViewerRole>;
  isPending: boolean;
  onStatusChange: (status: ContractResponse["status"]) => void;
}) {
  if (contract.status === "DRAFT") {
    if (role !== "employer") {
      return (
        <p className="rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-workon-muted">
          Le client doit envoyer le contrat avant que tu puisses le signer.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onStatusChange("PENDING")}
          className="w-full rounded-full"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Envoi..." : "Envoyer au pro"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("CANCELLED")}
          className="w-full rounded-full"
        >
          <XCircle className="h-4 w-4" />
          Annuler le contrat
        </Button>
      </div>
    );
  }

  if (contract.status === "PENDING") {
    if (role !== "worker") {
      return (
        <p className="rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-workon-muted">
          Le contrat a ete envoye. Le pro doit maintenant verifier et signer.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onStatusChange("ACCEPTED")}
          className="w-full rounded-full"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isPending ? "Signature..." : "Accepter et signer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("REJECTED")}
          className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" />
          Refuser
        </Button>
      </div>
    );
  }

  if (contract.status === "ACCEPTED") {
    if (role !== "employer") {
      return (
        <p className="rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-workon-muted">
          Le contrat est actif. Le client pourra le completer quand la mission sera livree.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onStatusChange("COMPLETED")}
          className="w-full rounded-full"
        >
          <FileCheck2 className="h-4 w-4" />
          {isPending ? "Mise a jour..." : "Marquer termine"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("CANCELLED")}
          className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" />
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <p className="rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-workon-muted">
      Aucune action n&apos;est requise pour ce statut.
    </p>
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
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-sm">
      <div className="mb-3 hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-workon-gold sm:flex">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate text-xs font-semibold text-white/64">{label}</p>
      <p className="mt-1 truncate text-lg font-black sm:text-xl">{value}</p>
      <p className="mt-1 hidden truncate text-[11px] font-semibold text-white/55 sm:block">
        {detail}
      </p>
    </div>
  );
}

function SignatureStep({
  label,
  name,
  signed,
  pendingLabel,
  detail,
}: {
  label: string;
  name: string;
  signed: boolean;
  pendingLabel: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-workon-bg-cream p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-workon-muted">
            {label}
          </p>
          <p className="truncate font-bold text-workon-ink">{name}</p>
          <p className="truncate text-sm text-workon-muted">{detail}</p>
        </div>
        {signed ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
        ) : (
          <Clock3 className="h-6 w-6 shrink-0 text-amber-600" />
        )}
      </div>
      <Badge
        variant="outline"
        className={
          signed
            ? "border-emerald-200 bg-emerald-100 text-emerald-900"
            : "border-amber-200 bg-amber-100 text-amber-900"
        }
      >
        {signed ? "Signe" : pendingLabel}
      </Badge>
    </div>
  );
}

function DetailRow({
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
    <div className="min-w-0 rounded-2xl bg-workon-bg-cream p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-workon-muted">
        <Icon className="h-4 w-4 text-workon-copper" />
        {label}
      </div>
      <p className="truncate font-bold text-workon-ink">{value}</p>
      <p className="mt-1 truncate text-sm text-workon-muted">{detail}</p>
    </div>
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
  const iconClassName = cn("h-5 w-5 shrink-0 text-workon-primary", className);

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
