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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  Briefcase,
  ClipboardList,
  Compass,
  Filter,
  LocateFixed,
  Map as MapIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";

type ViewMode = "list" | "swipe" | "map";

const VIEW_MODES: Array<{
  value: ViewMode;
  label: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  {
    value: "list",
    label: "Liste",
    description: "Comparer vite",
    icon: ClipboardList,
  },
  {
    value: "swipe",
    label: "Match",
    description: "Décider une par une",
    icon: Sparkles,
  },
  {
    value: "map",
    label: "Carte",
    description: "Voir le terrain",
    icon: MapIcon,
  },
];

function formatMoney(amount: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function radiusLabel(radius: number | "unlimited") {
  return radius === "unlimited" ? "Illimité" : `${radius} km`;
}

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
  const [maxDistance, setMaxDistance] = useState<number | "unlimited">("unlimited");
  const [category, setCategory] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const firstName = user?.firstName || "Pro";
  const totalValue = missions.reduce((sum, mission) => sum + mission.priceCents / 100, 0);
  const closestMission = missions.reduce<number | null>((closest, mission) => {
    if (mission.distance === null) return closest;
    if (closest === null) return mission.distance;
    return Math.min(closest, mission.distance);
  }, null);

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
        () => {
          setUserLocation({ lat: 45.5017, lng: -73.5673 });
          setLocationError(
            "Position exacte indisponible. WorkOn affiche les missions autour de Montréal.",
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      setUserLocation({ lat: 45.5017, lng: -73.5673 });
      setLocationError("Géolocalisation non supportée. WorkOn affiche Montréal par défaut.");
    }
  }, []);

  const loadMissions = useCallback(async () => {
    if (authLoading || !isAuthenticated) return;
    if (!userLocation) return;

    try {
      setIsLoading(true);
      setError(null);

      const raw = await api.getNearbyMissions({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: maxDistance === "unlimited" ? undefined : Number(maxDistance),
        category: category || undefined,
      });
      setMissions(raw.map(missionResponseToFeedItem));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des missions.",
      );
      toast.error("Impossible de charger les missions");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, category, maxDistance, userLocation]);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const handleReserve = async (missionId: string) => {
    try {
      await api.acceptMission(missionId);
      toast.success("Mission réservée");
      void loadMissions();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la réservation de la mission.",
      );
    }
  };

  return (
    <div className="bg-workon-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pb-6 pt-4 sm:px-6 lg:pt-6">
        <section className="workon-dark-panel overflow-hidden rounded-[28px] border border-white/10 p-5 shadow-[0_24px_60px_rgba(19,64,33,0.22)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-workon-gold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Opportunités vérifiées
              </span>
              <h1 className="mt-4 font-heading text-3xl font-black leading-tight text-white sm:text-4xl">
                Missions à saisir, {firstName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
                Compare les missions ouvertes par valeur, distance et contexte,
                puis réserve seulement ce qui mérite vraiment ton temps.
              </p>
            </div>

            <Button
              onClick={() => void loadMissions()}
              disabled={isLoading || !userLocation}
              className="h-12 rounded-2xl bg-workon-gold px-5 font-black text-workon-graphite shadow-[0_12px_28px_rgba(232,191,115,0.24)] hover:bg-workon-gold/90"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroMetric
              icon={Briefcase}
              label="Missions ouvertes"
              value={isLoading ? "..." : String(missions.length)}
              detail={userLocation ? "Synchronisées avec ta zone." : "Localisation en cours."}
            />
            <HeroMetric
              icon={LocateFixed}
              label="Rayon actif"
              value={radiusLabel(maxDistance)}
              detail={closestMission !== null ? `Plus proche : ${closestMission} km.` : "Distance disponible après recherche."}
            />
            <HeroMetric
              icon={WalletCards}
              label="Valeur visible"
              value={isLoading ? "..." : formatMoney(totalValue)}
              detail="Avant taxes, frais et acceptation finale."
            />
          </div>
        </section>

        {locationError && (
          <div className="flex gap-3 rounded-2xl border border-workon-gold/35 bg-workon-gold/12 p-4 text-sm text-workon-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-workon-copper" />
            <p>{locationError}</p>
          </div>
        )}

        <section className="rounded-[24px] border border-workon-border bg-workon-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3">
            <SlidersHorizontal className="h-4 w-4 text-workon-primary" />
            <p className="text-xs font-black uppercase tracking-[0.14em] text-workon-stone">
              Recherche opérationnelle
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-end">
            <div>
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wide text-workon-stone">
                Catégorie
              </Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-muted" />
                <Input
                  id="category"
                  placeholder="Ménage, plomberie, peinture..."
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-12 rounded-2xl border-workon-border bg-white pl-9 text-workon-ink placeholder:text-workon-muted"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="distance" className="text-xs font-bold uppercase tracking-wide text-workon-stone">
                Distance maximale
              </Label>
              <Select
                value={String(maxDistance)}
                onValueChange={(value) =>
                  setMaxDistance(value === "unlimited" ? "unlimited" : Number(value))
                }
              >
                <SelectTrigger
                  id="distance"
                  className="mt-1 h-12 rounded-2xl border-workon-border bg-white text-workon-ink"
                >
                  <SelectValue placeholder="Rayon" />
                </SelectTrigger>
                <SelectContent className="border-workon-border bg-white text-workon-ink">
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="unlimited">Illimité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => void loadMissions()}
              disabled={isLoading || !userLocation}
              variant="outline"
              className="h-12 rounded-2xl border-workon-primary/25 bg-workon-primary-subtle font-bold text-workon-primary hover:bg-workon-primary/12"
            >
              <Filter className="mr-2 h-4 w-4" />
              Appliquer
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const active = viewMode === mode.value;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setViewMode(mode.value)}
                  className={cn(
                    "flex min-h-[74px] items-center gap-3 rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                      : "border-workon-border bg-white text-workon-ink hover:border-workon-primary/30",
                  )}
                  aria-pressed={active}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      active ? "bg-white/16 text-white" : "bg-workon-bg text-workon-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{mode.label}</span>
                    <span className={cn("mt-0.5 block text-xs", active ? "text-white/70" : "text-workon-muted")}>
                      {mode.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-workon-accent/30 bg-workon-accent-subtle p-4 text-sm font-medium text-workon-accent">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[24px] border border-workon-border bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && missions.length === 0 && (
          <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-black text-workon-ink">
              Aucune mission disponible dans ce rayon
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-workon-muted">
              Élargis la distance, enlève la catégorie ou reviens plus tard.
              WorkOn garde l’entrée prête dès qu’une opportunité arrive.
            </p>
            <Button
              onClick={() => {
                setCategory("");
                setMaxDistance("unlimited");
                void loadMissions();
              }}
              className="mt-5 rounded-2xl bg-workon-primary px-5 font-bold text-white hover:bg-workon-primary-hover"
            >
              Réinitialiser la recherche
            </Button>
          </div>
        )}

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
                onSave={() => toast.success("Mission gardée dans ta sélection")}
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

function HeroMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
          {label}
        </p>
        <Icon className="h-4 w-4 text-workon-gold" />
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/62">{detail}</p>
    </div>
  );
}
