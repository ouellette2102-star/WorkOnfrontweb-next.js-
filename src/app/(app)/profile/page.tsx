"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileRolesCard } from "@/components/profile/profile-roles-card";
import { WorkerCardEditor } from "@/components/profile/worker-card-editor";
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
          Modifie ta photo, ton rôle et tes informations publiques.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProfileRolesCard />

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
      </div>

      <WorkerCardEditor />
    </div>
  );
}
