"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { WorkerCard } from "@/components/worker/worker-card";
import { MissionCard } from "@/components/mission/mission-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  Loader2,
  Users,
  Briefcase,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type Tab = "missions" | "workers";

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("missions");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation once (non-blocking)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          // Silent permission denied / timeout — fall back to city-based search.
          console.warn("[search] geolocation unavailable", err.message);
        },
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

  // Missions query — only runs when we have a location. No misleading
  // fallback to /me/assignments (that endpoint shows YOUR missions,
  // not nearby search results).
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ["search-missions", category, userLocation?.lat, userLocation?.lng],
    queryFn: () => {
      if (!userLocation) return [];
      return api.getNearbyMissions({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm: 100,
        category: category || undefined,
      });
    },
    enabled: tab === "missions" && !!userLocation,
  });

  const isLoading = tab === "workers" ? workersLoading : missionsLoading;

  const tabButtonClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
      active
        ? "bg-[#FF4D1C] text-white shadow-md shadow-[#FF4D1C]/25"
        : "text-white/60 hover:text-white"
    }`;

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
      active
        ? "bg-[#FF4D1C]/15 text-[#FF4D1C] border-[#FF4D1C]/30"
        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
    }`;

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">Rechercher</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl bg-neutral-800/60 backdrop-blur-sm border border-white/5 p-1">
        <button onClick={() => setTab("missions")} className={tabButtonClass(tab === "missions")}>
          <Briefcase className="h-4 w-4" />
          Missions
        </button>
        <button onClick={() => setTab("workers")} className={tabButtonClass(tab === "workers")}>
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
          <button onClick={() => setCategory("")} className={chipClass(!category)}>
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.name === category ? "" : cat.name)}
              className={chipClass(category === cat.name)}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Missions tab: geolocation gate */}
      {tab === "missions" && !userLocation && !missionsLoading && (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF4D1C]/15 via-[#FF4D1C]/5 to-transparent p-6 text-center shadow-lg shadow-black/20">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D1C]/20 border border-[#FF4D1C]/30">
            <MapPin className="h-5 w-5 text-[#FF4D1C]" />
          </div>
          <h2 className="font-semibold text-base">Active la géolocalisation</h2>
          <p className="mt-1 text-sm text-white/60 max-w-sm mx-auto">
            Pour voir les missions près de chez toi, autorise l&apos;accès à ta
            position dans les paramètres du navigateur.
          </p>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF4D1C]" />
        </div>
      ) : tab === "workers" ? (
        workersData && workersData.workers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workersData.workers.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun professionnel trouvé"
            subtitle={
              city || category
                ? "Essayez une autre ville ou catégorie."
                : "Commencez à taper un nom de ville ou choisissez une catégorie."
            }
          />
        )
      ) : missions && missions.length > 0 ? (
        <div className="space-y-3">
          {missions.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      ) : userLocation ? (
        <EmptyState
          title="Aucune mission dans ton rayon"
          subtitle={
            category
              ? "Aucune mission dans cette catégorie. Essayez « Tous »."
              : "Essayez une autre catégorie ou élargis ta zone depuis la carte."
          }
          action={
            <Button asChild variant="hero" size="sm">
              <Link href="/map">Voir la carte</Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center shadow-lg shadow-black/20">
      <p className="font-semibold text-base">{title}</p>
      <p className="text-sm text-white/60 mt-1 max-w-sm mx-auto">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
