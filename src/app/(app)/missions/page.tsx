import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Briefcase,
  ListFilter,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  getPublicMissions,
  getSectorStats,
  type PublicMission,
} from "@/lib/public-api";
import { MissionsFilterBar } from "./_components/missions-filter-bar";
import { MissionCard } from "@/components/mission/mission-card";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  city?: string;
  page?: string;
};

const PAGE_SIZE = 12;

const CATEGORY_LABELS: Record<string, string> = {
  other: "Autres services",
  cleaning: "Ménage",
  menage: "Ménage",
  reparation: "Réparation",
  entretien: "Entretien",
  snow_removal: "Déneigement",
  paysagement: "Paysagement",
  construction: "Construction",
  "construction-legere": "Construction légère",
  plomberie: "Plomberie",
  electrical: "Électricité",
  electricite: "Électricité",
};

function formatCategoryLabel(value?: string) {
  if (!value) return "";
  if (CATEGORY_LABELS[value]) return CATEGORY_LABELS[value];

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function MissionsFeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page ?? "1") || 1, 1);
  const category = sp.category?.trim() || undefined;
  const city = sp.city?.trim() || undefined;

  const [feed, sectorStats] = await Promise.all([
    getPublicMissions({ category, city, page, limit: PAGE_SIZE }).catch(
      () => ({ missions: [] as PublicMission[], total: 0, page }),
    ),
    getSectorStats().catch(
      () => [] as { category: string; missionCount: number }[],
    ),
  ]);

  const totalPages = Math.max(Math.ceil(feed.total / PAGE_SIZE), 1);
  const hasFilters = Boolean(category || city);
  const topCategory = sectorStats[0]?.category;
  const categoryLabel = formatCategoryLabel(category);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-28 pt-4">
      <header className="workon-dark-panel overflow-hidden rounded-[24px] p-5 shadow-[0_18px_40px_rgba(8,34,25,0.18)]">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/78">
          <Briefcase className="h-3.5 w-3.5 text-workon-gold" />
          Opportunités locales
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold leading-tight text-white">
              Missions ouvertes
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/72">
              {feed.total.toLocaleString("fr-CA")} mission
              {feed.total > 1 ? "s" : ""} disponible
              {feed.total > 1 ? "s" : ""}
              {city ? ` à ${city}` : ""}
              {categoryLabel ? ` en ${categoryLabel}` : ""}. Compare le budget, le lieu
              et les signaux de confiance avant de postuler.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
              Secteur actif
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {topCategory ? formatCategoryLabel(topCategory) : "Tous"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-white/72">
          <TrustMini icon={ShieldCheck} label="Paiement" value="sécurisé" />
          <TrustMini icon={SlidersHorizontal} label="Filtres" value="propres" />
          <TrustMini icon={MapPin} label="Local" value="vérifié" />
        </div>
      </header>

      <Suspense fallback={null}>
        <MissionsFilterBar
          category={category ?? ""}
          city={city ?? ""}
          categoryOptions={sectorStats.map((s) => s.category).slice(0, 20)}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-workon-copper">
            Feed
          </p>
          <h2 className="font-heading text-lg font-bold text-workon-ink">
            {hasFilters ? "Résultats filtrés" : "À traiter maintenant"}
          </h2>
        </div>
        {hasFilters && (
          <Link
            href="/missions"
            className="rounded-full border border-workon-border bg-white px-3 py-1.5 text-xs font-bold text-workon-primary shadow-sm hover:bg-workon-bg-cream"
          >
            Tout voir
          </Link>
        )}
      </div>

      {feed.missions.length === 0 ? (
        <EmptyState category={category} city={city} />
      ) : (
        <>
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="missions-feed-grid"
          >
            {feed.missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                variant="pro"
                source="public_feed"
                showSaveButton
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={feed.total}
              category={category}
              city={city}
            />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ category, city }: { category?: string; city?: string }) {
  const hasFilter = !!(category || city);
  return (
    <div
      className="rounded-[24px] border border-dashed border-workon-border bg-white p-8 text-center shadow-card"
      data-testid="missions-empty-state"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-stone">
        <ListFilter className="h-6 w-6" />
      </div>
      <h2 className="font-heading text-xl font-bold text-workon-ink">
        {hasFilter ? "Aucune mission ne correspond" : "Aucune mission active"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-workon-muted">
        {hasFilter
          ? "Élargis la ville ou retire une catégorie pour voir plus d'opportunités."
          : "Le feed se remplit avec les nouvelles demandes. Reviens bientôt ou explore la carte."}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {hasFilter && (
          <Link
            href="/missions"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-workon-border bg-white px-4 text-sm font-bold text-workon-ink hover:bg-workon-bg-cream"
          >
            Réinitialiser
          </Link>
        )}
        <Link
          href="/map"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-workon-primary px-4 text-sm font-bold text-white hover:bg-workon-primary-hover"
        >
          Voir la carte
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  category,
  city,
}: {
  page: number;
  totalPages: number;
  total: number;
  category?: string;
  city?: string;
}) {
  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (city) sp.set("city", city);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/missions?${qs}` : "/missions";
  };

  return (
    <nav
      className="flex items-center justify-between rounded-2xl border border-workon-border bg-white p-2 shadow-card"
      aria-label="Pagination"
      data-testid="missions-pagination"
    >
      <span className="px-2 text-xs font-medium text-workon-muted">
        Page {page} sur {totalPages} · {total} missions
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-full border border-workon-border bg-workon-bg px-3 py-1.5 text-xs font-bold text-workon-ink hover:border-workon-primary hover:text-workon-primary"
          >
            Précédent
          </Link>
        ) : (
          <span className="rounded-full border border-workon-border bg-workon-bg px-3 py-1.5 text-xs font-bold text-workon-muted opacity-50">
            Précédent
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex items-center gap-1 rounded-full bg-workon-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-workon-primary-hover"
          >
            Suivant <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-workon-bg px-3 py-1.5 text-xs font-bold text-workon-muted opacity-50">
            Suivant <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </nav>
  );
}

function TrustMini({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-2 py-2">
      <Icon className="mb-1 h-3.5 w-3.5 text-workon-gold" />
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/48">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}
