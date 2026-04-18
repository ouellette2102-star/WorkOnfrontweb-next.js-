"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type PaidPlan = "CLIENT_PRO" | "WORKER_PRO" | "CLIENT_BUSINESS";

/**
 * PaywallModal — shown when a free-plan user hits a quota or tries to
 * access a paid feature. Provides a direct Client Pro CTA + link to
 * the full pricing page.
 */
export function PaywallModal({
  open,
  onClose,
  title = "Limite gratuite atteinte",
  description,
  defaultPlan = "CLIENT_PRO",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  defaultPlan?: PaidPlan;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    try {
      setLoading(true);
      const { url } = await api.createSubscriptionCheckout(defaultPlan, {
        successUrl: `${window.location.origin}/settings/subscription?ok=1`,
        cancelUrl: window.location.href,
      });
      window.location.href = url;
    } catch (err) {
      toast.error("Impossible de démarrer le paiement", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-workon-bg-cream"
        >
          <X className="h-4 w-4 text-workon-muted" />
        </button>

        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-workon-primary/10 text-workon-primary mb-4">
          <Crown className="h-6 w-6" />
        </div>

        <h2 className="text-xl font-bold text-workon-ink font-heading">
          {title}
        </h2>
        <p className="text-sm text-workon-gray mt-2">
          {description ??
            "Tu as atteint la limite de 3 missions par mois du plan gratuit. Passe au plan Client Pro pour publier sans restriction et recevoir des leads."}
        </p>

        <div className="mt-5 space-y-2 text-sm text-workon-ink">
          <div className="flex items-center gap-2">
            <span className="text-workon-primary">✓</span> Missions illimitées
          </div>
          <div className="flex items-center gap-2">
            <span className="text-workon-primary">✓</span> 5 leads entrants par
            mois
          </div>
          <div className="flex items-center gap-2">
            <span className="text-workon-primary">✓</span> Priorité d&apos;affichage +
            badge entreprise
          </div>
          <div className="flex items-center gap-2">
            <span className="text-workon-primary">✓</span> Support prioritaire
          </div>
        </div>

        <div className="mt-5 p-3 rounded-2xl bg-workon-bg-cream">
          <p className="text-sm">
            <span className="text-2xl font-bold text-workon-ink">39 $</span>
            <span className="text-workon-gray"> / mois CAD</span>
          </p>
          <p className="text-xs text-workon-muted mt-1">
            Annulable à tout moment. Facture mensuelle via Stripe.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            onClick={upgrade}
            disabled={loading}
            variant="hero"
            size="hero"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirection…
              </>
            ) : (
              "Passer à Client Pro"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/pricing")}
            className="w-full"
          >
            Voir tous les plans
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Detects whether a backend error is a 403 QUOTA_EXCEEDED from
 * MissionQuotaGuard. Checks both ApiError.code === "QUOTA_EXCEEDED"
 * and falls back to the message text ("Limite gratuite...").
 */
export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { code?: unknown; message?: unknown };
  if (typeof anyErr.code === "string" && anyErr.code === "QUOTA_EXCEEDED") {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /QUOTA_EXCEEDED|Limite gratuite.*mois.*atteinte/i.test(msg);
}
