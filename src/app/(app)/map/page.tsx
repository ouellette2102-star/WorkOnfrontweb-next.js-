"use client";

import Link from "next/link";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Briefcase,
  ChevronRight,
  CreditCard,
  Filter,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { api, type MissionMapItem } from "@/lib/api-client";
import { MissionBottomSheet } from "@/components/map/mission-bottom-sheet";
import { MissionCard } from "@/components/mission/mission-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MissionMap = dynamic(() => import("@/components/map/mission-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[58vh] min-h-[430px] items-center justify-center rounded-[28px] border border-workon-border bg-workon-bg-cream">
      <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
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
      { enableHighAccuracy: true, timeout: 10000 },
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
  const visibleMissions = view === "map" ? missions.slice(0, 3) : missions;
  const featuredMission = selectedMission ?? missions[0] ?? null;
  const totalBudget = missions.reduce(
    (sum, mission) => sum + (Number.isFinite(mission.price) ? mission.price : 0),
    0,
  );
  const openCount = missions.filter((mission) => mission.status === "open").length;
  const activeCategoryLabel = category
    ? formatCategoryLabel(category)
    : "Toutes categories";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-28">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
              <Target className="h-3.5 w-3.5 text-workon-gold" />
              Carte opportunites
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white">
              Missions proches, preuves visibles.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Priorise les missions autour de toi selon le rayon, la categorie
              et le potentiel terrain.
            </p>
          </div>

          <Button
            type="button"
            variant="inverse"
            size="icon"
            onClick={detectGPS}
            aria-label={gpsActive ? "GPS actif" : "Me localiser"}
            className="h-11 w-11 shrink-0 rounded-2xl"
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroMetric
            label="Disponibles"
            value={String(mapData?.count ?? missions.length)}
            icon={Briefcase}
          />
          <HeroMetric
            label="Ouvertes"
            value={String(openCount || missions.length)}
            icon={Sparkles}
          />
          <HeroMetric
            label="Valeur"
            value={formatMoney(totalBudget)}
            icon={CreditCard}
          />
        </div>
      </header>

      <section className="workon-premium-card rounded-[28px] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
              Vue active
            </p>
            <p className="mt-0.5 text-sm font-semibold text-workon-ink">
              {activeCategoryLabel} · {radiusKm} km
            </p>
          </div>

          <div className="flex rounded-2xl border border-workon-border bg-workon-bg p-1">
            <ViewButton
              active={view === "map"}
              icon={MapIcon}
              label="Carte"
              onClick={() => setView("map")}
            />
            <ViewButton
              active={view === "list"}
              icon={List}
              label="Liste"
              onClick={() => setView("list")}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-workon-border bg-white px-3 py-2 text-xs font-bold text-workon-stone">
              <Filter className="h-3.5 w-3.5" />
              Rayon
            </span>
            {RADIUS_OPTIONS.map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => setRadiusKm(radius)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  radiusKm === radius
                    ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                    : "border-workon-border bg-white text-workon-stone hover:border-workon-stone-subtle",
                )}
              >
                {radius} km
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <CategoryChip
              active={!category}
              label="Toutes"
              onClick={() => setCategory("")}
            />
            {categories?.slice(0, 7).map((cat) => (
              <CategoryChip
                key={cat.id}
                active={category === cat.name}
                label={formatCategoryLabel(cat.name)}
                onClick={() => setCategory(cat.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {view === "map" && (
        <section className="relative">
          <MissionMap
            missions={missions}
            center={[latitude, longitude]}
            radiusKm={radiusKm}
            onPinClick={setSelectedMission}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-[11px] font-bold text-workon-ink shadow-soft backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-workon-primary" />
            Mission
            <span className="h-2.5 w-2.5 rounded-full bg-workon-copper" />
            Prioritaire
          </div>

          {!isLoading && !isError && featuredMission && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500]">
              <MapPreviewCard mission={featuredMission} />
            </div>
          )}
        </section>
      )}

      <MissionBottomSheet
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
              {view === "map" ? "A proximite" : "Resultats"}
            </p>
            <h2 className="font-heading text-xl font-bold text-workon-ink">
              {missions.length} mission{missions.length > 1 ? "s" : ""} dans ce rayon
            </h2>
          </div>
          {view === "map" && missions.length > 3 && (
            <button
              type="button"
              onClick={() => setView("list")}
              className="text-sm font-bold text-workon-primary"
            >
              Voir tout
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-[28px] border border-workon-border bg-white py-12">
            <Loader2 className="h-6 w-6 animate-spin text-workon-primary" />
          </div>
        ) : isError ? (
          <div className="rounded-[28px] border border-workon-accent/25 bg-workon-accent-subtle p-5 text-center">
            <p className="font-semibold text-workon-accent">
              Impossible de charger la carte.
            </p>
            <p className="mt-1 text-sm text-workon-stone">
              {error instanceof Error
                ? error.message
                : "Reessaie dans un instant."}
            </p>
            <Button
              type="button"
              variant="copper"
              className="mt-4"
              onClick={() => refetch()}
            >
              Reessayer
            </Button>
          </div>
        ) : missions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-workon-border bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-workon-ink">
              Rien dans ce rayon.
            </h3>
            <p className="mt-1 text-sm text-workon-muted">
              Elargis le rayon ou reviens plus tard pour de nouvelles missions.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "space-y-3",
              view === "map" && "lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0",
            )}
          >
            {visibleMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                variant="pro"
                source="map_list"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3">
      <Icon className="mb-2 h-4 w-4 text-workon-gold" />
      <p className="truncate font-heading text-lg font-bold leading-none text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}

function ViewButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition",
        active
          ? "bg-white text-workon-ink shadow-sm"
          : "text-workon-stone hover:text-workon-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition",
        active
          ? "border-workon-copper bg-workon-accent-subtle text-workon-copper"
          : "border-workon-border bg-white text-workon-stone hover:border-workon-stone-subtle hover:text-workon-ink",
      )}
    >
      {label}
    </button>
  );
}

function MapPreviewCard({ mission }: { mission: MissionMapItem }) {
  return (
    <Link
      href={`/missions/${mission.id}`}
      className="pointer-events-auto block rounded-[24px] border border-white/70 bg-white/95 p-3 shadow-xl shadow-workon-ink/15 backdrop-blur transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-workon-primary text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-workon-ink">
                {mission.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-workon-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-workon-trust-green" />
                Paiement securise · contrat protege
              </p>
            </div>
            <p className="shrink-0 font-heading text-lg font-bold text-workon-copper">
              {formatMoney(mission.price)}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-workon-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-workon-stone">
              {formatCategoryLabel(mission.category)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-workon-primary">
              Ouvrir
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "A confirmer";
  return `${Math.round(value).toLocaleString("fr-CA")} $`;
}

function formatCategoryLabel(value: string): string {
  if (!value) return "Autres services";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
