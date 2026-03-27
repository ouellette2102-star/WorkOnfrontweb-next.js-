import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/navigation/user-nav";
import { getPublicStats, getFeaturedReviews, getSectorStats, type PublicStats, type FeaturedReview, type SectorStat } from "@/lib/public-api";

export const revalidate = 120; // ISR — 2 min

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
          <Link href="/pros" className="hover:text-white transition-colors">Pour les pros</Link>
          <Link href="/missions" className="hover:text-white transition-colors">Missions</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-3xl font-black text-red-500">{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function ReviewCard({ r }: { r: FeaturedReview }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < r.rating ? "text-yellow-400" : "text-white/20"}>★</span>
        ))}
      </div>
      <p className="text-sm text-white/80 leading-relaxed line-clamp-4">&ldquo;{r.comment}&rdquo;</p>
      <div className="mt-4 flex items-center justify-between text-xs text-white/40">
        <span>{r.authorName ?? "Employeur anonyme"}</span>
        {r.workerName && (
          <span className="text-red-400/60">Pro : {r.workerName}</span>
        )}
      </div>
    </div>
  );
}

function SectorRow({ s }: { s: SectorStat }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{s.category}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-white/50 flex-shrink-0">
        <span className="text-green-400 font-medium">{s.workerCount} pros dispo</span>
        <span>{s.missionCount} missions</span>
      </div>
    </div>
  );
}

export default async function EmployeursPage() {
  const [statsRes, reviewsRes, sectorsRes] = await Promise.allSettled([
    getPublicStats(),
    getFeaturedReviews(6),
    getSectorStats(),
  ]);

  const stats: PublicStats | null = statsRes.status === "fulfilled" ? statsRes.value : null;
  const reviews: FeaturedReview[] = reviewsRes.status === "fulfilled" ? reviewsRes.value : [];
  const sectors: SectorStat[] = sectorsRes.status === "fulfilled" ? sectorsRes.value.slice(0, 6) : [];

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-white/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400 mb-5">
            🚀 0% commission pendant le lancement
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouvez un renfort qualifié<br />
            <span className="text-red-500">en moins de 10 minutes.</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg leading-relaxed">
            Publiez votre mission, recevez des candidatures de travailleurs vérifiés.
            Paiement sécurisé, couverture légale incluse.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white" asChild>
              <Link href="/sign-up?role=employer">Publier ma première mission</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 hover:border-white/40" asChild>
              <Link href="/pros">Voir les travailleurs →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
          <h2 className="text-xl font-bold mb-6">La plateforme en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Travailleurs actifs" value={stats.activeWorkers.toLocaleString("fr-CA")} sub="profils vérifiés" />
            <StatCard label="Missions complétées" value={stats.completedMissions.toLocaleString("fr-CA")} />
            <StatCard label="Missions ouvertes" value={stats.openMissions.toLocaleString("fr-CA")} sub="disponibles maintenant" />
            <StatCard label="Secteurs couverts" value={String(stats.sectorCount)} />
          </div>
        </section>
      )}

      {/* Why WorkOn */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
        <h2 className="text-xl font-bold mb-6">Pourquoi WorkOn ?</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[
            {
              icon: "⚡",
              title: "Réponse en minutes",
              desc: "Publiez votre besoin et recevez des candidatures de travailleurs disponibles dans votre secteur.",
            },
            {
              icon: "✅",
              title: "Profils vérifiés",
              desc: "Chaque travailleur passe une vérification d'identité. Vous voyez les avis et les missions complétées.",
            },
            {
              icon: "🔒",
              title: "Paiement sécurisé",
              desc: "Votre budget est bloqué en escrow. Libéré uniquement quand la mission est confirmée.",
            },
            {
              icon: "📋",
              title: "Contrat automatique",
              desc: "Chaque mission génère un contrat de service autonome. Couverture légale complète.",
            },
            {
              icon: "📊",
              title: "Suivi en temps réel",
              desc: "Tableau de bord pour suivre vos missions actives, l'historique et les paiements.",
            },
            {
              icon: "💬",
              title: "Communication directe",
              desc: "Chat intégré avec le travailleur avant et pendant la mission.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold mt-2 mb-1">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors available */}
      {sectors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Secteurs disponibles</h2>
            <span className="text-xs text-white/40">Mis à jour en temps réel</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-2">
            {sectors.map((s) => <SectorRow key={s.category} s={s} />)}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
        <h2 className="text-xl font-bold mb-2">Tarification transparente</h2>
        <p className="text-sm text-white/50 mb-6">Pas d'abonnement. Vous payez seulement pour les missions complétées.</p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Lancement</h3>
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400 border border-green-500/20">Actif maintenant</span>
            </div>
            <p className="text-4xl font-black">0%</p>
            <p className="text-sm text-white/50 mt-1">de commission sur chaque mission</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Missions illimitées</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Accès tous les travailleurs</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Contrats automatiques</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Support prioritaire</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 opacity-60">
            <h3 className="font-bold text-lg mb-4">Post-lancement</h3>
            <p className="text-4xl font-black">15%</p>
            <p className="text-sm text-white/50 mt-1">de commission sur chaque mission</p>
            <p className="text-xs text-white/40 mt-4">
              Uniquement sur les missions complétées. Aucune charge si la mission n&apos;aboutit pas.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
          <h2 className="text-xl font-bold mb-1">Témoignages</h2>
          <p className="text-sm text-white/50 mb-6">Avis réels de missions complétées</p>
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-white/10">
        <h2 className="text-xl font-bold mb-6">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Les travailleurs sont-ils des employés de WorkOn ?",
              a: "Non. Les travailleurs sont des prestataires autonomes. WorkOn est une plateforme de mise en relation. Vous contractez directement avec eux via un contrat de service indépendant.",
            },
            {
              q: "Que se passe-t-il si la mission n'est pas complétée ?",
              a: "Le paiement est bloqué en escrow jusqu'à la confirmation. En cas de litige, notre équipe arbitre et peut rembourser intégralement.",
            },
            {
              q: "Comment vérifiez-vous les travailleurs ?",
              a: "Chaque travailleur passe une vérification d'identité et de documents. Leur score de confiance est visible sur leur profil.",
            },
          ].map((item) => (
            <details key={item.q} className="group rounded-lg border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                {item.q}
                <span className="text-white/40 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Prêt à publier votre mission ?</h2>
          <p className="text-white/60 mb-6">0% commission pendant le lancement. Inscription en 2 minutes.</p>
          <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white" asChild>
            <Link href="/sign-up?role=employer">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes, non des employés de WorkOn.</p>
          <Link href="/pros" className="hover:text-white/70">Côté travailleur →</Link>
        </div>
      </footer>
    </main>
  );
}
