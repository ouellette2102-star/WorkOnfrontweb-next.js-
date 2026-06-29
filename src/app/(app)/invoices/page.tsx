"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Inbox,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type InvoiceResponse } from "@/lib/api-client";
import { useMode } from "@/contexts/mode-context";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  getInvoiceDisplayNumber,
  getInvoiceFilterGroup,
  getInvoiceParties,
  getInvoiceReviewState,
  getInvoiceSortTime,
  getInvoiceStatusMeta,
  getInvoiceTitle,
  type InvoiceFilter,
} from "./_invoice-ui";

const filterOptions: Array<{
  value: InvoiceFilter;
  label: string;
  hint: string;
}> = [
  { value: "all", label: "Toutes", hint: "Vue complete" },
  { value: "action", label: "A traiter", hint: "Revue/litige" },
  { value: "pending", label: "En cours", hint: "Paiement" },
  { value: "paid", label: "Payees", hint: "Escrow/recu" },
  { value: "closed", label: "Archives", hint: "Fermees" },
];

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="invoices-loading">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-44 animate-pulse rounded-2xl border border-workon-border bg-white"
        />
      ))}
    </div>
  );
}

export default function InvoicesListPage() {
  const { mode } = useMode();
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const {
    data: invoices,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["invoices", "mine"],
    queryFn: () => api.getMyInvoices(),
  });

  const list = useMemo(
    () =>
      [...(invoices ?? [])].sort(
        (a, b) => getInvoiceSortTime(b) - getInvoiceSortTime(a),
      ),
    [invoices],
  );

  const stats = useMemo(() => {
    const action = list.filter((invoice) => getInvoiceFilterGroup(invoice) === "action");
    const pending = list.filter((invoice) => getInvoiceFilterGroup(invoice) === "pending");
    const paid = list.filter((invoice) => getInvoiceFilterGroup(invoice) === "paid");
    const closed = list.filter((invoice) => getInvoiceFilterGroup(invoice) === "closed");
    const totalPaid = paid.reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      action,
      pending,
      paid,
      closed,
      totalPaid,
      focus: action[0] ?? pending[0] ?? list[0] ?? null,
    };
  }, [list]);

  const filteredInvoices = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((invoice) => getInvoiceFilterGroup(invoice) === filter);
  }, [filter, list]);

  const counts = useMemo(
    () => ({
      all: list.length,
      action: stats.action.length,
      pending: stats.pending.length,
      paid: stats.paid.length,
      closed: stats.closed.length,
    }),
    [list.length, stats.action.length, stats.pending.length, stats.paid.length, stats.closed.length],
  );

  return (
    <main
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      data-testid="invoices-page"
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-workon-ink via-slate-900 to-stone-900 text-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                <ReceiptText className="h-3.5 w-3.5 text-workon-accent" />
                Centre de facturation
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Mes factures
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Suis les montants payes, les revues escrow, les litiges et les
                recus lies aux missions que tu finances en mode Client.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button asChild className="bg-white text-workon-ink hover:bg-white/90">
                <Link href="/missions/mine">
                  <FileText className="mr-2 h-4 w-4" />
                  Missions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              icon={TriangleAlert}
              label="A traiter"
              value={String(stats.action.length)}
              detail="Revue ou probleme"
            />
            <MetricTile
              icon={Clock3}
              label="En cours"
              value={String(stats.pending.length)}
              detail="Paiement en route"
            />
            <MetricTile
              icon={CheckCircle2}
              label="Payees"
              value={String(stats.paid.length)}
              detail="Factures confirmees"
            />
            <MetricTile
              icon={Banknote}
              label="Total paye"
              value={formatInvoiceAmount(stats.totalPaid, "CAD")}
              detail="Selon factures visibles"
            />
          </div>
        </div>
      </section>

      {mode === "pro" && list.length === 0 && !isLoading && !error && (
        <section
          className="rounded-2xl border border-workon-primary/20 bg-workon-primary/5 p-5"
          data-testid="invoices-pro-redirect"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-6 w-6 flex-shrink-0 text-workon-primary" />
              <div>
                <h2 className="text-sm font-semibold text-workon-ink">
                  Tu es en mode Pro: tes factures de revenus vivent dans Mes revenus.
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-workon-muted">
                  Cette page recense les factures ou tu es le payeur. Pour suivre
                  les versements, recus et paiements liberes, consulte le hub revenus.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/earnings">
                Voir mes revenus <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {stats.focus && (
        <section
          className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm"
          data-testid="invoices-next-action"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-workon-muted">
                Prochaine action
              </p>
              <h2 className="mt-1 text-xl font-bold text-workon-ink">
                {getInvoiceTitle(stats.focus)}
              </h2>
              <p className="mt-1 text-sm text-workon-muted">
                {getInvoiceDisplayNumber(stats.focus)} -{" "}
                {getInvoiceReviewState(stats.focus).label} -{" "}
                {formatInvoiceAmount(stats.focus.total, stats.focus.currency)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/invoices/${stats.focus.id}`}>Voir la facture</Link>
              </Button>
              {getInvoiceReviewState(stats.focus).actionRequired && (
                <Button asChild>
                  <Link href={`/invoices/${stats.focus.id}/review`}>
                    Ouvrir la revue
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-workon-border bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          {filterOptions.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={`invoices-filter-${option.value}`}
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={`flex min-h-16 items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                  selected
                    ? "bg-workon-accent text-white shadow-sm"
                    : "text-workon-muted hover:bg-workon-bg"
                }`}
              >
                <span>
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{option.hint}</span>
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    selected ? "bg-white/15 text-white" : "bg-workon-accent/10 text-workon-accent"
                  }`}
                >
                  {counts[option.value]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Impossible de charger vos factures.
        </section>
      )}

      {!error && isLoading && <LoadingState />}

      {!error && !isLoading && list.length === 0 && mode !== "pro" && (
        <EmptyInvoices />
      )}

      {!error && !isLoading && list.length > 0 && filteredInvoices.length === 0 && (
        <section className="rounded-2xl border border-workon-border bg-white p-8 text-center">
          <Inbox className="mx-auto h-8 w-8 text-workon-muted/60" />
          <h2 className="mt-3 text-base font-bold text-workon-ink">
            Rien dans ce filtre
          </h2>
          <p className="mt-1 text-sm text-workon-muted">
            Change de filtre pour revoir toutes tes factures.
          </p>
        </section>
      )}

      {!error && !isLoading && filteredInvoices.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2" data-testid="invoices-list">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </section>
      )}
    </main>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-workon-accent">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/60">{detail}</p>
    </div>
  );
}

function EmptyInvoices() {
  return (
    <section
      className="flex flex-col items-center gap-4 rounded-2xl border border-workon-border bg-white p-10 text-center shadow-sm"
      data-testid="invoices-empty"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-accent/10 text-workon-accent">
        <Inbox className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-workon-ink">
          Aucune facture pour le moment
        </h2>
        <p className="mt-2 max-w-md text-sm text-workon-muted">
          Une facture sera creee ici des qu&apos;un travailleur completera une de tes
          missions. Tu pourras ensuite suivre le paiement, la revue et les recus.
        </p>
      </div>
      <Button asChild>
        <Link href="/missions/mine">
          <FileText className="mr-2 h-4 w-4" />
          Voir mes missions
        </Link>
      </Button>
    </section>
  );
}

function InvoiceCard({ invoice }: { invoice: InvoiceResponse }) {
  const status = getInvoiceStatusMeta(invoice.status);
  const review = getInvoiceReviewState(invoice);
  const parties = getInvoiceParties(invoice);
  const reviewTone =
    review.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : review.tone === "danger"
        ? "border-red-200 bg-red-50 text-red-800"
        : review.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-workon-border bg-workon-bg text-workon-muted";

  return (
    <article
      className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition hover:border-workon-primary/40 hover:shadow-md"
      data-testid="invoice-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
              {status.label}
            </span>
            <span className="font-mono text-xs font-semibold text-workon-muted">
              {getInvoiceDisplayNumber(invoice)}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-workon-ink">
            {getInvoiceTitle(invoice)}
          </h2>
          <p className="mt-1 text-sm text-workon-muted">
            {parties.supplier} vers {parties.client}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-workon-ink">
            {formatInvoiceAmount(invoice.total, invoice.currency)}
          </p>
          <p className="text-xs text-workon-muted">
            Creee {formatInvoiceDate(invoice.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SmallFact
          label="Sous-total"
          value={formatInvoiceAmount(invoice.subtotal, invoice.currency)}
        />
        <SmallFact
          label="Frais"
          value={formatInvoiceAmount(invoice.platformFee, invoice.currency)}
        />
        <SmallFact
          label="Taxes"
          value={formatInvoiceAmount(invoice.taxes, invoice.currency)}
        />
      </div>

      <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${reviewTone}`}>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-bold">{review.label}</p>
            <p className="mt-0.5 text-xs opacity-80">{review.detail}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-workon-muted">
          {invoice.missionId ? `Mission ${invoice.missionId}` : "Mission non liee"}
        </p>
        <div className="flex flex-wrap gap-2">
          {review.actionRequired && (
            <Button asChild size="sm">
              <Link href={`/invoices/${invoice.id}/review`}>Revue</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/invoices/${invoice.id}`}>
              Voir facture <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SmallFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-workon-bg px-3 py-2">
      <p className="text-xs text-workon-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-workon-ink">{value}</p>
    </div>
  );
}
