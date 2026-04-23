"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { missionResponseToMission, type Mission } from "@/types/mission";

// Fallback centroid (Montréal) used when geolocation is unavailable or
// denied. The /worker/dashboard widget should still show something.
const MONTREAL_FALLBACK = { latitude: 45.5017, longitude: -73.5673 };
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export function AvailableMissionsCard() {
  const { isLoading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const loadMissions = async () => {
    if (authLoading) return;

    try {
      setError(null);

      // Try to get the user's real location; fall back to Montréal if
      // geolocation is unavailable or denied so the card still renders.
      const coords = await new Promise<{ latitude: number; longitude: number }>(
        (resolve) => {
          if (typeof window === "undefined" || !("geolocation" in navigator)) {
            resolve(MONTREAL_FALLBACK);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            () => resolve(MONTREAL_FALLBACK),
            { enableHighAccuracy: false, timeout: 4000 },
          );
        },
      );

      const raw = await api.getNearbyMissions({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: 50,
      });
      const available = raw.map(missionResponseToMission);
      // Limiter à 3 pour la version compacte
      setMissions(available.slice(0, 3));
    } catch (error) {
      console.error("Erreur lors du chargement des missions disponibles:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Impossible de charger les missions";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [authLoading]);

  const handleReserve = async (missionId: string) => {
    setReservingId(missionId);
    try {
      await api.acceptMission(missionId);
      toast.success("Mission réservée avec succès !");
      loadMissions();
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la réservation"
      );
    } finally {
      setReservingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
        <h2 className="mb-4 font-heading font-bold text-2xl text-workon-ink">
          Missions Disponibles
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-workon-border bg-workon-bg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-workon-accent/20 rounded-3xl p-5 shadow-card">
        <h2 className="mb-4 font-heading font-bold text-2xl text-workon-accent">
          Erreur de chargement
        </h2>
        <p className="mb-4 text-sm text-workon-accent">{error}</p>
        <button
          onClick={loadMissions}
          className="rounded-xl bg-workon-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-workon-accent-hover"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-2xl text-workon-ink">
            Missions Disponibles
          </h2>
          <Link href="/worker/missions">
            <Button
              variant="outline"
              className="border-workon-border text-workon-ink hover:bg-workon-bg"
            >
              Voir toutes
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-2 text-4xl">🔍</span>
          <p className="text-workon-gray">Aucune mission disponible pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading font-bold text-2xl text-workon-ink">
          Missions Disponibles
        </h2>
        <Link href="/worker/missions">
          <Button
            variant="outline"
            className="border-workon-border text-workon-ink hover:bg-workon-bg"
          >
            Voir toutes
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="group flex items-center justify-between bg-white border border-workon-border rounded-2xl px-4 py-3.5 transition hover:shadow-soft"
          >
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-workon-ink">{mission.title}</h4>
              <div className="flex flex-wrap gap-3 text-sm text-workon-gray">
                {mission.city && <span>📍 {mission.city}</span>}
                {mission.hourlyRate && (
                  <span className="font-semibold text-[#2D8B55]">
                    💰 {mission.hourlyRate.toFixed(2)} $/h
                  </span>
                )}
                {mission.category && <span>🏷️ {mission.category}</span>}
              </div>
            </div>

            <Button
              onClick={() => handleReserve(mission.id)}
              disabled={reservingId === mission.id}
              className="ml-4 bg-workon-primary text-white hover:bg-workon-primary-hover"
            >
              {reservingId === mission.id ? "..." : "Réserver"}
            </Button>
          </div>
        ))}
      </div>

      {missions.length >= 3 && (
        <Link href="/worker/missions">
          <p className="mt-4 text-center text-sm text-workon-primary hover:text-workon-primary-hover">
            Voir toutes les missions disponibles →
          </p>
        </Link>
      )}
    </div>
  );
}

