"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type WorkerPayment } from "@/lib/api-client";
import Link from "next/link";
import { Receipt, ArrowLeft, ExternalLink } from "lucide-react";

function formatCAD(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

const statusConfig: Record<
  WorkerPayment["status"],
  { label: string; bg: string; text: string }
> = {
  SUCCEEDED: {
    label: "Payé",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  PENDING: {
    label: "En attente",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  FAILED: {
    label: "Échoué",
    bg: "bg-red-100",
    text: "text-red-700",
  },
};

export default function ReceiptsPage() {
  const {
    data: payments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["worker-payment-history"],
    queryFn: () => api.getWorkerPaymentHistory(),
  });

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/earnings"
            className="mb-4 inline-flex items-center gap-1 text-sm text-workon-muted transition hover:text-workon-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux revenus
          </Link>
          <h1 className="text-2xl font-bold text-workon-ink">Mes reçus</h1>
          <p className="mt-1 text-sm text-workon-muted">
            Historique de vos paiements et reçus de mission
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-50 p-8 text-center">
            <p className="text-red-600">
              Impossible de charger vos reçus. Veuillez réessayer.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && payments && payments.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-workon-muted/40" />
            <h2 className="mb-2 text-lg font-semibold text-workon-ink">
              Aucun reçu
            </h2>
            <p className="text-sm text-workon-muted">
              Vos reçus apparaîtront ici une fois que vous aurez complété des
              missions.
            </p>
            <Link
              href="/missions"
              className="mt-6 inline-block rounded-xl bg-workon-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Voir les missions
            </Link>
          </div>
        )}

        {/* Receipts list */}
        {!isLoading && !error && payments && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment) => {
              const status = statusConfig[payment.status];
              const date = payment.completedAt || payment.createdAt;

              return (
                <div
                  key={payment.id}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: mission info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-workon-ink">
                        {payment.missionTitle}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-workon-muted">
                        <time dateTime={date}>
                          {new Date(date).toLocaleDateString("fr-CA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                        {payment.missionCategory && (
                          <>
                            <span className="text-workon-muted/40">·</span>
                            <span>{payment.missionCategory}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: amount + status */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-workon-ink">
                        {formatCAD(payment.netAmountCents)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Fee breakdown + link */}
                  <div className="mt-3 flex items-center justify-between border-t border-workon-border pt-3">
                    <span className="text-xs text-workon-muted">
                      Brut {formatCAD(payment.amountCents)} &minus; Frais{" "}
                      {formatCAD(payment.feeCents)}
                    </span>
                    <Link
                      href={`/invoices/${payment.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-workon-primary transition hover:underline"
                    >
                      Voir la facture
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
