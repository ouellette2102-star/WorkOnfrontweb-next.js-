"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { RequireWorkerClient } from "@/components/auth/require-worker-client";
import { MissionFeedList } from "@/components/worker/mission-feed-list";
import { MissionSwipeCards } from "@/components/worker/mission-swipe-cards";
import { MissionMap } from "@/components/worker/mission-map";
import { Button } from "@/components/ui/button";

type ViewMode = "list" | "swipe" | "map";

type MissionFeed = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  hourlyRate: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  employerId: string;
  employerName: string | null;
  priceCents: number;
  currency: string;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export default function WorkerMissionsPage() {
  return (
    <RequireWorkerClient>
      <WorkerMissionsContent />
    </RequireWorkerClient>
  );
}

function WorkerMissionsContent() {
  const { getToken, isLoaded } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [missions, setMissions] = useState<MissionFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [maxDistance, setMaxDistance] = useState<number>(20); // km
  const [category, setCategory] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  // Demander la géolocalisation au chargement
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
        }
      );
    }
  }, []);

  const loadMissions = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError("Token non disponible");
        return;
      }

      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (maxDistance) params.append("maxDistance", maxDistance.toString());
      if (userLocation) {
        params.append("latitude", userLocation.lat.toString());
        params.append("longitude", userLocation.lng.toString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/missions/feed?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des missions");
      }

      const data = await response.json();
      setMissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, getToken, category, maxDistance, userLocation]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleReserve = async (missionId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentification requise");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/missions/${missionId}/reserve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la réservation");
      }

      alert("Mission réservée avec succès !");
      loadMissions(); // Recharger la liste
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la réservation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Missions disponibles 🔍
          </h1>
          <p className="text-white/70">
            {userLocation
              ? `${missions.length} mission(s) près de vous`
              : "Active la géolocalisation pour voir les distances"}
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
            <option value={999}>Illimité</option>
          </select>

          <input
            type="text"
            placeholder="Catégorie (ex: ménage)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-2 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
          />

          <Button
            onClick={loadMissions}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            Actualiser
          </Button>
        </div>

        {/* Switch de vue */}
        <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-neutral-900/70 p-2">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            📋 Liste
          </button>
          <button
            onClick={() => setViewMode("swipe")}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
              viewMode === "swipe"
                ? "bg-blue-600 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            💫 Swipe
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
              viewMode === "map"
                ? "bg-blue-600 text-white"
                : "text-white/70 hover:text-white"
            }`}
          >
            🗺️ Carte
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500 bg-red-500/20 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/70">Chargement des missions...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && missions.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucune mission disponible
            </h3>
            <p className="text-white/70">
              Essayez d'élargir votre rayon de recherche ou vérifiez plus tard
            </p>
          </div>
        )}

        {/* Vues */}
        {!isLoading && !error && missions.length > 0 && (
          <>
            {viewMode === "list" && (
              <MissionFeedList
                missions={missions}
                onReserve={handleReserve}
                userLocation={userLocation}
              />
            )}
            {viewMode === "swipe" && (
              <MissionSwipeCards
                missions={missions}
                onReserve={handleReserve}
                onReject={() => {}}
                onSave={() => {}}
              />
            )}
            {viewMode === "map" && (
              <MissionMap
                missions={missions}
                userLocation={userLocation}
                onReserve={handleReserve}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

