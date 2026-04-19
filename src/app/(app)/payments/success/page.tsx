"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api-client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "confirmed" | "pending" | "no-session">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("no-session");
      return;
    }

    let attempts = 0;
    const maxAttempts = 4;
    const delayMs = 2000;

    async function verify() {
      try {
        const sub = await api.getSubscription();
        if (sub && sub.plan !== "FREE") {
          setStatus("confirmed");
          return;
        }
      } catch {
        // ignore — webhook may not have fired yet
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(verify, delayMs);
      } else {
        // Webhook takes time — tell user it'll arrive soon, don't cry fraud
        setStatus("pending");
      }
    }

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-workon-bg p-6 flex items-center justify-center">
      <div className="mx-auto max-w-md w-full">
        <div className={`rounded-2xl border bg-white p-10 text-center shadow-sm ${status === "no-session" ? "border-red-200" : "border-green-200"}`}>

          {status === "loading" && (
            <>
              <div className="mb-5 flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-workon-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Vérification en cours…
              </h1>
              <p className="text-base text-workon-muted">
                On confirme ton paiement avec Stripe.
              </p>
            </>
          )}

          {status === "confirmed" && (
            <>
              <div className="mb-5 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Paiement confirmé !
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Ton abonnement est actif. Bienvenue dans WorkOn Pro.
              </p>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mb-5 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-amber-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Paiement reçu
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Ton paiement a été traité. L&apos;activation peut prendre quelques minutes.
                Rafraîchis la page si ton abonnement n&apos;apparaît pas.
              </p>
            </>
          )}

          {status === "no-session" && (
            <>
              <div className="mb-5 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-red-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-workon-ink">
                Lien invalide
              </h1>
              <p className="mb-6 text-base text-workon-muted">
                Cette page n&apos;est accessible que depuis une redirection Stripe valide.
              </p>
            </>
          )}

          {status !== "loading" && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <Button asChild className="w-full">
                <Link href="/settings/subscription" className="inline-flex items-center justify-center gap-2">
                  Voir mon abonnement
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/home"
                className="text-sm text-workon-muted hover:text-workon-ink transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-workon-bg">
          <Loader2 className="h-10 w-10 animate-spin text-workon-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
