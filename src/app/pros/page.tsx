import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/navigation/user-nav";
import { getFeaturedWorkers, getSectorStats, type FeaturedWorker, type SectorStat } from "@/lib/public-api";

export const revalidate = 120; // ISR — 2 min

// ─── Shared header ──────────────────────────────────────────────────────────

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
          <Link href="/employeurs" className="hover:text-white transition-colors">Employeurs</Link>
          <Link href="/missions" className="hover:text-white transition-colors">Missions</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

// ─── Worker Card ────────────────────────────────────────────────────────────

function WorkerCard({ w }: { w: FeaturedWorker }) {
  const initials = `${w.firstName[0]}${w.lastName[0]}`.toUpperCase();
  return (
    <Link
      href={`/p/${w.slug}`}
      className="group block rounded-xl border border-white/10 bg-white/5 p-5 hover:border-red-500/50 hover:bg-white/8 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {w.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.photoUrl} alt={w.firstName} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
              <span className="text-base font-bold text-red-400">{initials}</span>
            </div>
          )}
          {(w.trustTier === "VERIFIED" || w.trustTier === "TRUSTED" || w.trustTier === "PREMIUM") && (
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-red-600 border-2 border-neutral-900 flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate group-hover:text-red-400 transition-colors">
            {w.firstName} {w.lastName[0]}.
          </p>
          {w.sector && <p className="text-sm text-white/50 mt-0.5 truncate">{w.sector}</p>}
          {w.city && <p className="text-xs text-white/40 mt-1">📍 {w.city}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400">★</span>
          <span className="text-sm font-semibold">
            {w.ratingAvg > 0 ? w.ratingAvg.toFixed(1) : "Nouveau"}
          </span>
          {w.ratingCount > 0 && (
            <span className="text-xs text-white/40">({w.ratingCount} avis)</span>
          )}
        </div>
        <div className="text-xs text-white/40">
          {w.completedMissions} mission{w.completedMissions !== 1 ? "s" : ""}
        </div>
      </div>

      {w.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {w.badges.map((b) => (
            <span key={b.type} className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600/15 text-red-400 border border-red-600/20">
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-red-400 group-hover:text-red-300 transition-colors flex items-center gap-1">
        Voir le profil complet →
      </div>
    </Link>
  );
}

// ─── Sector Pill ────────────────────────────────────────────────────────────

function SectorPill({ sector }: { sector: SectorStat }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm font-medium truncate">{sector.category}</span>
      <div className="flex items-center gap-3 text-xs text-white/50 flex-shrink-0 ml-2">
        <span>{sector.workerCount} pros</span>
        <span>·</span>
        <span>{sector.missionCount} missions</span>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ProsPage() {
  const [workersRes, sectorsRes] = await Promise.allSettled([
    getFeaturedWorkers(9),
    getSectorStats(),
  ]);

  const workers = workersRes.status === "fulfilled" ? workersRes.value : [];
  const sectors = sectorsRes.status === "fulfilled" ? sectorsRes.value.slice(0, 8) : [];

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-white/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-600/10 px-3 py-1 text-xs text-red-400 mb-5">
            ⚡ Inscription gratuite — payé dès ce soir
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouve des missions.<br />
            <span className="text-red-500">Travaille quand tu veux.</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg leading-relaxed">
            Rejoins {workers.length > 0 ? `${workers.length}+ travailleurs` : "des centaines de pros"} qui acceptent des missions payées rapidement.
            Flexible, légal, sécurisé.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white" asChild>
              <Link href="/register?role=worker">S&apos;inscrire comme pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 hover:border-white/40" asChild>
              <Link href="/missions">Voir les missions →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why WorkOn for pros */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
        <h2 className="text-xl font-bold mb-6">Pourquoi WorkOn ?</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "💸", title: "Payé rapidement", desc: "Virement dès la fin de mission. Pas d'attente de 30 jours." },
            { icon: "📅", title: "Flexibilité totale", desc: "Tu choisis tes missions, tes horaires, ta ville." },
            { icon: "🔒", title: "Zéro risque", desc: "Paiement sécurisé via Stripe. Tu es protégé avant de commencer." },
            { icon: "⭐", title: "Bâtis ta réputation", desc: "Accumule des avis, monte en tier, accède aux meilleures missions." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold mt-2 mb-1 text-sm">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      {sectors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
          <h2 className="text-xl font-bold mb-4">Secteurs actifs</h2>
          <p className="text-sm text-white/50 mb-5">Missions ouvertes par catégorie — mis à jour toutes les 2 minutes</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {sectors.map((s) => <SectorPill key={s.category} sector={s} />)}
          </div>
        </section>
      )}

      {/* Featured workers */}
      {workers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Profils en vedette</h2>
              <p className="text-sm text-white/50 mt-1">Top travailleurs par missions complétées</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workers.map((w) => <WorkerCard key={w.id} w={w} />)}
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
        <h2 className="text-xl font-bold mb-6">Comment ça marche</h2>
        <ol className="space-y-4">
          {[
            { n: 1, title: "Crée ton profil en 2 min", desc: "Nom, secteur, ville. Photo optionnelle." },
            { n: 2, title: "Parcours les missions disponibles", desc: "Filtre par secteur et ville. Postule en 1 clic." },
            { n: 3, title: "Travaille et collecte tes avis", desc: "Chaque mission complétée améliore ton score et ta visibilité." },
            { n: 4, title: "Reçois ton paiement", desc: "Stripe débloque les fonds dès la confirmation. Rapide et sécurisé." },
          ].map((step) => (
            <li key={step.n} className="flex items-start gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-sm font-bold text-red-400">
                {step.n}
              </span>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Prêt à commencer ?</h2>
          <p className="text-white/60 mb-6">Inscription gratuite. Première mission disponible immédiatement.</p>
          <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white" asChild>
            <Link href="/register?role=worker">Créer mon profil gratuitement</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes.</p>
          <Link href="/employeurs" className="hover:text-white/70">Côté employeur →</Link>
        </div>
      </footer>
    </main>
  );
}
