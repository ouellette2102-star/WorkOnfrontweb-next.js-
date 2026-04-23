"use client";

import Link from "next/link";
import { AlertCircle, ShieldCheck, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface StripeOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional action label explaining what triggered this prompt */
  action?: string;
}

/**
 * StripeOnboardingModal — contextual popup triggered when a worker
 * attempts an action that requires Stripe Connect (e.g. accept a lead).
 *
 * Replaces the permanent home banner with a just-in-time prompt so
 * the user only sees it when it's relevant.
 */
export function StripeOnboardingModal({
  open,
  onOpenChange,
  action = "cette action",
}: StripeOnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            Configure ton paiement Stripe
          </DialogTitle>
          <DialogDescription className="text-center">
            Pour compléter {action}, connecte ton compte Stripe Connect. Ça
            prend 2 minutes — ensuite tu peux encaisser.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-workon-bg border border-workon-border p-3 space-y-2 my-2">
          <div className="flex items-center gap-2 text-xs text-workon-ink">
            <Zap className="h-3.5 w-3.5 text-workon-primary shrink-0" />
            Paiement déposé sous 24h après mission complétée
          </div>
          <div className="flex items-center gap-2 text-xs text-workon-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-workon-primary shrink-0" />
            Escrow sécurisé · tu es payé à coup sûr
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Plus tard
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto bg-workon-primary hover:bg-workon-primary/90 text-white"
          >
            <Link href="/worker/payments">Configurer maintenant</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
