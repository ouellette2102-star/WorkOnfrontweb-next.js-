import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ListFilter } from "lucide-react";
import {
  getPublicMissions,
  getSectorStats,
  type PublicMission,
} from "@/lib/public-api";
import { MissionsFilterBar } from "./_components/missions-filter-bar";
import { MissionCard } from "@/components/mission/mission-card";

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
          <div
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="missions-feed-grid"
          >
            {feed.missions.map((m) => (
              <MissionCard key={m.id} mission={m} variant="pro" />
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

