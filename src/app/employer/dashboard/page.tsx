import { requireEmployer } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EmployerDashboardPage() {
  const profile = await requireEmployer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Bienvenue, {profile.fullName || "Employeur"} 💼
          </h1>
          <p className="text-lg text-white/70">
            Gérez vos missions et travailleurs
          </p>
        </div>

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Link href="/missions/create">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">➕</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Créer une mission
              </h3>
              <p className="text-sm text-white/70">
                Publiez une nouvelle mission
              </p>
            </div>
          </Link>

          <Link href="/missions/mine">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">📋</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Mes missions
              </h3>
              <p className="text-sm text-white/70">
                Consultez toutes vos missions
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Notifications
              </h3>
              <p className="text-sm text-white/70">
                Vos notifications importantes
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-green-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Messages
              </h3>
              <p className="text-sm text-white/70">
                Communiquez avec les workers
              </p>
            </div>
          </Link>
        </div>

        {/* Sections principales */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Missions actives */}
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Missions actives
              </h2>
              <Link href="/missions/mine">
                <Button className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500">
                  Voir toutes
                </Button>
              </Link>
            </div>
            <p className="text-white/70">
              Vous n'avez pas encore de missions actives
            </p>
          </div>

          {/* Missions en attente */}
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                En attente de workers
              </h2>
            </div>
            <p className="text-white/70">
              Aucune mission en attente pour le moment
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <p className="text-sm text-white/50">Total missions créées</p>
            <p className="mt-2 text-3xl font-bold text-white">0</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <p className="text-sm text-white/50">Missions complétées</p>
            <p className="mt-2 text-3xl font-bold text-white">0</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <p className="text-sm text-white/50">Workers engagés</p>
            <p className="mt-2 text-3xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Infos profil */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Vos informations
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-white/50">Ville</p>
              <p className="text-white">{profile.city || "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">Téléphone</p>
              <p className="text-white">{profile.phone || "Non renseigné"}</p>
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

