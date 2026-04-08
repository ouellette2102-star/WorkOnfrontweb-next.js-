"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserNav } from "@/components/navigation/user-nav";
import { Button } from "@/components/ui/button";
import type { PublicMission, PublicMissionsResponse, SectorStat } from "@/lib/public-api";

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://workon-backend-production-31db.up.railway.app";
const API_BASE = `${RAW_BASE}/api/v1`;

// ─── Header ────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <span className="font-bold tracking-tight">WorkOn</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <Link href="/pros" className="hover:text-white transition-colors">Travailleurs</Link>
          <Link href="/employeurs" className="hover:text-white transition-colors">Employeurs</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

// ─── Mission Card ───────────────────────────────────────────────────────────

function MissionCard({ m }: { m: PublicMission }) {
  const ago = (() => {
    const diff = Date.now() - new Date(m.createdAt).getTime();
    const h = Math.floor(diff / 3_600_000);
    const d = Math.floor(diff / 86_400_000);
    if (h < 1) return "À l'instant";
    if (h < 24) return `Il y a ${h}h`;
    return `Il y a ${d}j`;
  })();

  return (
    <div className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-red-500/30 hover:bg-white/8 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/70">
              {m.category}
            </span>
            <span className="text-xs text-white/40">{ago}</span>
          </div>
          <h3 className="font-semibold truncate group-hover:text-red-400 transition-colors">
            {m.title}
          </h3>
          <p className="text-sm text-white/50 mt-1 line-clamp-2 leading-relaxed">
            {m.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-bold text-red-400 text-sm whitespace-nowrap">{m.priceRange}</p>
          {m.city && <p className="text-xs text-white/40 mt-0.5">📍 {m.city}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Ouverte
        </span>
        <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white text-xs h-7 px-3" asChild>
          <Link href="/register?role=worker">Postuler</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function MissionSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-16 rounded bg-white/10" />
          <div className="h-3 w-12 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MissionsPage() {
  const [missions, setMissions] = useState<PublicMission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<SectorStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cityInput, setCityInput] = useState("");

  const LIMIT = 12;

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (selectedCategory) params.set("category", selectedCategory);
      if (cityFilter) params.set("city", cityFilter);

      const res = await fetch(`${API_BASE}/public/missions?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: PublicMissionsResponse = await res.json();
      setMissions(data.missions);
      setTotal(data.total);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, cityFilter]);

  // Fetch sectors once
  useEffect(() => {
    fetch(`${API_BASE}/public/sectors/stats`)
      .then((r) => r.json())
      .then((data: SectorStat[]) => setSectors(data.slice(0, 10)))
      .catch((err) => {
        // Non-critical sidebar data — don't toast, but log so the
        // failure is visible instead of silently hidden.
        console.warn("[missions] failed to load sector stats", err);
      });
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchMissions, 30_000);
    return () => clearInterval(id);
  }, [fetchMissions]);

  const totalPages = Math.ceil(total / LIMIT);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat === selectedCategory ? "" : cat);
    setPage(1);
  };

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCityFilter(cityInput.trim());
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Missions ouvertes</h1>
            <p className="text-sm text-white/50 mt-1">
              {total > 0 ? `${total} mission${total !== 1 ? "s" : ""} disponible${total !== 1 ? "s" : ""}` : "Chargement..."} · mis à jour toutes les 30s
            </p>
          </div>
          <Button className="bg-red-600 hover:bg-red-500 text-white" asChild>
            <Link href="/register?role=employer">+ Publier une mission</Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-56 flex-shrink-0 space-y-5">
            {/* City search */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">Ville</h3>
              <form onSubmit={handleCitySearch} className="flex gap-1.5">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Montréal..."
                  className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                />
                <button type="submit" className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors">
                  OK
                </button>
              </form>
              {cityFilter && (
                <button
                  onClick={() => { setCityFilter(""); setCityInput(""); setPage(1); }}
                  className="text-xs text-white/40 hover:text-white/70 mt-1 transition-colors"
                >
                  ✕ Effacer filtre
                </button>
              )}
            </div>

            {/* Category filter */}
            {sectors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">Secteur</h3>
                <div className="space-y-1">
                  {sectors.map((s) => (
                    <button
                      key={s.category}
                      onClick={() => handleCategoryChange(s.category)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedCategory === s.category
                          ? "bg-red-600/20 text-red-400 border border-red-600/30"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="truncate block">{s.category}</span>
                      <span className="text-xs text-white/30">{s.missionCount} missions</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedCategory || cityFilter) && (
              <button
                onClick={() => { setSelectedCategory(""); setCityFilter(""); setCityInput(""); setPage(1); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Réinitialiser filtres
              </button>
            )}
          </aside>

          {/* Mission grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <MissionSkeleton key={i} />)}
              </div>
            ) : missions.length === 0 ? (
              <div className="text-center py-16 text-white/50">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium">Aucune mission trouvée</p>
                <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
                <button
                  onClick={() => { setSelectedCategory(""); setCityFilter(""); setCityInput(""); setPage(1); }}
                  className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {missions.map((m) => <MissionCard key={m.id} m={m} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:border-white/30 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Précédent
                    </button>
                    <span className="text-sm text-white/50">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:border-white/30 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* CTA worker */}
            <div className="mt-8 rounded-xl border border-red-600/20 bg-red-600/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold">Tu veux postuler à ces missions ?</p>
                <p className="text-sm text-white/60 mt-0.5">Crée ton profil gratuitement et commence à travailler.</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-500 text-white flex-shrink-0" asChild>
                <Link href="/register?role=worker">S&apos;inscrire comme pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 mt-8">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes.</p>
        </div>
      </footer>
    </main>
  );
}
