"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentProfile } from "@/hooks/use-current-profile";

export default function OnboardingDetailsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading } = useCurrentProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
    }
  }, [profile]);

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

      const token = getAccessToken();
      if (!token) {
        setError("Authentification requise");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement");
      }

      const updatedProfile = await response.json();

      // Rediriger vers le bon dashboard selon le rôle
      if (updatedProfile.primaryRole === "WORKER") {
        router.push("/worker/dashboard");
      } else if (
        updatedProfile.primaryRole === "EMPLOYER" ||
        updatedProfile.primaryRole === "ADMIN"
      ) {
        router.push("/employer/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Complétez votre profil
          </h1>
          <p className="text-lg text-white/70">
            Ces informations nous aideront à personnaliser votre expérience
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500 bg-red-500/20 p-4 text-center text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-neutral-900/70 p-8 backdrop-blur"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Nom complet *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-white"
              >
                Téléphone *
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                placeholder="+1 (514) 555-0123"
                required
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-medium text-white"
              >
                Ville *
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                placeholder="Montréal, QC"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement..." : "Continuer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

