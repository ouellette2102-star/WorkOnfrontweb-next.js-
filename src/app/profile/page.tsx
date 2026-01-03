import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileRolesCard } from "@/components/profile/profile-roles-card";
import { getCurrentProfile } from "@/lib/get-profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile(clerkUser.id);
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-red-500">Profil</p>
          <h1 className="mt-3 text-4xl font-semibold">Tes informations</h1>
          <p className="mt-2 text-white/70">
            Sélectionne ton rôle principal WorkOn et complète tes infos publiques.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProfileRolesCard />

          <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl shadow-black/40">
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">Infos publiques</p>
            <h2 className="mt-3 text-2xl font-semibold">Profil affiché</h2>
            <p className="mt-2 text-white/70">
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


