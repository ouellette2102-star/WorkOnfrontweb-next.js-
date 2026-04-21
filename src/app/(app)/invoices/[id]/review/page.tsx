"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-CA", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(value);
}

function PartyBadge({ accepted, label }: { accepted: boolean; label: string }) {
  return (
    <div
      className={`flex-1 rounded-2xl border p-4 ${
        accepted
          ? "border-green-500/40 bg-green-500/10"
          : "border-amber-500/40 bg-amber-500/10"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-workon-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-bold ${
          accepted ? "text-green-500" : "text-amber-500"
        }`}
      >
        {accepted ? "✓ Accepté" : "En attente"}
      </p>
    </div>
  );
}

export default function InvoiceReviewPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const queryClient = useQueryClient();
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api.getInvoice(invoiceId),
  });

  const stateQuery = useQuery({
    queryKey: ["invoice-review-state", invoiceId],
    queryFn: () => api.getInvoiceReviewState(invoiceId),
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.acceptInvoice(invoiceId),
    onSuccess: (data) => {
      queryClient.setQueryData(["invoice-review-state", invoiceId], data);
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      if (data.escrowReleasedAt) {
        toast.success(
          "Les deux parties ont confirmé — le paiement est débloqué.",
        );
      } else {
        toast.success("Acceptation enregistrée. En attente de l'autre partie.");
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    },
  });

  const disputeMutation = useMutation({
    mutationFn: () => api.disputeInvoice(invoiceId, disputeReason.trim()),
    onSuccess: (data) => {
      queryClient.setQueryData(["invoice-review-state", invoiceId], data);
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setShowDispute(false);
      setDisputeReason("");
      toast.success(
        "Contestation enregistrée. Notre équipe va examiner le dossier.",
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    },
  });

  if (invoiceQuery.isLoading || stateQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (invoiceQuery.error || !invoiceQuery.data || !stateQuery.data) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-400">
            Impossible de charger la facture ou vous n&apos;êtes pas partie à cette
            facture.
          </p>
          <Link href="/missions/mine">
            <Button variant="outline">Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  const state = stateQuery.data;
  const disputed = Boolean(state.clientDisputedAt);
  const released = Boolean(state.escrowReleasedAt);

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/invoices/${invoiceId}`}
          className="inline-block text-sm text-workon-muted transition hover:text-workon-primary"
        >
          &larr; Retour à la facture
        </Link>

        <header className="rounded-3xl border border-workon-border bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-workon-ink">
            Revue de facture
          </h1>
          <p className="text-sm text-workon-muted">
            Facture{" "}
            <span className="font-mono font-semibold text-workon-ink">
              {invoice.invoiceNumber ?? invoice.id.slice(0, 12)}
            </span>{" "}
            — {formatAmount(invoice.total, invoice.currency)}
          </p>
          <p className="mt-2 text-xs text-workon-muted">
            Vous consultez cette facture en tant que{" "}
            <span className="font-semibold">
              {state.viewerRole === "client" ? "client" : "prestataire"}
            </span>
            . L&apos;escrow WorkOn conserve les fonds jusqu&apos;à l&apos;acceptation
            des deux parties.
          </p>
        </header>

        <section className="rounded-3xl border border-workon-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-workon-ink">
            État d&apos;acceptation bilatérale
          </h2>
          <div className="flex gap-4">
            <PartyBadge
              label="Toi"
              accepted={
                (state.viewerRole === "client" && !!state.clientAcceptedAt) ||
                (state.viewerRole === "worker" && !!state.workerAcceptedAt)
              }
            />
            <PartyBadge
              label="Autre partie"
              accepted={
                (state.viewerRole === "client" && !!state.workerAcceptedAt) ||
                (state.viewerRole === "worker" && !!state.clientAcceptedAt)
              }
            />
          </div>

          {released && (
            <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-semibold text-green-500">
                ✓ Escrow débloqué le {formatDate(state.escrowReleasedAt)}
              </p>
              <p className="mt-1 text-sm text-workon-muted">
                Le transfert vers le prestataire est en cours via Stripe Connect.
              </p>
            </div>
          )}

          {disputed && !released && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-semibold text-red-500">
                ⚠ Facture contestée le {formatDate(state.clientDisputedAt)}
              </p>
              <p className="mt-1 text-sm text-workon-muted">
                Motif :{" "}
                <span className="italic">{state.disputeReason || "—"}</span>
              </p>
              <p className="mt-2 text-xs text-workon-muted">
                Les fonds restent bloqués en escrow jusqu&apos;à résolution admin.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {state.canAccept && (
              <Button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {acceptMutation.isPending
                  ? "Traitement..."
                  : "Accepter la facture"}
              </Button>
            )}
            {state.canDispute && !showDispute && (
              <Button
                onClick={() => setShowDispute(true)}
                variant="outline"
                className="border-red-500/40 text-red-500 hover:bg-red-500/10"
              >
                Contester la facture
              </Button>
            )}
          </div>

          {showDispute && state.canDispute && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
              <label
                htmlFor="dispute-reason"
                className="mb-2 block text-sm font-semibold text-workon-ink"
              >
                Motif de la contestation (min 10 caractères)
              </label>
              <Textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Expliquez ce qui n'a pas été livré ou ne correspond pas à ce qui était convenu..."
                rows={4}
                maxLength={1000}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDispute(false);
                    setDisputeReason("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => disputeMutation.mutate()}
                  disabled={
                    disputeReason.trim().length < 10 ||
                    disputeMutation.isPending
                  }
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {disputeMutation.isPending
                    ? "Envoi..."
                    : "Confirmer la contestation"}
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-workon-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-workon-ink">
            Détail de la facture
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-workon-muted">Fournisseur</dt>
              <dd className="font-semibold text-workon-ink">
                {invoice.supplier.name ?? "—"}
              </dd>
              {invoice.supplier.address && (
                <dd className="text-xs text-workon-muted">
                  {invoice.supplier.address}
                </dd>
              )}
              {invoice.supplier.gstNumber && (
                <dd className="mt-1 text-xs text-workon-muted">
                  TPS :{" "}
                  <span className="font-mono">{invoice.supplier.gstNumber}</span>
                </dd>
              )}
              {invoice.supplier.qstNumber && (
                <dd className="text-xs text-workon-muted">
                  TVQ :{" "}
                  <span className="font-mono">{invoice.supplier.qstNumber}</span>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-workon-muted">Client</dt>
              <dd className="font-semibold text-workon-ink">
                {invoice.client.name ?? "—"}
              </dd>
              {invoice.client.address && (
                <dd className="text-xs text-workon-muted">
                  {invoice.client.address}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-workon-muted">Numéro de facture</dt>
              <dd className="font-mono font-semibold text-workon-ink">
                {invoice.invoiceNumber ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-workon-muted">Date de paiement</dt>
              <dd className="font-semibold text-workon-ink">
                {formatDate(invoice.paidAt)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 rounded-2xl border border-workon-border bg-workon-bg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-workon-muted">Sous-total</span>
              <span>{formatAmount(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-workon-muted">Frais plateforme</span>
              <span>{formatAmount(invoice.platformFee, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-workon-muted">TPS (5%)</span>
              <span>{formatAmount(invoice.tps, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-workon-muted">TVQ (9,975%)</span>
              <span>{formatAmount(invoice.tvq, invoice.currency)}</span>
            </div>
            <div className="mt-2 border-t border-workon-border pt-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-green-500">
                {formatAmount(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
          {invoice.paymentTerms && (
            <p className="mt-4 text-xs text-workon-muted">
              {invoice.paymentTerms}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
