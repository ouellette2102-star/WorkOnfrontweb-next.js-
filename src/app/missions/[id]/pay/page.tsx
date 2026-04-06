"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PayMissionPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const missionId = params.id as string;

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push("/login?redirect=/missions/" + missionId + "/pay");
    return null;
  }

  const {
    data: mission,
    isLoading: missionLoading,
    error: missionError,
  } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => api.getMission(missionId),
    enabled: isAuthenticated,
  });

  const handleCheckout = async () => {
    setIsCreatingSession(true);
    try {
      const result = await api.createCheckoutSession(missionId);
      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error("Erreur lors de la cr\u00e9ation de la session:", error);
      const message = error instanceof Error ? error.message : "Erreur lors du paiement";
      toast.error(message);
      setIsCreatingSession(false);
    }
  };

  // Loading state
  if (missionLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (missionError || !mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
          <h1 className="mb-2 text-2xl font-bold text-red-400">
            Impossible de charger la mission
          </h1>
          <p className="mb-6 text-white/70">
            {missionError instanceof Error ? missionError.message : "Mission introuvable"}
          </p>
          <Link href="/missions/mine">
            <Button variant="outline">&larr; Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number) => amount.toFixed(2);
  const feePct = 0.15;
  const subtotal = mission.price;
  const fee = subtotal * feePct;
  const total = subtotal + fee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/missions/${mission.id}`}
            className="mb-4 inline-block text-sm text-white/70 transition hover:text-green-400"
          >
            &larr; Retour \u00e0 la mission
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-white">
            Payer la mission
          </h1>
          <p className="text-lg text-white/70">
            Paiement s\u00e9curis\u00e9 via Stripe Checkout
          </p>
        </div>

        {/* Mission summary */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <h2 className="mb-4 text-xl font-bold text-white">{mission.title}</h2>
          <div className="space-y-3 text-sm">
            {mission.category && (
              <div className="flex justify-between">
                <span className="text-white/60">Cat\u00e9gorie</span>
                <span className="font-semibold text-white">{mission.category}</span>
              </div>
            )}
            {mission.city && (
              <div className="flex justify-between">
                <span className="text-white/60">Ville</span>
                <span className="font-semibold text-white">{mission.city}</span>
              </div>
            )}
            <div className="my-4 border-t border-white/10" />
            <div className="flex justify-between">
              <span className="text-white/60">Montant mission</span>
              <span className="font-semibold text-white">{formatAmount(subtotal)} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Frais plateforme (15%)</span>
              <span className="font-semibold text-white">{formatAmount(fee)} $</span>
            </div>
            <div className="my-4 border-t border-white/10" />
            <div className="flex justify-between text-lg">
              <span className="font-bold text-white">Total \u00e0 payer</span>
              <span className="font-bold text-green-400">{formatAmount(total)} $ CAD</span>
            </div>
          </div>
        </div>

        {/* Checkout button */}
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 text-center backdrop-blur">
          <div className="mb-4 text-6xl">&#x1F512;</div>
          <h3 className="mb-3 text-2xl font-bold text-white">
            Paiement s\u00e9curis\u00e9
          </h3>
          <p className="mb-6 text-white/70">
            Vous serez redirig\u00e9 vers Stripe Checkout pour compl\u00e9ter le paiement en toute s\u00e9curit\u00e9.
          </p>
          <Button
            onClick={handleCheckout}
            disabled={isCreatingSession}
            className="bg-green-600 px-8 py-3 text-lg hover:bg-green-500"
          >
            {isCreatingSession ? "Redirection..." : "Proc\u00e9der au paiement"}
          </Button>
        </div>

        {/* Security footer */}
        <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900/50 p-4 text-center">
          <p className="text-xs text-white/50">
            Paiement s\u00e9curis\u00e9 par Stripe &bull; Vos informations bancaires ne sont
            jamais stock\u00e9es sur nos serveurs
          </p>
        </div>
      </div>
    </div>
  );
}
