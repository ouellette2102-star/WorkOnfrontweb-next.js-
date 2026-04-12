"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * /onboarding/details — Optional profile completion step after register.
 *
 * Historical note: this page used to call the dead `/profile/me` endpoint
 * directly via bare fetch + the defunct `useCurrentProfile` hook. Both
 * have been replaced with the canonical `useProfile` hook, which routes
 * through `api.fetchProfile` / `api.saveProfile` → `GET/PATCH /users/me`.
 */
export default function OnboardingDetailsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from profile once it lands.
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile]);

  // Redirect unauthenticated users away.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/onboarding/details");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Le nom complet est requis");
      return;
    }
    if (!phone.trim()) {
      setError("Le numéro de téléphone est requis");
      return;
    }
    if (!city.trim()) {
      setError("La ville est requise");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });

      // Role-aware redirect based on the authenticated user, not the
      // profile response (which no longer carries primaryRole reliably).
      if (user?.role === "worker") {
        router.push("/worker/dashboard");
      } else if (user?.role === "employer") {
        router.push("/employer/dashboard");
      } else {
        router.push("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-workon-bg">
        <div className="text-workon-muted">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-workon-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Complétez votre profil
          </h1>
          <p className="text-lg text-workon-muted">
            Ces informations nous aideront à personnaliser votre expérience
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-[#B5382A]/30 bg-[#B5382A]/5 p-4 text-center text-workon-accent shadow-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-workon-border bg-white backdrop-blur-sm p-8 shadow-sm"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (514) 555-0123"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Montréal, QC"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="hero"
            size="hero"
            className="mt-8 w-full"
          >
            {isSubmitting ? "Enregistrement..." : "Continuer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
