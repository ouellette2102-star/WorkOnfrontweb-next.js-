"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, FileText, Lock } from "lucide-react";

/**
 * BookingRecapCard — drop-in summary + Stripe deposit messaging shown
 * above the "Confirmer la réservation" CTA on /reserve/[workerId].
 *
 * Responsibilities:
 *  - Show what the client is about to commit to (title, duration, price)
 *  - Break the price down transparently (base / platform fee / deposit held)
 *  - Expose the contract terms inline via an expandable panel so users
 *    don't need to leave the page to accept them
 *  - Reinforce the escrow model: money is held by Stripe, not the platform
 *
 * Intentionally dumb: all state is derived from props, the caller owns
 * the form.
 */
const PLATFORM_FEE_PCT = 15; // Source of truth mirrors backend CommissionCalculator.
const QC_TAX_PCT = 14.975; // GST 5% + QST 9.975%

export function BookingRecapCard({
  workerName,
  workerJobTitle,
  priceCad,
  durationMinutes,
  scheduledDate,
}: {
  workerName: string;
  workerJobTitle?: string | null;
  priceCad: number;
  durationMinutes: number;
  scheduledDate: string;
}) {
  const [contractOpen, setContractOpen] = useState(false);

  const base = Math.max(0, priceCad);
  const platformFee = Math.round(base * (PLATFORM_FEE_PCT / 100));
  const taxes = Math.round(base * (QC_TAX_PCT / 100));
  const totalClient = base + taxes;
  const workerReceives = base - platformFee;

  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${
          durationMinutes % 60 ? ` ${durationMinutes % 60}min` : ""
        }`
      : `${durationMinutes}min`;

  const scheduledLabel = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString("fr-CA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "—";

  return (
    <div className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-workon-muted">
            Récapitulatif
          </p>
          <p className="mt-0.5 text-sm text-workon-ink truncate">
            <strong>{workerName}</strong>
            {workerJobTitle ? ` · ${workerJobTitle}` : ""}
          </p>
          <p className="text-xs text-workon-muted mt-0.5 capitalize">
            {scheduledLabel} · {durationLabel}
          </p>
        </div>
      </div>

      {/* Price breakdown */}
      {base > 0 && (
        <div className="rounded-xl bg-workon-bg-cream/60 border border-workon-border p-3 space-y-1.5 text-sm">
          <Line label="Service" value={`${base} $`} />
          <Line
            label={`Taxes (${QC_TAX_PCT.toFixed(3)}%)`}
            value={`${taxes} $`}
            muted
          />
          <div className="border-t border-workon-border my-1" />
          <Line label="Total client" value={`${totalClient} $`} bold />
          <div className="pt-1 text-[11px] text-workon-muted leading-relaxed">
            Le pro reçoit <strong>{workerReceives} $</strong> après
            commission plateforme de {PLATFORM_FEE_PCT}%.
          </div>
        </div>
      )}

      {/* Escrow reassurance */}
      <div className="flex items-start gap-2 rounded-xl border border-workon-primary/20 bg-workon-primary-subtle/30 p-3">
        <Lock className="h-4 w-4 text-workon-primary mt-0.5 shrink-0" />
        <div className="text-xs text-workon-ink leading-relaxed">
          <strong>Paiement sécurisé en escrow.</strong> Ton dépôt est retenu
          par Stripe et libéré au pro seulement après la complétion de la
          mission.
        </div>
      </div>

      {/* Expandable contract terms */}
      <div>
        <button
          type="button"
          onClick={() => setContractOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left text-xs font-semibold text-workon-ink py-1 hover:text-workon-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-workon-primary" />
            Voir le contrat
          </span>
          {contractOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        {contractOpen && (
          <div className="mt-2 rounded-xl border border-workon-border bg-workon-bg-cream/40 p-3 text-[11px] text-workon-gray leading-relaxed space-y-2">
            <p>
              <strong className="text-workon-ink">Annulation :</strong>{" "}
              Gratuite jusqu&apos;à 24h avant la mission. Au-delà, 50% du
              prix est retenu.
            </p>
            <p>
              <strong className="text-workon-ink">Commission :</strong>{" "}
              WorkOn prélève {PLATFORM_FEE_PCT}% du prix de base pour
              couvrir Stripe, l&apos;assurance et la plateforme.
            </p>
            <p>
              <strong className="text-workon-ink">Assurance :</strong>{" "}
              Chaque mission est couverte jusqu&apos;à 2 000 000 $ en
              responsabilité civile. Détails sur{" "}
              <a
                href="/legal/assurance"
                className="underline text-workon-primary"
              >
                /legal/assurance
              </a>
              .
            </p>
            <p>
              <strong className="text-workon-ink">Statut du pro :</strong>{" "}
              Travailleur autonome. WorkOn n&apos;est pas l&apos;employeur
              du pro et n&apos;est pas partie au contrat de service.
            </p>
          </div>
        )}
      </div>

      {/* Trust row */}
      <div className="flex items-center gap-2 text-[11px] text-workon-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-workon-primary" />
        <span>
          En confirmant, tu acceptes les termes ci-dessus et autorises le
          dépôt Stripe.
        </span>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={muted ? "text-workon-muted" : "text-workon-ink"}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          bold ? "font-bold text-workon-ink" : muted ? "text-workon-muted" : "text-workon-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
