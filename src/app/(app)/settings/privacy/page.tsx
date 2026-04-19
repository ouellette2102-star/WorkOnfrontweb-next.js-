"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelAccountDeletion,
  downloadMyDataAsJson,
  getConsentStatus,
  requestAccountDeletion,
  type ConsentStatus,
} from "@/lib/compliance-api";

const LEGAL_DOCUMENTS: { key: string; label: string; href: string }[] = [
  { key: "TERMS", label: "Conditions d'utilisation", href: "/legal/terms" },
  { key: "PRIVACY", label: "Politique de confidentialité", href: "/legal/privacy" },
];

const DELETE_CONFIRMATION_PHRASE = "SUPPRIMER";

export default function PrivacySettingsPage() {
  const queryClient = useQueryClient();

  const {
    data: consent,
    isLoading: consentLoading,
    error: consentError,
  } = useQuery<ConsentStatus, Error>({
    queryKey: ["consent-status"],
    queryFn: () => getConsentStatus(),
  });

  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadMyDataAsJson();
      toast.success("Export téléchargé");
    } catch (err) {
      console.error("[privacy] export failed", err);
      toast.error(
        err instanceof Error ? err.message : "Export impossible. Réessayez.",
      );
    } finally {
      setExporting(false);
    }
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const deletionMutation = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: (data) => {
      toast.success(
        `Suppression planifiée pour le ${new Date(data.scheduledFor).toLocaleDateString("fr-CA")}`,
      );
      setDeleteModalOpen(false);
      setConfirmation("");
      queryClient.invalidateQueries({ queryKey: ["consent-status"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Impossible d'enregistrer la suppression"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAccountDeletion,
    onSuccess: () => {
      toast.success("Suppression annulée");
      queryClient.invalidateQueries({ queryKey: ["consent-status"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Impossible d'annuler la suppression"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-workon-muted hover:text-workon-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Paramètres
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <ShieldCheck className="mt-1 h-6 w-6 text-workon-primary" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-workon-ink">
            Confidentialité et données
          </h1>
          <p className="mt-1 text-sm text-workon-muted">
            Vos droits en vertu de la Loi&nbsp;25 du Québec et du RGPD.
          </p>
        </div>
      </div>

      {/* Section 1 — Consent status */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-heading font-bold text-workon-ink">
          Documents acceptés
        </h2>
        <div className="rounded-2xl border border-workon-border bg-white shadow-sm overflow-hidden">
          {consentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-workon-primary" />
            </div>
          ) : consentError ? (
            <div className="px-4 py-6 text-sm text-workon-muted">
              Impossible de charger votre statut de consentement.
            </div>
          ) : (
            LEGAL_DOCUMENTS.map(({ key, label, href }, i) => {
              const doc = consent?.documents?.[key];
              const accepted = doc?.accepted ?? false;
              const isLast = i === LEGAL_DOCUMENTS.length - 1;
              return (
                <div
                  key={key}
                  className={`flex items-start gap-3 px-4 py-4 ${!isLast ? "border-b border-workon-border/50" : ""}`}
                  data-testid={`consent-row-${key}`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      accepted
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {accepted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={href}
                        className="text-sm font-medium text-workon-ink hover:text-workon-primary transition-colors"
                      >
                        {label}
                      </Link>
                      {doc?.activeVersion && (
                        <span className="text-xs text-workon-muted">
                          v{doc.activeVersion}
                        </span>
                      )}
                    </div>
                    {accepted && doc?.acceptedAt ? (
                      <p className="mt-1 text-xs text-workon-muted">
                        Accepté le{" "}
                        {new Date(doc.acceptedAt).toLocaleDateString("fr-CA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {doc.version !== doc.activeVersion && (
                          <>
                            {" "}— une nouvelle version vous sera présentée
                            à la prochaine session.
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700">
                        Non accepté — vous serez invité à le faire avant de
                        publier ou d&apos;accepter une mission.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Section 2 — Data export */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-heading font-bold text-workon-ink">
          Exporter mes données
        </h2>
        <div className="rounded-2xl border border-workon-border bg-white shadow-sm p-4">
          <p className="text-sm text-workon-muted">
            Téléchargez une copie complète de toutes les données personnelles
            que WorkOn conserve à votre sujet, au format JSON. Couvre votre
            profil, vos missions, vos paiements, vos avis et vos
            consentements.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            data-testid="export-data-button"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-workon-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-workon-primary/90 disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Préparation..." : "Télécharger mes données"}
          </button>
        </div>
      </section>

      {/* Section 3 — Account deletion */}
      <section>
        <h2 className="mb-3 text-lg font-heading font-bold text-workon-ink">
          Supprimer mon compte
        </h2>
        <div className="rounded-2xl border border-red-200 bg-red-50/40 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-workon-ink">
                La suppression déclenche une période de grâce de 30 jours
                pendant laquelle votre compte reste accessible. À
                l&apos;expiration, toutes vos données personnelles sont
                effacées définitivement.
              </p>
              <p className="mt-2 text-xs text-workon-muted">
                Les missions complétées et les paiements liés sont
                anonymisés mais conservés au titre des obligations fiscales
                et comptables (6 ans).
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                data-testid="request-deletion-button"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Demander la suppression
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3
              id="delete-modal-title"
              className="text-lg font-heading font-bold text-workon-ink"
            >
              Confirmer la suppression
            </h3>
            <p className="mt-3 text-sm text-workon-muted">
              Pour éviter toute suppression accidentelle, tapez{" "}
              <strong className="text-red-700">
                {DELETE_CONFIRMATION_PHRASE}
              </strong>{" "}
              ci-dessous puis cliquez sur Confirmer. Vous aurez 30 jours pour
              annuler.
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoFocus
              data-testid="delete-confirmation-input"
              className="mt-4 w-full rounded-xl border border-workon-border bg-white p-3 text-sm text-workon-ink focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder={DELETE_CONFIRMATION_PHRASE}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setConfirmation("");
                }}
                className="rounded-xl border border-workon-border px-4 py-2 text-sm font-medium text-workon-ink hover:bg-workon-bg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => deletionMutation.mutate()}
                disabled={
                  confirmation !== DELETE_CONFIRMATION_PHRASE ||
                  deletionMutation.isPending
                }
                data-testid="confirm-deletion-button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {deletionMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel pending deletion if one is active (mutation exposed for future status poll) */}
      {cancelMutation.isPending && (
        <p className="mt-4 text-xs text-workon-muted">Annulation en cours…</p>
      )}
    </div>
  );
}
