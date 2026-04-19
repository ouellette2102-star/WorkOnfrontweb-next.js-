"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Crown, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BoostCheckoutModal } from "@/components/boosts/boost-checkout-modal";

const PLAN_LABEL: Record<string, string> = {
  FREE: "Gratuit",
  CLIENT_PRO: "Client Pro",
  WORKER_PRO: "Worker Pro",
  CLIENT_BUSINESS: "Client Business",
  PRO: "Pro (legacy)",
  PREMIUM: "Premium (legacy)",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actif",
  TRIALING: "Essai",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Annulé",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
  INCOMPLETE: "Incomplet",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function SubscriptionSettingsPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("ok") === "1";

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription-me"],
    queryFn: () => api.getSubscription(),
    refetchInterval: justSubscribed ? 3000 : false, // poll after checkout to pick up webhook
  });

  const { data: quota } = useQuery({
    queryKey: ["missions-quota"],
    queryFn: () => api.getMissionsQuota(),
  });

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [verifyBoostOpen, setVerifyBoostOpen] = useState(false);
  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      toast.success(
        "Abonnement annulé — actif jusqu'à la fin de la période payée",
      );
      setConfirmCancel(false);
      qc.invalidateQueries({ queryKey: ["subscription-me"] });
    },
    onError: (err) => {
      toast.error("Impossible d'annuler", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    },
  });

  // Stop polling once we've moved off FREE
  useEffect(() => {
    if (justSubscribed && sub && sub.plan !== "FREE") {
      toast.success("Abonnement activé");
    }
  }, [justSubscribed, sub]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
      </div>
    );
  }

  const isPaid = sub && sub.plan !== "FREE";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-workon-ink font-heading mb-5">
        Mon abonnement
      </h1>

      {justSubscribed && isPaid && (
        <div className="mb-5 rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-green-900">Paiement confirmé</p>
            <p className="text-green-700">
              Ton plan {PLAN_LABEL[sub.plan]} est actif.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-workon-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          {isPaid ? (
            <Crown className="h-5 w-5 text-workon-primary" />
          ) : null}
          <span className="text-lg font-bold text-workon-ink">
            {sub ? PLAN_LABEL[sub.plan] ?? sub.plan : "—"}
          </span>
          {sub?.status && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-workon-bg-cream text-workon-gray">
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
          )}
        </div>

        {sub?.currentPeriodEnd && (
          <p className="text-sm text-workon-gray">
            Prochaine facturation :{" "}
            <span className="text-workon-ink font-medium">
              {formatDate(sub.currentPeriodEnd)}
            </span>
          </p>
        )}

        {sub?.cancelAtPeriodEnd && sub.currentPeriodEnd && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-900">
              Annulation programmée — ton plan reste actif jusqu&apos;au{" "}
              {formatDate(sub.currentPeriodEnd)}.
            </span>
          </div>
        )}

        {!isPaid && (
          <div className="mt-4">
            <p className="text-sm text-workon-gray mb-4">
              Tu es sur le plan gratuit. Passe à un plan payant pour débloquer
              plus de missions, visibilité, leads et vérification.
            </p>
            <Button asChild variant="hero" size="hero" className="w-full">
              <Link href="/pricing">Voir les plans</Link>
            </Button>
          </div>
        )}

        {isPaid && !sub?.cancelAtPeriodEnd && (
          <div className="mt-5">
            {!confirmCancel ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setConfirmCancel(true)}
              >
                Annuler mon abonnement
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-workon-ink">
                  L&apos;annulation prend effet à la fin de la période
                  courante. Tu gardes les avantages jusque là.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelMutation.isPending}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="flex-1"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirmer"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quota usage */}
      {quota && (
        <div className="mt-5 rounded-3xl bg-white border border-workon-border p-5 shadow-card">
          <p className="text-sm font-semibold text-workon-ink mb-2">
            Usage ce mois
          </p>
          <p className="text-sm text-workon-gray">
            Missions publiées :{" "}
            <span className="text-workon-ink font-medium">{quota.used}</span>
            {quota.limit !== null && <> / {quota.limit}</>}
          </p>
          {quota.limit !== null && (
            <div className="mt-3 h-2 w-full rounded-full bg-workon-bg-cream overflow-hidden">
              <div
                className="h-full bg-workon-primary transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (quota.used / Math.max(1, quota.limit)) * 100,
                  )}%`,
                }}
              />
            </div>
          )}
          {!quota.hasPaidPlan &&
            quota.limit !== null &&
            quota.used >= quota.limit && (
              <p className="mt-3 text-xs text-workon-muted">
                Limite atteinte. Passe au plan payant pour publier sans
                restriction.
              </p>
            )}
        </div>
      )}

      {/* Verify Express boost CTA */}
      <div className="mt-5 rounded-3xl bg-white border border-workon-border p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-workon-ink">
              Vérification express — 19 $
            </p>
            <p className="text-xs text-workon-gray mt-1">
              Ton dossier KYC (ID + téléphone) traité en moins de 24h. Badge
              « vérifié » accéléré.
            </p>
            <Button
              onClick={() => setVerifyBoostOpen(true)}
              variant="outline"
              className="mt-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Activer — 19 $
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-workon-muted">
        <Link href="/settings" className="hover:text-workon-gray">
          ← Autres réglages
        </Link>
      </div>

      <BoostCheckoutModal
        type="VERIFY_EXPRESS_19"
        isOpen={verifyBoostOpen}
        onClose={() => setVerifyBoostOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["subscription-me"] })}
      />
    </div>
  );
}
