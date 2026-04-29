import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { getProsList, type ProListItem } from "@/lib/public-api";
import { ShieldCheck, MapPin, Search } from "lucide-react";

/**
 * /pros — Browsable list of pros (clients can discover and book).
 *
 * QA report C3 / Sprint 2: this used to be a worker recruitment
 * landing — clicking "Pros" in the bottom nav landed on
 * "S'inscrire comme pro / Trouve des missions". That recruitment
 * funnel now lives at /rejoindre-pro. This page is the actual list.
 *
 * Filters via URL search params (city, category, search, page) so
 * deep-linkable + sharable + cacheable. Server component with ISR
 * 120s — pagination triggers a fresh render only on page change.
 */

export const metadata: Metadata = {
  title: "Trouvez un pro vérifié — WorkOn",
  description:
    "Découvrez et réservez des travailleurs autonomes vérifiés au Québec. Filtres par ville et catégorie. Paiement sécurisé Stripe.",
  alternates: { canonical: "/pros" },
};

export const revalidate = 120;

interface ProsPageProps {
  searchParams: Promise<{
    page?: string;
    city?: string;
    category?: string;
    search?: string;
    trustTier?: "BASIC" | "VERIFIED" | "TRUSTED" | "PREMIUM";
  }>;
}

const TIER_BADGE: Record<
  ProListItem["trustTier"],
  { label: string; cls: string } | null
> = {
  PREMIUM: {
    label: "★ Premium",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
  },
  TRUSTED: {
    label: "✓ De confiance",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  VERIFIED: {
    label: "✓ Vérifié",
    cls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  BASIC: null,
};

function ProCard({ pro }: { pro: ProListItem }) {
  const tier = TIER_BADGE[pro.trustTier];
  const initials = `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase();
  const href = pro.slug ? `/pro/${pro.slug}` : `/pro/${pro.id}`;

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-workon-border bg-white p-5 hover:border-workon-accent/40 hover:shadow-card transition-all flex gap-4"
    >
      {/* Photo or initials */}
      <div className="flex-shrink-0">
        {pro.pictureUrl ? (
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-workon-border">
            <Image
              src={pro.pictureUrl}
              alt={pro.fullName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-workon-accent/10 border-2 border-workon-accent/20 flex items-center justify-center text-2xl font-bold text-workon-accent">
            {initials || "?"}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-workon-ink truncate">
            {pro.fullName}
          </h3>
          {tier && (
            <span
              className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.cls}`}
            >
              {tier.label}
            </span>
          )}
        </div>
        {pro.jobTitle ? (
          <p className="text-sm text-workon-accent font-medium truncate mb-1">
            {pro.jobTitle}
          </p>
        ) : pro.category ? (
          <p className="text-sm text-workon-accent font-medium truncate mb-1 capitalize">
            {pro.category}
          </p>
        ) : null}
        <div className="flex items-center gap-3 text-xs text-workon-gray">
          {pro.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {pro.city}
            </span>
          )}
          {pro.hourlyRate !== null && pro.hourlyRate > 0 && (
            <span>{pro.hourlyRate}$/h</span>
          )}
          {pro.verified && (
            <span className="inline-flex items-center gap-1 text-workon-trust-green">
              <ShieldCheck className="h-3 w-3" />
              Vérifié
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap ${
        active
          ? "bg-workon-primary text-white border-workon-primary"
          : "bg-white text-workon-ink border-workon-border hover:border-workon-gray"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(
  base: Record<string, string | undefined>,
  override: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...override };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return `/pros${qs ? `?${qs}` : ""}`;
}

export default async function ProsPage({ searchParams }: ProsPageProps) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const params = {
    page,
    pageSize: 24,
    city: sp.city,
    category: sp.category,
    trustTier: sp.trustTier,
    search: sp.search,
  };

  const data = await getProsList(params).catch(() => null);
  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;
  const total = data?.pagination.total ?? 0;

  // Common filter chip params (drop page when changing filter)
  const baseParams = {
    city: sp.city,
    category: sp.category,
    search: sp.search,
    trustTier: sp.trustTier,
  };

  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6 border-b border-workon-border">
        <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight tracking-tight">
          Trouvez un pro <span className="text-workon-accent">vérifié</span>.
        </h1>
        <p className="mt-3 text-workon-gray max-w-2xl">
          {total > 0
            ? `${total} professionnel${total > 1 ? "s" : ""} disponible${
                total > 1 ? "s" : ""
              } au Québec.`
            : "Découvrez les travailleurs autonomes qui ont rejoint WorkOn."}{" "}
          Paiement sécurisé Stripe, contrats automatiques, conformité Loi 25.
        </p>

        {/* Search form (server-side, no JS needed) */}
        <form
          action="/pros"
          method="GET"
          className="mt-5 flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-workon-muted" />
            <input
              type="search"
              name="search"
              placeholder="Nom, métier, mot-clé..."
              defaultValue={sp.search ?? ""}
              className="w-full rounded-full border border-workon-border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-workon-primary"
            />
          </div>
          {sp.city && <input type="hidden" name="city" value={sp.city} />}
          {sp.category && (
            <input type="hidden" name="category" value={sp.category} />
          )}
          {sp.trustTier && (
            <input type="hidden" name="trustTier" value={sp.trustTier} />
          )}
          <Button
            type="submit"
            className="bg-workon-primary hover:bg-workon-primary-hover text-white rounded-full"
          >
            Rechercher
          </Button>
        </form>

        {/* Trust tier filter chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <FilterChip
            label="Tous"
            href={buildHref(baseParams, { trustTier: undefined })}
            active={!sp.trustTier}
          />
          <FilterChip
            label="Premium"
            href={buildHref(baseParams, { trustTier: "PREMIUM" })}
            active={sp.trustTier === "PREMIUM"}
          />
          <FilterChip
            label="De confiance"
            href={buildHref(baseParams, { trustTier: "TRUSTED" })}
            active={sp.trustTier === "TRUSTED"}
          />
          <FilterChip
            label="Vérifiés"
            href={buildHref(baseParams, { trustTier: "VERIFIED" })}
            active={sp.trustTier === "VERIFIED"}
          />
        </div>
      </section>

      {/* Results grid */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-workon-border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-workon-ink mb-2">
              Aucun pro ne correspond à votre recherche
            </h2>
            <p className="text-sm text-workon-gray mb-5">
              Essayez d&apos;élargir votre recherche, ou{" "}
              <Link
                href="/missions/new"
                className="text-workon-primary underline underline-offset-2 hover:text-workon-primary-hover"
              >
                publiez votre mission
              </Link>{" "}
              et laissez les pros venir à vous.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/pros">Voir tous les pros</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((pro) => <ProCard key={pro.id} pro={pro} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link
                  href={buildHref(baseParams, {
                    page: String(page - 1),
                  })}
                >
                  ← Précédent
                </Link>
              </Button>
            )}
            <span className="text-sm text-workon-gray px-3">
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link
                  href={buildHref(baseParams, {
                    page: String(page + 1),
                  })}
                >
                  Suivant →
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Recruitment cross-link footer */}
      <footer className="border-t border-workon-border bg-workon-bg-cream/40">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-sm">
          <p className="text-workon-gray">
            Vous êtes un travailleur autonome ?{" "}
            <Link
              href="/rejoindre-pro"
              className="text-workon-primary underline underline-offset-2 font-medium"
            >
              Rejoignez WorkOn →
            </Link>
          </p>
          <Link
            href="/missions/new"
            className="text-workon-accent font-medium hover:text-workon-accent-hover"
          >
            Publier une mission →
          </Link>
        </div>
      </footer>
    </main>
  );
}
