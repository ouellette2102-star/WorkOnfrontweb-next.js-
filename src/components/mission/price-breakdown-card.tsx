"use client";

import { useQuery } from "@tanstack/react-query";
import { Info, Loader2, AlertCircle } from "lucide-react";
import { api, type InvoicePreview } from "@/lib/api-client";

/**
 * Pre-checkout invoice breakdown.
 *
 * Calls `GET /payments/preview` so the employer sees *exactly* what
 * Stripe will charge before they hit "Pay": the service price, the
 * WorkOn platform fee (live percent from config), the TPS/TVQ split
 * when taxes are enabled, and the final total.
 *
 * Before this component, users saw only the raw mission price and
 * were surprised by a $129.98 charge when they booked a $100 gig.
 */

export interface PriceBreakdownCardProps {
  /** Raw mission price in CAD dollars. */
  priceDollars: number;
  /** Data-testid root for E2E coverage. */
  testId?: string;
  /**
   * Children rendered below the breakdown — typically the pay button,
   * which receives the authoritative total via the render prop below.
   */
  children?: (state: {
    preview: InvoicePreview | null;
    loading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

function formatCAD(amount: number, currency = "CAD"): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatPercent(rate: number): string {
  // Turn 0.09975 into "9,975 %" in fr-CA format
  return `${(rate * 100).toLocaleString("fr-CA", {
    maximumFractionDigits: 3,
  })} %`;
}

export function PriceBreakdownCard({
  priceDollars,
  testId = "price-breakdown",
  children,
}: PriceBreakdownCardProps) {
  const priceCents = Math.round(priceDollars * 100);
  const enabled = priceCents > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoice-preview", priceCents],
    queryFn: () => api.previewInvoice(priceCents),
    enabled,
    staleTime: 60_000,
  });

  const preview = data ?? null;
  const errorMessage = isError
    ? "Impossible de calculer le total. Réessaie dans un instant."
    : null;

  if (!enabled) {
    return (
      <div
        className="rounded-2xl border border-workon-border bg-white p-4"
        data-testid={`${testId}-empty`}
      >
        <p className="text-sm text-workon-muted">
          Le prix de la mission n&apos;est pas encore confirmé. La ventilation
          sera affichée dès qu&apos;un montant sera saisi.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-workon-border bg-white p-4 space-y-3"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-workon-ink">
          Détail du paiement
        </h3>
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin text-workon-muted"
            data-testid={`${testId}-loading`}
          />
        )}
      </div>

      {errorMessage && (
        <div
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
          data-testid={`${testId}-error`}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {preview && (
        <>
          <dl className="space-y-1.5 text-sm">
            <Row
              label="Sous-total"
              value={formatCAD(preview.subtotal, preview.currency)}
              testId={`${testId}-subtotal`}
            />
            <Row
              label={`Commission WorkOn (${formatPercent(
                preview.platformFeePercent / 100,
              )})`}
              value={formatCAD(preview.platformFee, preview.currency)}
              testId={`${testId}-platform-fee`}
              help="Ce qui permet à WorkOn de faire fonctionner la plateforme : paiements escrow, support, vérifications, assurance."
            />
            {preview.taxesEnabled ? (
              <>
                <Row
                  label={`TPS (${formatPercent(preview.tpsRate)})`}
                  value={formatCAD(preview.tps, preview.currency)}
                  testId={`${testId}-tps`}
                />
                <Row
                  label={`TVQ (${formatPercent(preview.tvqRate)})`}
                  value={formatCAD(preview.tvq, preview.currency)}
                  testId={`${testId}-tvq`}
                />
              </>
            ) : (
              <Row
                label="Taxes"
                value="—"
                testId={`${testId}-no-tax`}
                help="Les taxes ne sont pas collectées dans cet environnement (sandbox / dev)."
              />
            )}
          </dl>

          <div className="border-t border-workon-border pt-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-workon-ink">
                Total à payer
              </span>
              <span
                className="text-lg font-bold text-workon-ink"
                data-testid={`${testId}-total`}
              >
                {formatCAD(preview.total, preview.currency)}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-workon-muted">
              Prélevé par Stripe — escrow libéré à la fin de la mission.
            </p>
          </div>
        </>
      )}

      {children?.({
        preview,
        loading: isLoading,
        error: errorMessage,
      })}
    </div>
  );
}

function Row({
  label,
  value,
  testId,
  help,
}: {
  label: string;
  value: string;
  testId?: string;
  help?: string;
}) {
  return (
    <div
      className="flex items-baseline justify-between text-xs text-workon-gray"
      data-testid={testId}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {help && (
          <span
            className="inline-flex cursor-help items-center text-workon-muted"
            title={help}
            aria-label={help}
          >
            <Info className="h-3 w-3" />
          </span>
        )}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
