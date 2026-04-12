import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { HeroWorkerCard } from "@/components/worker/hero-worker-card";
import {
  getPublicStats,
  getFeaturedWorkers,
  getFeaturedReviews,
  type PublicStats,
  type FeaturedWorker,
  type FeaturedReview,
} from "@/lib/public-api";

export const revalidate = 300; // ISR — 5 min

// ─── Design tokens (emergent) ───────────────────────────────────────────────
// Fond: #F9F8F5 (oatmeal) | Texte: #1B1A18 (ink) | Accent: #B5382A (terracotta)
// Hover: #9A2F23 | Gris: #706E6A (warm gray) | Crème: #F0EDE8
// Bordures: #EAE6DF | Vert confiance: #22C55E | Forêt: #134021
// Gold: #D4922A | Typo: titres font-heading 48-64px bold
// Espacement: 120px entre sections (py-[120px] = py-[7.5rem])

// Header now lives in <MarketingHeader theme="light" /> — see PR #39.

// ─── Section 1: Hero — Tension + Value Prop + CTA ───────────────────────────

function HeroSection({ stats }: { stats: PublicStats | null }) {
  return (
    <section className="bg-[#F9F8F5]">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-[7.5rem] md:pt-28">
        <div className="max-w-3xl">
          {/* Urgence + Social proof */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {stats && stats.openMissions > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#B5382A]/20 bg-[#B5382A]/5 px-4 py-1.5 text-sm text-[#B5382A] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#B5382A] animate-pulse" />
                {stats.openMissions} opportunités disponibles maintenant
              </span>
            )}
            {stats && stats.activeWorkers > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/5 px-4 py-1.5 text-sm text-[#22C55E] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                {stats.activeWorkers} professionnels inscrits
              </span>
            )}
          </div>

          <h1 className="font-heading text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.08] tracking-tight text-[#1B1A18]">
            Les clients cherchent votre service{" "}
            <span className="text-[#B5382A]">en ce moment.</span>
            <br />
            <span className="text-[#706E6A] font-semibold">Ils ne vous trouvent pas.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-[#706E6A] max-w-2xl leading-relaxed">
            WorkOn capte les intentions d&apos;achat dans votre secteur et les transforme
            en opportunités concrètes &mdash; livrées directement a vous.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white h-14 px-8 text-base font-semibold rounded-xl shadow-lg shadow-[#134021]/25 transition-all hover:shadow-xl hover:shadow-[#134021]/30 hover:-translate-y-0.5" asChild>
              <Link href="/register">Recevoir mes premières opportunités</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-[#EAE6DF] text-[#1B1A18] hover:bg-[#F9F8F5] h-14 px-8 text-base rounded-xl" asChild>
              <Link href="/pros">Voir les professionnels</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-[#706E6A]/70">
            Inscription gratuite &middot; Aucun engagement &middot; Premières opportunités en temps réel
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Problème — 3 pain points avec tension émotionnelle ─────────

function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ),
      title: "Pas de présence commerciale",
      desc: "Votre entreprise est invisible sur le web. Les clients qui cherchent votre service tombent sur vos concurrents.",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5a10.5 10.5 0 1 1-8.25-17.325" />
        </svg>
      ),
      title: "Dépendance au bouche-a-oreille",
      desc: "Quand les recommandations ralentissent, votre chiffre d'affaires ralentit avec. Pas de système, pas de prévisibilité.",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: "Aucun système en place",
      desc: "Vous n'avez ni le temps, ni les outils, ni l'équipe pour générer un flux constant de nouvelles demandes.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Le problème que personne ne règle</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Vous êtes excellent dans votre métier.
            <br />
            <span className="text-[#706E6A]">Mais votre téléphone ne sonne pas assez.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10 md:gap-14">
          {problems.map((p) => (
            <div key={p.title}>
              <div className="h-14 w-14 rounded-2xl bg-[#B5382A]/8 flex items-center justify-center text-[#B5382A] mb-5">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1B1A18] mb-3">{p.title}</h3>
              <p className="text-[#706E6A] leading-relaxed text-[17px]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Système WorkOn — 4 étapes visuelles ───────────────────────

function SystemSection() {
  const steps = [
    {
      num: "01",
      title: "Inscription",
      desc: "Créez votre profil professionnel en 3 minutes. Vos réalisations, votre expertise, votre zone de service.",
      accent: "border-[#B5382A]/20 bg-[#B5382A]/5 text-[#B5382A]",
    },
    {
      num: "02",
      title: "Votre page commerciale",
      desc: "WorkOn génère automatiquement votre page professionnelle optimisée — votre vitrine commerciale qui travaille 24/7.",
      accent: "border-[#134021]/20 bg-[#134021]/5 text-[#134021]",
    },
    {
      num: "03",
      title: "Capture de demande",
      desc: "Notre système détecte et capte les intentions d'achat dans votre secteur, sur les plateformes où vos futurs clients expriment leurs besoins.",
      accent: "border-[#D4922A]/20 bg-[#D4922A]/5 text-[#D4922A]",
    },
    {
      num: "04",
      title: "Opportunités livrées",
      desc: "Chaque demande qualifiée est livrée directement sur votre téléphone. Vous recevez le nom, le numero et le besoin exact du client.",
      accent: "border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E]",
    },
  ];

  return (
    <section className="bg-[#F0EDE8]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Comment WorkOn fonctionne</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Un système qui capte la demande
            <br />
            <span className="text-[#B5382A]">pendant que vous travaillez.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%+0.25rem)] w-[calc(100%-2rem)] h-[2px] bg-gradient-to-r from-[#EAE6DF] to-[#EAE6DF] z-0" />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-7 shadow-card border border-[#EAE6DF] h-full">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl border ${s.accent} font-bold text-lg mb-5`}>
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-[#1B1A18] mb-3">{s.title}</h3>
                <p className="text-[15px] text-[#706E6A] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Differenciation — Ce que WorkOn n'est pas / Ce qu'il est ────

function DifferentiationSection() {
  const notItems = [
    {
      label: "Une agence marketing",
      desc: "Pas de contrat annuel, pas de frais mensuels fixes, pas de promesses vagues.",
    },
    {
      label: "Un annuaire en ligne",
      desc: "Votre profil n'est pas noye dans une liste de 500 concurrents.",
    },
    {
      label: "Un réseau social",
      desc: "Pas de likes, pas de followers, pas de contenu à produire.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Ce qui nous différencie</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Ni une agence. Ni un répertoire.
            <br />
            <span className="text-[#706E6A]">Un système de captation de demande.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Ce que WorkOn n'est pas */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#706E6A] uppercase tracking-widest mb-6">Ce que WorkOn n&apos;est pas</h3>
            {notItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 rounded-xl bg-[#F9F8F5] border border-[#EAE6DF]">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#EAE6DF] flex items-center justify-center text-[#706E6A] text-sm font-bold mt-0.5">&#x2715;</span>
                <div>
                  <p className="font-bold text-[#1B1A18] line-through decoration-[#706E6A]/40">{item.label}</p>
                  <p className="text-sm text-[#706E6A] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ce que WorkOn est */}
          <div className="flex items-center">
            <div className="rounded-2xl bg-[#1B1A18] p-8 md:p-10 w-full">
              <div className="h-14 w-14 rounded-2xl bg-[#B5382A] flex items-center justify-center mb-6">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ce que WorkOn est</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Un système de capture de demande qui identifie les clients qui
                cherchent <span className="text-[#B5382A] font-semibold">activement</span> votre
                service — et qui vous les livre avant vos concurrents.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <p className="text-sm text-[#22C55E] font-medium">Système actif 24/7 dans votre secteur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Cas d'usage — Secteurs actifs au Québec ─────────────────────

function UseCasesSection() {
  const cases = [
    {
      sector: "Ménage résidentiel",
      desc: "Les propriétaires cherchent un service fiable chaque semaine. WorkOn capte ces demandes avant qu'elles atterrissent chez la concurrence.",
      demand: "Forte demande",
      icon: "🏠",
      borderColor: "border-[#134021]/20 hover:border-[#134021]/30",
      tagColor: "bg-[#134021]/10 text-[#134021]",
    },
    {
      sector: "Entretien paysager",
      desc: "Le printemps génère un pic de demande massif. Votre page professionnelle est prete avant la premiere tonte.",
      demand: "Pic saisonnier",
      icon: "🌿",
      borderColor: "border-[#22C55E]/20 hover:border-[#22C55E]/30",
      tagColor: "bg-[#22C55E]/10 text-[#22C55E]",
    },
    {
      sector: "Services saisonniers",
      desc: "Lavage de vitres, déneigement, nettoyage de gouttières — chaque saison amène son lot d'opportunités. WorkOn les capte pour vous.",
      demand: "Toute l'année",
      icon: "🔧",
      borderColor: "border-[#D4922A]/20 hover:border-[#D4922A]/30",
      tagColor: "bg-[#D4922A]/10 text-[#D4922A]",
    },
  ];

  return (
    <section className="bg-[#F0EDE8]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Secteurs actifs au Québec</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Des opportunités dans votre
            <br />
            <span className="text-[#B5382A]">secteur d&apos;activité.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.sector} className={`rounded-2xl border-2 bg-white p-7 transition-all ${c.borderColor}`}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-3xl">{c.icon}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.tagColor}`}>
                  {c.demand}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1B1A18] mb-3">{c.sector}</h3>
              <p className="text-[15px] text-[#706E6A] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        {/* Urgence — Places limitées */}
        <div className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[#B5382A] bg-[#B5382A]/5 border border-[#B5382A]/15 rounded-full px-5 py-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Places limitées par secteur et par ville — inscrivez-vous pendant qu&apos;il est temps
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Confiance — Chiffres + Avis + Badge Québec ─────────────────

function TrustSection({ stats, reviews }: { stats: PublicStats | null; reviews: FeaturedReview[] }) {
  const figures = [
    { value: stats?.activeWorkers?.toLocaleString("fr-CA") ?? "100+", label: "Professionnels actifs" },
    { value: stats?.completedMissions?.toLocaleString("fr-CA") ?? "500+", label: "Missions complétées" },
    { value: stats?.activeCities?.toString() ?? "10+", label: "Villes couvertes au Québec" },
    { value: "15%", label: "Commission transparente" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Confiance</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Conçu au Québec,
            <br />
            <span className="text-[#706E6A]">pour les professionnels d&apos;ici.</span>
          </h2>
          <p className="mt-5 text-lg text-[#706E6A]">
            Conformité Loi 25. Service en français. Infrastructure canadienne.
          </p>
        </div>

        {/* Chiffres cles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {figures.map((f) => (
            <div key={f.label} className="text-center p-7 rounded-2xl bg-[#F9F8F5] border border-[#EAE6DF]">
              <p className="text-3xl md:text-4xl font-bold text-[#B5382A] tracking-tight">{f.value}</p>
              <p className="text-sm text-[#706E6A] mt-2 font-medium">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Avis vérifiés */}
        {reviews.length > 0 && (
          <>
            <h3 className="text-center text-sm font-semibold text-[#706E6A] uppercase tracking-widest mb-8">Ce qu&apos;ils disent</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#EAE6DF] bg-[#F9F8F5] p-7">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? "text-yellow-500 text-lg" : "text-[#EAE6DF] text-lg"}>★</span>
                    ))}
                  </div>
                  <p className="text-[15px] text-[#1B1A18] leading-relaxed line-clamp-4">&laquo;&nbsp;{r.comment}&nbsp;&raquo;</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-[#706E6A]">
                    <span className="font-semibold">{r.authorName ?? "Client vérifié"}</span>
                    {r.workerName && <span className="text-[#706E6A]/60">pour {r.workerName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Section 6b: Featured Workers ───────────────────────────────────────────

function WorkersSection({ workers }: { workers: FeaturedWorker[] }) {
  if (workers.length === 0) return null;

  return (
    <section className="bg-[#F9F8F5]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Profils en vedette</p>
            <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18]">Professionnels disponibles</h2>
            <p className="text-[#706E6A] mt-2 text-lg">Profils vérifiés &middot; données en temps réel</p>
          </div>
          <Link href="/pros" className="hidden md:inline-flex text-sm font-semibold text-[#B5382A] hover:text-[#9A2F23] transition-colors">
            Voir tous les profils →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {workers.map((w) => (
            <HeroWorkerCard key={w.id} worker={w} />
          ))}
        </div>
        <div className="mt-10 text-center md:hidden">
          <Link href="/pros" className="text-sm font-semibold text-[#B5382A]">Voir tous les profils →</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Pricing transparent ─────────────────────────────────────────

function PricingSection() {
  return (
    <section className="bg-[#F0EDE8]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Tarification</p>
          <h2 className="font-heading text-3xl md:text-[2.75rem] font-bold text-[#1B1A18] leading-tight">
            Transparent. Simple.
            <br />
            <span className="text-[#706E6A]">Vous payez quand vous gagnez.</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl bg-white border-2 border-[#B5382A]/20 p-8 md:p-10 shadow-card">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wide mb-2">Inscription gratuite</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-6xl font-bold text-[#1B1A18] tracking-tight">15%</span>
              </div>
              <p className="text-[#706E6A] text-lg">de commission par mission complétée</p>
            </div>

            <div className="mt-8 space-y-4">
              {[
                "Page professionnelle optimisée",
                "Diffusion automatique à votre clientèle cible",
                "Opportunités livrées sur votre téléphone",
                "Paiement sécurisé par Stripe",
                "Aucun frais mensuel fixe",
                "Aucun contrat ni exclusivité",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-[#1B1A18]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button className="w-full bg-[#134021] hover:bg-[#0F3319] text-white h-14 text-base font-semibold rounded-xl shadow-lg shadow-[#134021]/20" asChild>
                <Link href="/register">Créer mon profil gratuitement</Link>
              </Button>
              <p className="text-center text-xs text-[#706E6A] mt-3">
                Aucune carte de crédit requise
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 8: Employer CTA ────────────────────────────────────────────────

function EmployerSection({ stats }: { stats: PublicStats | null }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="rounded-3xl bg-gradient-to-br from-[#B5382A]/5 via-[#B5382A]/8 to-[#B5382A]/5 border border-[#B5382A]/15 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-lg">
            <p className="text-sm font-semibold text-[#B5382A] uppercase tracking-widest mb-4">Employeurs</p>
            <h2 className="font-heading text-3xl font-bold text-[#1B1A18]">Vous cherchez du renfort qualifié?</h2>
            <p className="mt-4 text-lg text-[#706E6A] leading-relaxed">
              Zéro commission pendant le lancement. Accès à{" "}
              {stats?.activeWorkers
                ? `${stats.activeWorkers.toLocaleString("fr-CA")} travailleurs vérifiés`
                : "des centaines de travailleurs vérifiés"}{" "}
              au Québec.
            </p>
          </div>
          <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white h-14 px-10 text-base font-semibold rounded-xl flex-shrink-0 shadow-lg shadow-[#134021]/20" asChild>
            <Link href="/employeurs">Découvrir l&apos;offre employeur →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: CTA Final — Conversion ──────────────────────────────────────

function CTASection() {
  return (
    <section className="bg-[#134021]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight">
            Commencez à recevoir des
            <br />
            opportunités <span className="text-[#B5382A]">cette semaine.</span>
          </h2>
          <p className="mt-8 text-xl text-white/60 max-w-xl mx-auto leading-relaxed">
            Inscription gratuite. Aucun engagement.
            <br />
            Vous payez uniquement quand une demande se transforme en contrat.
          </p>
          <div className="mt-10">
            <Button size="lg" className="bg-[#B5382A] hover:bg-[#9A2F23] text-white h-16 px-12 text-lg font-semibold rounded-xl shadow-2xl shadow-[#B5382A]/30 transition-all hover:shadow-[#B5382A]/40 hover:-translate-y-0.5" asChild>
              <Link href="/register">Créer mon profil professionnel</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Gratuit pour commencer
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Aucun contrat
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Paiement sécurisé
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#F9F8F5] border-t border-[#EAE6DF]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-[#1B1A18]">
            <WorkOnWordmark size="md" />
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-[#706E6A] font-medium">
            <Link href="/faq" className="hover:text-[#1B1A18] transition-colors">FAQ</Link>
            <Link href="/pricing" className="hover:text-[#1B1A18] transition-colors">Tarifs</Link>
            <Link href="/legal/privacy" className="hover:text-[#1B1A18] transition-colors">Confidentialité</Link>
            <Link href="/legal/terms" className="hover:text-[#1B1A18] transition-colors">Conditions</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-[#EAE6DF] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#706E6A]">
          <p>&copy; 2026 WorkOn Inc. Tous droits réservés.</p>
          <p>Les travailleurs sont des prestataires autonomes, non des employés de WorkOn.</p>
        </div>
      </div>
    </footer>
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
    <main className="min-h-screen bg-[#F9F8F5] text-[#1B1A18]">
      <MarketingHeader theme="light" />
      <HeroSection stats={stats} />
      <ProblemSection />
      <SystemSection />
      <DifferentiationSection />
      <UseCasesSection />
      <WorkersSection workers={workers} />
      <TrustSection stats={stats} reviews={reviews} />
      <PricingSection />
      <EmployerSection stats={stats} />
      <CTASection />
      <Footer />
    </main>
  );
}
