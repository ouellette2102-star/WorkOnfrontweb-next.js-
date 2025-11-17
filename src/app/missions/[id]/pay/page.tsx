"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getMissionById } from "@/lib/missions-api";
import { createPaymentIntent } from "@/lib/stripe-api";
import { PaymentForm } from "@/components/employer/payment-form";
import type { Mission } from "@/types/mission";
import { toast } from "sonner";
import Link from "next/link";

// Initialiser Stripe (côté client)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function PayMissionPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const missionId = params.id as string;

  useEffect(() => {
    const loadMission = async () => {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();
        if (!token) {
          router.push("/sign-in");
          return;
        }

        const data = await getMissionById(token, missionId);
        setMission(data);

        // Vérifier que la mission peut être payée
        if (data.status !== "COMPLETED") {
          toast.error("Cette mission n'est pas encore complétée");
          router.push(`/missions/${missionId}`);
          return;
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la mission:", error);
        toast.error("Mission introuvable");
        router.push("/missions/mine");
      } finally {
        setIsLoadingMission(false);
      }
    };

    loadMission();
  }, [isLoaded, isSignedIn, getToken, missionId, router]);

  const handleInitializePayment = async () => {
    if (!mission) return;

    setIsCreatingIntent(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentification requise");
        return;
      }

      // Créer le PaymentIntent
      const { clientSecret: secret } = await createPaymentIntent(
        token,
        mission.id,
        mission.priceCents
      );

      setClientSecret(secret);
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de créer le paiement"
      );
    } finally {
      setIsCreatingIntent(false);
    }
  };

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
        {!clientSecret ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 text-center backdrop-blur">
            <div className="mb-4 text-6xl">🔒</div>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Paiement sécurisé
            </h3>
            <p className="mb-6 text-white/70">
              En cliquant sur "Procéder au paiement", vous serez redirigé vers
              notre formulaire de paiement sécurisé Stripe.
            </p>
            <button
              onClick={handleInitializePayment}
              disabled={isCreatingIntent}
              className="rounded-xl bg-red-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isCreatingIntent ? "Préparation..." : "Procéder au paiement"}
            </button>
          </div>
        ) : (
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

