"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmployerDashboardStats() {
  const { data: missions } = useQuery({
    queryKey: ["my-missions"],
    queryFn: () => api.getMyMissions(),
  });

  const { data: offers } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => api.getMyOffers(),
  });

  const activeMissions = missions?.filter(
    (m) => m.status === "open" || m.status === "assigned" || m.status === "in_progress"
  ).length ?? 0;

  const completedMissions = missions?.filter(
    (m) => m.status === "completed" || m.status === "paid"
  ).length ?? 0;

  const pendingOffers = offers?.filter((o) => o.status === "PENDING").length ?? 0;

  return (
    <>
      {/* Sections principales */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Missions actives */}
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Missions actives</h2>
            <Link href="/missions/mine">
              <Button className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500">
                Voir toutes
              </Button>
            </Link>
          </div>
          {activeMissions > 0 ? (
            <p className="text-white/70">
              {activeMissions} mission{activeMissions > 1 ? "s" : ""} en cours
            </p>
          ) : (
            <p className="text-white/70">
              Vous n&apos;avez pas encore de missions actives
            </p>
          )}
        </div>

        {/* Offres en attente */}
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Offres en attente</h2>
          </div>
          {pendingOffers > 0 ? (
            <p className="text-white/70">
              {pendingOffers} offre{pendingOffers > 1 ? "s" : ""} en attente de r&eacute;ponse
            </p>
          ) : (
            <p className="text-white/70">
              Aucune offre en attente pour le moment
            </p>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <p className="text-sm text-white/50">Total missions cr&eacute;&eacute;es</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {missions?.length ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <p className="text-sm text-white/50">Missions compl&eacute;t&eacute;es</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {completedMissions}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
          <p className="text-sm text-white/50">Offres en attente</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {pendingOffers}
          </p>
        </div>
      </div>
    </>
  );
}
