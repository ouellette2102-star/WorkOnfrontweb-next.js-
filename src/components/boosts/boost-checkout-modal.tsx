"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, X, Zap, Rocket, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaxDisclaimer } from "@/components/ui/tax-disclaimer";
import { toast } from "sonner";
import { api, type BoostType } from "@/lib/api-client";

type Props = {
  type: BoostType;
  missionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const BOOST_META: Record<
  BoostType,
  {
    label: string;
    priceCents: number;
    blurb: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }
> = {
  URGENT_9: {
    label: "Mission urgente",
    priceCents: 900,
    blurb:
      "Flag ta mission 24h comme urgente — notification push aux travailleurs à proximité.",
    icon: Zap,
    accent: "text-amber-600",
  },
  TOP_48H_14: {
    label: "Top visibilité 48h",
    priceCents: 1400,
    blurb:
      "Ta mission en tête de carte et de la pile swipe pendant 48h.",
    icon: Rocket,
    accent: "text-blue-600",
  },
  VERIFY_EXPRESS_19: {
    label: "Vérification express",
    priceCents: 1900,
    blurb:
      "Ton dossier KYC traité en moins de 24h — badge « vérifié » accéléré.",
    icon: ShieldCheck,
    accent: "text-emerald-600",
  },
};

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

export function BoostCheckoutModal({
  type,
  missionId,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = BOOST_META[type];

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        let res;
        if (type === "URGENT_9") {
          if (!missionId) throw new Error("missionId requis");
          res = await api.createMissionUrgentBoost(missionId);
        } else if (type === "TOP_48H_14") {
          if (!missionId) throw new Error("missionId requis");
          res = await api.createTopVisibilityBoost(missionId);
        } else {
          res = await api.createVerifyExpressBoost();
        }
        if (!cancelled) setClientSecret(res.clientSecret);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur serveur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, type, missionId]);

  const stripe = useMemo(() => getStripe(), []);

  if (!isOpen) return null;

  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-workon-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${meta.accent}`} />
            <div>
              <h2 className="text-lg font-bold text-workon-ink">
                {meta.label}
              </h2>
              <p className="text-sm text-workon-gray">
                {(meta.priceCents / 100).toFixed(2)} $ CAD
              </p>
              <TaxDisclaimer
                preTaxAmount={meta.priceCents / 100}
                compact
                className="mt-0.5 block"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-workon-muted hover:text-workon-ink"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-workon-gray">{meta.blurb}</p>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {clientSecret && !loading && !error && (
          <Elements
            key={clientSecret}
            stripe={stripe}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <BoostPaymentForm
              amountCents={meta.priceCents}
              onSuccess={() => {
                toast.success("Paiement confirmé — boost actif !");
                onSuccess?.();
                onClose();
              }}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

function BoostPaymentForm({
  amountCents,
  onSuccess,
  onCancel,
}: {
  amountCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/subscription?boost=1`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Paiement échoué");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess();
      } else {
        toast.info("Paiement en cours de traitement...");
        onSuccess();
      }
    } catch {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-workon-primary hover:bg-workon-primary-hover text-white"
        >
          {processing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Payer {(amountCents / 100).toFixed(2)} $
        </Button>
      </div>
    </form>
  );
}
