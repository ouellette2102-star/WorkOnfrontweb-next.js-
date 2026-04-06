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
  PAID: { label: "Pay\u00e9e", className: "bg-green-600 text-white" },
  FAILED: { label: "\u00c9chou\u00e9e", className: "bg-red-600 text-white" },
  CANCELLED: { label: "Annul\u00e9e", className: "bg-neutral-500 text-white" },
  REFUNDED: { label: "Rembours\u00e9e", className: "bg-purple-600 text-white" },
};

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2) + " $";
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/missions/mine"
          className="mb-6 inline-block text-sm text-white/70 transition hover:text-green-400"
        >
          &larr; Retour aux missions
        </Link>

        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 backdrop-blur">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-white">
                Facture #{invoice.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-white/50">
                Cr\u00e9\u00e9e le{" "}
                {new Date(invoice.createdAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {/* Mission reference */}
          {invoice.localMissionId && (
            <div className="mb-6">
              <p className="text-sm text-white/50">Mission associ\u00e9e</p>
              <p className="text-white">{invoice.localMissionId}</p>
            </div>
          )}

          {/* Amount breakdown */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-neutral-800/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              D\u00e9tail du montant
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Sous-total</span>
                <span className="font-semibold text-white">
                  {formatCents(invoice.subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Frais plateforme (15%)</span>
                <span className="font-semibold text-white">
                  {formatCents(invoice.platformFeeCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Taxes</span>
                <span className="font-semibold text-white">
                  {formatCents(invoice.taxCents)}
                </span>
              </div>
              <div className="my-3 border-t border-white/10" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-white">Total</span>
                <span className="font-bold text-green-400">
                  {formatCents(invoice.totalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Paid date */}
          {invoice.paidAt && (
            <div className="mb-6">
              <p className="text-sm text-white/50">Pay\u00e9e le</p>
              <p className="text-white">
                {new Date(invoice.paidAt).toLocaleDateString("fr-CA")}
              </p>
            </div>
          )}

          {/* Download placeholder */}
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            disabled
          >
            T\u00e9l\u00e9charger (bient\u00f4t disponible)
          </Button>
        </div>
      </div>
    </div>
  );
}
