"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  FileText,
  Gavel,
  Inbox,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api, type DisputeResponse, type MissionResponse } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DisputeWithMission = DisputeResponse & { _missionTitle?: string };
type DisputeFilter = "all" | "action" | "mediation" | "resolved";

const FILTER_OPTIONS: Array<{ value: DisputeFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "action", label: "A documenter" },
  { value: "mediation", label: "Mediation" },
  { value: "resolved", label: "Regles" },
];

const ELIGIBLE_MISSION_STATUSES: MissionResponse["status"][] = [
  "assigned",
  "in_progress",
  "completed",
  "paid",
];

const DISPUTE_STATUS_CONFIG: Record<
  DisputeResponse["status"],
  {
    label: string;
    detail: string;
    badgeClassName: string;
    panelClassName: string;
    icon: LucideIcon;
    order: number;
  }
> = {
  OPEN: {
    label: "Ouvert",
    detail: "Le dossier attend des preuves ou des precisions.",
    badgeClassName: "border-red-200 bg-red-100 text-red-800",
    panelClassName: "border-red-200 bg-red-50",
    icon: AlertTriangle,
    order: 0,
  },
  IN_MEDIATION: {
    label: "En mediation",
    detail: "WorkOn examine les informations des deux parties.",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-900",
    panelClassName: "border-amber-200 bg-amber-50",
    icon: Gavel,
    order: 1,
  },
  RESOLVED: {
    label: "Resolu",
    detail: "Une resolution a ete inscrite au dossier.",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
    panelClassName: "border-emerald-200 bg-emerald-50",
    icon: CheckCircle2,
    order: 2,
  },
  CLOSED: {
    label: "Ferme",
    detail: "Le dossier est archive en lecture.",
    badgeClassName: "border-stone-200 bg-stone-100 text-stone-700",
    panelClassName: "border-stone-200 bg-stone-50",
    icon: XCircle,
    order: 3,
  },
};

const MISSION_STATUS_LABELS: Record<MissionResponse["status"], string> = {
  open: "Ouverte",
  assigned: "Assignee",
  in_progress: "En cours",
  completed: "Completee",
  paid: "Payee",
  cancelled: "Annulee",
};

const REASON_OPTIONS: Array<{ value: string; hint: string }> = [
  { value: "Travail non effectue", hint: "La mission n'a pas ete livree" },
  { value: "Qualite insuffisante", hint: "Le resultat ne correspond pas" },
  { value: "Non-respect du delai", hint: "La date ou l'heure bloque" },
  { value: "Dommages materiels", hint: "Objet ou lieu endommage" },
  { value: "Communication absente", hint: "Aucune reponse utile" },
  { value: "Autre", hint: "Cas particulier" },
];

export default function DisputesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<DisputeFilter>("all");

  const {
    data: missions = [],
    error: missionsError,
    isFetching: missionsFetching,
    isLoading: missionsLoading,
  } = useQuery({
    queryKey: ["my-missions-for-disputes"],
    queryFn: () => api.getMyMissions(),
  });

  const {
    data: myDisputes = [],
    error: myDisputesError,
    isFetching: myDisputesFetching,
    isLoading: myDisputesLoading,
  } = useQuery({
    queryKey: ["my-disputes"],
    queryFn: () => api.getMyDisputes(),
  });

  const missionById = useMemo(() => {
    return new Map(missions.map((mission) => [mission.id, mission]));
  }, [missions]);

  const eligibleMissions = useMemo(() => {
    return missions.filter(isEligibleMissionForDispute);
  }, [missions]);

  const eligibleMissionIds = useMemo(() => {
    return eligibleMissions.map((mission) => mission.id).sort().join(",");
  }, [eligibleMissions]);

  const disputeQueries = useQuery({
    queryKey: ["disputes-all", eligibleMissionIds],
    queryFn: async () => {
      const settled = await Promise.allSettled(
        eligibleMissions.map(async (mission) => {
          const dispute = await api.getDisputeForMission(mission.id);
          return dispute ? { ...dispute, _missionTitle: mission.title } : null;
        }),
      );

      return settled.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
    },
    enabled: eligibleMissions.length > 0 && !!myDisputesError,
  });

  const disputes = useMemo(() => {
    const map = new Map<string, DisputeWithMission>();

    for (const dispute of disputeQueries.data ?? []) {
      map.set(dispute.id, dispute);
    }

    for (const dispute of myDisputes) {
      const existing = map.get(dispute.id);
      const missionId = dispute.localMissionId ?? dispute.missionId ?? "";
      const missionTitle = existing?._missionTitle ?? missionById.get(missionId)?.title;
      map.set(dispute.id, { ...dispute, _missionTitle: missionTitle });
    }

    return Array.from(map.values()).sort((a, b) => {
      const statusDelta = DISPUTE_STATUS_CONFIG[a.status].order - DISPUTE_STATUS_CONFIG[b.status].order;
      if (statusDelta !== 0) return statusDelta;
      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  }, [disputeQueries.data, missionById, myDisputes]);

  const stats = useMemo(() => {
    return {
      active: disputes.filter((dispute) => isActionableDispute(dispute)).length,
      mediation: disputes.filter((dispute) => dispute.status === "IN_MEDIATION").length,
      resolved: disputes.filter((dispute) => dispute.status === "RESOLVED" || dispute.status === "CLOSED").length,
      eligible: eligibleMissions.length,
    };
  }, [disputes, eligibleMissions.length]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      if (filter === "action") return isActionableDispute(dispute);
      if (filter === "mediation") return dispute.status === "IN_MEDIATION";
      if (filter === "resolved") return dispute.status === "RESOLVED" || dispute.status === "CLOSED";
      return true;
    });
  }, [disputes, filter]);

  const isLoading = missionsLoading || myDisputesLoading || disputeQueries.isLoading;
  const isRefreshing = missionsFetching || myDisputesFetching || disputeQueries.isFetching;
  const error = missionsError || myDisputesError;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-missions-for-disputes"] });
    queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
    queryClient.invalidateQueries({ queryKey: ["disputes-all"] });
  };

  return (
    <div className="min-h-screen bg-workon-bg px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                <Scale className="h-4 w-4" />
                Resolution de litiges
              </p>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Mes litiges
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
                Regroupe les preuves, suis le statut de chaque dossier et ouvre une reclamation des qu&apos;une mission admissible doit etre arbitree.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="inverse"
                onClick={refresh}
                disabled={isRefreshing}
                className="bg-white/10"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualiser
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                className="bg-white text-workon-primary hover:bg-workon-bg-cream"
              >
                <Plus className="h-4 w-4" />
                Ouvrir un litige
              </Button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile icon={FilePlus2} label="A documenter" value={String(stats.active)} detail="Preuves possibles" />
          <MetricTile icon={Gavel} label="Mediation" value={String(stats.mediation)} detail="Analyse WorkOn" />
          <MetricTile icon={CheckCircle2} label="Regles" value={String(stats.resolved)} detail="Resolus ou fermes" />
          <MetricTile icon={ShieldCheck} label="Admissibles" value={String(stats.eligible)} detail="Missions eligibles" />
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-workon-border bg-white p-2 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-4 gap-1 md:flex md:overflow-x-auto">
            {FILTER_OPTIONS.map((option) => {
              const selected = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(option.value)}
                  className={`min-w-0 rounded-xl px-2 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm md:shrink-0 ${
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
          <Button asChild variant="outline" className="bg-white md:w-auto">
            <Link href="/support">
              <MessageCircle className="h-4 w-4" />
              Support
            </Link>
          </Button>
        </div>

        {showForm && (
          <CreateDisputeForm
            missions={eligibleMissions}
            onSuccess={(dispute) => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
              queryClient.invalidateQueries({ queryKey: ["disputes-all"] });
              router.push(`/disputes/${dispute.id}`);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {isLoading && <LoadingState />}

        {!isLoading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
            <h2 className="text-xl font-bold text-red-800">Impossible de charger les litiges</h2>
            <p className="mt-2 text-sm text-red-700">
              Reessaie dans un instant. Les dossiers deja ouverts ne sont pas perdus.
            </p>
            <Button type="button" onClick={refresh} className="mt-5">
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          </div>
        )}

        {!isLoading && !error && disputes.length === 0 && (
          <EmptyDisputes onCreate={() => setShowForm(true)} hasEligibleMissions={eligibleMissions.length > 0} />
        )}

        {!isLoading && !error && disputes.length > 0 && filteredDisputes.length === 0 && (
          <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm">
            <Inbox className="mx-auto mb-4 h-12 w-12 text-workon-gray/40" />
            <h2 className="text-xl font-semibold text-workon-ink">Rien dans ce filtre</h2>
            <p className="mt-2 text-sm text-workon-muted">
              Change de filtre pour revoir tous tes dossiers.
            </p>
          </div>
        )}

        {filteredDisputes.length > 0 && (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <DisputeCard key={dispute.id} dispute={dispute} />
            ))}
          </div>
        )}

        <HowItWorks />
      </div>
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: DisputeWithMission }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const queryClient = useQueryClient();
  const status = DISPUTE_STATUS_CONFIG[dispute.status];
  const StatusIcon = status.icon;
  const view = getDisputeView(dispute);
  const canAddEvidence = isActionableDispute(dispute);

  return (
    <article
      className="rounded-3xl border border-workon-border bg-white p-5 shadow-sm transition hover:border-workon-primary/35 hover:shadow-md md:p-6"
      data-testid="dispute-card"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={status.badgeClassName}>
                  <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                  {status.label}
                </Badge>
                {canAddEvidence && (
                  <Badge className="border-transparent bg-workon-primary text-white">
                    Preuves ouvertes
                  </Badge>
                )}
                <span className="text-xs font-semibold uppercase text-workon-muted">
                  {view.displayId}
                </span>
              </div>
              <h2 className="break-words text-xl font-bold text-workon-ink">
                {dispute.reason}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-workon-muted">
                {dispute.description}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-workon-bg-cream px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-semibold text-workon-muted">Ouvert</p>
              <p className="font-bold text-workon-ink">{view.ageLabel}</p>
              <p className="text-xs text-workon-muted">{formatDate(dispute.createdAt)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <InfoPill icon={Scale} label="Dossier" value={view.displayId} detail={status.detail} />
            <InfoPill icon={FileText} label="Mission" value={view.missionTitle} detail={view.missionIdLabel} />
            <InfoPill icon={FilePlus2} label="Preuves" value={view.evidenceLabel} detail={view.timelineLabel} />
          </div>

          <div className={`rounded-2xl border p-4 ${status.panelClassName}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-workon-primary" />
                <div>
                  <p className="font-semibold text-workon-ink">{view.nextStep.label}</p>
                  <p className="text-sm text-workon-muted">{view.nextStep.detail}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {canAddEvidence && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEvidence((value) => !value)}
                    className="bg-white"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Ajouter une preuve
                  </Button>
                )}
                <Button asChild>
                  <Link href={`/disputes/${dispute.id}`}>
                    Voir le dossier
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEvidence && canAddEvidence && (
        <div className="mt-4 border-t border-workon-border pt-4">
          <EvidenceForm
            disputeId={dispute.id}
            onSuccess={() => {
              setShowEvidence(false);
              queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
              queryClient.invalidateQueries({ queryKey: ["disputes-all"] });
            }}
            onCancel={() => setShowEvidence(false)}
          />
        </div>
      )}
    </article>
  );
}

function EvidenceForm({
  disputeId,
  onSuccess,
  onCancel,
}: {
  disputeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.addDisputeTextEvidence(disputeId, { type: "OTHER", content: content.trim() }),
    onSuccess: () => {
      toast.success("Preuve ajoutee");
      setContent("");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout de la preuve");
    },
  });

  const canSubmit = content.trim().length >= 3 && !mutation.isPending;

  return (
    <form
      className="space-y-3 rounded-2xl border border-workon-border bg-workon-bg-cream p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
      data-testid="dispute-evidence-form"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-workon-primary">
          <FilePlus2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={`evidence-${disputeId}`} className="block text-sm font-bold text-workon-ink">
            Ajouter une preuve texte
          </label>
          <p className="mt-1 text-sm text-workon-muted">
            Note les faits, liens, captures disponibles ou toute precision utile au dossier.
          </p>
        </div>
      </div>

      <Textarea
        id={`evidence-${disputeId}`}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Ex. capture envoyee au support, message du client, details de ce qui manque..."
        rows={4}
        maxLength={2000}
        className="min-h-[112px] resize-none bg-white"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white">
          Annuler
        </Button>
        <Button type="submit" disabled={!canSubmit} data-testid="submit-dispute-evidence">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Soumettre
        </Button>
      </div>
    </form>
  );
}

function CreateDisputeForm({
  missions,
  onSuccess,
  onCancel,
}: {
  missions: MissionResponse[];
  onSuccess: (dispute: DisputeResponse) => void;
  onCancel: () => void;
}) {
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");

  const selectedMission = missions.find((mission) => mission.id === selectedMissionId);
  const finalReason = reason === "Autre" ? customReason.trim() : reason;

  const createMutation = useMutation({
    mutationFn: async () => {
      const initialDescription = description.trim();
      const dispute = await api.createDispute({
        localMissionId: selectedMissionId || undefined,
        reason: finalReason,
        description: initialDescription,
      });

      if (initialDescription) {
        await api.addDisputeTextEvidence(dispute.id, {
          type: "OTHER",
          content: `Description initiale: ${initialDescription}`,
        });
      }

      return dispute;
    },
    onSuccess: (dispute) => {
      toast.success("Litige ouvert");
      onSuccess(dispute);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ouverture du litige");
    },
  });

  const canSubmit =
    !!selectedMissionId &&
    finalReason.length >= 3 &&
    description.trim().length >= 3 &&
    !createMutation.isPending;

  return (
    <section
      className="rounded-3xl border border-workon-primary/20 bg-white p-5 shadow-sm sm:p-6"
      data-testid="create-dispute-form"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) createMutation.mutate();
        }}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-workon-primary">
              <AlertTriangle className="h-4 w-4" />
              Nouveau litige
            </p>
            <h2 className="text-2xl font-bold text-workon-ink">Ouvrir une reclamation</h2>
            <p className="mt-2 text-sm leading-6 text-workon-muted">
              Selectionne la mission, precise la raison et ajoute assez de contexte pour accelerer l&apos;arbitrage.
            </p>
          </div>

          <label htmlFor="dispute-mission" className="block">
            <span className="mb-1 block text-sm font-semibold text-workon-muted">Mission concernee</span>
            {missions.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Aucune mission admissible pour l&apos;instant. Les litiges peuvent etre ouverts sur les missions assignees, en cours, completees ou payees.
              </div>
            ) : (
              <div className="relative">
                <select
                  id="dispute-mission"
                  value={selectedMissionId}
                  onChange={(event) => setSelectedMissionId(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-workon-border bg-white px-4 pr-10 text-sm font-semibold text-workon-ink shadow-sm focus:border-workon-primary focus:outline-none focus:ring-2 focus:ring-workon-primary/30"
                  data-testid="dispute-mission-select"
                >
                  <option value="">Selectionner une mission...</option>
                  {missions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.title} - {MISSION_STATUS_LABELS[mission.status]} - {formatCurrency(mission.price)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-muted" />
              </div>
            )}
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-workon-muted">Raison</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {REASON_OPTIONS.map((option) => {
                const selected = reason === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReason(option.value)}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? "border-workon-primary bg-workon-primary/10 text-workon-primary"
                        : "border-workon-border bg-white text-workon-ink hover:border-workon-primary/40"
                    }`}
                  >
                    <span className="block text-sm font-bold">{option.value}</span>
                    <span className="mt-1 block text-xs text-workon-muted">{option.hint}</span>
                  </button>
                );
              })}
            </div>

            {reason === "Autre" && (
              <Input
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Precise la raison..."
                className="mt-3 border-workon-border bg-white text-workon-ink"
                maxLength={120}
              />
            )}
          </div>

          <label htmlFor="dispute-description" className="block">
            <span className="mb-1 block text-sm font-semibold text-workon-muted">Description</span>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explique ce qui etait prevu, ce qui s'est produit, les preuves disponibles et la resolution attendue..."
              rows={6}
              maxLength={2000}
              className="min-h-[150px] resize-none bg-white"
              data-testid="dispute-description"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit} data-testid="submit-dispute">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              Soumettre le litige
            </Button>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
            <p className="text-sm font-bold text-workon-ink">Mission selectionnee</p>
            {selectedMission ? (
              <div className="mt-3 space-y-3 text-sm">
                <InfoLine label="Titre" value={selectedMission.title} />
                <InfoLine label="Statut" value={MISSION_STATUS_LABELS[selectedMission.status]} />
                <InfoLine label="Ville" value={selectedMission.city || "Ville inconnue"} />
                <InfoLine label="Budget" value={formatCurrency(selectedMission.price)} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-workon-muted">
                Les details de la mission apparaitront ici avant l&apos;envoi.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-workon-primary/20 bg-workon-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-workon-ink">
              <ShieldCheck className="h-4 w-4 text-workon-primary" />
              A inclure
            </p>
            <ul className="mt-3 space-y-2 text-sm text-workon-muted">
              <li>Ce qui etait convenu dans la mission.</li>
              <li>Ce qui manque ou ce qui bloque.</li>
              <li>Les preuves deja disponibles.</li>
              <li>La resolution attendue.</li>
            </ul>
          </div>
        </aside>
      </form>
    </section>
  );
}

function HowItWorks() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Paiement protege",
      desc: "Le paiement lie a la mission reste encadre pendant que le dossier est examine.",
    },
    {
      icon: FilePlus2,
      title: "Preuves centralisees",
      desc: "Ajoute les notes, captures et documents dans le dossier pour garder une trace claire.",
    },
    {
      icon: Scale,
      title: "Arbitrage WorkOn",
      desc: "L'equipe compare les faits et indique la prochaine etape ou la resolution.",
    },
  ] satisfies Array<{ icon: LucideIcon; title: string; desc: string }>;

  return (
    <section className="space-y-4 pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-workon-ink">Comment ca fonctionne</h2>
          <p className="mt-1 text-sm text-workon-muted">
            Les litiges sont reserves aux missions realisees ou engagees sur WorkOn.
          </p>
        </div>
        <Link href="/support" className="text-sm font-semibold text-workon-primary hover:underline">
          Contacter le support
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-workon-bg-cream text-workon-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-workon-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-workon-muted">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1].map((item) => (
        <div key={item} className="h-48 animate-pulse rounded-3xl border border-workon-border bg-white" />
      ))}
    </div>
  );
}

function EmptyDisputes({
  onCreate,
  hasEligibleMissions,
}: {
  onCreate: () => void;
  hasEligibleMissions: boolean;
}) {
  return (
    <div className="rounded-3xl border border-workon-border bg-white p-10 text-center shadow-sm sm:p-12">
      <Inbox className="mx-auto mb-4 h-14 w-14 text-workon-gray/40" />
      <h2 className="mb-2 text-xl font-semibold text-workon-ink">Aucun litige ouvert</h2>
      <p className="mx-auto max-w-2xl text-sm leading-6 text-workon-muted">
        Tes missions se deroulent sans dossier actif. Si un probleme survient sur une mission admissible, ouvre un litige et garde les preuves au meme endroit.
      </p>
      <Button type="button" onClick={onCreate} disabled={!hasEligibleMissions} className="mt-6">
        <Plus className="h-4 w-4" />
        Ouvrir un litige
      </Button>
      {!hasEligibleMissions && (
        <p className="mt-3 text-xs font-semibold text-workon-muted">
          Aucune mission admissible pour le moment.
        </p>
      )}
    </div>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-workon-border pb-2 last:border-0 last:pb-0">
      <span className="text-workon-muted">{label}</span>
      <span className="max-w-[180px] truncate text-right font-semibold text-workon-ink">{value}</span>
    </div>
  );
}

function getDisputeView(dispute: DisputeWithMission) {
  const evidenceCount = Array.isArray(dispute.evidence) ? dispute.evidence.length : 0;
  const timelineCount = Array.isArray(dispute.timeline) ? dispute.timeline.length : 0;
  const missionId = dispute.localMissionId ?? dispute.missionId;

  return {
    displayId: getDisputeDisplayId(dispute.id),
    missionTitle: dispute._missionTitle ?? "Mission WorkOn",
    missionIdLabel: missionId ? `Mission ${missionId.slice(0, 8)}` : "Mission liee",
    evidenceLabel: evidenceCount === 0 ? "Aucune" : `${evidenceCount} preuve${evidenceCount > 1 ? "s" : ""}`,
    timelineLabel: timelineCount === 0 ? "Chronologie a venir" : `${timelineCount} evenement${timelineCount > 1 ? "s" : ""}`,
    ageLabel: getAgeLabel(dispute.createdAt),
    nextStep: getNextStep(dispute),
  };
}

function getNextStep(dispute: DisputeResponse) {
  if (dispute.status === "OPEN") {
    return {
      label: "Ajouter les preuves disponibles",
      detail: "Le dossier est ouvert. Plus le contexte est precis, plus l'arbitrage est rapide.",
    };
  }

  if (dispute.status === "IN_MEDIATION") {
    return {
      label: "Mediation en cours",
      detail: "Garde les informations regroupees. WorkOn peut demander un complement.",
    };
  }

  if (dispute.status === "RESOLVED") {
    return {
      label: "Resolution inscrite",
      detail: dispute.resolution ?? "La resolution est disponible dans le dossier detaille.",
    };
  }

  return {
    label: "Dossier ferme",
    detail: "Le dossier reste disponible pour consultation.",
  };
}

function isEligibleMissionForDispute(mission: MissionResponse) {
  return ELIGIBLE_MISSION_STATUSES.includes(mission.status);
}

function isActionableDispute(dispute: DisputeResponse) {
  return dispute.status === "OPEN" || dispute.status === "IN_MEDIATION";
}

function getDisputeDisplayId(id: string) {
  const compact = id.replace(/^dispute[_-]?/i, "").replace(/[^a-z0-9]/gi, "");
  return `LIT-${(compact.slice(0, 6) || id.slice(0, 6)).toUpperCase()}`;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getAgeLabel(value: string | null | undefined) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "Date inconnue";
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `${days} j`;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
