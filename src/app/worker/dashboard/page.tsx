import { requireWorker } from "@/lib/auth-helpers";
import { ActiveMissionsCard } from "@/components/worker/active-missions-card";
import { AvailableMissionsCard } from "@/components/worker/available-missions-card";
import { MissionHistoryCard } from "@/components/worker/mission-history-card";
import { QuickStatsCard } from "@/components/worker/quick-stats-card";
import { StripeConnectGate } from "@/components/worker/stripe-connect-gate";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function WorkerDashboardPage() {
  const profile = await requireWorker();

  // Extraire le prénom (premier mot du fullName)
  const firstName = profile.fullName?.split(" ")[0] || "Travailleur";

  return (
    <div className="min-h-screen bg-workon-bg p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-workon-ink">
            Salut {firstName} 👋
          </h1>
          <p className="text-lg text-workon-muted">
            {profile.city ? `Tu es à ${profile.city}` : "Prêt à trouver des missions près de chez toi"}
          </p>
        </div>

        {/* Stripe Connect gate (hidden when onboarded) */}
        <div className="mb-6">
          <StripeConnectGate />
        </div>

        {/* Quick Stats */}
        <QuickStatsCard />

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Link href="/worker/missions">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Missions disponibles
              </h3>
              <p className="text-sm text-workon-muted">
                Trouve des missions près de chez toi
              </p>
            </div>
          </Link>

          <Link href="/worker/payments">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-green-50 p-6 transition hover:border-[#22C55E]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">💰</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Paiements
              </h3>
              <p className="text-sm text-workon-muted">
                Gère tes paiements Stripe
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Notifications
              </h3>
              <p className="text-sm text-workon-muted">
                Consulte tes notifications
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-workon-border bg-workon-bg/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-workon-bg">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-workon-ink">
                Messages
              </h3>
              <p className="text-sm text-workon-muted">
                Communique avec les employeurs
              </p>
            </div>
          </Link>
        </div>

        {/* Sections principales */}
        <div className="grid gap-8">
          {/* Missions actives */}
          <ActiveMissionsCard />

          {/* Missions disponibles (compacte) */}
          <AvailableMissionsCard />

          {/* Historique */}
          <MissionHistoryCard />
        </div>

        {/* Infos profil */}
        <div className="mt-8 rounded-3xl border border-workon-border bg-workon-bg/70 p-6 backdrop-blur">
          <h3 className="mb-4 text-xl font-semibold text-workon-ink">
            Tes informations
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
