"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type MissionMapItem } from "@/lib/api-client";
import {
  MapPin,
  List,
  Map as MapIcon,
  Navigation,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { MissionBottomSheet } from "@/components/map/mission-bottom-sheet";
import { MissionCard } from "@/components/mission/mission-card";

/**
 * Interactive map page — shows nearby missions.
 *
 * Features:
 * - Toggle between map view and list view
 * - GPS auto-detection with fallback to Montreal
 * - Radius filter (5, 10, 25, 50, 100 km)
 * - Category filter from backend catalog
 * - Mission cards with distance, budget, category
 *
 * Leaflet is loaded dynamically (no SSR) since it requires window.
 */

const MissionMap = dynamic(() => import("@/components/map/mission-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[50vh] rounded-2xl bg-workon-bg-cream flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
    </div>
  ),
});

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

function radiusToBbox(latitude: number, longitude: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngScale = Math.max(0.01, Math.cos((latitude * Math.PI) / 180));
  const lngDelta = radiusKm / (111.32 * lngScale);

  return {
    north: latitude + latDelta,
    south: latitude - latDelta,
    east: longitude + lngDelta,
    west: longitude - lngDelta,
  };
}

export default function MapPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [latitude, setLatitude] = useState(45.5017);
  const [longitude, setLongitude] = useState(-73.5673);
  const [radiusKm, setRadiusKm] = useState(25);
  const [category, setCategory] = useState("");
  const [gpsActive, setGpsActive] = useState(false);
  const [selectedMission, setSelectedMission] =
    useState<MissionMapItem | null>(null);

  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsActive(true);
      },
      () => {
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    detectGPS();
  }, [detectGPS]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 60_000,
  });

  const bbox = useMemo(
    () => radiusToBbox(latitude, longitude, radiusKm),
    [latitude, longitude, radiusKm],
  );

  const {
    data: mapData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "mission-map-pins",
      bbox.north,
      bbox.south,
      bbox.east,
      bbox.west,
      category,
    ],
    queryFn: () =>
      api.getMissionMapPins({
        ...bbox,
        category: category || undefined,
      }),
    enabled: latitude !== 0,
    staleTime: 30_000,
  });
  const missions = mapData?.missions ?? [];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
          Opportunités
        </h1>
        <div className="flex items-center gap-1 bg-workon-bg-cream rounded-xl p-1">
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === "map" ? "bg-white text-workon-ink shadow-sm" : "text-workon-muted"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Carte
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === "list" ? "bg-white text-workon-ink shadow-sm" : "text-workon-muted"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Liste
          </button>
        </div>
      </div>

      {/* GPS badge */}
      {gpsActive && (
        <div className="flex items-center gap-1.5 text-xs text-workon-primary">
          <Navigation className="h-3.5 w-3.5" />
          <span>GPS actif</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {/* Radius */}
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="shrink-0 rounded-full border border-workon-border bg-white px-3 py-1.5 text-xs text-workon-ink focus:border-workon-primary"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>

        {/* Category chips */}
        <button
          onClick={() => setCategory("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
            !category ? "bg-workon-primary text-white border-workon-primary" : "bg-white text-workon-ink border-workon-border"
          }`}
        >
          Toutes
        </button>
        {categories?.slice(0, 6).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.name)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap ${
              category === cat.name ? "bg-workon-primary text-white border-workon-primary" : "bg-white text-workon-ink border-workon-border"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Map view */}
      {view === "map" && (
        <MissionMap
          missions={missions}
          center={[latitude, longitude]}
          radiusKm={radiusKm}
          onPinClick={setSelectedMission}
        />
      )}

      {/* Bottom sheet — triggered by pin tap */}
      <MissionBottomSheet
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
      />

      {/* Mission list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-workon-accent/30 bg-workon-accent/5 p-4 text-center">
            <p className="text-sm font-medium text-workon-accent">
              Impossible de charger la carte.
            </p>
            <p className="mt-1 text-xs text-workon-muted">
              {error instanceof Error ? error.message : "Reessaie dans un instant."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-full bg-workon-accent px-4 py-2 text-xs font-semibold text-white"
            >
              Reessayer
            </button>
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-8 w-8 mx-auto text-workon-muted mb-2" />
            <p className="text-sm text-workon-gray">Aucune opportunité dans ce rayon</p>
          </div>
        ) : (
          missions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              variant="pro"
              source="map_list"
            />
          ))
        )}
      </div>
    </div>
  );
}
