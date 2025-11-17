"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  missionId: string;
  amount: number;
  onSuccess: () => void;
};

export function PaymentForm({ missionId, amount, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe n'est pas encore chargé");
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/missions/${missionId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Erreur de paiement:", error);
        toast.error(error.message || "Le paiement a échoué");
      } else {
        // Paiement réussi
        onSuccess();
      }
    } catch (err) {
      console.error("Erreur lors de la confirmation:", err);
      toast.error("Une erreur est survenue lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-white/60">
          Montant à payer: <span className="font-bold text-white">{(amount / 100).toFixed(2)} $ CAD</span>
        </p>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="rounded-xl bg-green-600 px-8 py-3 text-lg font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          {isProcessing ? "Traitement..." : "Payer maintenant"}
        </Button>
      </div>
    </form>
  );
}

