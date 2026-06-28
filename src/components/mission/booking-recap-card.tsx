"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Lock,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { QC_COMBINED_TAX_PCT, formatCAD } from "@/lib/tax";

const PLATFORM_FEE_PCT = 15;

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
  const platformFee = roundMoney(base * (PLATFORM_FEE_PCT / 100));
  const taxes = roundMoney(base * (QC_COMBINED_TAX_PCT / 100));
  // The client is charged the full amount up front via /payments/checkout:
  // service + WorkOn fee (on top) + taxes on the service. This mirrors the live
  // /payments/preview and the real Stripe charge — there is no partial deposit.
  const totalClient = roundMoney(base + platformFee + taxes);
  // The pro receives the full service price; the 15% fee is paid on top by the
  // client, never deducted from the pro.
  const workerReceives = base;

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
    : "Date à confirmer";

  return (
    <div className="workon-premium-card overflow-hidden rounded-[28px]">
      <div className="border-b border-workon-border bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
              Contrat et paiement
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-workon-ink">
              {base > 0 ? "Paiement protégé" : "Cadre prêt"}
            </p>
          </div>
          <div className="rounded-2xl bg-workon-primary-subtle p-2 text-workon-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-workon-ink">
          {workerName}{workerJobTitle ? ` / ${workerJobTitle}` : ""}
        </p>
        <p className="mt-1 text-xs capitalize text-workon-muted">
          {scheduledLabel} / {durationLabel}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-workon-border bg-workon-bg-cream px-5 py-4">
        <RecapTrustSignal icon={ShieldCheck} label="Profil" value="visible" />
        <RecapTrustSignal icon={FileText} label="Contrat" value="trace" />
        <RecapTrustSignal icon={WalletCards} label="Paiement" value={base > 0 ? "cadre" : "a definir"} />
      </div>

      {base > 0 ? (
        <>
          <div className="px-5 py-4">
            <p className="text-sm font-bold text-workon-ink">Estimation client</p>
            <div className="mt-3 space-y-2 text-sm">
              <Line label="Service" value={formatCAD(base)} />
              <Line
                label={`Frais plateforme (${PLATFORM_FEE_PCT}%)`}
                value={formatCAD(platformFee)}
                muted
                tooltip="Couvre la plateforme, les outils de suivi et l'infrastructure de paiement."
              />
              <Line
                label={`Taxes TPS + TVQ (${QC_COMBINED_TAX_PCT}%)`}
                value={formatCAD(taxes)}
                muted
              />
              <div className="my-2 border-t border-workon-border" />
              <Line label="Total estimé" value={formatCAD(totalClient)} bold />
            </div>
          </div>

          <div className="mx-5 mb-4 rounded-2xl border border-workon-primary/20 bg-workon-primary-subtle p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-workon-primary">
                  Total à payer maintenant
                </p>
                <p className="mt-1 text-xs leading-relaxed text-workon-muted">
                  Retenu par Stripe en escrow, libéré au pro à la fin de la mission.
                </p>
              </div>
              <p className="font-heading text-2xl font-bold text-workon-primary">
                {formatCAD(totalClient)}
              </p>
            </div>
            <div className="mt-3 border-t border-workon-primary/20 pt-3 text-xs text-workon-muted">
              <div className="flex items-center justify-between gap-3">
                <span>Net pro estimé</span>
                <span className="font-bold text-workon-ink">{formatCAD(workerReceives)}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="px-5 py-4">
          <div className="rounded-2xl border border-dashed border-workon-border bg-workon-bg-cream p-4">
            <div className="flex items-start gap-3">
              <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-workon-primary" />
              <div>
                <p className="font-bold text-workon-ink">Aucun montant calculé pour le moment.</p>
                <p className="mt-1 text-sm leading-relaxed text-workon-muted">
                  Entre un prix pour afficher les frais, les taxes et le total à payer avant de confirmer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-5 mb-4 flex items-start gap-2 rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-workon-primary" />
        <p className="text-xs leading-relaxed text-workon-ink">
          <strong>Paiement protégé.</strong> Le dépôt est traité par Stripe. Les détails de mission et les termes restent visibles dans WorkOn.
        </p>
      </div>

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => setContractOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 border-t border-workon-border py-3 text-left text-xs font-bold text-workon-ink transition hover:text-workon-primary"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-workon-primary" />
            Termes du contrat
          </span>
          {contractOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {contractOpen && (
          <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3 text-xs leading-relaxed text-workon-muted">
            <p>
              <strong className="text-workon-ink">Annulation :</strong> gratuite avant le délai de 24h, sauf condition différente convenue entre les parties.
            </p>
            <p className="mt-2">
              <strong className="text-workon-ink">Commission :</strong> WorkOn prélève {PLATFORM_FEE_PCT}% pour la plateforme marketplace et paiement.
            </p>
            <p className="mt-2">
              <strong className="text-workon-ink">Statut du pro :</strong> travailleur autonome indépendant. WorkOn ne joue pas le rôle employeur et ne devient pas partie au contrat de service.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-workon-border bg-white px-5 py-4 text-[11px] font-semibold text-workon-muted">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-workon-primary" />
        En confirmant, tu autorises la création de la réservation et la redirection Stripe si un paiement est requis.
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
    <div className="flex items-center justify-between gap-3">
      <span className={muted ? "flex items-center gap-1 text-workon-muted" : "flex items-center gap-1 text-workon-ink"}>
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <Info className="h-3 w-3 text-workon-muted" />
          </span>
        )}
      </span>
      <span className={bold ? "shrink-0 font-bold tabular-nums text-workon-ink" : muted ? "shrink-0 tabular-nums text-workon-muted" : "shrink-0 tabular-nums text-workon-ink"}>
        {value}
      </span>
    </div>
  );
}

function RecapTrustSignal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-white/80 p-3">
      <Icon className="mb-2 h-4 w-4 text-workon-copper" />
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-workon-stone">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-workon-ink">{value}</p>
    </div>
  );
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
