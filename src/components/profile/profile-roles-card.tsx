"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import type { PrimaryRole } from "@/lib/workon-api";

const ROLE_OPTIONS: Array<{
  key: PrimaryRole;
  label: string;
  description: string;
}> = [
  {
    key: "WORKER",
    label: "Travailleur",
    description: "Tu réalises des missions, tu partages ton portfolio et tu reçois des paiements.",
  },
  {
    key: "EMPLOYER",
    label: "Client entreprise",
    description: "Tu publies des missions et tu fais appel à des professionnels.",
  },
  {
    key: "CLIENT_RESIDENTIAL",
    label: "Client résidentiel",
    description: "Tu cherches des pros pour ta maison (plomberie, électricité, entretien...).",
  },
  {
    key: "ADMIN",
    label: "Administrateur",
    description: "Accès complet WorkOn pour superviser les opérations et les équipes.",
  },
];

export function ProfileRolesCard() {
  const { profile, isLoading, error, updateRole } = useProfile();
  const [selectedRole, setSelectedRole] = useState<PrimaryRole | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedRole(profile.primaryRole);
    }
  }, [profile]);

  const isUnchanged = !!profile && selectedRole === profile.primaryRole;

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setStatus("idle");
    setStatusMessage(null);
    try {
      await updateRole(selectedRole);
      setStatus("success");
      setStatusMessage("Rôle principal mis à jour ✨");
    } catch (err) {
      setStatus("error");
      setStatusMessage(
        err instanceof Error ? err.message : "Impossible de mettre à jour ton rôle.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <section className="rounded-3xl border border-workon-border bg-white  p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Profil</p>
        <h2 className="mt-2 text-2xl font-semibold">Chargement du profil...</h2>
        <p className="mt-4 text-workon-muted">Nous synchronisons ton compte WorkOn.</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="rounded-3xl border border-workon-accent/30 bg-workon-accent/5 p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-workon-accent">Impossible de charger le profil</h2>
        <p className="mt-2 text-sm text-workon-muted">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-workon-border bg-white  p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.4em] text-workon-accent">Ton rôle WorkOn</p>
      <h2 className="mt-4 text-2xl font-semibold">Sélectionne ton espace principal</h2>
      <p className="mt-3 text-workon-muted">
        Tu peux activer plusieurs espaces en parallèle (Travailleur, Client entreprise, Client résidentiel).
        Choisis simplement celui que tu veux voir en priorité dans le dashboard.
      </p>

      {/* Role change info */}
      <p className="mt-5 text-xs text-workon-muted">
        Ton rôle détermine ce que tu vois dans l&apos;app. Tu peux le changer à tout moment.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = option.key === selectedRole;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedRole(option.key)}
              className={`rounded-2xl border px-4 py-5 text-left transition ${
                isSelected
                  ? "border-[#134021] bg-[#134021]/10"
                  : "border-workon-border bg-workon-bg hover:border-[#134021]/40"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-workon-muted">{option.label}</p>
              <h3 className="mt-2 text-lg font-semibold">{option.label}</h3>
              <p className="mt-2 text-sm text-workon-muted">{option.description}</p>
              {isSelected ? (
                <span className="mt-3 inline-flex rounded-full bg-[#134021]/15 border border-[#134021]/25 px-3 py-1 text-xs text-workon-accent">
                  Rôle principal
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          disabled={!selectedRole || isSubmitting || isUnchanged}
          onClick={handleSave}
          className="rounded-full bg-[#134021] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0F3319] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : "Sauvegarder mon rôle"}
        </button>
        {statusMessage ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-[#22C55E]" : "text-workon-accent"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
      </div>

      {profile ? (
        <div className="mt-8 rounded-2xl border border-workon-border bg-workon-bg/60 p-4 text-sm text-workon-muted">
          <p className="font-semibold text-white">Accès actifs :</p>
          <ul className="mt-2 space-y-1">
            <li>• Travailleurs : {profile.isWorker ? "✅ actif" : "—"}</li>
            <li>• Clients entreprise : {profile.isEmployer ? "✅ actif" : "—"}</li>
            <li>
              • Clients résidentiels : {profile.isClientResidential ? "✅ actif" : "—"}
            </li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
