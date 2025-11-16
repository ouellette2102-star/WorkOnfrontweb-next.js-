import Link from "next/link";

export default function OnboardingSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <span className="text-sm uppercase tracking-[0.4em] text-green-500">Profil prêt</span>
          <h1 className="text-4xl font-semibold md:text-5xl">Ton profil est prêt. Bienvenue sur WorkOn.</h1>
          <p className="text-white/70">
            Accède maintenant au fil en direct, découvre les missions ou publie ta première opportunité.
          </p>
        </div>
        <Link
          href="/feed"
          className="rounded-full bg-red-600 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-500"
        >
          Ouvrir le feed
        </Link>
      </div>
    </main>
  );
}


