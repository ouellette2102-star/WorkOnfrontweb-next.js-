import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/navigation/user-nav";
import { RedPhoneButton } from "@/components/red-phone-button";
import {
  getPublicStats,
  getFeaturedWorkers,
  getFeaturedReviews,
  type PublicStats,
  type FeaturedWorker,
  type FeaturedReview,
} from "@/lib/public-api";

export const revalidate = 300; // ISR — 5 min

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
          <Link href="/pros" className="hover:text-white transition-colors">Pour les pros</Link>
          <Link href="/employeurs" className="hover:text-white transition-colors">Employeurs</Link>
          <Link href="/missions" className="hover:text-white transition-colors">Missions</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

// ─── Stats bar ──────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: PublicStats }) {
  const items = [
    { label: "travailleurs actifs", value: stats.activeWorkers.toLocaleString("fr-CA") },
    { label: "missions complétées", value: stats.completedMissions.toLocaleString("fr-CA") },
    { label: "secteurs couverts", value: String(stats.sectorCount) },
    { label: "villes actives", value: String(stats.activeCities) },
  ];
  return (
    <div className="border-b border-white/10 bg-white/5">
      <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-xl font-bold text-red-500">{item.value}</p>
            <p className="text-xs text-white/50 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Worker Card ────────────────────────────────────────────────────────────

function WorkerCard({ w }: { w: FeaturedWorker }) {
  const initials = `${w.firstName[0]}${w.lastName[0]}`.toUpperCase();
  return (
    <Link
      href={`/p/${w.slug}`}
      className="group block rounded-xl border border-white/10 bg-white/5 p-4 hover:border-red-500/50 hover:bg-white/8 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {w.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.photoUrl} alt={w.firstName} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
              <span className="text-sm font-bold text-red-400">{initials}</span>
            </div>
          )}
          {(w.trustTier === "VERIFIED" || w.trustTier === "ELITE") && (
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-red-600 border border-neutral-900 flex items-center justify-center">
              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
            {w.firstName} {w.lastName[0]}.
          </p>
          {w.sector && <p className="text-xs text-white/50 mt-0.5 truncate">{w.sector}</p>}
          {w.city && <p className="text-xs text-white/40 mt-0.5">📍 {w.city}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-xs font-medium">{w.ratingAvg > 0 ? w.ratingAvg.toFixed(1) : "Nouveau"}</span>
          {w.ratingCount > 0 && <span className="text-xs text-white/40">({w.ratingCount})</span>}
        </div>
        <span className="text-xs text-white/40">{w.completedMissions} mission{w.completedMissions !== 1 ? "s" : ""}</span>
      </div>
      {w.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {w.badges.slice(0, 2).map((b) => (
            <span key={b.type} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-600/15 text-red-400 border border-red-600/20">
              {b.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// ─── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({ r }: { r: FeaturedReview }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < r.rating ? "text-yellow-400 text-sm" : "text-white/20 text-sm"}>★</span>
        ))}
      </div>
      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <span>{r.authorName ?? "Client anonyme"}</span>
        {r.workerName && <span>→ {r.workerName}</span>}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [statsRes, workersRes, reviewsRes] = await Promise.allSettled([
    getPublicStats(),
    getFeaturedWorkers(6),
    getFeaturedReviews(3),
  ]);

  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
  const workers = workersRes.status === "fulfilled" ? workersRes.value : [];
  const reviews = reviewsRes.status === "fulfilled" ? reviewsRes.value : [];

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <Header />

      {stats && <StatsBar stats={stats} />}

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12">
        <div className="max-w-3xl">
          {stats && (
            <div className="inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-600/10 px-3 py-1 text-xs text-red-400 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              {stats.openMissions} missions ouvertes en ce moment
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Le <span className="text-red-500">match</span> instantané<br />
            missions · travailleurs.
          </h1>
          <p className="mt-5 text-white/60 text-lg max-w-xl leading-relaxed">
            Trouve un renfort qualifié en minutes. Accepte des missions payées le soir même.
            Montréal et Québec.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white" asChild>
              <Link href="/sign-up">Publier une mission</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 hover:border-white/40" asChild>
              <Link href="/pros">Je suis un travailleur →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured workers */}
      {workers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Travailleurs disponibles</h2>
              <p className="text-sm text-white/50 mt-1">Profils vérifiés · données en temps réel</p>
            </div>
            <Link href="/pros" className="text-sm text-red-400 hover:text-red-300 transition-colors">Voir tous →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workers.map((w) => <WorkerCard key={w.id} w={w} />)}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-white/10">
        <h2 className="text-2xl font-bold mb-8">Comment ça marche</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Publie ta mission", desc: "Décris ton besoin en 2 minutes. Secteur, ville, budget, disponibilité." },
            { step: "02", title: "Match instantané", desc: "On te présente les travailleurs disponibles et vérifiés dans ta zone." },
            { step: "03", title: "Payé en sécurité", desc: "Paiement escrow libéré à la fin. Zéro risque des deux côtés." },
          ].map((item) => (
            <div key={item.step}>
              <span className="text-5xl font-black text-red-600/20 select-none">{item.step}</span>
              <div className="-mt-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 border-t border-white/10">
          <h2 className="text-2xl font-bold mb-1">Ce qu&apos;ils disent</h2>
          <p className="text-sm text-white/50 mb-6">Avis vérifiés de missions complétées</p>
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* Employer CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-white/10">
        <div className="rounded-2xl bg-red-600/10 border border-red-600/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Vous êtes employeur ?</h2>
            <p className="mt-2 text-white/60">
              Zéro commission pendant le lancement. Accès à{" "}
              {stats?.activeWorkers ? `${stats.activeWorkers.toLocaleString("fr-CA")} travailleurs vérifiés` : "des centaines de travailleurs vérifiés"}.
            </p>
          </div>
          <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white flex-shrink-0" asChild>
            <Link href="/employeurs">En savoir plus →</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-4">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 WorkOn Inc. Tous droits réservés.</p>
          <p className="text-center">Les travailleurs sont des prestataires autonomes, non des employés de WorkOn.</p>
          <nav className="flex gap-4">
            <Link href="/faq" className="hover:text-white/70">FAQ</Link>
            <Link href="/pricing" className="hover:text-white/70">Tarifs</Link>
          </nav>
        </div>
      </footer>

      <RedPhoneButton />
    </main>
  );
}
