/**
 * Page Pricing Premium
 * PR-27: Paiement Premium & plans
 *
 * Règles:
 * - Aucune promesse chiffrée
 * - Description factuelle
 * - UI Sparkly réutilisée
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { getAllPlans, formatPrice, type PremiumPlan, type PremiumPlanId } from "@/lib/premium-plans";

export default function PremiumPricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, getToken } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wasCanceled = searchParams.get("canceled") === "true";
  const plans = getAllPlans();

  const handleSubscribe = async (planId: PremiumPlanId) => {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/premium/pricing");
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Erreur d'authentification. Reconnectez-vous.");
        return;
      }

      const response = await fetch("/api/premium/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.ok && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Handle error or coming soon
        const errorCode = data.error?.code;
        if (errorCode === "COMING_SOON") {
          setError("Premium sera bientôt disponible. Nous vous tiendrons informé !");
        } else {
          setError(data.error?.message ?? "Une erreur est survenue. Réessayez.");
        }
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError("Impossible de traiter votre demande. Réessayez plus tard.");
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au profil
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">WorkOn Premium</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Amplifiez votre visibilité basée sur vos performances réelles.
            Pas de promesses, juste des résultats.
          </p>
        </div>

        {/* Canceled notice */}
        {wasCanceled && (
          <div className="mb-8 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-center">
            <p className="text-yellow-400">
              Paiement annulé. Vous pouvez réessayer quand vous êtes prêt.
            </p>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/10">
            <div className="flex items-center gap-3 justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isLoading={isLoading && selectedPlan === plan.id}
              onSelect={() => handleSubscribe(plan.id)}
            />
          ))}
        </div>

        {/* FAQ / Trust */}
        <div className="text-center text-sm text-white/50">
          <p>Paiement sécurisé par Stripe. Annulation possible à tout moment.</p>
          <p className="mt-2">
            Questions ?{" "}
            <Link href="/faq" className="text-amber-400 hover:underline">
              Consultez notre FAQ
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function PlanCard({
  plan,
  isLoading,
  onSelect,
}: {
  plan: PremiumPlan;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const price = formatPrice(plan.priceCents, plan.currency);
  const interval = plan.interval === "month" ? "/mois" : "/an";

  return (
    <Card
      className={`relative overflow-hidden ${
        plan.popular
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5"
          : "border-white/10 bg-neutral-800/50"
      }`}
    >
      {plan.popular && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-amber-500 text-black font-semibold">
            Populaire
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <p className="text-sm text-white/60 mb-4">{plan.description}</p>

        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-white/60">{interval}</span>
          {plan.savings && (
            <Badge
              variant="outline"
              className="ml-2 bg-green-500/10 border-green-500/30 text-green-400 text-xs"
            >
              {plan.savings}
            </Badge>
          )}
        </div>

        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-white/80">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={`w-full ${
            plan.popular
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-400 hover:to-yellow-400"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Choisir ce plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

