"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import type { PrimaryRole } from "@/lib/workon-api";
import { saveProfile } from "@/lib/workon-api";

const roles: Array<{ value: PrimaryRole; label: string }> = [
  { value: "WORKER", label: "Worker" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "CLIENT_RESIDENTIAL", label: "Client résidentiel" },
];

type FormState = {
  role: string;
  name: string;
  phone: string;
  city: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function OnboardingForm() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [state, setState] = useState<FormState>({
    role: "",
    name: "",
    phone: "",
    city: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof FormState) => (value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const nextFieldErrors: FieldErrors = {};

    (["role", "name", "phone", "city"] satisfies (keyof FormState)[]).forEach((key) => {
      if (!state[key]?.trim()) {
        nextFieldErrors[key] = "Champ requis";
      }
    });

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError("Merci de compléter tous les champs.");
      return;
    }

    const payload = {
      role: state.role,
      name: state.name.trim(),
      phone: state.phone.trim(),
      city: state.city.trim(),
    };
    startTransition(async () => {
      try {
        if (authLoading || !isAuthenticated) {
          setError("Authentification en cours. Réessaie dans un instant.");
          return;
        }
        const token = getAccessToken();
        if (!token) {
          setError(
            "Impossible de récupérer le token. Réessaie ou reconnecte-toi.",
          );
          return;
        }
        await saveProfile(token, {
          primaryRole: payload.role as PrimaryRole,
          fullName: payload.name,
          phone: payload.phone,
          city: payload.city,
        });
        router.push("/dashboard");
      } catch (apiError) {
        setError(
          apiError instanceof Error
            ? apiError.message
            : "Une erreur est survenue. Réessaie.",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-white">Ton rôle</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handleChange("role")(role.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                state.role === role.value
                  ? "border-red-500 bg-red-500/10 text-white"
                  : "border-workon-border bg-workon-bg text-workon-muted hover:border-white/30"
              }`}
            >
              <p className="font-semibold">{role.label}</p>
              <p className="text-xs text-workon-muted">Accès dédié et outils adaptés</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-workon-muted">Nom complet</label>
          <input
            type="text"
            value={state.name}
            onChange={(event) => handleChange("name")(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            placeholder="Ex: Alex Tremblay"
          />
          {fieldErrors.name ? <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p> : null}
        </div>
        <div>
          <label className="text-sm text-workon-muted">Téléphone</label>
          <input
            type="tel"
            value={state.phone}
            onChange={(event) => handleChange("phone")(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            placeholder="+1 514 555 1234"
          />
          {fieldErrors.phone ? <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p> : null}
        </div>
        <div>
          <label className="text-sm text-workon-muted">Ville</label>
          <input
            type="text"
            value={state.city}
            onChange={(event) => handleChange("city")(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-workon-border bg-workon-bg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            placeholder="Montréal, QC"
          />
          {fieldErrors.city ? <p className="mt-1 text-xs text-red-400">{fieldErrors.city}</p> : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-red-600 px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-500 disabled:opacity-70"
      >
        {isPending ? "En cours..." : "Continuer"}
      </button>
    </form>
  );
}