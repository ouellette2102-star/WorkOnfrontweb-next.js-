"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type MissionResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { MissionCard } from "@/components/mission/mission-card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Briefcase, ClipboardList } from "lucide-react";
import Link from "next/link";

type Tab = "active" | "done" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Actives" },
  { key: "done", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
];

function filterByTab(missions: MissionResponse[], tab: Tab): MissionResponse[] {
  switch (tab) {
    case "active":
      return missions.filter((m) =>
        ["open", "assigned", "in_progress"].includes(m.status),
      );
    case "done":
      return missions.filter((m) =>
        ["completed", "paid"].includes(m.status),
      );
    case "cancelled":
      return missions.filter((m) => m.status === "cancelled");
  }
}

const emptyMessages: Record<Tab, string> = {
  active: "Aucune mission active pour le moment.",
  done: "Aucune mission terminée.",
  cancelled: "Aucune mission annulée.",
};

export default function MyMissionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("active");

  const isEmployer = user?.role === "employer";

  // Employer: missions they created. Worker: missions assigned to them.
  const {
    data: missions,
    isLoading,
    error,
  } = useQuery({
    queryKey: [isEmployer ? "my-missions" : "my-assignments"],
    queryFn: () => (isEmployer ? api.getMyMissions() : api.getMyAssignments()),
    enabled: !!user,
  });

  // For employers, fetch offers count per mission to display on cards.
  const missionIds = (missions ?? [])
    .filter((m) => ["open", "assigned", "in_progress"].includes(m.status))
    .map((m) => m.id);

  const offersQueries = useQuery({
    queryKey: ["offers-counts", ...missionIds],
    queryFn: async () => {
      if (!isEmployer || missionIds.length === 0) return {};
      const results: Record<string, number> = {};
      await Promise.all(
        missionIds.map(async (mid) => {
          try {
            const offers = await api.getOffersForMission(mid);
            results[mid] = offers.filter((o) => o.status === "PENDING").length;
          } catch {
            results[mid] = 0;
          }
        }),
      );
      return results;
    },
    enabled: isEmployer && missionIds.length > 0,
  });

  const offerCounts = offersQueries.data ?? {};

  const filtered = missions ? filterByTab(missions, tab) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-workon-primary/10 flex items-center justify-center">
            {isEmployer ? (
              <Briefcase className="h-5 w-5 text-workon-primary" />
            ) : (
              <ClipboardList className="h-5 w-5 text-workon-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
              {isEmployer ? "Mes missions" : "Mes affectations"}
            </h1>
            <p className="text-sm text-workon-muted">
              {isEmployer
                ? "Missions que vous avez publiées"
                : "Missions qui vous sont assignées"}
            </p>
          </div>
        </div>

        {isEmployer && (
          <Link href="/missions/new">
            <Button className="bg-workon-primary hover:bg-workon-primary-hover text-white rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Créer
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-workon-bg p-1">
        {TABS.map((t) => {
          const count = missions
            ? filterByTab(missions, t.key).length
            : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-workon-ink shadow-sm"
                  : "text-workon-muted hover:text-workon-ink"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-workon-primary/10 px-1.5 text-[11px] font-semibold text-workon-primary">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            Erreur lors du chargement des missions.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-workon-border bg-white p-8 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-workon-bg flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-workon-muted" />
          </div>
          <p className="text-sm text-workon-muted">{emptyMessages[tab]}</p>
          {isEmployer && tab === "active" && (
            <Link href="/missions/new">
              <Button
                variant="default"
                className="mt-2 bg-workon-primary hover:bg-workon-primary-hover text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-1" />
                Créer une mission
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((mission) => (
            <div key={mission.id} className="relative">
              <MissionCard
                mission={mission}
                variant={isEmployer ? "client" : "pro"}
                showCTA={false}
                source="mine"
              />
              {/* Employer: pending offers badge overlay */}
              {isEmployer && (offerCounts[mission.id] ?? 0) > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-workon-primary px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {offerCounts[mission.id]} offre
                    {offerCounts[mission.id] > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
