"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { api, type WorkerPayment } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReceiptFilter = "all" | "paid" | "pending" | "failed";

const RECEIPT_STATUS: Record<
  WorkerPayment["status"],
  { label: string; className: string; icon: LucideIcon; tone: string }
> = {
  SUCCEEDED: {
    label: "Recu disponible",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle,
    tone: "Versement confirme",
  },
  PENDING: {
    label: "En attente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
    tone: "Traitement en cours",
  },
  FAILED: {
    label: "A verifier",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
    tone: "Action requise",
  },
};

const FILTERS: Array<{
  id: ReceiptFilter;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "all", label: "Tous", icon: Receipt },
  { id: "paid", label: "Disponibles", icon: CheckCircle },
  { id: "pending", label: "En attente", icon: Clock },
  { id: "failed", label: "A verifier", icon: AlertCircle },
];

function formatCAD(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Date a confirmer";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";

  return date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getSortDate(payment: WorkerPayment) {
  return new Date(payment.completedAt ?? payment.createdAt).getTime();
}

function getFilterForPayment(payment: WorkerPayment): ReceiptFilter {
  if (payment.status === "SUCCEEDED") return "paid";
  if (payment.status === "FAILED") return "failed";
  return "pending";
}

function getReceiptNumber(payment: WorkerPayment) {
  return payment.invoiceNumber || `Recu ${payment.id.slice(0, 8)}`;
}

export default function ReceiptsPage() {
  const [activeFilter, setActiveFilter] = useState<ReceiptFilter>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    data: payments = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["worker-earnings-payments"],
    queryFn: () => api.getWorkerEarningsPayments(),
  });

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => getSortDate(b) - getSortDate(a)),
    [payments],
  );

  const totals = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === "SUCCEEDED");
    const pending = payments.filter((payment) => payment.status === "PENDING");
    const failed = payments.filter((payment) => payment.status === "FAILED");

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      paidNetCents: paid.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      pendingNetCents: pending.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      feeCents: payments.reduce((sum, payment) => sum + payment.feeCents, 0),
      grossCents: payments.reduce((sum, payment) => sum + payment.amountCents, 0),
    };
  }, [payments]);

  const visiblePayments = useMemo(
    () =>
      activeFilter === "all"
        ? sortedPayments
        : sortedPayments.filter(
            (payment) => getFilterForPayment(payment) === activeFilter,
          ),
    [activeFilter, sortedPayments],
  );

  const filterCounts: Record<ReceiptFilter, number> = {
    all: payments.length,
    paid: totals.paidCount,
    pending: totals.pendingCount,
    failed: totals.failedCount,
  };

  const refreshReceipts = () => {
    void refetch();
  };

  const handleDownloadStatement = async (payment: WorkerPayment) => {
    setDownloadingId(payment.id);
    try {
      await api.downloadWorkerStatementPdf(payment.id);
    } catch (downloadError) {
      alert(
        downloadError instanceof Error
          ? downloadError.message
          : "Telechargement echoue",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main
      data-testid="receipts-page"
      className="min-h-screen bg-workon-bg px-4 py-5 pb-36 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <Link
                  href="/earnings"
                  className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/72 transition hover:bg-white/15 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour aux revenus
                </Link>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <Receipt className="h-3.5 w-3.5 text-workon-gold" />
                  Centre des recus
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  Mes recus
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                  Retrouve les recus de mission avec le statut de versement,
                  le net recu, les frais et la facture associee.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={refreshReceipts}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Actualiser
                </button>
                <Link
                  href="/worker/payments"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
                >
                  Paiements
                  <Wallet className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <ReceiptMetric
                icon={FileText}
                label="Recus"
                value={String(payments.length)}
                detail={`${totals.paidCount} disponible(s)`}
                loading={isLoading}
              />
              <ReceiptMetric
                icon={Banknote}
                label="Net verse"
                value={formatCAD(totals.paidNetCents)}
                detail="Apres frais"
                loading={isLoading}
              />
              <ReceiptMetric
                icon={Clock}
                label="En attente"
                value={formatCAD(totals.pendingNetCents)}
                detail={`${totals.pendingCount} paiement(s)`}
                loading={isLoading}
              />
              <ReceiptMetric
                icon={AlertCircle}
                label="A verifier"
                value={String(totals.failedCount)}
                detail="Paiements bloques"
                loading={isLoading}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <ShieldCheck className="h-4 w-4 text-workon-gold" />
                  Chaque recu conserve le lien mission, facture, escrow et
                  versement pour le suivi administratif.
                </div>
                <div className="flex flex-wrap gap-2">
                  <HeroPill icon={Receipt} label="Brut" value={formatCAD(totals.grossCents)} />
                  <HeroPill icon={BarChart3} label="Frais" value={formatCAD(totals.feeCents)} />
                  <HeroPill icon={FileText} label="Factures" value={`${payments.length}`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <StatePanel
            icon={Loader2}
            title="Chargement des recus"
            text="On recupere les paiements issus du flux facture et escrow."
            spinning
          />
        ) : error ? (
          <StatePanel
            icon={AlertCircle}
            title="Recus indisponibles"
            text="Impossible de charger vos recus pour le moment."
            tone="danger"
            action={
              <Button
                type="button"
                onClick={refreshReceipts}
                className="mt-4 rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover"
              >
                Reessayer
                <RefreshCw className="h-4 w-4" />
              </Button>
            }
          />
        ) : payments.length === 0 ? (
          <EmptyReceipts />
        ) : (
          <section className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="space-y-4">
              <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Dossier administratif
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                  Resume des recus
                </h2>
                <div className="mt-5 space-y-3">
                  <SummaryRow label="Total brut" value={formatCAD(totals.grossCents)} />
                  <SummaryRow label="Frais suivis" value={formatCAD(totals.feeCents)} />
                  <SummaryRow label="Net verse" value={formatCAD(totals.paidNetCents)} tone="good" />
                  <SummaryRow label="Net en attente" value={formatCAD(totals.pendingNetCents)} tone="warn" />
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button asChild className="rounded-full font-bold">
                    <Link href="/earnings">
                      <BarChart3 className="h-4 w-4" />
                      Revenus
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-workon-border font-bold text-workon-ink"
                  >
                    <Link href="/worker/payments">
                      <Wallet className="h-4 w-4" />
                      Paiements
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Suivi
                </p>
                <div className="mt-4 space-y-3">
                  <StatusLine
                    icon={CheckCircle}
                    label="Recus disponibles"
                    value={String(totals.paidCount)}
                    tone="good"
                  />
                  <StatusLine
                    icon={Clock}
                    label="Traitement en cours"
                    value={String(totals.pendingCount)}
                    tone="warn"
                  />
                  <StatusLine
                    icon={AlertCircle}
                    label="A verifier"
                    value={String(totals.failedCount)}
                    tone="danger"
                  />
                </div>
              </div>
            </aside>

            <section className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                    Historique
                  </p>
                  <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                    Recus de mission
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-workon-muted">
                    {visiblePayments.length} sur {payments.length} recu(s)
                    affiches
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {FILTERS.map((filter) => {
                    const Icon = filter.icon;
                    const active = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        data-testid={`receipts-filter-${filter.id}`}
                        onClick={() => setActiveFilter(filter.id)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition",
                          active
                            ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                            : "border-workon-border bg-workon-bg-cream text-workon-stone hover:border-workon-primary/35 hover:text-workon-primary",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {filter.label}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px]",
                            active ? "bg-white/18 text-white" : "bg-white text-workon-muted",
                          )}
                        >
                          {filterCounts[filter.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {visiblePayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream px-4 py-10 text-center">
                  <Inbox className="mb-3 h-10 w-10 text-workon-primary" />
                  <p className="text-lg font-black text-workon-ink">
                    Rien dans ce filtre
                  </p>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-workon-muted">
                    Les recus changeront de section lorsque leur statut de
                    paiement sera mis a jour.
                  </p>
                </div>
              ) : (
                <div data-testid="receipts-list" className="space-y-3">
                  {visiblePayments.map((payment) => (
                    <ReceiptCard
                      key={payment.id}
                      payment={payment}
                      isDownloading={downloadingId === payment.id}
                      onDownload={() => handleDownloadStatement(payment)}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

function ReceiptCard({
  payment,
  isDownloading,
  onDownload,
}: {
  payment: WorkerPayment;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const status = RECEIPT_STATUS[payment.status] ?? RECEIPT_STATUS.PENDING;
  const StatusIcon = status.icon;
  const currency = payment.currency || "CAD";
  const receiptDate = payment.completedAt ?? payment.createdAt;

  return (
    <article
      data-testid="receipt-card"
      className="rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/30 hover:shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                status.className,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-xs font-bold text-workon-muted">
              {getReceiptNumber(payment)}
            </span>
          </div>

          <h3 className="truncate text-base font-black text-workon-ink sm:text-lg">
            {payment.missionTitle}
          </h3>
          <p className="mt-1 text-xs font-semibold text-workon-muted">
            {payment.missionCategory ?? "Categorie a confirmer"} -{" "}
            <time dateTime={receiptDate}>{formatDate(receiptDate)}</time>
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-workon-muted">
            <span className="rounded-full bg-workon-bg-cream px-2.5 py-1">
              {status.tone}
            </span>
            {payment.escrowReleasedAt && (
              <span className="rounded-full bg-workon-bg-cream px-2.5 py-1">
                Escrow libere le {formatDate(payment.escrowReleasedAt)}
              </span>
            )}
            {payment.stripeTransferId && (
              <span className="max-w-full truncate rounded-full bg-workon-bg-cream px-2.5 py-1">
                Stripe {payment.stripeTransferId}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:w-[420px]">
          <MoneyFact label="Brut" value={formatCAD(payment.amountCents, currency)} />
          <MoneyFact label="Frais" value={formatCAD(payment.feeCents, currency)} />
          <MoneyFact
            label="Net"
            value={formatCAD(payment.netAmountCents, currency)}
            highlight
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-workon-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-workon-muted">
          Mission {payment.missionId}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {payment.invoiceNumber && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={isDownloading}
              className="rounded-full border-workon-border font-bold text-workon-ink"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Releve PDF
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover"
          >
            <Link href={`/invoices/${payment.id}`}>
              Voir facture
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ReceiptMetric({
  icon: Icon,
  label,
  value,
  detail,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black tracking-tight">
            {loading ? "--" : value}
          </p>
          <p className="mt-1 truncate text-[11px] leading-relaxed text-white/65">
            {detail}
          </p>
        </div>
        <span className="rounded-xl bg-white/10 p-2 text-workon-gold">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function HeroPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/72">
      <Icon className="h-3 w-3 text-workon-gold" />
      {label}: {value}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-workon-bg-cream p-3">
      <span className="text-sm font-bold text-workon-stone">{label}</span>
      <span
        className={cn(
          "text-base font-black",
          tone === "good" && "text-emerald-700",
          tone === "warn" && "text-amber-700",
          tone === "neutral" && "text-workon-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatusLine({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "good" | "warn" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-workon-bg-cream p-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-workon-ink">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            tone === "good" && "bg-emerald-50 text-emerald-700",
            tone === "warn" && "bg-amber-50 text-amber-700",
            tone === "danger" && "bg-red-50 text-red-700",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className="text-base font-black text-workon-ink">{value}</span>
    </div>
  );
}

function MoneyFact({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-workon-stone">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-black",
          highlight ? "text-emerald-700" : "text-workon-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyReceipts() {
  return (
    <section
      data-testid="receipts-empty"
      className="rounded-[28px] border border-workon-border bg-white p-10 text-center shadow-sm sm:p-12"
    >
      <Receipt className="mx-auto mb-4 h-12 w-12 text-workon-primary" />
      <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
        Aucun recu
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-muted">
        Vos recus apparaitront ici quand une mission aura ete facturee et
        rattachee au flux de paiement.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild className="rounded-full font-bold">
          <Link href="/missions">Voir les missions</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-workon-border font-bold text-workon-ink"
        >
          <Link href="/earnings">Retour aux revenus</Link>
        </Button>
      </div>
    </section>
  );
}

function StatePanel({
  icon: Icon,
  title,
  text,
  action,
  spinning,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
  spinning?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <section className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger"
            ? "bg-red-50 text-red-600"
            : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-muted">
        {text}
      </p>
      {action}
    </section>
  );
}
