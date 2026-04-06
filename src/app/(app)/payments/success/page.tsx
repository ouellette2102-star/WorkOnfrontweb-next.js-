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
        <div className="rounded-3xl border border-green-500/20 bg-neutral-900/70 p-12 text-center backdrop-blur">
          <div className="mb-6 text-7xl">&#x2705;</div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Paiement r\u00e9ussi !
          </h1>
          <p className="mb-2 text-lg text-white/70">
            Votre paiement a \u00e9t\u00e9 trait\u00e9 avec succ\u00e8s.
          </p>
          {sessionId && (
            <p className="mb-6 text-sm text-white/40">
              R\u00e9f\u00e9rence : {sessionId.slice(0, 20)}...
            </p>
          )}
          <div className="flex flex-col items-center gap-3">
            <Link href="/missions/mine">
              <Button className="bg-green-600 px-8 py-3 text-lg hover:bg-green-500">
                Voir mes missions
              </Button>
            </Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">
              Retour au tableau de bord
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
