"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-yellow-500/20 bg-neutral-900/70 p-12 text-center backdrop-blur">
          <div className="mb-6 text-7xl">&#x274C;</div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Paiement annul\u00e9
          </h1>
          <p className="mb-8 text-lg text-white/70">
            Le paiement a \u00e9t\u00e9 annul\u00e9. Aucun montant n&apos;a \u00e9t\u00e9 d\u00e9bit\u00e9.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/missions/mine">
              <Button className="bg-yellow-600 px-8 py-3 text-lg hover:bg-yellow-500">
                Retour aux missions
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
