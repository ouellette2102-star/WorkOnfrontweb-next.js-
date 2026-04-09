"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { getOnboardingStatus } from "@/lib/stripe-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * StripeConnectGate — reusable banner that surfaces when a worker
 * has NOT completed Stripe Connect onboarding. Mount it on /home,
 * /worker/dashboard, /missions/[id] or any surface where a worker
 * might try to accept a paying mission.
 *
 * It stays silent until the backend confirms `onboarded === false`
 * and gracefully hides on errors so it never blocks the page.
 *
 * Clicking the CTA deep-links to /worker/payments where the real
 * Stripe hosted onboarding link is created and followed.
 */

export interface StripeConnectGateProps {
  /** Hide if the worker has fewer than this many completed missions yet.
   *  Default: 0 (show always when not onboarded). Useful for /home to
   *  avoid nagging brand-new workers on their very first login. */
  minCompletedMissions?: number;
  className?: string;
}

export function StripeConnectGate({
  minCompletedMissions = 0,
  className,
}: StripeConnectGateProps) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const status = await getOnboardingStatus(token);
        if (!cancelled) setOnboarded(!!status.onboarded);
      } catch (err) {
        // Non-fatal: stay silent on failure, don't block the page.
        console.warn("[stripe-connect-gate] status check failed", err);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Heuristic dismissal stored per-session so brand-new workers
  // don't see the banner on every tab. Persistent dismissal lives
  // in a follow-up PR (requires settings-api).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("workon:stripe-gate-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("workon:stripe-gate-dismissed", "1");
    } catch {
      // sessionStorage may be disabled — still hide for this render.
    }
  }

  // Conditions to render:
  if (onboarded === null) return null; // still loading
  if (onboarded) return null;          // already onboarded
  if (dismissed) return null;           // user dismissed this session
  // NOTE: minCompletedMissions is kept in the API for future use
  // once we wire in a real "has any completed mission" signal.
  void minCompletedMissions;

  return (
    <div
      role="region"
      aria-label="Configuration de votre compte de paiement"
      className={cn(
        "relative rounded-3xl border border-[#FF4D1C]/30 bg-gradient-to-br from-[#FF4D1C]/15 via-[#FF4D1C]/5 to-transparent p-5 shadow-lg shadow-black/20 backdrop-blur-sm",
        className,
      )}
    >
      <button
        onClick={handleDismiss}
        aria-label="Masquer"
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm"
      >
        ×
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-[#FF4D1C]/20 border border-[#FF4D1C]/30 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-[#FF4D1C]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-white">
            Configure ton paiement Stripe
          </p>
          <p className="mt-1 text-sm text-white/70 leading-relaxed">
            Pour accepter une mission payée, tu dois d&apos;abord connecter
            ton compte Stripe Connect. Ça prend 2 minutes.
          </p>
          <div className="mt-4">
            <Button asChild variant="hero" size="sm">
              <Link href="/worker/payments">Configurer Stripe</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
