"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-workon-bg p-6 flex items-center justify-center">
      <div className="mx-auto max-w-md w-full">
        <div className="rounded-2xl border border-amber-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-5 flex justify-center">
            <XCircle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-workon-ink">
            Paiement annulé
          </h1>
          <p className="mb-6 text-base text-workon-muted">
            Le paiement a été annulé. Aucun montant n&apos;a été débité de votre compte.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => router.back()}
              className="w-full inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer le paiement
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/missions/mine" className="inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
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
