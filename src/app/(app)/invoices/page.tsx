"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type InvoiceListItem = {
  id: string;
  missionId: string | null;
  subtotal: number;
  platformFee: number;
  taxes: number;
  total: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  description?: string | null;
  paidAt: string | null;
  createdAt: string;
};

const statusConfig: Record<InvoiceListItem["status"], { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-yellow-500/20 text-yellow-700" },
  PROCESSING: { label: "Traitement", className: "bg-blue-500/20 text-blue-700" },
  PAID: { label: "Payée", className: "bg-green-500/20 text-green-700" },
  FAILED: { label: "Échouée", className: "bg-red-500/20 text-red-700" },
  CANCELLED: { label: "Annulée", className: "bg-neutral-500/20 text-neutral-700" },
  REFUNDED: { label: "Remboursée", className: "bg-purple-500/20 text-purple-700" },
};

function formatAmount(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

export default function InvoicesListPage() {
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices", "mine"],
    queryFn: () => apiFetch<InvoiceListItem[]>("/payments/invoices/mine"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-600">
          Impossible de charger vos factures.
        </div>
      </div>
    );
  }

  const list = invoices ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-2xl font-bold text-workon-ink">Mes factures</h1>
      <p className="mb-6 text-sm text-workon-muted">
        Toutes les factures où vous êtes le payeur.
      </p>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-workon-border bg-white p-8 text-center text-workon-muted">
          Aucune facture pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((invoice) => {
            const status = statusConfig[invoice.status];
            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold text-workon-ink">
                      Facture #{invoice.id.slice(0, 8)}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-workon-muted">
                    {new Date(invoice.createdAt).toLocaleDateString("fr-CA")}
                    {invoice.description ? ` — ${invoice.description}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-workon-ink">
                    {formatAmount(invoice.total, invoice.currency)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
