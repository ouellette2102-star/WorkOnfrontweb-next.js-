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
    ctaHref: "/missions",
  },
  employer: {
    message: "Tu es prêt à publier des missions pour trouver du renfort.",
    ctaLabel: "Créer une mission",
    ctaHref: "/missions/new",
  },
  client: {
    message: "Tu es prêt à réserver des pros en toute simplicité.",
    ctaLabel: "Explorer les offres près de chez toi",
    ctaHref: "/missions",
  },
  admin: {
    message: "Tu supervises l’activité WorkOn et aides les équipes à avancer.",
    ctaLabel: "Accéder au centre d’administration",
    ctaHref: "/dashboard",
  },
};

export function DashboardHero({ displayName }: DashboardHeroProps) {
  const { primaryRole, isLoading, error } = usePrimaryRole();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-white/40">Profil WorkOn</p>
          <h2 className="mt-4 text-2xl font-semibold">Chargement de ton espace...</h2>
          <p className="mt-3 text-white/60">Nous vérifions tes rôles actifs.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-red-900/40 bg-red-950/30 p-8">
          <h2 className="text-xl font-semibold text-red-300">Impossible de charger ton profil</h2>
          <p className="mt-2 text-sm text-red-200">{error.message}</p>
          <Link
            href="/profile"
            className="mt-4 inline-flex rounded-full border border-red-500/40 px-4 py-2 text-sm uppercase tracking-wide text-red-200 transition hover:border-red-400"
          >
            Modifier mon profil
          </Link>
        </div>
      );
    }

    if (!primaryRole) {
      return (
        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-yellow-400">Profil incomplet</p>
          <h2 className="mt-4 text-2xl font-semibold">Choisis ton rôle principal</h2>
          <p className="mt-3 max-w-2xl text-yellow-100/90">
            Ton espace sera personnalisé après avoir sélectionné ton rôle principal (travailleur,
            employeur ou client résidentiel).
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center rounded-full bg-yellow-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-yellow-400"
          >
            Compléter mon profil
          </Link>
        </div>
      );
    }

    const hero = HERO_COPY[primaryRole];

    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.4em] text-red-500">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Bienvenue {displayName}</h1>
        <p className="mt-4 max-w-2xl text-white/70">{hero.message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={hero.ctaHref}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-500"
          >
            {hero.ctaLabel}
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:text-white"
          >
            Modifier mon profil
          </Link>
        </div>
      </div>
    );
  };

  return renderContent();
}

