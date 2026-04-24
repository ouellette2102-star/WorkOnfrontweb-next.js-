"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { WorkerCardEditor } from "@/components/profile/worker-card-editor";
import { PortfolioUploader } from "@/components/profile/portfolio-uploader";
import { BusinessInfoEditor } from "@/components/profile/business-info-editor";
import { StripeConnectGate } from "@/components/worker/stripe-connect-gate";
import { IdentityVerifyGate } from "@/components/profile/identity-verify-gate";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-workon-accent">Profil</p>
        <h1 className="mt-3 text-4xl font-semibold">Tes informations</h1>
        <p className="mt-2 text-workon-muted">
          Modifie ta photo et tes informations publiques. Change ton rôle
          (Pro/Client) depuis le menu en haut à droite.
        </p>
      </div>

      {/* Worker-only: visible only when role=worker and onboarding incomplete.
          Self-dismisses for clients and for workers already onboarded. */}
      <StripeConnectGate />

      {/* All roles: surfaces when trustTier === BASIC (unverified identity).
          Auto-hides once phone/ID verification moves the tier up. */}
      <IdentityVerifyGate />

      <section className="rounded-3xl border border-workon-border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Infos publiques</p>
        <h2 className="mt-3 text-2xl font-semibold">Profil affiché</h2>
        <p className="mt-2 text-workon-muted">
          Photo, nom, ville — visibles sur tes cartes WorkOn.
        </p>
        <div className="mt-6">
          <ProfileForm />
        </div>
      </section>

      <WorkerCardEditor />

      {/* Portfolio gallery — feeds LocalUser.gallery, surfaced on the public
          worker card + /worker/[id]. Backend endpoints already existed; the UI
          was the missing piece (bug #5). */}
      <PortfolioUploader />

      {/* Revenu Québec IN-203 — legal snapshot fields printed on every
          invoice issued through WorkOn. Kept below the public-profile
          sections because these are private, legal fields — not
          marketing content. */}
      <BusinessInfoEditor />
    </div>
  );
}
