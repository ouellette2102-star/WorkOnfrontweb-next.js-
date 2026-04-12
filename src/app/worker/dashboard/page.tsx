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
          <h1 className="mb-2 font-heading font-bold text-2xl text-[#1B1A18]">
            Salut {firstName} 👋
          </h1>
          <p className="text-sm text-[#706E6A]">
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
            <div className="group cursor-pointer bg-white border border-[#EAE6DF] rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">🔍</div>
              <h3 className="mb-1 text-base font-semibold text-[#1B1A18]">
                Missions disponibles
              </h3>
              <p className="text-xs text-[#706E6A]">
                Trouve des missions près de chez toi
              </p>
            </div>
          </Link>

          <Link href="/worker/payments">
            <div className="group cursor-pointer bg-white border border-[#EAE6DF] rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">💰</div>
              <h3 className="mb-1 text-base font-semibold text-[#1B1A18]">
                Paiements
              </h3>
              <p className="text-xs text-[#706E6A]">
                Gère tes paiements Stripe
              </p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="group cursor-pointer bg-white border border-[#EAE6DF] rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">🔔</div>
              <h3 className="mb-1 text-base font-semibold text-[#1B1A18]">
                Notifications
              </h3>
              <p className="text-xs text-[#706E6A]">
                Consulte tes notifications
              </p>
            </div>
          </Link>

          <Link href="/messages">
            <div className="group cursor-pointer bg-white border border-[#EAE6DF] rounded-2xl px-4 py-3.5 transition hover:shadow-soft">
              <div className="mb-3 text-3xl">💬</div>
              <h3 className="mb-1 text-base font-semibold text-[#1B1A18]">
                Messages
              </h3>
              <p className="text-xs text-[#706E6A]">
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
        <div className="mt-8 bg-white border border-[#EAE6DF] rounded-3xl p-5 shadow-card">
          <h3 className="mb-4 font-heading font-bold text-lg text-[#1B1A18]">
            Tes informations
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[10px] text-[#706E6A] uppercase tracking-wider">Ville</p>
              <p className="text-[#1B1A18]">{profile.city || "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#706E6A] uppercase tracking-wider">Téléphone</p>
              <p className="text-[#1B1A18]">{profile.phone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#706E6A] uppercase tracking-wider">Email</p>
              <p className="text-[#1B1A18]">{profile.email}</p>
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
