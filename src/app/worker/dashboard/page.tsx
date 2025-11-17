import { requireWorker } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function WorkerDashboardPage() {
  const profile = await requireWorker();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Bienvenue, {profile.fullName || "Travailleur"} 👋
          </h1>
          <p className="text-lg text-white/70">
            Voici vos missions et opportunités
          </p>
        </div>

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Link href="/missions/available">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-blue-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Missions disponibles
              </h3>
              <p className="text-sm text-white/70">
                Trouvez des missions près de chez vous
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-blue-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Notifications
              </h3>
              <p className="text-sm text-white/70">
                Consultez vos notifications
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-blue-500 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Messages
              </h3>
              <p className="text-sm text-white/70">
                Communiquez avec les employeurs
              </p>
            </div>
          </Link>
        </div>

        {/* Sections principales */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Missions réservées */}
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Mes missions réservées
              </h2>
              <Link href="/missions/available">
                <Button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
                  Voir toutes
                </Button>
              </Link>
            </div>
            <p className="text-white/70">
              Vous n'avez pas encore de missions réservées
            </p>
          </div>

          {/* Missions en cours */}
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Missions en cours
              </h2>
            </div>
            <p className="text-white/70">
              Aucune mission en cours pour le moment
            </p>
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

