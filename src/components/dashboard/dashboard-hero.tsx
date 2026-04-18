"use client";

import Link from "next/link";
import { usePrimaryRole } from "@/hooks/use-primary-role";

type DashboardHeroProps = {
  displayName: string;
};

const HERO_COPY: Record<
  Exclude<ReturnType<typeof usePrimaryRole>["primaryRole"], null>,
  {
    message: string;
    ctaLabel: string;
    ctaHref: string;
  }
> = {
  worker: {
    message: "Tu es prêt à accepter des missions autour de toi.",
    ctaLabel: "Voir les missions disponibles",
    ctaHref: "/missions/mine",
  },
  employer: {
    message: "Tu es prêt à publier des missions pour trouver du renfort.",
    ctaLabel: "Express Dispatch",
    ctaHref: "/express",
  },
  client: {
    message: "Tu es prêt à réserver des pros en toute simplicité.",
    ctaLabel: "Explorer les offres près de chez toi",
    ctaHref: "/missions/mine",
  },
  admin: {
    message: "Tu supervises l'activité WorkOn et aides les équipes à avancer.",
    ctaLabel: "Accéder au centre d'administration",
    ctaHref: "/dashboard",
  },
};

export function DashboardHero({ displayName }: DashboardHeroProps) {
  const { primaryRole, isLoading, error } = usePrimaryRole();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-2xl border border-workon-border bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.4em] text-workon-muted">Profil WorkOn</p>
          <h2 className="mt-4 text-2xl font-semibold text-workon-ink">Chargement de ton espace...</h2>
          <p className="mt-3 text-workon-muted">Nous vérifions tes rôles actifs.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-xl font-semibold text-red-700">Impossible de charger ton profil</h2>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
          <Link
            href="/profile"
            className="mt-4 inline-flex rounded-full border border-red-300 px-4 py-2 text-sm uppercase tracking-wide text-red-700 transition hover:bg-red-100"
          >
            Modifier mon profil
          </Link>
        </div>
      );
    }

    if (!primaryRole) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-600">Profil incomplet</p>
          <h2 className="mt-4 text-2xl font-semibold text-workon-ink">Choisis ton rôle principal</h2>
          <p className="mt-3 max-w-2xl text-workon-muted">
            Ton espace sera personnalisé après avoir sélectionné ton rôle principal (travailleur,
            client entreprise ou client résidentiel).
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-400"
          >
            Compléter mon profil
          </Link>
        </div>
      );
    }

    const hero = HERO_COPY[primaryRole];

    return (
      <div className="rounded-2xl border border-workon-border bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.4em] text-workon-primary">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold text-workon-ink md:text-5xl">Bienvenue {displayName}</h1>
        <p className="mt-4 max-w-2xl text-workon-muted">{hero.message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={hero.ctaHref}
            className="rounded-full bg-workon-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-workon-primary/90"
          >
            {hero.ctaLabel}
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-workon-border px-6 py-3 text-sm font-semibold uppercase tracking-wide text-workon-muted transition hover:text-workon-ink hover:border-workon-ink/30"
          >
            Modifier mon profil
          </Link>
        </div>
      </div>
    );
  };

  return renderContent();
}
