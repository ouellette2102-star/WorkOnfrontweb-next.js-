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
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ton statut</p>
      <h2 className="mt-3 text-xl font-semibold">Profil WorkOn</h2>

      {isLoading && !profile ? (
        <p className="mt-3 text-white/60">Chargement du profil...</p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-400">Erreur : {error}</p>
      ) : null}

      {profile ? (
        <>
          <p className="mt-3 text-white/70">
            Rôle principal :{" "}
            <span className="font-semibold">
              {ROLE_LABELS[profile.primaryRole] ?? profile.primaryRole}
            </span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-white/70">
            <li>• Accès Worker : {profile.isWorker ? "✅" : "—"}</li>
            <li>• Accès Employer : {profile.isEmployer ? "✅" : "—"}</li>
            <li>• Accès Client résidentiel : {profile.isClientResidential ? "✅" : "—"}</li>
          </ul>
        </>
      ) : null}

      <Link
        href="/profile"
        className="mt-6 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:text-white"
      >
        Mettre à jour mes rôles
      </Link>
    </div>
  );
}

