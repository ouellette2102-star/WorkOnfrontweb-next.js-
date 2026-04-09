import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { HeroWorkerCard } from "@/components/worker/hero-worker-card";
import { WhyChooseBlock } from "@/components/marketing/why-choose-block";
import { getFeaturedWorkers, getSectorStats, type SectorStat } from "@/lib/public-api";

export const revalidate = 120; // ISR — 2 min

// Header now lives in <MarketingHeader theme="dark" /> — see PR #39.

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
      <MarketingHeader theme="dark" items={[
        { href: "/", label: "Accueil" },
        { href: "/employeurs", label: "Employeurs" },
        { href: "/missions", label: "Missions" },
      ]} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-white/10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4D1C]/30 bg-[#FF4D1C]/10 px-3 py-1 text-xs text-[#FF4D1C] mb-5">
            ⚡ Inscription gratuite — payé dès ce soir
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouve des missions.<br />
            <span className="text-[#FF4D1C]">Travaille quand tu veux.</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg leading-relaxed">
            Rejoins {workers.length > 0 ? `${workers.length}+ travailleurs` : "des centaines de pros"} qui acceptent des missions payées rapidement.
            Flexible, légal, sécurisé.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white" asChild>
              <Link href="/register?role=worker">S&apos;inscrire comme pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/20 hover:border-white/40" asChild>
              <Link href="/missions">Voir les missions →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why WorkOn for pros */}
      <WhyChooseBlock
        eyebrow="Pourquoi WorkOn"
        title="Du travail, vraiment simple."
        theme="dark"
        items={[
          { icon: "💸", title: "Payé rapidement", desc: "Virement dès la fin de mission. Pas d'attente de 30 jours." },
          { icon: "📅", title: "Flexibilité totale", desc: "Tu choisis tes missions, tes horaires, ta ville." },
          { icon: "🔒", title: "Zéro risque", desc: "Paiement sécurisé via Stripe. Tu es protégé avant de commencer." },
          { icon: "⭐", title: "Bâtis ta réputation", desc: "Accumule des avis, monte en tier, accède aux meilleures missions." },
        ]}
      />

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
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {workers.map((w) => <HeroWorkerCard key={w.id} worker={w} />)}
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
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#FF4D1C]/20 border border-[#FF4D1C]/30 flex items-center justify-center text-sm font-bold text-[#FF4D1C]">
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
          <Button size="lg" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white" asChild>
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
