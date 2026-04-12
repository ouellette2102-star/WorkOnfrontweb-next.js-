import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileRolesCard } from "@/components/profile/profile-roles-card";
import { requireAuth } from "@/lib/server-auth";
import { getCurrentProfile } from "@/lib/get-profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireAuth();

  const profile = await getCurrentProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-workon-accent">Profil</p>
          <h1 className="mt-3 text-4xl font-semibold">Tes informations</h1>
          <p className="mt-2 text-workon-muted">
            Sélectionne ton rôle principal WorkOn et complète tes infos publiques.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProfileRolesCard />

          <section className="rounded-3xl border border-workon-border bg-white  p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Infos publiques</p>
            <h2 className="mt-3 text-2xl font-semibold">Profil affiché</h2>
            <p className="mt-2 text-workon-muted">
              Ces données sont visibles sur les futures cartes WorkOn.
            </p>

            <div className="mt-6">
              <ProfileForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


