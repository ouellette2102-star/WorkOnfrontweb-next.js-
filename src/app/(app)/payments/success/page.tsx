"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-[#22C55E]/20 bg-neutral-900/70 p-12 text-center backdrop-blur shadow-lg shadow-black/20">
          <div className="mb-6 text-7xl">✅</div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Paiement réussi !
          </h1>
          <p className="mb-2 text-lg text-white/70">
            Votre paiement a été traité avec succès.
          </p>
          {sessionId && (
            <p className="mb-6 text-sm text-white/40">
              Référence : {sessionId.slice(0, 20)}…
            </p>
          )}
          <div className="flex flex-col items-center gap-3">
            <Button asChild variant="hero" size="hero">
              <Link href="/missions/mine">Voir mes missions</Link>
            </Button>
            <Link href="/home" className="text-sm text-white/50 hover:text-white">
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
