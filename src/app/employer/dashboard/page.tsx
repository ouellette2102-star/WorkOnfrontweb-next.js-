import { requireEmployer } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmployerDashboardClient } from "./dashboard-client";

export default async function EmployerDashboardPage() {
  const profile = await requireEmployer();

  return (
    <div className="min-h-screen bg-workon-bg">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-workon-ink sm:text-4xl">
            Bienvenue, {profile.fullName || "Client"}
          </h1>
          <p className="mt-1 text-base text-workon-muted">
            Votre tableau de bord client
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link href="/express">
            <div className="group cursor-pointer rounded-2xl border-2 border-workon-accent/30 bg-gradient-to-br from-workon-accent/10 to-workon-accent/5 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-accent/60 hover:shadow-md">
              <div className="mb-2 text-3xl">&#x26A1;</div>
              <h3 className="text-base font-semibold text-workon-ink">
                Express Dispatch
              </h3>
              <p className="mt-0.5 text-xs text-workon-muted">
                Besoin urgent
              </p>
            </div>
          </Link>

          <Link href="/missions/new">
            <div className="group cursor-pointer rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-primary/40 hover:shadow-md">
              <div className="mb-2 text-3xl">&#x2795;</div>
              <h3 className="text-base font-semibold text-workon-ink">
                Nouvelle mission
              </h3>
              <p className="mt-0.5 text-xs text-workon-muted">
                Publier une mission
              </p>
            </div>
          </Link>

          <Link href="/employer/discover">
            <div className="group cursor-pointer rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-primary/40 hover:shadow-md">
              <div className="mb-2 text-3xl">&#x1F50D;</div>
              <h3 className="text-base font-semibold text-workon-ink">
                Pros
              </h3>
              <p className="mt-0.5 text-xs text-workon-muted">
                Trouver des travailleurs
              </p>
            </div>
          </Link>

          <Link href="/employer/matches">
            <div className="group cursor-pointer rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-primary/40 hover:shadow-md">
              <div className="mb-2 text-3xl">&#x1F91D;</div>
              <h3 className="text-base font-semibold text-workon-ink">
                Matches
              </h3>
              <p className="mt-0.5 text-xs text-workon-muted">
                Vos compatibles
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-2xl border border-workon-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-workon-primary/40 hover:shadow-md">
              <div className="mb-2 text-3xl">&#x1F4AC;</div>
              <h3 className="text-base font-semibold text-workon-ink">
                Messages
              </h3>
              <p className="mt-0.5 text-xs text-workon-muted">
                Conversations
              </p>
            </div>
          </Link>
        </div>

        {/* Client-side: stats, missions, matches */}
        <EmployerDashboardClient />

        {/* Profile info */}
        <div className="mt-8 rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-workon-ink">
            Vos informations
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-workon-muted">Ville</p>
              <p className="mt-0.5 text-sm text-workon-ink">{profile.city || "Non renseignee"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-workon-muted">Telephone</p>
              <p className="mt-0.5 text-sm text-workon-ink">{profile.phone || "Non renseigne"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-workon-muted">Email</p>
              <p className="mt-0.5 text-sm text-workon-ink">{profile.email}</p>
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
