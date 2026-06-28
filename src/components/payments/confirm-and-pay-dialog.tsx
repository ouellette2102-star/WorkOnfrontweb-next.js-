"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceBreakdownCard } from "@/components/mission/price-breakdown-card";

/**
 * Uber / Airbnb style "confirm & pay" sheet.
 *
 * Whenever a client is about to be charged we open this dialog FIRST so they
 * see — and explicitly accept — the *authoritative* invoice (service price,
 * WorkOn fee, TPS/TVQ, total) before any Stripe redirect. The numbers come
 * straight from `GET /payments/preview` via {@link PriceBreakdownCard}, so what
 * the client accepts here is exactly what Stripe will charge.
 *
 * The component is fully controlled: the caller owns `open` and provides an
 * async `onConfirm` that does the real work (create mission / reserve / start
 * checkout) and redirects. The confirm button stays disabled until the live
 * preview has loaded, so a client can never accept a stale or estimated total.
 */
export interface ConfirmAndPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Raw service price in CAD dollars (what the client offered the pro). */
  priceDollars: number;
  /** Dialog title. */
  title?: string;
  /** One-line context under the title (e.g. the pro + mission). */
  subtitle?: string;
  /** Confirm button label (the live total is appended automatically). */
  confirmLabel?: string;
  /**
   * Runs when the client accepts the invoice. Should create/reserve/checkout
   * and redirect to Stripe. Throw to signal failure — the dialog re-enables the
   * confirm button so the client can retry or cancel. On success, keep the
   * spinner: the caller navigates away.
   */
  onConfirm: () => Promise<void>;
}

export function ConfirmAndPayDialog({
  open,
  onOpenChange,
  priceDollars,
  title = "Confirmer et payer",
  subtitle = "Vérifie le détail. La redirection vers Stripe se fait seulement après ta confirmation.",
  confirmLabel = "Confirmer et payer",
  onConfirm,
}: ConfirmAndPayDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
      // Success → caller redirects; leave the spinner running until unmount.
    } catch {
      // Caller surfaces the toast; re-enable so the client can retry/cancel.
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the client dismiss mid-payment.
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md" data-testid="confirm-pay-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <PriceBreakdownCard priceDollars={priceDollars} testId="confirm-pay-breakdown">
          {({ preview, loading, error }) => (
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2 rounded-2xl border border-workon-primary/15 bg-workon-primary-subtle p-3 text-xs leading-relaxed text-workon-ink">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-workon-primary" />
                <span>
                  <strong>Paiement protégé.</strong> Les fonds sont retenus en
                  escrow par Stripe et libérés à la fin de la mission.
                </span>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={submitting || loading || !preview || !!error}
                className="h-12 w-full rounded-2xl bg-workon-primary font-black text-white shadow-[0_12px_28px_rgba(19,64,33,0.22)] hover:bg-workon-primary-hover"
                data-testid="confirm-pay-button"
              >
                {(submitting || loading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {preview
                  ? `${confirmLabel} (${preview.total.toFixed(2)} $)`
                  : confirmLabel}
              </Button>

              <button
                type="button"
                onClick={() => {
                  if (!submitting) onOpenChange(false);
                }}
                disabled={submitting}
                className="w-full text-center text-xs font-semibold text-workon-muted transition hover:text-workon-ink disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          )}
        </PriceBreakdownCard>
      </DialogContent>
    </Dialog>
  );
}
