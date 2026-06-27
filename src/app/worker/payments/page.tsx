"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { RequireWorkerClient } from "@/components/auth/require-worker-client";
import { Button } from "@/components/ui/button";
import { getOnboardingStatus, type WorkerPayment } from "@/lib/stripe-api";
import { api } from "@/lib/api-client";
import type { StripeConnectStatus } from "@/lib/api-schemas";
import { EmbeddedConnectOnboarding } from "@/components/worker/embedded-connect-onboarding";
import { cn } from "@/lib/utils";

const PAYMENT_STATUS: Record<
  WorkerPayment["status"],
  { label: string; className: string; icon: LucideIcon }
> = {
  SUCCEEDED: {
    label: "Paye",
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

function formatMoney(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "Date a confirmer";
  return format(new Date(value), "d MMM yyyy", { locale: frCA });
}

export default function WorkerPaymentsPage() {
  return (
    <RequireWorkerClient>
      <WorkerPaymentsContent />
    </RequireWorkerClient>
  );
}

function WorkerPaymentsContent() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [showEmbedded, setShowEmbedded] = useState(false);

  const isOnboarded = connectStatus?.onboarded === true;
  const requirementsCount = connectStatus?.requirementsNeeded.length ?? 0;

  useEffect(() => {
    const loadStatus = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const token = getAccessToken();
        if (!token) return;

        const status = await getOnboardingStatus(token);
        setConnectStatus(status);
      } catch (error) {
        console.error("Erreur lors du chargement du statut:", error);
        toast.error("Impossible de verifier le statut Stripe");
      } finally {
        setIsLoadingStatus(false);
      }
    };

    loadStatus();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const loadPayments = async () => {
      if (authLoading || !isAuthenticated || !isOnboarded) {
        setIsLoadingPayments(false);
        return;
      }

      try {
        const token = getAccessToken();
        if (!token) return;

        // Real payouts from the Invoice/escrow flow (source of truth), not the
        // legacy /stripe/worker/history which reads the dead Clerk-era table.
        const data = await api.getWorkerEarningsPayments();
        setPayments(data);
      } catch (error) {
        console.error("Erreur lors du chargement des paiements:", error);
        toast.error("Impossible de charger les paiements");
      } finally {
        setIsLoadingPayments(false);
      }
    };

    loadPayments();
  }, [authLoading, isAuthenticated, isOnboarded]);

  const totals = useMemo(() => {
    const succeeded = payments.filter((payment) => payment.status === "SUCCEEDED");
    const pending = payments.filter((payment) => payment.status === "PENDING");
    return {
      paidCents: succeeded.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      pendingCents: pending.reduce((sum, payment) => sum + payment.netAmountCents, 0),
      feesCents: payments.reduce((sum, payment) => sum + payment.feeCents, 0),
      paidCount: succeeded.length,
      pendingCount: pending.length,
    };
  }, [payments]);

  if (isLoadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg px-4">
        <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-workon-primary" />
          <p className="text-sm font-bold text-workon-ink">Chargement des paiements</p>
          <p className="mt-1 text-xs text-workon-muted">Verification du statut Stripe Connect.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-workon-bg px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <Wallet className="h-3.5 w-3.5 text-workon-gold" />
                  Paiements travailleur
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  Mes paiements
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                  Configure les versements, suis les fonds en attente et garde
                  le lien entre mission, facture et paiement.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                {!isOnboarded && !showEmbedded && (
                  <button
                    type="button"
                    onClick={() => setShowEmbedded(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
                  >
                    Configurer mes paiements
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <Link
                  href="/earnings"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Voir mes revenus
                  <BarChart3 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <PaymentMetric
                icon={ShieldCheck}
                label="Stripe Connect"
                value={isOnboarded ? "Actif" : "A faire"}
                detail={requirementsCount ? `${requirementsCount} exigence(s)` : "Statut synchronise"}
              />
              <PaymentMetric
                icon={Banknote}
                label="Versements"
                value={connectStatus?.payoutsEnabled ? "Actifs" : "Bloques"}
                detail={isOnboarded ? "Compte pret" : "Configuration requise"}
              />
              <PaymentMetric
                icon={Clock}
                label="En attente"
                value={formatMoney(totals.pendingCents)}
                detail={`${totals.pendingCount} paiement(s)`}
              />
              <PaymentMetric
                icon={Wallet}
                label="Net recu"
                value={formatMoney(totals.paidCents)}
                detail={`${totals.paidCount} mission(s) payee(s)`}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <CreditCard className="h-4 w-4 text-workon-gold" />
                  {isOnboarded
                    ? "Les paiements complétés apparaissent depuis le flux facture/escrow."
                    : "Configuration Stripe requise avant les versements bancaires."}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ConnectPill
                    label="Paiements"
                    ok={connectStatus?.chargesEnabled === true}
                  />
                  <ConnectPill
                    label="Versements"
                    ok={connectStatus?.payoutsEnabled === true}
                  />
                  <ConnectPill
                    label="Dossier"
                    ok={isOnboarded && requirementsCount === 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isOnboarded && !showEmbedded && (
          <section className="grid gap-4 pt-28 md:pt-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                    Etape requise
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                    Configure tes paiements
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-workon-gray">
                    Pour recevoir ton argent directement sur ton compte
                    bancaire, configure ton compte Stripe Connect. Ca prend
                    quelques minutes et reste integre dans WorkOn.
                  </p>
                </div>
                <Button onClick={() => setShowEmbedded(true)} variant="hero" size="hero">
                  Configurer mes paiements
                </Button>
              </div>
            </div>

            <PaymentChecklist
              items={[
                { label: "Compte Connect", done: connectStatus?.chargesEnabled === true },
                { label: "Versements bancaires", done: connectStatus?.payoutsEnabled === true },
                { label: "Exigences Stripe", done: requirementsCount === 0 },
              ]}
            />
          </section>
        )}

        {!isOnboarded && showEmbedded && (
          <section className="rounded-[28px] border border-workon-border bg-white p-5 pt-28 shadow-sm sm:p-6 md:pt-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                  Stripe Connect
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
                  Configuration securisee
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-workon-gray">
                  Termine les informations demandees par Stripe. La page se
                  rafraichira quand l&apos;onboarding sera complete.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmbedded(false)}
                className="inline-flex items-center justify-center rounded-full border border-workon-border px-4 py-2 text-sm font-bold text-workon-stone transition hover:bg-workon-bg"
              >
                Revenir au resume
              </button>
            </div>
            <EmbeddedConnectOnboarding onComplete={() => window.location.reload()} />
          </section>
        )}

        {isOnboarded && (
          <section className="grid gap-4 pt-28 md:pt-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
                Resume financier
              </p>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Net recu" value={formatMoney(totals.paidCents)} tone="good" />
                <SummaryRow label="En attente" value={formatMoney(totals.pendingCents)} tone="warn" />
                <SummaryRow label="Frais suivis" value={formatMoney(totals.feesCents)} />
                <SummaryRow label="Paiements listes" value={String(payments.length)} />
              </div>
              <Link
                href="/receipts"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
              >
                Voir mes recus
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <PaymentsHistory
              isLoading={isLoadingPayments}
              payments={payments}
            />
          </section>
        )}

        {!isOnboarded && (
          <section className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6 lg:pt-44">
            <div className="grid gap-3 md:grid-cols-3">
              <TrustStep
                icon={ShieldCheck}
                title="Escrow protege"
                text="Les paiements restent lies aux missions et factures WorkOn."
              />
              <TrustStep
                icon={CreditCard}
                title="Stripe integre"
                text="La configuration se fait dans WorkOn avec Stripe Connect."
              />
              <TrustStep
                icon={FileText}
                title="Historique conserve"
                text="Revenus, recus et statut restent consultables apres mission."
              />
            </div>
          </section>
        )}

        <div className="text-center">
          <Link
            href="/worker/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-workon-muted transition hover:text-workon-primary"
          >
            Retour au dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function PaymentMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black tracking-tight">{value}</p>
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

function ConnectPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
        ok ? "border-emerald-300/35 bg-emerald-400/12 text-emerald-100" : "border-white/15 bg-white/10 text-white/65",
      )}
    >
      {ok ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

function PaymentChecklist({
  items,
}: {
  items: Array<{ label: string; done: boolean }>;
}) {
  return (
    <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
        Checklist
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-workon-bg-cream p-3">
            <span className="text-sm font-bold text-workon-ink">{item.label}</span>
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                item.done ? "bg-emerald-50 text-emerald-600" : "bg-white text-workon-muted",
              )}
            >
              {item.done ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsHistory({
  isLoading,
  payments,
}: {
  isLoading: boolean;
  payments: WorkerPayment[];
}) {
  return (
    <div className="rounded-[28px] border border-workon-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-workon-stone">
            Historique
          </p>
          <h2 className="font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
            Paiements de mission
          </h2>
        </div>
        <p className="text-xs font-semibold text-workon-muted">
          Source: factures et escrow WorkOn
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl border border-workon-border bg-workon-bg"
            />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream px-4 py-10 text-center">
          <Wallet className="mb-3 h-10 w-10 text-workon-primary" />
          <p className="text-lg font-black text-workon-ink">Aucun paiement encore</p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-workon-muted">
            Les paiements de tes missions completees apparaitront ici avec le
            montant net, les frais et le statut de versement.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment }: { payment: WorkerPayment }) {
  const statusConfig = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.PENDING;
  const StatusIcon = statusConfig.icon;
  const currency = payment.currency || "CAD";

  return (
    <article className="rounded-2xl border border-workon-border bg-white p-4 transition hover:border-workon-primary/30 hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                statusConfig.className,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
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
            {payment.missionCategory ?? "Categorie a confirmer"} - {formatDate(payment.completedAt ?? payment.createdAt)}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
          <PaymentFact label="Brut" value={formatMoney(payment.amountCents, currency)} />
          <PaymentFact label="Frais" value={formatMoney(payment.feeCents, currency)} />
          <PaymentFact label="Net" value={formatMoney(payment.netAmountCents, currency)} highlight />
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
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-workon-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
    </div>
  );
}
