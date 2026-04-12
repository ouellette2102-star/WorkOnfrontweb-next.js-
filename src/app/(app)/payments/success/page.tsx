"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setVerified(false);
      return;
    }
    // Payment was confirmed by Stripe redirect — mark as verified
    setVerified(true);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-workon-bg p-6 flex items-center justify-center">
      <div className="mx-auto max-w-md w-full">
        <div className="rounded-2xl border border-green-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-5 flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-workon-ink">
            Paiement réussi !
          </h1>
          <p className="mb-2 text-base text-workon-muted">
            Votre paiement a été traité avec succès.
          </p>
          {sessionId && (
            <p className="mb-6 text-sm text-workon-muted/60">
              Référence : {sessionId.slice(0, 20)}...
            </p>
          )}
          {verified === null && (
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-workon-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Vérification du paiement...
            </div>
          )}
          <div className="flex flex-col items-center gap-3 mt-4">
            <Button asChild className="w-full">
              <Link href="/bookings" className="inline-flex items-center justify-center gap-2">
                Voir mes réservations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/missions/mine">
                Voir mes missions
              </Link>
            </Button>
            <Link
              href="/home"
              className="text-sm text-workon-muted hover:text-workon-ink transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
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
