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
    queryFn: () => api.getWorkers({ limit: 6 }),
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
            : "Professionnel vérifié, disponible sur demande"}
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
      {activeMissions && activeMissions.length > 0 && (
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
      )}

      {/* Featured workers */}
      {workersData && workersData.workers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Professionnels vérifiés</h2>
            <Link href="/search" className="text-xs text-red-accent hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {workersData.workers.slice(0, 4).map((w) => (
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
