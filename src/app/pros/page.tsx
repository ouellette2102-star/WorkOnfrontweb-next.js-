import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { HeroWorkerCard } from "@/components/worker/hero-worker-card";
import { WhyChooseBlock } from "@/components/marketing/why-choose-block";
import { getFeaturedWorkers, getSectorStats, type SectorStat } from "@/lib/public-api";

export const revalidate = 120; // ISR — 2 min

// Header now lives in <MarketingHeader theme="light" /> — see PR #39.

// ─── Sector Pill ────────────────────────────────────────────────────────────

function SectorPill({ sector }: { sector: SectorStat }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#EAE6DF] bg-white px-4 py-3">
      <span className="text-sm font-medium truncate text-[#1B1A18]">{sector.category}</span>
      <div className="flex items-center gap-3 text-xs text-[#706E6A] flex-shrink-0 ml-2">
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
    <main className="min-h-screen bg-[#F9F8F5] text-[#1B1A18]">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-[#EAE6DF]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B5382A]/30 bg-[#B5382A]/10 px-3 py-1 text-xs text-[#B5382A] mb-5">
            ⚡ Inscription gratuite — payé dès ce soir
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouve des missions.<br />
            <span className="text-[#B5382A]">Travaille quand tu veux.</span>
          </h1>
          <p className="mt-4 text-[#706E6A] text-lg leading-relaxed">
            Rejoins {workers.length > 0 ? `${workers.length}+ travailleurs` : "des centaines de pros"} qui acceptent des missions payées rapidement.
            Flexible, légal, sécurisé.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white" asChild>
              <Link href="/register?role=worker">S&apos;inscrire comme pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-[#EAE6DF] hover:border-[#706E6A] text-[#1B1A18]" asChild>
              <Link href="/missions">Voir les missions →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why WorkOn for pros */}
      <WhyChooseBlock
        eyebrow="Pourquoi WorkOn"
        title="Du travail, vraiment simple."
        theme="light"
        items={[
          { icon: "💸", title: "Payé rapidement", desc: "Virement dès la fin de mission. Pas d'attente de 30 jours." },
          { icon: "📅", title: "Flexibilité totale", desc: "Tu choisis tes missions, tes horaires, ta ville." },
          { icon: "🔒", title: "Zéro risque", desc: "Paiement sécurisé via Stripe. Tu es protégé avant de commencer." },
          { icon: "⭐", title: "Bâtis ta réputation", desc: "Accumule des avis, monte en tier, accède aux meilleures missions." },
        ]}
      />

      {/* Sectors */}
      {sectors.length > 0 && (
        <section className="bg-white mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF]">
          <h2 className="font-heading text-xl font-bold mb-4 text-[#1B1A18]">Secteurs actifs</h2>
          <p className="text-sm text-[#706E6A] mb-5">Missions ouvertes par catégorie — mis à jour toutes les 2 minutes</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {sectors.map((s) => <SectorPill key={s.category} sector={s} />)}
          </div>
        </section>
      )}

      {/* Featured workers */}
      {workers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#1B1A18]">Profils en vedette</h2>
              <p className="text-sm text-[#706E6A] mt-1">Top travailleurs par missions complétées</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {workers.map((w) => <HeroWorkerCard key={w.id} worker={w} />)}
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="bg-white mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF]">
        <h2 className="font-heading text-xl font-bold mb-6 text-[#1B1A18]">Comment ça marche</h2>
        <ol className="space-y-4">
          {[
            { n: 1, title: "Crée ton profil en 2 min", desc: "Nom, secteur, ville. Photo optionnelle." },
            { n: 2, title: "Parcours les missions disponibles", desc: "Filtre par secteur et ville. Postule en 1 clic." },
            { n: 3, title: "Travaille et collecte tes avis", desc: "Chaque mission complétée améliore ton score et ta visibilité." },
            { n: 4, title: "Reçois ton paiement", desc: "Stripe débloque les fonds dès la confirmation. Rapide et sécurisé." },
          ].map((step) => (
            <li key={step.n} className="flex items-start gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#B5382A]/10 border border-[#B5382A]/20 flex items-center justify-center text-sm font-bold text-[#B5382A]">
                {step.n}
              </span>
              <div>
                <p className="font-semibold text-sm text-[#1B1A18]">{step.title}</p>
                <p className="text-xs text-[#706E6A] mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold mb-3 text-[#1B1A18]">Prêt à commencer ?</h2>
          <p className="text-[#706E6A] mb-6">Inscription gratuite. Première mission disponible immédiatement.</p>
          <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white" asChild>
            <Link href="/register?role=worker">Créer mon profil gratuitement</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#EAE6DF] bg-[#F9F8F5]">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-[#9C9A96]">
          <Link href="/" className="hover:text-[#706E6A]">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes.</p>
          <Link href="/employeurs" className="hover:text-[#706E6A]">Côté employeur →</Link>
        </div>
      </footer>
    </main>
  );
}
