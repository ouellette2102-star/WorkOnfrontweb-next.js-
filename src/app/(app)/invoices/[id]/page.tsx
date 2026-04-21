"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type InvoiceResponse } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const statusConfig: Record<
  InvoiceResponse["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "En attente", className: "bg-yellow-600 text-white" },
  PROCESSING: { label: "Traitement", className: "bg-blue-600 text-white" },
  PAID: { label: "Payée", className: "bg-green-600 text-white" },
  FAILED: { label: "Échouée", className: "bg-red-600 text-white" },
  CANCELLED: { label: "Annulée", className: "bg-neutral-500 text-white" },
  REFUNDED: { label: "Remboursée", className: "bg-purple-600 text-white" },
};

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(value);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api.getInvoice(invoiceId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-400">Facture introuvable</p>
          <Link href="/missions/mine">
            <Button variant="outline">Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[invoice.status];
  const reviewPending =
    invoice.status === "PAID" &&
    !invoice.review.escrowReleasedAt &&
    !invoice.review.clientDisputedAt;

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/missions/mine"
          className="mb-6 inline-block text-sm text-workon-muted transition hover:text-workon-primary"
        >
          &larr; Retour aux missions
        </Link>

        <div className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-workon-ink">
                Facture{" "}
                <span className="font-mono">
                  {invoice.invoiceNumber ?? `#${invoice.id.slice(0, 8)}`}
                </span>
              </h1>
              <p className="text-sm text-workon-muted">
                Créée le{" "}
                {new Date(invoice.createdAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {/* Bilateral review CTA */}
          {reviewPending && (
            <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="mb-2 font-semibold text-amber-600">
                Revue bilatérale requise
              </p>
              <p className="mb-3 text-sm text-workon-muted">
                Les fonds sont en escrow. Les deux parties doivent confirmer la
                prestation pour que le paiement soit débloqué vers le
                prestataire.
              </p>
              <Link href={`/invoices/${invoiceId}/review`}>
                <Button className="bg-amber-600 text-white hover:bg-amber-700">
                  Ouvrir la revue
                </Button>
              </Link>
            </div>
          )}

          {invoice.review.escrowReleasedAt && (
            <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-semibold text-green-600">
                ✓ Escrow débloqué —{" "}
                {new Date(invoice.review.escrowReleasedAt).toLocaleDateString(
                  "fr-CA",
                )}
              </p>
              <p className="mt-1 text-sm text-workon-muted">
                Transfert vers le prestataire effectué via Stripe Connect.
              </p>
            </div>
          )}

          {invoice.review.clientDisputedAt &&
            !invoice.review.escrowReleasedAt && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="font-semibold text-red-600">Facture contestée</p>
                <p className="mt-1 text-sm text-workon-muted italic">
                  &ldquo;{invoice.review.disputeReason}&rdquo;
                </p>
              </div>
            )}

          {/* Legal parties */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-workon-muted">
                Fournisseur
              </p>
              <p className="font-semibold text-workon-ink">
                {invoice.supplier.name ?? "—"}
              </p>
              {invoice.supplier.address && (
                <p className="text-xs text-workon-muted">
                  {invoice.supplier.address}
                </p>
              )}
              {invoice.supplier.gstNumber && (
                <p className="mt-1 text-xs text-workon-muted">
                  TPS :{" "}
                  <span className="font-mono">{invoice.supplier.gstNumber}</span>
                </p>
              )}
              {invoice.supplier.qstNumber && (
                <p className="text-xs text-workon-muted">
                  TVQ :{" "}
                  <span className="font-mono">{invoice.supplier.qstNumber}</span>
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-workon-muted">
                Client
              </p>
              <p className="font-semibold text-workon-ink">
                {invoice.client.name ?? "—"}
              </p>
              {invoice.client.address && (
                <p className="text-xs text-workon-muted">
                  {invoice.client.address}
                </p>
              )}
            </div>
          </div>

          {/* Mission reference */}
          {invoice.missionId && (
            <div className="mb-6">
              <p className="text-sm text-workon-muted">Mission associée</p>
              <p className="font-mono text-workon-ink">{invoice.missionId}</p>
              {invoice.description && (
                <p className="mt-1 text-sm text-workon-muted">
                  {invoice.description}
                </p>
              )}
            </div>
          )}

          {/* Amount breakdown */}
          <div className="mb-6 rounded-2xl border border-workon-border bg-workon-bg p-6">
            <h3 className="mb-4 text-lg font-semibold text-workon-ink">
              Détail du montant
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-workon-muted">Sous-total</span>
                <span className="font-semibold text-workon-ink">
                  {formatAmount(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-workon-muted">
                  Frais plateforme (15%)
                </span>
                <span className="font-semibold text-workon-ink">
                  {formatAmount(invoice.platformFee, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-workon-muted">TPS (5%)</span>
                <span className="font-semibold text-workon-ink">
                  {formatAmount(invoice.tps, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-workon-muted">TVQ (9,975%)</span>
                <span className="font-semibold text-workon-ink">
                  {formatAmount(invoice.tvq, invoice.currency)}
                </span>
              </div>
              <div className="my-3 border-t border-workon-border" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-workon-ink">Total</span>
                <span className="font-bold text-green-500">
                  {formatAmount(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {invoice.paidAt && (
            <div className="mb-6">
              <p className="text-sm text-workon-muted">Payée le</p>
              <p className="text-workon-ink">
                {new Date(invoice.paidAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
          )}

          {invoice.paymentTerms && (
            <p className="mb-6 text-xs text-workon-muted">
              {invoice.paymentTerms}
            </p>
          )}

          <Button
            variant="outline"
            className="border-workon-border text-workon-ink hover:bg-workon-bg print:hidden"
            onClick={() => window.print()}
          >
            Télécharger PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
