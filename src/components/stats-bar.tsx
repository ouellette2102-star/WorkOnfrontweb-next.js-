"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Zap, Users, Briefcase, TrendingUp } from "lucide-react";
import { safeLocalStorage } from "@/lib/safe-storage";

/**
 * Live marketplace stats — replaces static counters with real-time data.
 * Fetches open missions (nearby) and available workers directly.
 */
export function StatsBar() {
  const { data: missions } = useQuery({
    queryKey: ["stats-nearby-missions"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/missions-local/nearby?latitude=45.5&longitude=-73.5&radiusKm=100`,
        {
          headers: {
            Authorization: `Bearer ${safeLocalStorage.getItem("workon_token") ?? ""}`,
          },
        }
      );
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: workers } = useQuery({
    queryKey: ["stats-workers"],
    queryFn: () => api.getSwipeCandidates({ role: "worker" }),
    staleTime: 60_000,
  });

  const openCount = Array.isArray(missions)
    ? missions.filter((m: any) => m.status === "open").length
    : 0;
  const activeCount = Array.isArray(missions)
    ? missions.filter((m: any) => m.status !== "open" && m.status !== "cancelled").length
    : 0;
  const workerCount = Array.isArray(workers) ? workers.length : 0;
  const matchRate =
    openCount > 0 && workerCount > 0
      ? Math.round((Math.min(openCount, workerCount) / Math.max(openCount, 1)) * 100)
      : 0;

  const stats = [
    { icon: Zap, value: openCount, label: "En attente", color: "text-amber-500" },
    { icon: Briefcase, value: activeCount, label: "Actives", color: "text-workon-primary" },
    { icon: Users, value: workerCount, label: "Pros", color: "text-workon-accent" },
    { icon: TrendingUp, value: `${matchRate}%`, label: "Match", color: "text-green-600" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur border border-workon-border px-3 py-1.5 shadow-sm"
        >
          <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
          <span className="font-bold text-sm text-workon-ink">{s.value}</span>
          <span className="text-workon-muted text-[10px]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
