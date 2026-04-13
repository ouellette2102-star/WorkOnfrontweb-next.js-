"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { StatsBar } from "@/components/stats-bar";
import { WorkerCard } from "@/components/worker/worker-card";
import { MissionCard } from "@/components/mission/mission-card";
import { StripeConnectGate } from "@/components/worker/stripe-connect-gate";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Briefcase, Search, Phone } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: () => api.getHomeStats(),
  });

  const { data: workersData } = useQuery({
    queryKey: ["featured-workers"],
    queryFn: () => api.getWorkers({ limit: 12 }),
  });

  // Filter out obvious test / seed accounts
  const realWorkers = (workersData?.workers ?? []).filter((w) => {
    const first = (w.firstName ?? "").trim();
    const last = (w.lastName ?? "").trim();
    if (first.length < 2 || last.length < 2) return false;
    const full = `${first} ${last}`.toLowerCase();
    if (full.startsWith("test") || full.includes("john doe") || full.includes("jane doe"))
      return false;
    return true;
  });

  const { data: myMissions } = useQuery({
    queryKey: ["my-missions"],
    queryFn: () => (user?.role === "employer" ? api.getMyMissions() : api.getMyAssignments()),
    enabled: !!user,
  });

  const activeMissions = myMissions?.filter(
    (m) => m.status === "open" || m.status === "assigned" || m.status === "in_progress",
  );

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Hero — light organic gradient */}
      <div className="relative -mx-4 -mt-6 px-4 pt-6 pb-8 bg-gradient-to-b from-workon-primary/10 via-workon-primary/5 to-transparent">
        <h1 className="text-2xl font-bold text-center text-workon-ink">
          {user?.role === "worker" ? "Trouvez des missions" : "Trouvez votre talent"}
        </h1>
        <p className="text-center text-workon-muted text-sm mt-1">
          {user?.role === "worker"
            ? "Missions disponibles près de chez vous"
            : "Une ligne directe vers le travail instantané"}
        </p>

        {/* Stats bar */}
        {stats && (
          <div className="mt-4">
            <StatsBar
              activeWorkers={stats.activeWorkers}
              completedMissions={stats.completedContracts}
              nearby={stats.openServiceCalls}
            />
          </div>
        )}
      </div>

      {/* Stripe Connect gate (workers only — hidden when onboarded) */}
      {user?.role === "worker" && <StripeConnectGate />}

      {/* Quick actions */}
      <div className="flex gap-3">
        {user?.role === "employer" || user?.role === "residential_client" ? (
          <>
            <Button asChild className="flex-1 h-12 bg-workon-accent hover:bg-workon-accent/90 text-white">
              <Link href="/express">
                <Phone className="h-4 w-4 mr-1" />
                Express Dispatch
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-12 border-workon-border text-workon-ink">
              <Link href="/missions/new">
                <Plus className="h-4 w-4 mr-1" />
                Mission
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="flex-1 h-12 bg-workon-primary hover:bg-workon-primary/90 text-white">
              <Link href="/search">
                <Search className="h-4 w-4 mr-1" />
                Trouver des missions
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-12 border-workon-border text-workon-ink">
              <Link href="/map">
                <MapPin className="h-4 w-4 mr-1" />
                Carte
              </Link>
            </Button>
          </>
        )}
      </div>

      {/* Missions + Pros — side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Active missions */}
        <section className="space-y-3">
          {activeMissions && activeMissions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-workon-ink">
                  <Briefcase className="inline h-4 w-4 mr-1 text-workon-primary" />
                  Missions actives
                </h2>
                <Link href="/missions" className="text-xs text-workon-primary hover:underline">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-2">
                {activeMissions.slice(0, 4).map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </>
          ) : (
            user && activeMissions !== undefined && (
              <div className="rounded-2xl border border-workon-border bg-white p-6 text-center shadow-sm h-full flex flex-col items-center justify-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-workon-primary/10">
                  <Briefcase className="h-5 w-5 text-workon-primary" />
                </div>
                <h2 className="font-semibold text-base text-workon-ink">
                  {user.role === "employer"
                    ? "Aucune mission en cours"
                    : "Prêt pour ta prochaine mission ?"}
                </h2>
                <p className="mt-1 text-sm text-workon-muted">
                  {user.role === "employer"
                    ? "Publie ta première mission."
                    : "Des missions t'attendent près de chez toi."}
                </p>
                <Button asChild className="mt-4 bg-workon-primary hover:bg-workon-primary/90 text-white">
                  <Link href={user.role === "employer" ? "/express" : "/search"}>
                    {user.role === "employer" ? "Express Dispatch" : "Voir les missions"}
                  </Link>
                </Button>
              </div>
            )
          )}
        </section>

        {/* Right: Featured workers */}
        <section className="space-y-3">
          {realWorkers.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-workon-ink">Pros disponibles</h2>
                <Link href="/search" className="text-xs text-workon-primary hover:underline">
                  Voir tout
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {realWorkers.slice(0, 4).map((w) => (
                  <WorkerCard key={w.id} worker={w} compact />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-workon-border bg-white p-6 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <p className="text-sm text-workon-muted">Aucun pro disponible pour le moment.</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-workon-muted pt-4 space-y-1">
        <p>WorkOn fournit l&apos;infrastructure de mise en relation et paiement.</p>
        <p>Paiement sécurisé par Stripe.</p>
      </div>
    </div>
  );
}
