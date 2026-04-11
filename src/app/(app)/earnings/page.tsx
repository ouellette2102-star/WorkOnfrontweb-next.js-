"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Percent,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";

function formatCAD(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatCADFromDollars(dollars: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(dollars);
}

type EarningsHistoryItem = {
  id: string;
  missionTitle: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed";
};

type EarningsHistoryResponse = {
  items: EarningsHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function EarningsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => api.getEarningsSummary(),
  });

  const {
    data: historyRaw,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ["earnings-history", page],
    queryFn: () => api.getEarningsHistory({ page, limit }),
  });

  const history = historyRaw as EarningsHistoryResponse | undefined;

  const {
    data: payments,
    isLoading: paymentsLoading,
  } = useQuery({
    queryKey: ["worker-payment-history"],
    queryFn: () => api.getWorkerPaymentHistory(),
  });

  const isLoading = summaryLoading;
  const hasError = summaryError || historyError;

  const summaryCards = summary
    ? [
        {
          label: "Total brut",
          value: formatCADFromDollars(summary.totalGross),
          icon: <DollarSign className="h-5 w-5" />,
          color: "text-workon-primary",
          bg: "bg-workon-primary/10",
        },
        {
          label: "Total net",
          sublabel: "Après commission",
          value: formatCADFromDollars(summary.totalNet),
          icon: <TrendingUp className="h-5 w-5" />,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Total versé",
          value: formatCADFromDollars(summary.totalPaid),
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-workon-primary",
          bg: "bg-workon-primary/10",
        },
        {
          label: "En attente",
          value: formatCADFromDollars(summary.totalPending),
          icon: <Clock className="h-5 w-5" />,
          color: "text-workon-accent",
          bg: "bg-workon-accent/10",
        },
        {
          label: "Commission",
          value: `${(summary.commissionRate * 100).toFixed(0)}%`,
          icon: <Percent className="h-5 w-5" />,
          color: "text-workon-muted",
          bg: "bg-gray-100",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-workon-bg px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-workon-ink">Mes revenus</h1>
          <p className="mt-1 text-workon-muted">
            Suivez vos gains et vos paiements
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-workon-primary" />
          </div>
        )}

        {/* Error */}
        {hasError && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="text-red-600">Erreur lors du chargement des revenus</p>
          </div>
        )}

        {/* Summary cards */}
        {!isLoading && !hasError && summary && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm"
                >
                  <div className={`mb-2 inline-flex rounded-xl p-2 ${card.bg}`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <p className="text-xs text-workon-muted">{card.label}</p>
                  {card.sublabel && (
                    <p className="text-[10px] text-workon-muted/70">{card.sublabel}</p>
                  )}
                  <p className={`mt-1 text-lg font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="border-workon-border text-workon-ink">
                <Link href="/worker/payments">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gérer mes paiements
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-workon-border text-workon-ink"
              >
                <a
                  href="https://connect.stripe.com/express_login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Tableau Stripe Connect
                </a>
              </Button>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-workon-border bg-white shadow-sm">
              <div className="border-b border-workon-border px-6 py-4">
                <h2 className="text-lg font-semibold text-workon-ink">
                  Historique des revenus
                </h2>
              </div>

              {historyLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
                </div>
              )}

              {!historyLoading && history?.items && history.items.length === 0 && (
                <div className="py-12 text-center">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-workon-muted/40" />
                  <p className="text-workon-muted">Aucun revenu pour le moment</p>
                  <p className="mt-1 text-sm text-workon-muted/70">
                    Complétez des missions pour commencer à gagner
                  </p>
                </div>
              )}

              {/* If history is an array (no pagination wrapper), handle both shapes */}
              {!historyLoading && history && (
                <>
                  {(history.items ?? (Array.isArray(history) ? (history as unknown as EarningsHistoryItem[]) : [])).map(
                    (item: EarningsHistoryItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-workon-border/50 px-6 py-4 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-workon-ink">
                            {item.missionTitle}
                          </p>
                          <p className="text-xs text-workon-muted">
                            {new Date(item.date).toLocaleDateString("fr-CA", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <span className="whitespace-nowrap font-semibold text-workon-primary">
                            {formatCADFromDollars(item.amount)}
                          </span>
                        </div>
                      </div>
                    ),
                  )}

                  {/* Pagination */}
                  {history.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-workon-border px-6 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="border-workon-border text-workon-ink"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Précédent
                      </Button>
                      <span className="text-sm text-workon-muted">
                        Page {page} / {history.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= history.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="border-workon-border text-workon-ink"
                      >
                        Suivant
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Fallback: show payment history if earnings history isn't available */}
              {!historyLoading && !history && payments && payments.length > 0 && (
                <>
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b border-workon-border/50 px-6 py-4 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-workon-ink">
                          {p.missionTitle}
                        </p>
                        <p className="text-xs text-workon-muted">
                          {p.completedAt
                            ? new Date(p.completedAt).toLocaleDateString("fr-CA", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "En cours"}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <StatusBadge
                          status={
                            p.status === "SUCCEEDED"
                              ? "paid"
                              : p.status === "PENDING"
                                ? "pending"
                                : "failed"
                          }
                        />
                        <span className="whitespace-nowrap font-semibold text-workon-primary">
                          {formatCAD(p.netAmountCents)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "paid" | "pending" | "failed" }) {
  const styles = {
    paid: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-workon-accent/10 text-workon-accent border-workon-accent/20",
    failed: "bg-red-50 text-red-600 border-red-200",
  };
  const labels = {
    paid: "Versé",
    pending: "En attente",
    failed: "Échoué",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
