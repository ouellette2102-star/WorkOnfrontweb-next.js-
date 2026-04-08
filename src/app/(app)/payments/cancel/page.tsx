"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-yellow-500/20 bg-neutral-900/70 p-12 text-center backdrop-blur shadow-lg shadow-black/20">
          <div className="mb-6 text-7xl">❌</div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Paiement annulé
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Le paiement a été annulé. Aucun montant n&apos;a été débité.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button asChild variant="hero" size="hero">
              <Link href="/missions/mine">Retour aux missions</Link>
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
