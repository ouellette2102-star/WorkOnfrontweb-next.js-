"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, FileText, Lock, Info } from "lucide-react";

const PLATFORM_FEE_PCT = 15;    // mirrors backend CommissionCalculator
const QC_TAX_PCT = 14.975;      // GST 5% + QST 9.975%
const DEPOSIT_PCT = 50;         // % du total payé maintenant (escrow)

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
  const deposit = Math.round(totalClient * (DEPOSIT_PCT / 100));
  const balanceDue = totalClient - deposit;
  const workerReceives = base - platformFee;

  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}min` : ""}`
      : `${durationMinutes}min`;

  const scheduledLabel = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString("fr-CA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "—";

  if (base === 0) return null;

  return (
    <div className="rounded-2xl border border-workon-border bg-white shadow-sm overflow-hidden">

      {/* ── En-tête mission ── */}
      <div className="px-4 pt-4 pb-3 border-b border-workon-border">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-workon-muted mb-1">
          Récapitulatif de réservation
        </p>
        <p className="font-semibold text-workon-ink">
          {workerName}{workerJobTitle ? ` · ${workerJobTitle}` : ""}
        </p>
        <p className="text-xs text-workon-muted mt-0.5 capitalize">
          {scheduledLabel} · {durationLabel}
        </p>
      </div>

      {/* ── Détails du contrat ── */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-bold text-workon-ink">Détails du contrat</p>

        <div className="space-y-2 text-sm">
          <Line label="Service" value={`${base} $`} />
          <Line
            label={`Frais de plateforme (${PLATFORM_FEE_PCT}%)`}
            value={`${platformFee} $`}
            muted
            tooltip="Couvre l'assurance, Stripe et la plateforme WorkOn"
          />
          <Line
            label={`Taxes (TPS + TVQ ${QC_TAX_PCT}%)`}
            value={`${taxes} $`}
            muted
          />
          <div className="border-t border-workon-border my-1" />
          <Line label="Total" value={`${totalClient} $`} bold />
        </div>
      </div>

      {/* ── Paiement maintenant vs à la fin ── */}
      <div className="mx-4 mb-3 rounded-xl border border-workon-primary/20 bg-workon-primary/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-workon-primary">Dépôt maintenant ({DEPOSIT_PCT}%)</p>
            <p className="text-[11px] text-workon-muted">Retenu en escrow Stripe jusqu&apos;à complétion</p>
          </div>
          <p className="text-lg font-bold text-workon-primary">{deposit} $</p>
        </div>
        <div className="border-t border-workon-primary/20" />
        <div className="flex items-center justify-between text-xs text-workon-muted">
          <span>Solde à la complétion</span>
          <span className="font-semibold">{balanceDue} $</span>
        </div>
      </div>

      {/* ── Escrow ── */}
      <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-workon-border bg-workon-bg p-3">
        <Lock className="h-4 w-4 text-workon-primary mt-0.5 shrink-0" />
        <p className="text-xs text-workon-ink leading-relaxed">
          <strong>Paiement protégé.</strong> Ton dépôt est retenu par Stripe et libéré au pro seulement après que tu confirmes la complétion. Le pro reçoit <strong>{workerReceives} $</strong>.
        </p>
      </div>

      {/* ── Contrat dépliable ── */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setContractOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left text-xs font-semibold text-workon-ink py-2 border-t border-workon-border hover:text-workon-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-workon-primary" />
            Termes du contrat
          </span>
          {contractOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {contractOpen && (
          <div className="mt-2 rounded-xl border border-workon-border bg-workon-bg p-3 text-[11px] text-workon-muted leading-relaxed space-y-2">
            <p><strong className="text-workon-ink">Annulation :</strong> Gratuite jusqu&apos;à 24h avant. Au-delà, 50% du prix est retenu.</p>
            <p><strong className="text-workon-ink">Commission :</strong> WorkOn prélève {PLATFORM_FEE_PCT}% pour couvrir Stripe, l&apos;assurance et la plateforme.</p>
            <p><strong className="text-workon-ink">Assurance :</strong> Couverture jusqu&apos;à 2 000 000 $ en responsabilité civile par mission.</p>
            <p><strong className="text-workon-ink">Statut du pro :</strong> Travailleur autonome indépendant. WorkOn n&apos;est pas l&apos;employeur et n&apos;est pas partie au contrat de service.</p>
          </div>
        )}
      </div>

      {/* ── Footer légal ── */}
      <div className="px-4 pb-4 flex items-center gap-1.5 text-[10px] text-workon-muted">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        En confirmant, tu acceptes les termes ci-dessus et autorises le dépôt Stripe.
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  bold = false,
  muted = false,
  tooltip,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`flex items-center gap-1 ${muted ? "text-workon-muted" : "text-workon-ink"}`}>
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <Info className="h-3 w-3 text-workon-muted" />
          </span>
        )}
      </span>
      <span className={`tabular-nums shrink-0 ${bold ? "font-bold text-workon-ink" : muted ? "text-workon-muted" : "text-workon-ink"}`}>
        {value}
      </span>
    </div>
  );
}
