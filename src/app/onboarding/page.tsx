import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireAuth } from "@/lib/server-auth";
import { getCurrentProfile } from "@/lib/get-profile";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireAuth();

  const profile = await getCurrentProfile(user.id);
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <header className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-workon-muted hover:text-workon-ink">
            ← Retour à l’accueil
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-workon-accent">Onboarding WorkOn</p>
            <h1 className="mt-4 text-4xl font-semibold font-heading md:text-5xl">Choisis ton profil</h1>
            <p className="mt-3 text-workon-muted">
              Dis-nous qui tu es pour qu’on adapte l’expérience — tu pourras modifier ces informations plus tard
              depuis ton profil.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-workon-border bg-white p-8 shadow-card">
          <OnboardingForm />
        </section>
      </div>
    </main>
  );
}

