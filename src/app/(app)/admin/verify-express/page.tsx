"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  Mail,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

const TRUST_TIER_LABEL: Record<string, string> = {
  BASIC: "Basic",
  VERIFIED: "Vérifié",
  TRUSTED: "Trusted",
  PREMIUM: "Premium",
};

const ID_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Non démarré",
  PENDING: "En cours",
  VERIFIED: "Vérifié",
  FAILED: "Rejeté",
  EXPIRED: "Expiré",
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "il y a <1h";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function timeRemaining24h(paidAt: string | null): {
  text: string;
  urgent: boolean;
} {
  if (!paidAt) return { text: "—", urgent: false };
  const elapsedMs = Date.now() - new Date(paidAt).getTime();
  const remainingMs = 24 * 60 * 60 * 1000 - elapsedMs;
  if (remainingMs <= 0) return { text: "⚠️ DÉPASSÉ", urgent: true };
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  return {
    text: `${remainingHours}h restantes`,
    urgent: remainingHours < 4,
  };
}

export default function VerifyExpressAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-verify-express-queue"],
    queryFn: () => api.adminListVerifyExpressQueue(),
    enabled: !!user && user.role === "admin",
    refetchInterval: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: (boostId: string) => api.adminApproveVerifyExpress(boostId),
    onSuccess: (res) => {
      toast.success(
        `Approuvé — badge ${TRUST_TIER_LABEL[res.trustTier] ?? res.trustTier} appliqué`,
      );
      qc.invalidateQueries({ queryKey: ["admin-verify-express-queue"] });
    },
    onError: (err) => {
      toast.error("Échec de l'approbation", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ boostId, reason }: { boostId: string; reason?: string }) =>
      api.adminRejectVerifyExpress(boostId, reason),
    onSuccess: () => {
      toast.success("Rejeté — utilisateur notifié");
      setRejectingId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-verify-express-queue"] });
    },
    onError: (err) => {
      toast.error("Échec du rejet", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  // ── Auth gate ──
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <h1 className="text-2xl font-bold text-workon-ink mb-2">Accès refusé</h1>
        <p className="text-workon-muted">
          Cette page est réservée aux administrateurs de la plateforme.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-workon-muted hover:text-workon-ink mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l&apos;admin
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          Reviewer Queue · VERIFY_EXPRESS_19
        </div>
        <h1 className="text-2xl font-bold text-workon-ink">
          File de vérification express
        </h1>
        <p className="mt-1 text-sm text-workon-muted">
          Demandes payées 19&nbsp;$ en attente d&apos;approbation manuelle.
          Délai promis&nbsp;: 24h. Traiter en FIFO.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Erreur de chargement.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {data && data.total === 0 && (
        <div
          data-testid="empty-queue"
          className="rounded-2xl border border-workon-border bg-white p-8 text-center shadow-card"
        >
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
          <p className="font-semibold text-workon-ink">Rien à traiter</p>
          <p className="mt-1 text-sm text-workon-muted">
            Aucune demande de vérification en attente.
          </p>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wide text-workon-muted">
            <span data-testid="queue-count" className="font-bold text-workon-ink">
              {data.total}
            </span>{" "}
            demande{data.total > 1 ? "s" : ""} en attente
          </div>

          {data.items.map((item) => {
            const u = item.user;
            const remaining = timeRemaining24h(item.paidAt);
            const isRejecting = rejectingId === item.boostId;

            return (
              <div
                key={item.boostId}
                data-testid={`queue-item-${item.boostId}`}
                className="rounded-2xl border border-workon-border bg-white p-5 shadow-card"
              >
                {/* Header — name + tier */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-workon-ink">
                      {u?.firstName} {u?.lastName}
                    </p>
                    <p className="text-xs text-workon-muted">
                      Trust actuel&nbsp;:{" "}
                      <span className="font-medium text-workon-ink">
                        {TRUST_TIER_LABEL[u?.trustTier ?? "BASIC"]}
                      </span>{" "}
                      · ID&nbsp;:{" "}
                      <span className="font-medium text-workon-ink">
                        {ID_STATUS_LABEL[u?.idVerificationStatus ?? "NOT_STARTED"]}
                      </span>
                    </p>
                  </div>
                  <div
                    className={`text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1 ${
                      remaining.urgent
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {remaining.text}
                  </div>
                </div>

                {/* Contact + payment info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-workon-muted mb-4">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{u?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>
                      {u?.phone ?? "(aucun téléphone)"}{" "}
                      {u?.phoneVerified ? "✓" : ""}
                    </span>
                  </div>
                  <div className="sm:col-span-2 text-[11px]">
                    Payé {formatRelativeTime(item.paidAt)} · PI{" "}
                    <span className="font-mono">
                      {item.stripePaymentIntentId?.slice(0, 16) ?? "—"}…
                    </span>
                  </div>
                </div>

                {/* Gallery preview — admin uses these to verify ID photos */}
                {u?.gallery && u.gallery.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-workon-muted mb-2 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Photos uploadées ({u.gallery.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {u.gallery.slice(0, 6).map((url, i) => (
                        <a
                          key={`${url}-${i}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="block aspect-square rounded-lg border border-workon-border bg-workon-bg-cream overflow-hidden hover:opacity-80"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!isRejecting ? (
                  <div className="flex gap-2">
                    <Button
                      data-testid={`btn-approve-${item.boostId}`}
                      onClick={() => approveMutation.mutate(item.boostId)}
                      disabled={
                        approveMutation.isPending &&
                        approveMutation.variables === item.boostId
                      }
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {approveMutation.isPending &&
                      approveMutation.variables === item.boostId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Approuver
                        </>
                      )}
                    </Button>
                    <Button
                      data-testid={`btn-reject-${item.boostId}`}
                      variant="outline"
                      onClick={() => setRejectingId(item.boostId)}
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Rejeter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motif du rejet (optionnel — visible par l'utilisateur)"
                      rows={2}
                      className="w-full rounded-xl border border-workon-border px-3 py-2 text-sm focus:outline-none focus:border-workon-primary"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        disabled={rejectMutation.isPending}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        data-testid={`btn-reject-confirm-${item.boostId}`}
                        onClick={() =>
                          rejectMutation.mutate({
                            boostId: item.boostId,
                            reason: rejectReason.trim() || undefined,
                          })
                        }
                        disabled={rejectMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirmer rejet"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-workon-muted text-center pt-4">
        Le remboursement en cas de rejet est manuel via le dashboard Stripe
        (pas encore automatisé).
      </p>
    </div>
  );
}
