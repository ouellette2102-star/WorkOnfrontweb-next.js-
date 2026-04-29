import { requireWorker } from "@/lib/auth-helpers";
import { ActiveMissionsCard } from "@/components/worker/active-missions-card";
import { AvailableMissionsCard } from "@/components/worker/available-missions-card";
import { MissionHistoryCard } from "@/components/worker/mission-history-card";
import { ProfileCompletionCard } from "@/components/worker/profile-completion-card";
import { QuickStatsCard } from "@/components/worker/quick-stats-card";
import { StripeConnectGate } from "@/components/worker/stripe-connect-gate";
import { TrustScoreRing } from "@/components/worker/trust-score-ring";
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
          <h1 className="mb-2 font-heading font-bold text-2xl text-workon-ink">
            Salut {firstName} 👋
          </h1>
          <p className="text-sm text-workon-gray">
            {profile.city ? `Tu es à ${profile.city}` : "Prêt à trouver des missions près de chez toi"}
          </p>
        </div>

        {/* Stripe Connect gate (hidden when onboarded) */}
        <div className="mb-6">
          <StripeConnectGate />
        </div>

        {/* Profile completion (hidden when 100%) */}
        <ProfileCompletionCard />

        {/* Quick Stats */}
        <QuickStatsCard />

        {/* Actions rapides */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Link href="/worker/missions">
            <div className="group cursor-pointer bg-white border border-workon-border rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">🔍</div>
              <h3 className="mb-1 text-base font-semibold text-workon-ink">
                Missions disponibles
              </h3>
              <p className="text-xs text-workon-gray">
                Trouve des missions près de chez toi
              </p>
            </div>
          </Link>

          <Link href="/worker/payments">
            <div className="group cursor-pointer bg-white border border-workon-border rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">💰</div>
              <h3 className="mb-1 text-base font-semibold text-workon-ink">
                Paiements
              </h3>
              <p className="text-xs text-workon-gray">
                Gère tes paiements Stripe
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer bg-white border border-workon-border rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">🔔</div>
              <h3 className="mb-1 text-base font-semibold text-workon-ink">
                Notifications
              </h3>
              <p className="text-xs text-workon-gray">
                Consulte tes notifications
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer bg-white border border-workon-border rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">💬</div>
              <h3 className="mb-1 text-base font-semibold text-workon-ink">
                Messages
              </h3>
              <p className="text-xs text-workon-gray">
                Communique avec les clients
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
        <div className="mt-8 bg-white border border-workon-border rounded-3xl p-5 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h3 className="mb-4 font-heading font-bold text-lg text-workon-ink">
                Tes informations
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[10px] text-workon-gray uppercase tracking-wider">Ville</p>
                  <p className="text-workon-ink">{profile.city || "Non renseignée"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-workon-gray uppercase tracking-wider">Téléphone</p>
                  <p className="text-workon-ink">{profile.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-workon-gray uppercase tracking-wider">Email</p>
                  <p className="text-workon-ink">{profile.email}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/profile">Modifier mon profil</Link>
              </Button>
            </div>
            {/* Trust Score Ring */}
            <div className="flex-shrink-0">
              <TrustScoreRing size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
