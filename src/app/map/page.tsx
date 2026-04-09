"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api, type MissionMapItem } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, RefreshCw, List } from "lucide-react";
import Link from "next/link";

/**
 * /map — Mission discovery via interactive Leaflet map.
 * Uses the missions-local/nearby endpoint with geolocation.
 */
export default function MapPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionMapItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Request geolocation on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Votre navigateur ne supporte pas la géolocalisation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      () => {
        setLocationError("Impossible d'obtenir votre position.");
        // Default to Montreal
        setUserLocation({ lat: 45.5017, lng: -73.5673 });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  // Fetch nearby missions
  const { data: missions, isLoading: missionsLoading, refetch } = useQuery({
    queryKey: ["map-missions", userLocation?.lat, userLocation?.lng, categoryFilter],
    queryFn: () => {
      if (!userLocation) return [];
      return api.getNearbyMissions({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm: 50,
        category: categoryFilter || undefined,
      });
    },
    enabled: !!userLocation && isAuthenticated,
    staleTime: 30_000,
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 300_000,
  });

  const handleReserve = useCallback(async (missionId: string) => {
    try {
      await api.acceptMission(missionId);
      refetch();
      router.push(`/missions/${missionId}`);
    } catch (err) {
      console.error("Erreur réservation:", err);
    }
  }, [refetch, router]);

  // Listen for reserve events from map popups
  useEffect(() => {
    const handler = (event: Event) => {
      const missionId = (event as CustomEvent).detail;
      handleReserve(missionId);
    };
    window.addEventListener("reserve-mission", handler as EventListener);
    return () => window.removeEventListener("reserve-mission", handler as EventListener);
  }, [handleReserve]);

  // Dynamic Leaflet map import
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("@/components/worker/mission-map").then((mod) => {
      setMapComponent(() => mod.MissionMap);
    });
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF4D1C]" />
      </div>
    );
  }

  // Convert MissionResponse[] to MissionFeedItem[] shape for the map component
  const feedMissions = (missions || []).map((m: any) => ({
    ...m,
    employerName: null,
    distance: m.distanceKm ?? null,
    hourlyRate: m.price ? m.price : null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      {/* Filter bar */}
      <div className="border-b border-white/10 bg-neutral-900/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <MapPin className="h-5 w-5 text-[#FF4D1C]" />
          <h1 className="text-lg font-bold">Missions à proximité</h1>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="ml-auto rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white"
          >
            <option value="">Toutes les catégories</option>
            {categoriesData?.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-white/10 text-white/70"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Location warning */}
      {locationError && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-300">
          ⚠️ {locationError}
        </div>
      )}

      {/* Map area */}
      <div className="relative flex-1">
        {missionsLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900/80">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#FF4D1C]" />
              <p className="mt-2 text-sm text-white/70">Chargement des missions...</p>
            </div>
          </div>
        )}

        {MapComponent && feedMissions.length > 0 && (
          <div className="h-[calc(100vh-130px)]">
            <MapComponent
              missions={feedMissions}
              userLocation={userLocation}
              onReserve={handleReserve}
            />
          </div>
        )}

        {!missionsLoading && feedMissions.length === 0 && (
          <div className="flex h-[calc(100vh-130px)] flex-col items-center justify-center">
            <MapPin className="mb-4 h-16 w-16 text-white/20" />
            <h2 className="mb-2 text-xl font-semibold">Aucune mission à proximité</h2>
            <p className="mb-6 text-white/60">
              Essayez d&apos;élargir votre zone de recherche
            </p>
            <Button asChild variant="hero" size="hero">
              <Link href="/search">
                <List className="mr-2 h-4 w-4" />
                Voir en liste
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mission count footer */}
      {feedMissions.length > 0 && (
        <div className="border-t border-white/10 bg-neutral-900/95 px-4 py-2 text-center text-sm text-white/60 backdrop-blur">
          {feedMissions.length} mission{feedMissions.length > 1 ? "s" : ""} trouvée{feedMissions.length > 1 ? "s" : ""} dans un rayon de 50 km
        </div>
      )}
    </div>
  );
}
