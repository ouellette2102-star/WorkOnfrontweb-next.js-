"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { getOnboardingStatus } from "@/lib/stripe-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeSessionStorage } from "@/lib/safe-storage";
import { useAuth } from "@/contexts/auth-context";

/**
 * StripeConnectGate — reusable banner that surfaces when a worker
 * has NOT completed Stripe Connect onboarding.
 *
 * Worker-only: renders nothing when user.role !== 'worker' so it
 * can be dropped on shared pages (e.g. /profile) without firing
 * status checks for clients.
 */

export interface StripeConnectGateProps {
  minCompletedMissions?: number;
  className?: string;
}

export function StripeConnectGate({
  minCompletedMissions = 0,
  className,
}: StripeConnectGateProps) {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isWorker = user?.role === "worker" || (user?.role as unknown as string) === "WORKER";

  useEffect(() => {
    if (!isWorker) return;
    let cancelled = false;
    const run = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const status = await getOnboardingStatus(token);
        if (!cancelled) setOnboarded(!!status.onboarded);
      } catch (err) {
        console.warn("[stripe-connect-gate] status check failed", err);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isWorker]);

  useEffect(() => {
    if (safeSessionStorage.getItem("workon:stripe-gate-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    safeSessionStorage.setItem("workon:stripe-gate-dismissed", "1");
  }

  if (!isWorker) return null;
  if (onboarded === null) return null;
  if (onboarded) return null;
  if (dismissed) return null;
  void minCompletedMissions;

  return (
    <div
      role="region"
      aria-label="Configuration de votre compte de paiement"
      className={cn(
        "relative rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm",
        className,
      )}
    >
      <button
        onClick={handleDismiss}
        aria-label="Masquer"
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 flex items-center justify-center text-sm"
      >
        ×
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-workon-ink">
            Configure ton paiement Stripe
          </p>
          <p className="mt-1 text-sm text-workon-muted leading-relaxed">
            Pour accepter une mission payée, tu dois d&apos;abord connecter
            ton compte Stripe Connect. Ça prend 2 minutes.
          </p>
          <div className="mt-4">
            <Button asChild size="sm" className="bg-workon-primary hover:bg-workon-primary/90 text-white">
              <Link href="/worker/payments">Configurer Stripe</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
