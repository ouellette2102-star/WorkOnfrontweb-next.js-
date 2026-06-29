"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  Download,
  FileCheck2,
  FileText,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  getInvoiceAcceptedCount,
  getInvoiceDisplayNumber,
  getInvoiceParties,
  getInvoiceReviewState,
  getInvoiceStatusMeta,
  getInvoiceTitle,
  invoiceNeedsReview,
} from "../_invoice-ui";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [downloading, setDownloading] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api.getInvoice(invoiceId),
  });

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await api.downloadInvoicePdf(invoiceId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Telechargement echoue");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="h-96 animate-pulse rounded-2xl bg-white" />
          <div className="h-96 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-workon-bg p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-4 font-semibold text-red-700">Facture introuvable</p>
          <Button asChild variant="outline">
            <Link href="/invoices">Retour aux factures</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = getInvoiceStatusMeta(invoice.status);
  const review = getInvoiceReviewState(invoice);
  const parties = getInvoiceParties(invoice);
  const acceptedCount = getInvoiceAcceptedCount(invoice);
  const needsReview = invoiceNeedsReview(invoice);

  return (
    <main
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      data-testid="invoice-detail-page"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux factures
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/missions/mine">
            Missions <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-workon-ink via-slate-900 to-zinc-900 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <ReceiptText className="h-3.5 w-3.5 text-workon-accent" />
              Dossier facture
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {getInvoiceDisplayNumber(invoice)}
            </h1>
            <p className="mt-2 text-lg text-white/80">{getInvoiceTitle(invoice)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                {status.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                <ShieldCheck className="h-3.5 w-3.5" />
                {review.label}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm text-white/65">Total facture</p>
            <p className="mt-2 text-4xl font-bold">
              {formatInvoiceAmount(invoice.total, invoice.currency)}
            </p>
            <p className="mt-3 text-sm text-white/70">{review.detail}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Generation..." : "Telecharger PDF"}
              </Button>
              {needsReview && (
                <Button asChild className="bg-white text-workon-ink hover:bg-white/90">
                  <Link href={`/invoices/${invoiceId}/review`}>
                    Ouvrir la revue
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={CalendarClock}
          label="Creee"
          value={formatInvoiceDate(invoice.createdAt)}
          detail={invoice.paidAt ? `Payee ${formatInvoiceDate(invoice.paidAt)}` : "Paiement non date"}
        />
        <SummaryTile
          icon={Users}
          label="Parties"
          value={`${parties.supplier} / ${parties.client}`}
          detail="Fournisseur et client"
        />
        <SummaryTile
          icon={ShieldCheck}
          label="Acceptations"
          value={`${acceptedCount}/2`}
          detail={review.label}
        />
        <SummaryTile
          icon={Banknote}
          label="Ouvert"
          value={formatInvoiceAmount(
            invoice.status === "PAID" ? 0 : invoice.total,
            invoice.currency,
          )}
          detail={status.description}
        />
      </section>

      {needsReview && (
        <StatusPanel
          tone="warning"
          icon={ShieldAlert}
          title="Revue bilaterale requise"
          text="Les fonds sont en escrow. Les deux parties doivent confirmer la prestation pour debloquer le versement vers le prestataire."
          href={`/invoices/${invoiceId}/review`}
          action="Ouvrir la revue"
        />
      )}

      {invoice.review.escrowReleasedAt && (
        <StatusPanel
          tone="success"
          icon={FileCheck2}
          title={`Escrow debloque le ${formatInvoiceDate(invoice.review.escrowReleasedAt)}`}
          text="Le transfert vers le prestataire a ete lance via Stripe Connect."
        />
      )}

      {invoice.review.clientDisputedAt && !invoice.review.escrowReleasedAt && (
        <StatusPanel
          tone="danger"
          icon={ShieldAlert}
          title="Facture contestee"
          text={invoice.review.disputeReason || "Les fonds restent bloques en escrow jusqu'a resolution WorkOn."}
          href={`/invoices/${invoiceId}/review`}
          action="Voir le litige"
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-workon-accent" />
              <h2 className="text-lg font-bold text-workon-ink">
                Parties legales
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <PartyBlock
                label="Fournisseur"
                name={invoice.supplier.name}
                address={invoice.supplier.address}
                gstNumber={invoice.supplier.gstNumber}
                qstNumber={invoice.supplier.qstNumber}
              />
              <PartyBlock
                label="Client"
                name={invoice.client.name}
                address={invoice.client.address}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-workon-accent" />
              <h2 className="text-lg font-bold text-workon-ink">
                Detail du montant
              </h2>
            </div>
            <div className="space-y-3">
              <AmountRow
                label="Sous-total"
                value={formatInvoiceAmount(invoice.subtotal, invoice.currency)}
              />
              <AmountRow
                label="Frais plateforme"
                value={formatInvoiceAmount(invoice.platformFee, invoice.currency)}
              />
              <AmountRow
                label="TPS (5%)"
                value={formatInvoiceAmount(invoice.tps, invoice.currency)}
              />
              <AmountRow
                label="TVQ (9,975%)"
                value={formatInvoiceAmount(invoice.tvq, invoice.currency)}
              />
              <AmountRow
                label="Taxes totales"
                value={formatInvoiceAmount(invoice.taxes, invoice.currency)}
              />
              <div className="border-t border-workon-border pt-3">
                <AmountRow
                  label="Total"
                  value={formatInvoiceAmount(invoice.total, invoice.currency)}
                  strong
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-workon-accent" />
              <h2 className="text-base font-bold text-workon-ink">
                Actions facture
              </h2>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Generation..." : "Telecharger la facture PDF"}
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/invoices/${invoiceId}/review`}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Revue escrow
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/missions/mine">
                  <FileText className="mr-2 h-4 w-4" />
                  Mission associee
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-workon-ink">
              Reference
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label="Numero" value={getInvoiceDisplayNumber(invoice)} mono />
              <InfoRow label="ID facture" value={invoice.id} mono />
              <InfoRow
                label="Mission"
                value={invoice.missionId ?? "Non liee"}
                mono={Boolean(invoice.missionId)}
              />
              <InfoRow label="Devise" value={invoice.currency} />
            </dl>
          </div>

          {invoice.paymentTerms && (
            <div className="rounded-2xl border border-workon-border bg-white p-5 text-sm text-workon-muted shadow-sm">
              <p className="mb-2 font-semibold text-workon-ink">
                Conditions de paiement
              </p>
              <p>{invoice.paymentTerms}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function SummaryTile({
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
    <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-workon-accent/10 text-workon-accent">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-workon-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-workon-ink">{value}</p>
      <p className="mt-1 text-xs text-workon-muted">{detail}</p>
    </div>
  );
}

function StatusPanel({
  tone,
  icon: Icon,
  title,
  text,
  href,
  action,
}: {
  tone: "warning" | "success" | "danger";
  icon: typeof ShieldAlert;
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "danger"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <section className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-1 text-sm opacity-85">{text}</p>
          </div>
        </div>
        {href && action && (
          <Button asChild variant="outline" className="border-current bg-white/40">
            <Link href={href}>{action}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function PartyBlock({
  label,
  name,
  address,
  gstNumber,
  qstNumber,
}: {
  label: string;
  name: string | null;
  address: string | null;
  gstNumber?: string | null;
  qstNumber?: string | null;
}) {
  return (
    <div className="rounded-xl bg-workon-bg p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-workon-muted">
        {label}
      </p>
      <p className="mt-2 font-bold text-workon-ink">{name ?? "-"}</p>
      {address && <p className="mt-1 text-sm text-workon-muted">{address}</p>}
      {gstNumber && (
        <p className="mt-2 text-xs text-workon-muted">
          TPS: <span className="font-mono">{gstNumber}</span>
        </p>
      )}
      {qstNumber && (
        <p className="text-xs text-workon-muted">
          TVQ: <span className="font-mono">{qstNumber}</span>
        </p>
      )}
    </div>
  );
}

function AmountRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-bold text-workon-ink" : "text-workon-muted"}>
        {label}
      </span>
      <span className={strong ? "text-xl font-bold text-workon-accent" : "font-semibold text-workon-ink"}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-workon-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold text-workon-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
