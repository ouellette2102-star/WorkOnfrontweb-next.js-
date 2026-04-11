"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, type DisputeResponse, type MissionResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Scale,
  AlertTriangle,
  Loader2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  ChevronDown,
  Inbox,
  Shield,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const DISPUTE_STATUS_MAP: Record<
  DisputeResponse["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "Ouvert",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  IN_MEDIATION: {
    label: "En médiation",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
  },
  RESOLVED: {
    label: "Résolu",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  CLOSED: {
    label: "Fermé",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const REASON_OPTIONS = [
  "Travail non effectué",
  "Qualité insuffisante",
  "Non-respect du délai",
  "Dommages matériels",
  "Communication absente",
  "Autre",
];

export default function DisputesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Fetch user missions to extract disputes from them
  const {
    data: missions,
    isLoading: missionsLoading,
  } = useQuery({
    queryKey: ["my-missions-for-disputes"],
    queryFn: () => api.getMyMissions(),
  });

  // Try to fetch disputes for each mission that is completed or in_progress
  const eligibleMissions = (missions ?? []).filter(
    (m) => ["completed", "paid", "in_progress", "assigned"].includes(m.status),
  );

  // We'll fetch disputes per mission
  const disputeQueries = useQuery({
    queryKey: ["disputes-all", eligibleMissions.map((m) => m.id).join(",")],
    queryFn: async () => {
      const results: (DisputeResponse & { _missionTitle?: string })[] = [];
      for (const mission of eligibleMissions) {
        try {
          const dispute = await api.getDisputeForMission(mission.id);
          if (dispute) {
            results.push({ ...dispute, _missionTitle: mission.title });
          }
        } catch {
          // No dispute for this mission — that's OK
        }
      }
      return results;
    },
    enabled: eligibleMissions.length > 0,
  });

  const disputes = disputeQueries.data ?? [];
  const isLoading = missionsLoading || disputeQueries.isLoading;

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-workon-primary/20 bg-workon-primary/5 px-3 py-1 text-xs text-workon-primary mb-3">
              <Scale className="h-3.5 w-3.5" />
              Résolution de litiges
            </div>
            <h1 className="text-3xl font-bold text-workon-ink">
              Mes litiges
            </h1>
            <p className="mt-1 text-workon-muted">
              Gérez vos réclamations et suivez leur résolution
            </p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-workon-primary hover:bg-workon-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ouvrir un litige
          </Button>
        </div>

        {/* Create dispute form */}
        {showForm && (
          <CreateDisputeForm
            missions={eligibleMissions}
            onSuccess={(dispute) => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["disputes-all"] });
              router.push(`/disputes/${dispute.id}`);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && disputes.length === 0 && (
          <div className="rounded-2xl border border-workon-border bg-white p-12 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-workon-muted/30" />
            <h3 className="text-lg font-semibold text-workon-ink">
              Aucun litige en cours
            </h3>
            <p className="mt-2 text-sm text-workon-muted">
              Vos missions se déroulent sans problème. Si un souci survient,
              ouvrez un litige depuis cette page.
            </p>
          </div>
        )}

        {/* Dispute list */}
        {!isLoading && disputes.length > 0 && (
          <div className="space-y-3">
            {disputes.map((dispute) => {
              const statusInfo = DISPUTE_STATUS_MAP[dispute.status];
              return (
                <Link
                  key={dispute.id}
                  href={`/disputes/${dispute.id}`}
                  className="block rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-workon-ink">
                        {dispute.reason}
                      </p>
                      {(dispute as DisputeResponse & { _missionTitle?: string })._missionTitle && (
                        <p className="mt-0.5 text-sm text-workon-muted">
                          Mission : {(dispute as DisputeResponse & { _missionTitle?: string })._missionTitle}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-sm text-workon-muted/80">
                        {dispute.description}
                      </p>
                      <p className="mt-2 text-xs text-workon-muted/60">
                        Ouvert le{" "}
                        {new Date(dispute.createdAt).toLocaleDateString("fr-CA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Info section */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-workon-ink">Comment ça fonctionne</h2>

          {[
            {
              icon: <Shield className="h-5 w-5 text-green-600" />,
              title: "Paiement bloqué en escrow",
              desc: "Votre paiement est retenu par Stripe jusqu'à ce que la mission soit confirmée complétée.",
            },
            {
              icon: <FileText className="h-5 w-5 text-workon-primary" />,
              title: "Ouvrir un litige",
              desc: "Sélectionnez la mission concernée, décrivez le problème et soumettez votre réclamation.",
            },
            {
              icon: <Scale className="h-5 w-5 text-yellow-600" />,
              title: "Arbitrage sous 48h",
              desc: "Notre équipe examine les preuves des deux parties et rend une décision : remboursement total, partiel, ou libération.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-workon-border bg-white p-4 flex items-start gap-4"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-workon-bg flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-workon-ink">{item.title}</h3>
                <p className="mt-0.5 text-sm text-workon-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-workon-muted/60 pt-2 pb-4">
          <p>
            WorkOn arbitre uniquement les litiges liés aux missions réalisées via la plateforme.
            <br />
            Pour les urgences, <Link href="/support" className="text-workon-primary underline">contactez le support</Link>.
          </p>
        </div>
      </div>
    </div>
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
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.createDispute({
        localMissionId: selectedMissionId || undefined,
        missionId: selectedMissionId || undefined,
        reason: reason === "Autre" ? customReason : reason,
        description,
      }),
    onSuccess: (dispute) => {
      toast.success("Litige ouvert avec succès!");
      onSuccess(dispute);
    },
    onError: () => {
      toast.error("Erreur lors de l'ouverture du litige");
    },
  });

  const finalReason = reason === "Autre" ? customReason : reason;
  const canSubmit =
    selectedMissionId && finalReason.trim() && description.trim() && !createMutation.isPending;

  return (
    <div className="rounded-2xl border border-workon-primary/20 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-workon-primary" />
        <h2 className="text-lg font-bold text-workon-ink">Ouvrir un litige</h2>
      </div>

      <div className="space-y-4">
        {/* Mission selector */}
        <div>
          <label className="mb-1 block text-sm font-medium text-workon-ink">
            Mission concernée *
          </label>
          {missions.length === 0 ? (
            <p className="text-sm text-workon-muted">
              Aucune mission éligible. Les litiges peuvent être ouverts sur les missions en cours ou complétées.
            </p>
          ) : (
            <div className="relative">
              <select
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-workon-border bg-workon-bg px-4 py-2.5 pr-10 text-sm text-workon-ink focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
              >
                <option value="">Sélectionner une mission...</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} — {m.status === "completed" ? "Complétée" : m.status === "in_progress" ? "En cours" : m.status}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-muted" />
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="mb-1 block text-sm font-medium text-workon-ink">
            Raison *
          </label>
          <div className="flex flex-wrap gap-2">
            {REASON_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setReason(opt)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  reason === opt
                    ? "border-workon-primary bg-workon-primary/10 text-workon-primary font-medium"
                    : "border-workon-border bg-workon-bg text-workon-muted hover:border-workon-primary/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {reason === "Autre" && (
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Précisez la raison..."
              className="mt-2 border-workon-border bg-workon-bg text-workon-ink"
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-workon-ink">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème en détail : ce qui était prévu, ce qui s'est passé, preuves disponibles..."
            rows={4}
            className="w-full rounded-xl border border-workon-border bg-workon-bg p-3 text-sm text-workon-ink placeholder-workon-muted/50 focus:border-workon-primary focus:outline-none focus:ring-1 focus:ring-workon-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
            className="flex-1 bg-workon-primary hover:bg-workon-primary/90 text-white disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Soumettre le litige
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending}
            className="border-workon-border text-workon-ink"
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
