"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Phone, CreditCard, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const TIER_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  BASIC: { label: "Basique", color: "text-neutral-400 border-neutral-500/30 bg-neutral-500/10", description: "Compte non verifie" },
  VERIFIED: { label: "Verifie", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", description: "Telephone verifie" },
  TRUSTED: { label: "Fiable", color: "text-green-400 border-green-500/30 bg-green-500/10", description: "Identite confirmee" },
  PREMIUM: { label: "Premium", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", description: "Verification complete" },
};

const TIERS_ORDER = ["BASIC", "VERIFIED", "TRUSTED", "PREMIUM"];

export default function VerifyPage() {
  const queryClient = useQueryClient();
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { data: status, isLoading } = useQuery({
    queryKey: ["verification-status"],
    queryFn: () => api.getVerificationStatus(),
  });

  const phoneMutation = useMutation({
    mutationFn: () => api.startPhoneVerification(),
    onSuccess: () => {
      setShowOtpInput(true);
      toast.success("Code de verification envoye");
    },
    onError: () => toast.error("Erreur lors de l'envoi du code"),
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => api.confirmPhoneOtp(otpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast.success("Telephone verifie avec succes !");
      setShowOtpInput(false);
      setOtpCode("");
    },
    onError: () => toast.error("Code invalide"),
  });

  const idMutation = useMutation({
    mutationFn: () => api.startIdVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast.success("Verification d'identite lancee");
    },
    onError: () => toast.error("Erreur lors du lancement de la verification"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  const tierConfig = status ? TIER_CONFIG[status.trustTier] || TIER_CONFIG.BASIC : TIER_CONFIG.BASIC;
  const currentTierIndex = status ? TIERS_ORDER.indexOf(status.trustTier) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/home" className="mb-4 inline-flex items-center gap-1 text-sm text-workon-muted hover:text-workon-ink">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-workon-ink">Verification d&apos;identite</h1>
      <p className="mb-6 text-workon-muted">Augmentez votre niveau de confiance pour debloquer plus de fonctionnalites.</p>

      {/* Current tier */}
      <div className={`mb-6 rounded-xl border p-4 ${tierConfig.color}`}>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-bold">Niveau: {tierConfig.label}</h2>
            <p className="text-sm opacity-80">{tierConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-workon-muted">
          {TIERS_ORDER.map((tier, i) => (
            <span key={tier} className={i <= currentTierIndex ? "text-workon-accent font-medium" : ""}>
              {TIER_CONFIG[tier].label}
            </span>
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-workon-bg">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
            style={{ width: `${((currentTierIndex + 1) / TIERS_ORDER.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Verification steps */}
      <div className="space-y-4">
        {/* Phone verification */}
        <div className="rounded-xl border border-workon-border bg-white shadow-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status?.phoneVerified ? "bg-green-500/20" : "bg-workon-bg"}`}>
                {status?.phoneVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Phone className="h-5 w-5 text-workon-muted" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-workon-ink">Verification du telephone</h3>
                <p className="text-sm text-workon-muted">Confirmez votre numero par SMS</p>
              </div>
            </div>
            {status?.phoneVerified && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                Verifie
              </span>
            )}
          </div>

          {!status?.phoneVerified && !showOtpInput && (
            <Button
              onClick={() => phoneMutation.mutate()}
              disabled={phoneMutation.isPending}
              className="bg-workon-primary hover:bg-workon-primary/90"
            >
              {phoneMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              Envoyer le code
            </Button>
          )}

          {showOtpInput && (
            <div className="flex gap-2">
              <Input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Code a 6 chiffres"
                maxLength={6}
                className="flex-1 border-workon-border bg-white text-center text-lg tracking-widest text-workon-ink placeholder-workon-muted/50"
              />
              <Button
                onClick={() => confirmOtpMutation.mutate()}
                disabled={otpCode.length < 4 || confirmOtpMutation.isPending}
                className="bg-green-600 hover:bg-green-500"
              >
                {confirmOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
              </Button>
            </div>
          )}
        </div>

        {/* ID verification */}
        <div className="rounded-xl border border-workon-border bg-white shadow-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status?.idVerified ? "bg-green-500/20" : "bg-workon-bg"}`}>
                {status?.idVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <CreditCard className="h-5 w-5 text-workon-muted" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-workon-ink">Verification d&apos;identite</h3>
                <p className="text-sm text-workon-muted">Soumettez une piece d&apos;identite officielle</p>
              </div>
            </div>
            {status?.idVerified && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                Verifie
              </span>
            )}
          </div>

          {!status?.idVerified && (
            <Button
              onClick={() => idMutation.mutate()}
              disabled={idMutation.isPending}
              className="bg-workon-primary hover:bg-workon-primary/90"
            >
              {idMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Commencer la verification
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
