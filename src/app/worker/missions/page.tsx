"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { RequireWorkerClient } from "@/components/auth/require-worker-client";
import { MissionFeedList } from "@/components/worker/mission-feed-list";
import { MissionSwipeCards } from "@/components/worker/mission-swipe-cards";
import { MissionMap } from "@/components/worker/mission-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { missionResponseToFeedItem, type MissionFeedItem } from "@/types/mission";
import { toast } from "sonner";

type ViewMode = "list" | "swipe" | "map";

export default function WorkerMissionsPage() {
  return (
    <RequireWorkerClient>
      <WorkerMissionsContent />
    </RequireWorkerClient>
  );
}

function WorkerMissionsContent() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [missions, setMissions] = useState<MissionFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [maxDistance, setMaxDistance] = useState<number | "unlimited">("unlimited");
  const [category, setCategory] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const firstName = user?.firstName || "Travailleur";

  // Demander la géolocalisation au chargement
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
          setLocationError(
            "Impossible d'obtenir votre position. Certaines fonctionnalités (distance) seront limitées."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Votre navigateur ne supporte pas la géolocalisation.");
    }
  }, []);

  const loadMissions = useCallback(async () => {
    if (authLoading || !isAuthenticated) return;
    if (!userLocation) return; // wait until we have coords

    try {
      setIsLoading(true);
      setError(null);

      const raw = await api.getNearbyMissions({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm:
          maxDistance === "unlimited" ? undefined : Number(maxDistance),
        category: category || undefined,
      });
      setMissions(raw.map(missionResponseToFeedItem));
    } catch (err) {
      console.error("Erreur lors du chargement des missions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des missions."
      );
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, category, maxDistance, userLocation]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleReserve = async (missionId: string) => {
    try {
      await api.acceptMission(missionId);
      toast.success("Mission réservée avec succès !");
      loadMissions(); // Recharger la liste
    } catch (err) {
      console.error("Erreur lors de la réservation:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la réservation de la mission."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Salut {firstName} 👋
          </h1>
          <p className="text-white/70">
            {userLocation
              ? `${missions.length} mission(s) près de vous`
              : "Active la géolocalisation pour voir les distances"}
          </p>
        </div>

        {/* Alerte géolocalisation */}
        {locationError && (
          <div className="mb-6 rounded-xl border border-yellow-500 bg-yellow-500/20 p-4 text-yellow-300">
            ⚠️ {locationError}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-neutral-900/70 p-4 backdrop-blur md:flex-row md:items-end">
          <div className="flex-1">
            <Label htmlFor="category" className="text-white/70">
              Catégorie de mission
            </Label>
            <Input
              id="category"
              placeholder="Ex: Ménage, Plomberie..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 bg-neutral-800 text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="distance" className="text-white/70">
              Distance maximale
            </Label>
            <Select
              value={String(maxDistance)}
              onValueChange={(value) =>
                setMaxDistance(value === "unlimited" ? "unlimited" : Number(value))
              }
            >
              <SelectTrigger className="mt-1 w-full bg-neutral-800 text-white">
                <SelectValue placeholder="Sélectionner une distance" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 text-white">
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="20">20 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="unlimited">Illimité</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={loadMissions}
            className="bg-[#FF4D1C] text-white hover:bg-[#E8441A]"
          >
            Actualiser les missions
          </Button>
        </div>

        {/* Switch de vue */}
        <div className="mb-6 flex justify-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "bg-[#FF4D1C] text-white"
                : "border-white/20 text-white/70 hover:bg-neutral-800"
            }
          >
            📋 Liste
          </Button>
          <Button
            variant={viewMode === "swipe" ? "default" : "outline"}
            onClick={() => setViewMode("swipe")}
            className={
              viewMode === "swipe"
                ? "bg-[#FF4D1C] text-white"
                : "border-white/20 text-white/70 hover:bg-neutral-800"
            }
          >
            💫 Swipe
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            onClick={() => setViewMode("map")}
            className={
              viewMode === "map"
                ? "bg-[#FF4D1C] text-white"
                : "border-white/20 text-white/70 hover:bg-neutral-800"
            }
          >
            🗺️ Carte
          </Button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 rounded-3xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-4 text-[#FF4D1C] shadow-lg shadow-black/20">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent"></div>
            <p className="text-white/70">Chargement des missions...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && missions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-neutral-900/70 p-12 backdrop-blur">
            <span className="mb-4 text-6xl">🔍</span>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucune mission disponible
            </h3>
            <p className="text-center text-white/70">
              Essayez d'élargir votre rayon de recherche ou de modifier les filtres.
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
