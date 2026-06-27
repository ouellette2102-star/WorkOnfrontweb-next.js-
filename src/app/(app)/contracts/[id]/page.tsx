"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileCheck2,
  FileText,
  MapPin,
  MessageCircle,
  PenLine,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
} from "../_contract-ui";

export default function ContractDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const contractId = params.id as string;

  const {
    data: contract,
    isLoading,
    error,
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
      counterparty: getCounterparty(contract, role),
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !contractView) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-4 font-semibold text-red-700">Contrat introuvable</p>
          <Button asChild variant="outline">
            <Link href="/contracts">Retour aux contrats</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { contract: currentContract, mission, counterparty, links, status, action } =
    contractView;

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="ghost" className="pl-0">
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4" />
            Retour aux contrats
          </Link>
        </Button>

        <section className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={status.badgeClassName}>
                  {status.label}
                </Badge>
                {action.needsAction && (
                  <Badge className="border-transparent bg-workon-primary text-white">
                    Action requise
                  </Badge>
                )}
                <span className="text-xs font-semibold uppercase text-workon-muted">
                  {contractView.displayId}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-workon-ink md:text-4xl">
                {mission.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-workon-muted md:text-base">
                {mission.description ??
                  "Contrat associe a cette mission WorkOn. Verifie les parties, le montant et les signatures avant d'agir."}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-workon-muted">
                {mission.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {mission.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Cree le {formatDate(currentContract.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  Mis a jour le {formatDate(currentContract.updatedAt)}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-workon-bg-cream p-5 lg:min-w-64">
              <p className="text-sm font-semibold text-workon-muted">Montant du contrat</p>
              <p className="mt-1 text-4xl font-bold text-workon-ink">
                {formatCurrency(currentContract.amount)}
              </p>
              {currentContract.hourlyRate && (
                <p className="mt-2 text-sm text-workon-muted">
                  {formatCurrency(currentContract.hourlyRate)} / h
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <main className="space-y-6">
            <section className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-workon-ink">
                    Progression des signatures
                  </h2>
                  <p className="mt-1 text-sm text-workon-muted">
                    Le contrat devient actif quand les deux parties ont signe.
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 text-workon-primary" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <SignatureStep
                  label="Client"
                  name={counterparty.label === "Client" ? counterparty.name : "Client WorkOn"}
                  signed={currentContract.signedByEmployer}
                  pendingLabel="En attente d'envoi"
                />
                <SignatureStep
                  label="Professionnel"
                  name={
                    counterparty.label === "Professionnel"
                      ? counterparty.name
                      : "Pro WorkOn"
                  }
                  signed={currentContract.signedByWorker}
                  pendingLabel={
                    currentContract.status === "PENDING"
                      ? "Signature requise"
                      : "En attente"
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <FileText className="h-6 w-6 text-workon-primary" />
                <div>
                  <h2 className="text-xl font-bold text-workon-ink">
                    Details du contrat
                  </h2>
                  <p className="mt-1 text-sm text-workon-muted">
                    Les informations operationnelles de la mission.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow
                  icon={UserRound}
                  label={counterparty.label}
                  value={counterparty.name}
                  detail={counterparty.detail ?? counterparty.city ?? "Profil WorkOn"}
                />
                <DetailRow
                  icon={DollarSign}
                  label="Prix"
                  value={formatCurrency(currentContract.amount)}
                  detail="Montant total accepte"
                />
                <DetailRow
                  icon={Clock3}
                  label="Duree"
                  value={formatDuration(mission.durationMinutes)}
                  detail="Estimation de la mission"
                />
                <DetailRow
                  icon={MapPin}
                  label="Lieu"
                  value={mission.city ?? "A confirmer"}
                  detail={mission.address ?? "Adresse non affichee"}
                />
              </div>

              {currentContract.terms && (
                <div className="mt-5 rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
                  <h3 className="mb-2 text-sm font-semibold text-workon-muted">
                    Termes du contrat
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-workon-ink">
                    {currentContract.terms}
                  </p>
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-6">
            <section className={`rounded-3xl border p-5 shadow-sm ${status.panelClassName}`}>
              <div className="mb-5 flex items-start gap-3">
                <PenLine className="mt-1 h-5 w-5 shrink-0 text-workon-primary" />
                <div>
                  <h2 className="text-lg font-bold text-workon-ink">
                    {action.label}
                  </h2>
                  <p className="mt-1 text-sm text-workon-muted">
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

            <section className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-workon-ink">
                Raccourcis
              </h2>
              <div className="space-y-3">
                {links.messagesHref && (
                  <Button asChild variant="outline" className="w-full justify-between">
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
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={links.missionHref}>
                      <span className="inline-flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4" />
                        Mission
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
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
        <p className="rounded-2xl bg-white/70 p-4 text-sm text-workon-muted">
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
          className="w-full"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Envoi..." : "Envoyer au pro"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("CANCELLED")}
          className="w-full"
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
        <p className="rounded-2xl bg-white/70 p-4 text-sm text-workon-muted">
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
          className="w-full"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isPending ? "Signature..." : "Accepter et signer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("REJECTED")}
          className="w-full border-red-200 text-red-700 hover:bg-red-50"
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
        <p className="rounded-2xl bg-white/70 p-4 text-sm text-workon-muted">
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
          className="w-full"
        >
          <FileCheck2 className="h-4 w-4" />
          {isPending ? "Mise a jour..." : "Marquer termine"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onStatusChange("CANCELLED")}
          className="w-full border-red-200 text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" />
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <p className="rounded-2xl bg-white/70 p-4 text-sm text-workon-muted">
      Aucune action n&apos;est requise pour ce statut.
    </p>
  );
}

function SignatureStep({
  label,
  name,
  signed,
  pendingLabel,
}: {
  label: string;
  name: string;
  signed: boolean;
  pendingLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-workon-muted">{label}</p>
          <p className="font-semibold text-workon-ink">{name}</p>
        </div>
        {signed ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : (
          <Clock3 className="h-6 w-6 text-amber-600" />
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
  icon: typeof UserRound;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-workon-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="font-semibold text-workon-ink">{value}</p>
      <p className="mt-1 text-sm text-workon-muted">{detail}</p>
    </div>
  );
}
