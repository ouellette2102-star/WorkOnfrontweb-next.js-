"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Percent,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { api, type EarningsSummary, type WorkerPayment } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatCAD(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatCADFromDollars(dollars: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(dollars);
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

type EarningsSummaryWithLifetime = EarningsSummary & {
  totalLifetimeGross?: number;
  totalLifetimeNet?: number;
};

const HISTORY_STATUS: Record<
  EarningsHistoryItem["status"],
  { label: string; className: string; icon: LucideIcon }
> = {
  paid: {
    label: "Verse",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle,
  },
  pending: {
    label: "En attente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  failed: {
    label: "Echoue",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
};

const PAYMENT_STATUS: Record<
  WorkerPayment["status"],
  { label: string; className: string; icon: LucideIcon }
> = {
  SUCCEEDED: {
    label: "Verse",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle,
  },
  PENDING: {
    label: "En attente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  FAILED: {
    label: "Echoue",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
};

function normalizeHistory(raw: unknown): EarningsHistoryResponse {
  if (Array.isArray(raw)) {
    return {
      items: raw as EarningsHistoryItem[],
      total: raw.length,
      page: 1,
      limit: raw.length || 10,
      totalPages: 1,
    };
  }

  if (raw && typeof raw === "object") {
    const candidate = raw as Partial<EarningsHistoryResponse>;
    return {
      items: Array.isArray(candidate.items) ? candidate.items : [],
      total: typeof candidate.total === "number" ? candidate.total : candidate.items?.length ?? 0,
      page: typeof candidate.page === "number" ? candidate.page : 1,
      limit: typeof candidate.limit === "number" ? candidate.limit : 10,
      totalPages: typeof candidate.totalPages === "number" ? candidate.totalPages : 1,
    };
  }

  return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
}

export default function EarningsPage() {
  const limit = 10;

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => api.getEarningsSummary(),
  });

  const {
    data: historyRaw,
    isLoading: historyLoading,
    isFetching: historyFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["earnings-history", limit],
    queryFn: () => api.getEarningsHistory({ limit }),
  });

  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["worker-earnings-payments"],
    queryFn: () => api.getWorkerEarningsPayments(),
  });

  const history = useMemo(() => normalizeHistory(historyRaw), [historyRaw]);
  const paymentItems = useMemo(() => payments ?? [], [payments]);
  const earningsSummary = summary as EarningsSummaryWithLifetime | undefined;
  const isLoading = summaryLoading;
  const isRefreshing = summaryFetching || historyFetching || paymentsFetching;
  const historyItems = history.items;
  const showPaymentFallback =
    !historyLoading && historyItems.length === 0 && paymentItems.length > 0;

  const money = {
    gross: earningsSummary?.totalLifetimeGross ?? earningsSummary?.totalGross ?? 0,
    net: earningsSummary?.totalLifetimeNet ?? earningsSummary?.totalNet ?? 0,
    paid: earningsSummary?.totalPaid ?? 0,
    pending: earningsSummary?.totalPending ?? 0,
  };

  const paymentTotals = useMemo(() => {
    const succeeded = paymentItems.filter((payment) => payment.status === "SUCCEEDED");
    const pending = paymentItems.filter((payment) => payment.status === "PENDING");
    return {
      paidCents: succeeded.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      pendingCents: pending.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      feesCents: paymentItems.reduce((sum, payment) => sum + payment.feeCents, 0),
      succeededCount: succeeded.length,
      pendingCount: pending.length,
    };
  }, [paymentItems]);

  const refreshAll = () => {
    void refetchSummary();
    void refetchHistory();
    void refetchPayments();
  };

  return (
    <main className="min-h-screen bg-workon-bg px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <Wallet className="h-3.5 w-3.5 text-workon-gold" />
                  Revenus travailleur
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  Mes revenus
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                  Suis tes gains, les montants en attente et le lien entre
                  missions, factures, escrow et versements bancaires.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={refreshAll}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {isRefreshing ? (
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
                  <CreditCard className="h-4 w-4" />
                </Link>
                <a
                  href="https://connect.stripe.com/express_login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Stripe
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <EarningsMetric
                icon={DollarSign}
                label="Brut"
                value={formatCADFromDollars(money.gross)}
                detail="Avant frais et ajustements"
                loading={summaryLoading}
              />
              <EarningsMetric
                icon={TrendingUp}
                label="Net"
                value={formatCADFromDollars(money.net)}
                detail="Revenus conserves"
                loading={summaryLoading}
              />
              <EarningsMetric
                icon={CheckCircle}
                label="Verse"
                value={formatCADFromDollars(money.paid)}
                detail={`${paymentTotals.succeededCount} paiement(s) confirmes`}
                loading={summaryLoading}
              />
              <EarningsMetric
                icon={Clock}
                label="En attente"
                value={formatCADFromDollars(money.pending)}
                detail={`${paymentTotals.pendingCount} paiement(s) en traitement`}
                loading={summaryLoading}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <ShieldCheck className="h-4 w-4 text-workon-gold" />
                  Les frais de plateforme sont suivis cote paiement; ta part
                  reste visible ici avant de passer aux versements.
                </div>
                <div className="flex flex-wrap gap-2">
                  <FinancePill icon={Percent} label="Ta part" value="100%" />
                  <FinancePill icon={Receipt} label="Historique" value={`${history.total} ligne(s)`} />
                  <FinancePill icon={Banknote} label="Paiements" value={`${paymentItems.length}`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <StatePanel
            icon={Loader2}
            title="Chargement des revenus"
            text="On recupere ton resume financier et l'historique des missions."
            spinning
          />
        ) : summaryError ? (
          <StatePanel
            icon={AlertCircle}
            title="Revenus indisponibles"
            text="Impossible de charger le resume financier pour le moment."
            tone="danger"
            action={
              <button
                type="button"
                onClick={refreshAll}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
              >
                Reessayer
                <RefreshCw className="h-4 w-4" />
              </button>
            }
          />
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Lecture rapide
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                  Resume financier
                </h2>

                <div className="mt-5 space-y-3">
                  <SummaryRow label="Total brut" value={formatCADFromDollars(money.gross)} />
                  <SummaryRow label="Total net" value={formatCADFromDollars(money.net)} tone="good" />
                  <SummaryRow label="Verse" value={formatCADFromDollars(money.paid)} tone="good" />
                  <SummaryRow label="En attente" value={formatCADFromDollars(money.pending)} tone="warn" />
                  <SummaryRow label="Frais suivis" value={formatCAD(paymentTotals.feesCents)} />
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button asChild className="rounded-full bg-workon-primary font-bold text-white hover:bg-workon-primary-hover">
                    <Link href="/worker/payments">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Gerer mes paiements
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-workon-border font-bold text-workon-ink">
                    <Link href="/receipts">
                      <FileText className="mr-2 h-4 w-4" />
                      Voir mes recus
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                      Suivi
                    </p>
                    <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                      Historique des revenus
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-workon-muted">
                    {historyItems.length > 0
                      ? `${historyItems.length} / ${history.total} ligne(s)`
                      : "Dernieres lignes"}
                  </p>
                </div>

                <HistoryList
                  isLoading={historyLoading}
                  historyError={Boolean(historyError)}
                  historyItems={historyItems}
                  paymentFallback={showPaymentFallback ? paymentItems : []}
                  paymentsLoading={paymentsLoading}
                />

              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <TrustStep
                icon={ShieldCheck}
                title="Escrow synchronise"
                text="Les montants suivent les missions facturees et les paiements liberes."
              />
              <TrustStep
                icon={CreditCard}
                title="Versements geres"
                text="La configuration bancaire reste disponible depuis la page paiements."
              />
              <TrustStep
                icon={Receipt}
                title="Pieces conservees"
                text="Les recus et factures restent accessibles pour ton suivi administratif."
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function EarningsMetric({
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
  loading?: boolean;
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

function FinancePill({
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

function HistoryList({
  isLoading,
  historyError,
  historyItems,
  paymentFallback,
  paymentsLoading,
}: {
  isLoading: boolean;
  historyError: boolean;
  historyItems: EarningsHistoryItem[];
  paymentFallback: WorkerPayment[];
  paymentsLoading: boolean;
}) {
  if (isLoading || paymentsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-workon-border bg-workon-bg"
          />
        ))}
      </div>
    );
  }

  if (historyItems.length > 0) {
    return (
      <div className="space-y-3">
        {historyItems.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </div>
    );
  }

  if (paymentFallback.length > 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-workon-primary/20 bg-workon-primary/5 p-3 text-xs font-semibold text-workon-primary">
          Historique legacy indisponible; affichage des paiements reels issus du
          flux facture/escrow.
        </div>
        {paymentFallback.map((payment) => (
          <PaymentFallbackRow key={payment.id} payment={payment} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream px-4 py-10 text-center">
      <Inbox className="mb-3 h-10 w-10 text-workon-primary" />
      <p className="text-lg font-black text-workon-ink">
        {historyError ? "Aucun historique disponible" : "Aucun revenu pour le moment"}
      </p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-workon-muted">
        Termine des missions facturees pour voir les revenus, les statuts et les
        montants nets apparaitre ici.
      </p>
    </div>
  );
}

function HistoryRow({ item }: { item: EarningsHistoryItem }) {
  const status = HISTORY_STATUS[item.status] ?? HISTORY_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <article className="rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/30 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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
            <span className="text-xs font-semibold text-workon-muted">
              {formatDate(item.date)}
            </span>
          </div>
          <h3 className="truncate text-base font-black text-workon-ink">
            {item.missionTitle}
          </h3>
        </div>
        <span className="text-lg font-black text-workon-primary">
          {formatCADFromDollars(item.amount)}
        </span>
      </div>
    </article>
  );
}

function PaymentFallbackRow({ payment }: { payment: WorkerPayment }) {
  const status = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.PENDING;
  const StatusIcon = status.icon;
  const currency = payment.currency || "CAD";

  return (
    <article className="rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/30 hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
            {payment.invoiceNumber && (
              <span className="text-xs font-bold text-workon-muted">
                Facture {payment.invoiceNumber}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-black text-workon-ink">
            {payment.missionTitle}
          </h3>
          <p className="mt-1 text-xs font-semibold text-workon-muted">
            {payment.missionCategory ?? "Categorie a confirmer"} -{" "}
            {formatDate(payment.completedAt ?? payment.createdAt)}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[390px]">
          <PaymentFact label="Brut" value={formatCAD(payment.amountCents, currency)} />
          <PaymentFact label="Frais" value={formatCAD(payment.feeCents, currency)} />
          <PaymentFact label="Net" value={formatCAD(payment.netAmountCents, currency)} highlight />
        </div>
      </div>
    </article>
  );
}

function PaymentFact({
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
      <p className={cn("mt-1 text-sm font-black", highlight ? "text-emerald-700" : "text-workon-ink")}>
        {value}
      </p>
    </div>
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

function TrustStep({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-workon-border bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-workon-primary/10 text-workon-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
    </div>
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
          tone === "danger" ? "bg-red-50 text-red-600" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-muted">{text}</p>
      {action}
    </section>
  );
}
