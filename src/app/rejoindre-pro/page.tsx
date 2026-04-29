import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { HeroWorkerCard } from "@/components/worker/hero-worker-card";
import { WhyChooseBlock } from "@/components/marketing/why-choose-block";
import { getFeaturedWorkers, getSectorStats, type SectorStat } from "@/lib/public-api";

/**
 * Worker recruitment landing — `/rejoindre-pro`.
 *
 * QA report C3 / Sprint 2: this content used to live at `/pros`,
 * which made `/pros` a recruitment page rather than a public list of
 * pros. Sprint 2 splits the two:
 *   - `/pros`         → browsable list of pros to book (refactored
 *                       in Bloc 2C)
 *   - `/rejoindre-pro`→ this page (recruitment funnel)
 *
 * The bottom-nav "Pros" item targets `/pros` so a CLIENT looking for
 * a worker no longer lands on a "S'inscrire comme pro" page. The
 * worker-recruitment funnel keeps living, just at the right URL.
 */

export const metadata: Metadata = {
  title: "Rejoindre WorkOn — Trouve des missions, travaille quand tu veux",
  description:
    "Rejoins WorkOn et accède à des missions payées rapidement, à des clients vérifiés et à un paiement sécurisé Stripe. Inscription gratuite, légal au Québec.",
  alternates: { canonical: "/rejoindre-pro" },
};

export const revalidate = 120; // ISR — 2 min

// ─── Sector Pill ────────────────────────────────────────────────────────────

function SectorPill({ sector }: { sector: SectorStat }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-workon-border bg-white px-4 py-3">
      <span className="text-sm font-medium truncate text-workon-ink">{sector.category}</span>
      <div className="flex items-center gap-3 text-xs text-workon-gray flex-shrink-0 ml-2">
        <span>{sector.workerCount} pros</span>
        <span>·</span>
        <span>{sector.missionCount} missions</span>
      </div>
    </div>
  );
}

// QA report P7: don't expose a tiny worker count ("Rejoins 2+
// travailleurs"). Use a qualitative phrase until the marketplace has
// crossed the credibility threshold.
const CREDIBILITY_THRESHOLD = 50;

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function RejoindreProPage() {
  const [workersRes, sectorsRes] = await Promise.allSettled([
    getFeaturedWorkers(9),
    getSectorStats(),
  ]);

  const workers = workersRes.status === "fulfilled" ? workersRes.value : [];
  const sectors = sectorsRes.status === "fulfilled" ? sectorsRes.value.slice(0, 8) : [];

  const proofPhrase =
    workers.length >= CREDIBILITY_THRESHOLD
      ? `Rejoins ${workers.length}+ travailleurs`
      : "Rejoins une communauté de travailleurs québécois";

  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-workon-border">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-workon-accent/30 bg-workon-accent/10 px-3 py-1 text-xs text-workon-accent mb-5">
            ⚡ Inscription gratuite — payé dès ce soir
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouve des missions.<br />
            <span className="text-workon-accent">Travaille quand tu veux.</span>
          </h1>
          <p className="mt-4 text-workon-gray text-lg leading-relaxed">
            {proofPhrase} qui acceptent des missions payées rapidement.
            Flexible, légal, sécurisé.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-workon-primary hover:bg-workon-primary-hover text-white" asChild>
              <Link href="/register?role=worker">S&apos;inscrire comme pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-workon-border hover:border-workon-gray text-workon-ink" asChild>
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
        <section className="bg-white mx-auto max-w-6xl px-4 py-10 border-b border-workon-border">
          <h2 className="font-heading text-xl font-bold mb-4 text-workon-ink">Secteurs actifs</h2>
          <p className="text-sm text-workon-gray mb-5">Missions ouvertes par catégorie — mis à jour toutes les 2 minutes</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {sectors.map((s) => <SectorPill key={s.category} sector={s} />)}
          </div>
        </section>
      )}

      {/* Featured workers */}
      {workers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-workon-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-workon-ink">Profils en vedette</h2>
              <p className="text-sm text-workon-gray mt-1">Top travailleurs par missions complétées</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {workers.map((w) => <HeroWorkerCard key={w.id} worker={w} />)}
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="bg-white mx-auto max-w-6xl px-4 py-10 border-b border-workon-border">
        <h2 className="font-heading text-xl font-bold mb-6 text-workon-ink">Comment ça marche</h2>
        <ol className="space-y-4">
          {[
            { n: 1, title: "Crée ton profil en 2 min", desc: "Nom, secteur, ville. Photo optionnelle." },
            { n: 2, title: "Parcours les missions disponibles", desc: "Filtre par secteur et ville. Postule en 1 clic." },
            { n: 3, title: "Travaille et collecte tes avis", desc: "Chaque mission complétée améliore ton score et ta visibilité." },
            { n: 4, title: "Reçois ton paiement", desc: "Stripe débloque les fonds dès la confirmation. Rapide et sécurisé." },
          ].map((step) => (
            <li key={step.n} className="flex items-start gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-workon-accent/10 border border-workon-accent/20 flex items-center justify-center text-sm font-bold text-workon-accent">
                {step.n}
              </span>
              <div>
                <p className="font-semibold text-sm text-workon-ink">{step.title}</p>
                <p className="text-xs text-workon-gray mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold mb-3 text-workon-ink">Prêt à commencer ?</h2>
          <p className="text-workon-gray mb-6">Inscription gratuite. Première mission disponible immédiatement.</p>
          <Button size="lg" className="bg-workon-primary hover:bg-workon-primary-hover text-white" asChild>
            <Link href="/register?role=worker">Créer mon profil gratuitement</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-workon-border bg-workon-bg">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-workon-muted">
          <Link href="/" className="hover:text-workon-gray">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes.</p>
          <Link href="/pricing" className="hover:text-workon-gray">Côté client →</Link>
        </div>
      </footer>
    </main>
  );
}
