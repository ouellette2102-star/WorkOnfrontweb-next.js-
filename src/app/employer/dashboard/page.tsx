import { requireEmployer } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmployerDashboardStats } from "./dashboard-stats";

export default async function EmployerDashboardPage() {
  const profile = await requireEmployer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Bienvenue, {profile.fullName || "Employeur"}
          </h1>
          <p className="text-lg text-white/70">
            G&eacute;rez vos missions et travailleurs
          </p>
        </div>

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Link href="/missions/new">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">&#x2795;</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Cr&eacute;er une mission
              </h3>
              <p className="text-sm text-white/70">
                Publiez une nouvelle mission
              </p>
            </div>
          </Link>

          <Link href="/missions/mine">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">&#x1F4CB;</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Mes missions
              </h3>
              <p className="text-sm text-white/70">
                Consultez toutes vos missions
              </p>
            </div>
          </Link>

          <Link href="/employer/discover">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">&#x1F50D;</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                D&eacute;couvrir
              </h3>
              <p className="text-sm text-white/70">
                Trouver des travailleurs
              </p>
            </div>
          </Link>

          <Link href="/employer/matches">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">&#x1F91D;</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Mes matches
              </h3>
              <p className="text-sm text-white/70">
                Vos travailleurs compatibles
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">&#x1F4AC;</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Messages
              </h3>
              <p className="text-sm text-white/70">
                Communiquez avec les workers
              </p>
            </div>
          </Link>
        </div>

        {/* Live stats from API */}
        <EmployerDashboardStats />

        {/* Infos profil */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Vos informations
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-white/50">Ville</p>
              <p className="text-white">{profile.city || "Non renseign\u00e9e"}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">T&eacute;l&eacute;phone</p>
              <p className="text-white">{profile.phone || "Non renseign\u00e9"}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">Email</p>
              <p className="text-white">{profile.email}</p>
            </div>
          </div>
          <Link href="/profile">
            <Button className="mt-4 rounded-xl bg-neutral-700 px-4 py-2 text-sm text-white transition hover:bg-neutral-600">
              Modifier mon profil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
