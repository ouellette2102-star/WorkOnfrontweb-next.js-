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
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Salut {firstName} 👋
          </h1>
          <p className="text-lg text-white/70">
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
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Missions disponibles
              </h3>
              <p className="text-sm text-white/70">
                Trouve des missions près de chez toi
              </p>
            </div>
          </Link>

          <Link href="/worker/payments">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-gradient-to-br from-green-900/20 to-neutral-900/70 p-6 backdrop-blur transition hover:border-[#22C55E]/50 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">💰</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Paiements
              </h3>
              <p className="text-sm text-white/70">
                Gère tes paiements Stripe
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Notifications
              </h3>
              <p className="text-sm text-white/70">
                Consulte tes notifications
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-[#FF4D1C]/50 hover:bg-neutral-900">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                Messages
              </h3>
              <p className="text-sm text-white/70">
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
        <div className="mt-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Tes informations
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
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/profile">Modifier mon profil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
