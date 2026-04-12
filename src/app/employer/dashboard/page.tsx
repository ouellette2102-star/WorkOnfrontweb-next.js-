import { requireEmployer } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmployerDashboardStats } from "./dashboard-stats";

export default async function EmployerDashboardPage() {
  const profile = await requireEmployer();

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">
            Bienvenue, {profile.fullName || "Employeur"}
          </h1>
          <p className="text-lg text-workon-muted">
            Gérez vos missions et vos travailleurs.
          </p>
        </div>

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Link href="/missions/new">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">➕</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Créer une mission
              </h3>
              <p className="text-sm text-workon-muted">
                Publiez une nouvelle mission
              </p>
            </div>
          </Link>

          <Link href="/missions/mine">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">📋</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Mes missions
              </h3>
              <p className="text-sm text-workon-muted">
                Consultez toutes vos missions
              </p>
            </div>
          </Link>

          <Link href="/employer/discover">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Découvrir
              </h3>
              <p className="text-sm text-workon-muted">
                Trouver des travailleurs
              </p>
            </div>
          </Link>

          <Link href="/employer/matches">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">🤝</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Mes matches
              </h3>
              <p className="text-sm text-workon-muted">
                Vos travailleurs compatibles
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Messages
              </h3>
              <p className="text-sm text-workon-muted">
                Communiquez avec les travailleurs
              </p>
            </div>
          </Link>
        </div>

        {/* Live stats from API */}
        <EmployerDashboardStats />

        {/* Infos profil */}
        <div className="mt-8 rounded-3xl border border-workon-border bg-workon-bg/70 p-6  shadow-sm">
          <h3 className="mb-4 text-xl font-semibold text-workon-ink">
            Vos informations
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-workon-muted">Ville</p>
              <p className="text-workon-ink">{profile.city || "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-sm text-workon-muted">Téléphone</p>
              <p className="text-workon-ink">{profile.phone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-sm text-workon-muted">Email</p>
              <p className="text-workon-ink">{profile.email}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/profile">Modifier mon profil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
