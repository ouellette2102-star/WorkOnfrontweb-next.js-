import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Clock, ArrowRight, ListFilter } from "lucide-react";
import {
  getPublicMissions,
  getSectorStats,
  type PublicMission,
} from "@/lib/public-api";
import { MissionsFilterBar } from "./_components/missions-filter-bar";

/**
 * /missions — public, open-mission feed.
 *
 * Server component that reads `category`, `city` and `page` from the
 * URL, queries the existing `GET /public/missions` endpoint, and
 * renders a responsive grid of cards. Filters are driven by the
 * client-side <MissionsFilterBar> which mutates the search params via
 * `useRouter().replace`.
 *
 * Replaces the previous `/missions/mine` redirect. Workers now have a
 * real way to discover open demand on the platform; the existing
 * `/missions/mine` page stays accessible via the header link inside
 * the authenticated shell.
 */

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  city?: string;
  page?: string;
};

const PAGE_SIZE = 12;

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
    getSectorStats().catch(() => [] as { category: string; missionCount: number }[]),
  ]);

  const totalPages = Math.max(Math.ceil(feed.total / PAGE_SIZE), 1);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-workon-ink">Missions ouvertes</h1>
        <p className="mt-1 text-sm text-workon-muted">
          {feed.total.toLocaleString("fr-CA")} mission{feed.total > 1 ? "s" : ""}{" "}
          disponible{feed.total > 1 ? "s" : ""}
          {city ? ` à ${city}` : ""}
          {category ? ` en ${category}` : ""}.
        </p>
      </header>

      <Suspense fallback={null}>
        <MissionsFilterBar
          category={category ?? ""}
          city={city ?? ""}
          categoryOptions={sectorStats.map((s) => s.category).slice(0, 20)}
        />
      </Suspense>

      {feed.missions.length === 0 ? (
        <EmptyState category={category} city={city} />
      ) : (
        <>
          <ul
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="missions-feed-grid"
          >
            {feed.missions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </ul>

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

/* ------------------------------------------------------------------ */
/*  Mission card                                                       */
/* ------------------------------------------------------------------ */

function MissionCard({ mission }: { mission: PublicMission }) {
  const createdAgo = timeAgo(new Date(mission.createdAt));
  return (
    <li
      className="group flex flex-col overflow-hidden rounded-2xl border border-workon-border bg-white transition-colors hover:border-workon-primary/50"
      data-testid="mission-card"
    >
      <Link
        href={`/missions/${mission.id}`}
        className="flex h-full flex-col p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-workon-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-workon-primary">
            {mission.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-workon-muted">
            <Clock className="h-3 w-3" />
            {createdAgo}
          </span>
        </div>

        <h2 className="mb-1 line-clamp-2 text-sm font-semibold text-workon-ink group-hover:text-workon-primary">
          {mission.title}
        </h2>
        <p className="mb-3 line-clamp-3 text-xs text-workon-muted">
          {mission.description}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-workon-border pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-workon-muted">
            <MapPin className="h-3.5 w-3.5" />
            {mission.city}
          </span>
          <span className="text-sm font-semibold text-workon-ink">
            {mission.priceRange}
          </span>
        </div>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ category, city }: { category?: string; city?: string }) {
  const hasFilter = !!(category || city);
  return (
    <div
      className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-workon-border bg-white p-10 text-center"
      data-testid="missions-empty-state"
    >
      <ListFilter className="mb-3 h-8 w-8 text-workon-muted" />
      <h2 className="text-sm font-semibold text-workon-ink">
        Aucune mission pour l&apos;instant
      </h2>
      <p className="mt-1 max-w-sm text-xs text-workon-muted">
        {hasFilter
          ? "Essaie d'élargir ta recherche — retire un filtre ou change de ville."
          : "Reviens bientôt, de nouvelles missions sont publiées chaque jour."}
      </p>
      {hasFilter && (
        <Link
          href="/missions"
          className="mt-3 rounded-full border border-workon-border bg-workon-bg px-3 py-1 text-xs font-medium text-workon-ink hover:border-workon-primary hover:text-workon-primary"
        >
          Réinitialiser les filtres
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

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
      className="mt-6 flex items-center justify-between"
      aria-label="Pagination"
      data-testid="missions-pagination"
    >
      <span className="text-xs text-workon-muted">
        Page {page} sur {totalPages} · {total} missions
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-white px-3 py-1 text-xs font-medium text-workon-ink hover:border-workon-primary hover:text-workon-primary"
          >
            ← Précédent
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-workon-bg px-3 py-1 text-xs font-medium text-workon-muted opacity-50">
            ← Précédent
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex items-center gap-1 rounded-full border border-workon-primary bg-workon-primary px-3 py-1 text-xs font-medium text-white hover:bg-workon-primary-hover"
          >
            Suivant <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-workon-bg px-3 py-1 text-xs font-medium text-workon-muted opacity-50">
            Suivant <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem.`;
  return date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
  });
}
