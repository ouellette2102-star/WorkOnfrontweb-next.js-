"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getOnboardingStatus } from "@/lib/stripe-api";
import { Button } from "@/components/ui/button";

export default function StripeOnboardingReturnPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (authLoading) return;

      try {
        const token = getAccessToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const status = await getOnboardingStatus(token);
        setIsOnboarded(status.onboarded);
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
      } finally {
        setIsChecking(false);
      }
    };

    // Vérifier après un court délai pour laisser Stripe mettre à jour
    const timer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-workon-muted">Vérification de votre onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-workon-bg p-6">
      <div className="max-w-md rounded-3xl border border-workon-border bg-workon-bg/70 p-8 text-center backdrop-blur">
        {isOnboarded ? (
          <>
            <div className="mb-4 text-6xl">🎉</div>
            <h1 className="mb-3 text-3xl font-bold text-workon-ink">
              Onboarding complété !
            </h1>
            <p className="mb-6 text-workon-muted">
              Votre compte Stripe Connect est maintenant actif. Vous pouvez
              recevoir des paiements pour vos missions complétées.
            </p>
            <Button
              onClick={() => router.push("/worker/payments")}
              className="rounded-xl bg-green-600 px-8 py-3 text-lg font-semibold text-white hover:bg-green-500"
            >
              Voir mes paiements
            </Button>
          </>
        ) : (
          <>
            <div className="mb-4 text-6xl">⚠️</div>
            <h1 className="mb-3 text-3xl font-bold text-workon-ink">
              Onboarding incomplet
            </h1>
            <p className="mb-6 text-workon-muted">
              Il semble que votre onboarding Stripe n'est pas encore terminé.
              Veuillez compléter toutes les étapes requises.
            </p>
            <Button
              onClick={() => router.push("/worker/payments")}
              className="rounded-xl bg-red-600 px-8 py-3 text-lg font-semibold text-white hover:bg-red-500"
            >
              Reprendre l'onboarding
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

