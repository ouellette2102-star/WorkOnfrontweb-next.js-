"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";
import { getOnboardingStatus } from "@/lib/stripe-api";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeSessionStorage } from "@/lib/safe-storage";
import { useAuth } from "@/contexts/auth-context";
import { Wallet } from "lucide-react";

/**
 * StripeConnectGate — payout setup nudge for workers.
 *
 * Décision 🔒 2026-06-14 : on demande le KYC/compte de paiement AU BON
 * MOMENT — seulement quand le worker a DE L'ARGENT EN ATTENTE
 * (totalPending > 0). Pas à l'inscription, pas pour « accepter une
 * mission » (le worker peut accepter + gagner sans onboarding, l'escrow
 * tient les fonds). Wording orienté « recevoir ton argent », jamais
 * « Stripe ». Worker-only.
 */

export interface StripeConnectGateProps {
  minCompletedMissions?: number;
  className?: string;
}

const DISMISSED_STORAGE_KEY = "workon:stripe-gate-dismissed";
const subscribeNoop = () => () => {};
const getStoredDismissed = () =>
  safeSessionStorage.getItem(DISMISSED_STORAGE_KEY) === "1";
const getServerDismissed = () => true;

export function StripeConnectGate({
  minCompletedMissions = 0,
  className,
}: StripeConnectGateProps) {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const storedDismissed = useSyncExternalStore(
    subscribeNoop,
    getStoredDismissed,
    getServerDismissed,
  );
  const [dismissedOverride, setDismissedOverride] = useState<boolean | null>(null);
  const dismissed = dismissedOverride ?? storedDismissed;

  const isWorker = user?.role === "worker" || (user?.role as unknown as string) === "WORKER";

  useEffect(() => {
    if (!isWorker) return;
    let cancelled = false;
    const run = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const [status, summary] = await Promise.all([
          getOnboardingStatus(token),
          api.getEarningsSummary().catch(() => null),
        ]);
        if (cancelled) return;
        setOnboarded(!!status.onboarded);
        setPending(
          summary && typeof summary.totalPending === "number"
            ? summary.totalPending
            : 0,
        );
      } catch (err) {
        console.warn("[stripe-connect-gate] status check failed", err);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isWorker]);

  function handleDismiss() {
    setDismissedOverride(true);
    safeSessionStorage.setItem(DISMISSED_STORAGE_KEY, "1");
  }

  if (!isWorker) return null;
  if (onboarded === null || pending === null) return null;
  if (onboarded) return null;
  // Le bon moment : on ne demande la config de paiement QUE lorsqu'il y a
  // de l'argent en attente à recevoir (décision 🔒 2026-06-14).
  if (!(pending > 0)) return null;
  if (dismissed) return null;
  void minCompletedMissions;

  const amount = pending.toFixed(2);

  return (
    <div
      role="region"
      aria-label="Configuration de votre compte de paiement"
      className={cn(
        "relative rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm",
        className,
      )}
    >
      <button
        onClick={handleDismiss}
        aria-label="Masquer"
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center text-sm"
      >
        ×
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-workon-ink">
            Tu as {amount} $ qui t&apos;attendent
          </p>
          <p className="mt-1 text-sm text-workon-muted leading-relaxed">
            Configure ton compte de paiement (2 min) pour recevoir cet argent
            sur ton compte bancaire.
          </p>
          <div className="mt-4">
            <Button asChild size="sm" className="bg-workon-primary hover:bg-workon-primary/90 text-white">
              <Link href="/worker/payments">Configurer mes paiements</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
