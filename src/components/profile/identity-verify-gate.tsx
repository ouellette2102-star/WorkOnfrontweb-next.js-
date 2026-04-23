"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * IdentityVerifyGate — banner that surfaces on shared pages (e.g. /profile)
 * when the current user has not completed phone + ID verification.
 *
 * Backend contract:
 *   GET /api/v1/identity/status → { phoneVerified, idVerified, trustTier }
 *
 * Hide rules:
 *   - trustTier >= VERIFIED (phone confirmed) → hide. Workers still get a
 *     "go further" opportunity on /profile/verify itself.
 *   - Status query failed (unauth, 503) → hide; we never block the page
 *     because verification status can't load.
 *
 * We keep this intentionally distinct from the Stripe Connect gate: a worker
 * can be Stripe-onboarded but identity-BASIC (or vice versa), and the CTAs
 * point at different flows.
 */
export interface IdentityVerifyGateProps {
  className?: string;
}

export function IdentityVerifyGate({ className }: IdentityVerifyGateProps) {
  const { data: status, isError } = useQuery({
    queryKey: ["verification-status", "profile-gate"],
    queryFn: () => api.getVerificationStatus(),
    staleTime: 60_000,
    retry: false,
  });

  if (isError) return null;
  if (!status) return null;
  if (status.trustTier && status.trustTier !== "BASIC") return null;

  return (
    <div
      role="region"
      aria-label="Vérification d'identité requise"
      className={cn(
        "rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-workon-ink">
            Vérifie ton identité
          </p>
          <p className="mt-1 text-sm text-workon-muted leading-relaxed">
            Les clients préfèrent les profils vérifiés. Ajoute ton téléphone
            (30&nbsp;secondes) pour débloquer plus de missions.
          </p>
          <div className="mt-4">
            <Button
              asChild
              size="sm"
              className="bg-workon-primary hover:bg-workon-primary/90 text-white"
            >
              <Link href="/profile/verify">Vérifier maintenant</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
