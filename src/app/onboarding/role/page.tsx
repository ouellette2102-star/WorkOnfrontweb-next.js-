"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export default function OnboardingRolePage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = async (role: "WORKER" | "EMPLOYER") => {
    if (authLoading || !isAuthenticated) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ primaryRole: role }),
      });

      // Rediriger vers l'étape suivante (détails)
      router.push("/onboarding/details");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Bienvenue sur WorkOn
          </h1>
          <p className="text-lg text-white/70">
            Pour commencer, dites-nous qui vous êtes
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500 bg-red-500/20 p-4 text-center text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Carte Travailleur */}
          <button
            onClick={() => handleRoleSelect("WORKER")}
            disabled={isSubmitting}
            className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-neutral-900/70 p-8 text-left backdrop-blur transition-all hover:border-blue-500 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative z-10">
              <div className="mb-4 text-6xl">👷</div>
              <h2 className="mb-3 text-2xl font-bold text-white">
                Je suis Travailleur
              </h2>
              <p className="text-white/70">
                Je cherche des missions et je veux gagner de l'argent en
                travaillant
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Carte Employeur */}
          <button
            onClick={() => handleRoleSelect("EMPLOYER")}
            disabled={isSubmitting}
            className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-neutral-900/70 p-8 text-left backdrop-blur transition-all hover:border-green-500 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative z-10">
              <div className="mb-4 text-6xl">💼</div>
              <h2 className="mb-3 text-2xl font-bold text-white">
                Je suis Employeur
              </h2>
              <p className="text-white/70">
                Je publie des missions et je cherche des travailleurs qualifiés
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        {isSubmitting && (
          <div className="mt-6 text-center text-white/70">
            Enregistrement en cours...
          </div>
        )}
      </div>
    </div>
  );
}

