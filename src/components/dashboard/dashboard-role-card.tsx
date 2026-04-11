"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";

const ROLE_LABELS: Record<string, string> = {
  WORKER: "Travailleur",
  EMPLOYER: "Employeur",
  CLIENT_RESIDENTIAL: "Client résidentiel",
  ADMIN: "Administrateur",
};

export function DashboardRoleCard() {
  const { profile, isLoading, error } = useProfile();

  return (
    <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-workon-muted">Ton statut</p>
      <h2 className="mt-3 text-xl font-semibold text-workon-ink">Profil WorkOn</h2>

      {isLoading && !profile ? (
        <p className="mt-3 text-workon-muted">Chargement du profil...</p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600">Erreur : {error}</p>
      ) : null}

      {profile ? (
        <>
          <p className="mt-3 text-workon-muted">
            Rôle principal :{" "}
            <span className="font-semibold text-workon-ink">
              {ROLE_LABELS[profile.primaryRole] ?? profile.primaryRole}
            </span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-workon-muted">
            <li>• Accès Worker : {profile.isWorker ? "✅" : "—"}</li>
            <li>• Accès Employer : {profile.isEmployer ? "✅" : "—"}</li>
            <li>• Accès Client résidentiel : {profile.isClientResidential ? "✅" : "—"}</li>
          </ul>
        </>
      ) : null}

      <Link
        href="/profile"
        className="mt-6 inline-flex rounded-full border border-workon-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-workon-muted transition hover:text-workon-ink hover:border-workon-ink/30"
      >
        Mettre à jour mes rôles
      </Link>
    </div>
  );
}
