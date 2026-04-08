"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { StatsBar } from "@/components/stats-bar";
import { WorkerCard } from "@/components/worker/worker-card";
import { MissionCard } from "@/components/mission/mission-card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Briefcase, Search } from "lucide-react";
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

  // Filter out obvious test / seed accounts: names that are just a single
  // letter, blank, "Test ...", or the classic "John Doe" placeholders.
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
      {/* Hero gradient */}
      <div className="relative -mx-4 -mt-6 px-4 pt-6 pb-8 bg-gradient-to-b from-red-900/30 via-orange-900/10 to-transparent">
        <h1 className="text-2xl font-bold text-center">
          {user?.role === "worker" ? "Trouvez des missions" : "Trouvez votre talent"}
        </h1>
        <p className="text-center text-white/60 text-sm mt-1">
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

      {/* Quick actions */}
      <div className="flex gap-3">
        {user?.role === "employer" ? (
          <Button asChild className="flex-1 h-12">
            <Link href="/missions/new">
              <Plus className="h-4 w-4 mr-1" />
              Publier une mission
            </Link>
          </Button>
        ) : (
          <Button asChild className="flex-1 h-12">
            <Link href="/search">
              <Search className="h-4 w-4 mr-1" />
              Trouver des missions
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="flex-1 h-12">
          <Link href="/map">
            <MapPin className="h-4 w-4 mr-1" />
            Carte
          </Link>
        </Button>
      </div>

      {/* Active missions */}
      {activeMissions && activeMissions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              <Briefcase className="inline h-4 w-4 mr-1 text-red-accent" />
              Missions actives
            </h2>
            <Link href="/missions" className="text-xs text-red-accent hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="space-y-2">
            {activeMissions.slice(0, 3).map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      ) : (
        user && activeMissions !== undefined && (
          <section>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF4D1C]/15 via-[#FF4D1C]/5 to-transparent p-6 text-center shadow-lg shadow-black/20">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D1C]/20 border border-[#FF4D1C]/30">
                <Briefcase className="h-5 w-5 text-[#FF4D1C]" />
              </div>
              <h2 className="font-semibold text-base">
                {user.role === "employer"
                  ? "Aucune mission en cours"
                  : "Prêt pour ta prochaine mission ?"}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {user.role === "employer"
                  ? "Publie ta première mission — un pro peut répondre en quelques minutes."
                  : "Des missions payées rapidement t'attendent près de chez toi."}
              </p>
              <Button asChild variant="hero" size="hero" className="mt-4">
                <Link href={user.role === "employer" ? "/missions/new" : "/search"}>
                  {user.role === "employer" ? "Publier une mission" : "Voir les missions"}
                </Link>
              </Button>
            </div>
          </section>
        )
      )}

      {/* Featured workers */}
      {realWorkers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pros disponibles</h2>
            <Link href="/search" className="text-xs text-red-accent hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {realWorkers.slice(0, 4).map((w) => (
              <WorkerCard key={w.id} worker={w} compact />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-white/40 pt-4 space-y-1">
        <p>WorkOn fournit l&apos;infrastructure de mise en relation et paiement.</p>
        <p>Paiement sécurisé par Stripe.</p>
      </div>
    </div>
  );
}
