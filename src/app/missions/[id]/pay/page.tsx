"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getMissionById } from "@/lib/missions-api";
import { PaymentForm } from "@/components/employer/payment-form";
import type { Mission } from "@/types/mission";
import { toast } from "sonner";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Check Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const isStripeConfigured = Boolean(STRIPE_PUBLISHABLE_KEY);

// Initialiser Stripe (côté client) - only if configured
let stripePromise: Promise<Stripe | null> | null = null;
if (isStripeConfigured) {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY!);
}

// Types for API response
type PaymentIntentResponse =
  | { ok: true; clientSecret: string; paymentIntentId: string }
  | { ok: false; error: { code: string; message: string } };

export default function PayMissionPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // States
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(true);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<{ code: string; message: string } | null>(null);

  const missionId = params.id as string;

  // Load mission
  const loadMission = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoadingMission(true);
    setMissionError(null);

    try {
      const token = await getToken();
      if (!token) {
        setMissionError("Impossible de récupérer le token d'authentification");
        return;
      }

      const data = await getMissionById(token, missionId);
      setMission(data);

      // Vérifier que la mission peut être payée
      if (data.status !== "COMPLETED") {
        setMissionError("Cette mission n'est pas encore complétée. Le paiement sera disponible une fois la mission terminée.");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la mission:", error);
      const message = error instanceof Error ? error.message : "Mission introuvable";
      if (message.includes("404") || message.includes("introuvable")) {
        setMissionError("Cette mission n'existe pas ou a été supprimée.");
      } else {
        setMissionError(message);
      }
    } finally {
      setIsLoadingMission(false);
    }
  }, [isLoaded, isSignedIn, getToken, missionId, router]);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  // Create payment intent via proxy API
  const handleInitializePayment = async () => {
    if (!mission) return;

    setIsCreatingIntent(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          amountCents: mission.priceCents,
        }),
      });

      const data: PaymentIntentResponse = await response.json();

      if (data.ok) {
        setClientSecret(data.clientSecret);
        setPaymentError(null);
      } else {
        setPaymentError(data.error);
        toast.error(data.error.message);
      }
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      const message = error instanceof Error ? error.message : "Erreur réseau";
      setPaymentError({ code: "NETWORK_ERROR", message });
      toast.error(message);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // Loading state
  if (isLoadingMission || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  // Stripe not configured
  if (!isStripeConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="mx-auto max-w-2xl">
          <Card className="border-yellow-500/20 bg-yellow-500/10 p-8 text-center">
            <div className="mb-4 text-6xl">⚙️</div>
            <h1 className="mb-2 text-2xl font-bold text-yellow-400">
              Paiement non configuré
            </h1>
            <p className="mb-6 text-white/70">
              Le système de paiement n&apos;est pas encore configuré pour cet environnement.
              Contactez le support si le problème persiste.
            </p>
            <Link href="/missions/mine">
              <Button variant="outline">← Retour aux missions</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Mission error state
  if (missionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="mx-auto max-w-2xl">
          <Card className="border-red-500/20 bg-red-500/10 p-8 text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-red-400">
              Impossible de charger la mission
            </h1>
            <p className="mb-6 text-white/70">{missionError}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={loadMission} className="bg-red-600 hover:bg-red-500">
                🔄 Réessayer
              </Button>
              <Link href="/missions/mine">
                <Button variant="outline">← Retour aux missions</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Mission not loaded (shouldn't happen but safe fallback)
  if (!mission) {
    return null;
  }

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const feeCents = Math.ceil(mission.priceCents * 0.12);
  const totalCents = mission.priceCents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/missions/${mission.id}`}
            className="mb-4 inline-block text-sm text-white/70 transition hover:text-red-400"
          >
            ← Retour à la mission
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-white">
            💳 Payer la mission
          </h1>
          <p className="text-lg text-white/70">
            Effectuez le paiement sécurisé via Stripe
          </p>
        </div>

        {/* Résumé de la mission */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <h2 className="mb-4 text-xl font-bold text-white">{mission.title}</h2>
          <div className="space-y-3 text-sm">
            {mission.category && (
              <div className="flex justify-between">
                <span className="text-white/60">Catégorie</span>
                <span className="font-semibold text-white">{mission.category}</span>
              </div>
            )}
            {mission.city && (
              <div className="flex justify-between">
                <span className="text-white/60">Ville</span>
                <span className="font-semibold text-white">{mission.city}</span>
              </div>
            )}
            <div className="my-4 border-t border-white/10"></div>
            <div className="flex justify-between">
              <span className="text-white/60">Montant mission</span>
              <span className="font-semibold text-white">
                {formatAmount(mission.priceCents)} $
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Frais plateforme (12%)</span>
              <span className="font-semibold text-white">
                {formatAmount(feeCents)} $
              </span>
            </div>
            <div className="my-4 border-t border-white/10"></div>
            <div className="flex justify-between text-lg">
              <span className="font-bold text-white">Total à payer</span>
              <span className="font-bold text-green-400">
                {formatAmount(totalCents)} $ CAD
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire de paiement */}
        {paymentError ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur">
            <div className="mb-4 text-6xl">⚠️</div>
            <h3 className="mb-3 text-2xl font-bold text-red-400">
              Erreur de paiement
            </h3>
            <p className="mb-6 text-white/70">{paymentError.message}</p>
            <Button
              onClick={() => {
                setPaymentError(null);
                handleInitializePayment();
              }}
              className="bg-red-600 hover:bg-red-500"
            >
              🔄 Réessayer
            </Button>
            {paymentError.code && (
              <p className="mt-4 text-xs text-white/40">Code: {paymentError.code}</p>
            )}
          </div>
        ) : !clientSecret ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 text-center backdrop-blur">
            <div className="mb-4 text-6xl">🔒</div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Paiement sécurisé
            </h3>
            <p className="mb-6 text-white/70">
              En cliquant sur &quot;Procéder au paiement&quot;, vous serez redirigé vers
              notre formulaire de paiement sécurisé Stripe.
            </p>
            <Button
              onClick={handleInitializePayment}
              disabled={isCreatingIntent}
              className="bg-red-600 px-8 py-3 text-lg hover:bg-red-500"
            >
              {isCreatingIntent ? "Préparation..." : "💳 Procéder au paiement"}
            </Button>
          </div>
        ) : stripePromise ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 backdrop-blur">
            <h3 className="mb-6 text-xl font-bold text-white">
              Informations de paiement
            </h3>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#dc2626",
                    colorBackground: "#171717",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    fontFamily: "system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <PaymentForm
                missionId={mission.id}
                amount={totalCents}
                onSuccess={() => {
                  toast.success("Paiement effectué avec succès !");
                  router.push("/missions/mine");
                }}
              />
            </Elements>
          </div>
        ) : (
          <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-8 text-center backdrop-blur">
            <div className="mb-4 text-6xl">⚙️</div>
            <h3 className="mb-3 text-2xl font-bold text-yellow-400">
              Chargement du paiement...
            </h3>
            <p className="text-white/70">
              Si ce message persiste, rechargez la page.
            </p>
          </div>
        )}

        {/* Infos sécurité */}
        <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900/50 p-4 text-center">
          <p className="text-xs text-white/50">
            🔒 Paiement sécurisé par Stripe • Vos informations bancaires ne sont
            jamais stockées sur nos serveurs
          </p>
        </div>
      </div>
    </div>
  );
}

