"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type MissionResponse } from "@/lib/api-client";
import { WorkerCard } from "@/components/worker/worker-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Tab = "missions" | "workers";

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("missions");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation once
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 },
      );
    }
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 300_000,
  });

  // Workers query
  const { data: workersData, isLoading: workersLoading } = useQuery({
    queryKey: ["workers", city, category],
    queryFn: () =>
      api.getWorkers({
        city: city || undefined,
        category: category || undefined,
        limit: 20,
      }),
    enabled: tab === "workers",
  });

  // Missions query
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ["search-missions", category, userLocation?.lat, userLocation?.lng],
    queryFn: () => {
      if (userLocation) {
        return api.getNearbyMissions({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusKm: 100,
          category: category || undefined,
        });
      }
      // Fallback: get missions without location
      return api.getMyAssignments(); // Will be replaced with a proper search endpoint
    },
    enabled: tab === "missions",
  });

  const isLoading = tab === "workers" ? workersLoading : missionsLoading;

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">Rechercher</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-xl bg-neutral-800/50 p-1">
        <button
          onClick={() => setTab("missions")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "missions"
              ? "bg-red-600 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Missions
        </button>
        <button
          onClick={() => setTab("workers")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "workers"
              ? "bg-red-600 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Travailleurs
        </button>
      </div>

      {/* Search bar (workers only) */}
      {tab === "workers" && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Rechercher par ville..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Category filter chips */}
      {categories && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !category
                ? "bg-red-600 text-white"
                : "bg-neutral-800 text-white/60 hover:bg-neutral-700"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.name === category ? "" : cat.name)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.name
                  ? "bg-red-600 text-white"
                  : "bg-neutral-800 text-white/60 hover:bg-neutral-700"
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      ) : tab === "workers" ? (
        workersData && workersData.workers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workersData.workers.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/50">
            <p>Aucun professionnel trouvé</p>
            <p className="text-sm mt-1">Essayez une autre ville ou catégorie</p>
          </div>
        )
      ) : missions && missions.length > 0 ? (
        <div className="space-y-3">
          {missions.map((m: MissionResponse) => (
            <Link key={m.id} href={`/missions/${m.id}`}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-500/30">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">{m.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/50">
                      {m.category && <span>🏷️ {m.category}</span>}
                      {m.city && <span>📍 {m.city}</span>}
                      {m.distanceKm != null && <span>🚗 {m.distanceKm.toFixed(1)} km</span>}
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-lg font-bold text-green-400">
                      {m.price ? `${m.price.toFixed(2)} $` : "—"}
                    </p>
                    <Badge className="mt-1 bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/50">
          <p>Aucune mission trouvée</p>
          <p className="text-sm mt-1">Essayez une autre catégorie</p>
        </div>
      )}
    </div>
  );
}
