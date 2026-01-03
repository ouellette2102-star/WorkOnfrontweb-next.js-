/**
 * Page Succès Premium
 * PR-27: Confirmation après paiement réussi
 *
 * Flow:
 * 1. Stripe redirige ici avec session_id
 * 2. On confirme côté backend (si dispo)
 * 3. On affiche confirmation
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type ConfirmationState = "loading" | "success" | "pending" | "error";

export default function PremiumSuccessPage() {
  const searchParams = useSearchParams();
  const { isSignedIn, getToken } = useAuth();

  const [state, setState] = useState<ConfirmationState>("loading");
  const [message, setMessage] = useState<string>("");

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const confirmSubscription = async () => {
      if (!sessionId) {
        setState("error");
        setMessage("Session de paiement invalide.");
        return;
      }

      if (!isSignedIn) {
        setState("pending");
        setMessage("Veuillez vous connecter pour confirmer votre abonnement.");
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setState("error");
          setMessage("Erreur d'authentification.");
          return;
        }

        // Try to confirm with backend
        const response = await fetch("/api/premium/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (data.ok) {
          setState("success");
          setMessage("Votre abonnement Premium est maintenant actif !");
        } else if (data.error?.code === "COMING_SOON" || response.status === 501) {
          // Backend not ready, but we can show pending state
          setState("pending");
          setMessage("Votre paiement a été reçu. Premium sera activé sous peu.");
        } else {
          setState("pending");
          setMessage("Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.");
        }
      } catch (error) {
        console.error("Confirmation error:", error);
        // Network error - show pending (payment might have succeeded)
        setState("pending");
        setMessage("Votre paiement est en cours de validation. Actualisez dans quelques minutes.");
      }
    };

    confirmSubscription();
  }, [sessionId, isSignedIn, getToken]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-white/10 bg-neutral-800/50">
        <CardContent className="p-8 text-center">
          {state === "loading" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-6">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Vérification en cours...</h1>
              <p className="text-white/60">Nous confirmons votre paiement.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Bienvenue Premium ! 🎉</h1>
              <p className="text-white/70 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/profile" className="block">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Voir mon profil Premium
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">
                    Retour au dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}

          {state === "pending" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-6">
                <Sparkles className="h-8 w-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Merci pour votre confiance !</h1>
              <p className="text-white/70 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/dashboard" className="block">
                  <Button className="w-full bg-amber-500 text-black font-semibold hover:bg-amber-400">
                    Retour au dashboard
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-white/40 mt-4">
                Vous recevrez un email de confirmation.
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Oops !</h1>
              <p className="text-white/70 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/premium/pricing" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-500">
                    Réessayer
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">
                    Retour au dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

