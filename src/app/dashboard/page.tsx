import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/get-profile";
import { DashboardRoleCard } from "@/components/dashboard/dashboard-role-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const profileRecord = await getCurrentProfile(clerkUser.id);

  if (!profileRecord) {
    redirect("/onboarding");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: {
      createdAt: true,
    },
  });

  const displayName =
    clerkUser.firstName || clerkUser.lastName
      ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim()
      : clerkUser.emailAddresses[0]?.emailAddress ?? "Profil WorkOn";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
        <DashboardHero displayName={displayName} />

        <section className="grid gap-6 md:grid-cols-2">
          <DashboardRoleCard />

          {/* Missions Quick Access */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Missions
            </p>
            <h2 className="mt-3 text-xl font-semibold">Gère tes missions</h2>
            <p className="mt-2 text-sm text-white/70">
              Trouve des opportunités ou publie tes besoins
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/missions/available">
                <Button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-red-500/50 hover:bg-white/10">
                  🔍 Voir les missions disponibles
                </Button>
              </Link>
              <Link href="/missions/new">
                <Button className="w-full rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500">
                  ➕ Créer une mission
                </Button>
              </Link>
              <Link href="/missions/mine">
                <Button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-red-500/50 hover:bg-white/10">
                  📋 Mes missions
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section Prochainement */}
        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Prochainement</p>
          <h2 className="mt-3 text-xl font-semibold">Onboarding guidé</h2>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>• Upload de pièces justificatives (ID, assurances)</li>
            <li>• Gestion des équipes & accès multi-roles</li>
            <li>• Stripe Connect pour paiements instantanés</li>
          </ul>

          {dbUser?.createdAt ? (
            <p className="mt-4 text-sm text-white/50">
              Membre depuis le {new Date(dbUser.createdAt).toLocaleDateString("fr-CA")}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

