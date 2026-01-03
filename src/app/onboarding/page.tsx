import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getCurrentProfile } from "@/lib/get-profile";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile(clerkUser.id);
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-black text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <header className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            ← Retour à l’accueil
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-red-500">Onboarding WorkOn</p>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Choisis ton profil</h1>
            <p className="mt-3 text-white/70">
              Cette étape synchronise ton compte Clerk avec les outils WorkOn. Tu pourras modifier ces informations plus
              tard depuis ton profil.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl shadow-black/40">
          <OnboardingForm />
        </section>
      </div>
    </main>
  );
}

