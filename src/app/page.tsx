import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/navigation/user-nav";
import {
  getPublicStats,
  getFeaturedWorkers,
  getFeaturedReviews,
  type PublicStats,
  type FeaturedWorker,
  type FeaturedReview,
} from "@/lib/public-api";

export const revalidate = 300; // ISR — 5 min

// ─── Design tokens ──────────────────────────────────────────────────────────
// Fond: #FAFAFA | Texte: #1A1A2E | Accent: #FF4D1C | Gris: #6B7280
// Creme: #F5F3EF | Vert confiance: #22C55E
// Typo: titres 48-64px bold | sous-titres 20-24px | corps 16-18px
// Espacement: 120px entre sections (py-[120px] = py-[7.5rem])

// ─── Header ─────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#FF4D1C] flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <span className="text-[#1A1A2E] font-bold text-lg tracking-tight">WorkOn</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#6B7280]">
          <Link href="/pros" className="hover:text-[#1A1A2E] transition-colors">Pour les pros</Link>
          <Link href="/employeurs" className="hover:text-[#1A1A2E] transition-colors">Employeurs</Link>
          <Link href="/pricing" className="hover:text-[#1A1A2E] transition-colors">Tarifs</Link>
        </nav>
        <UserNav />
      </div>
    </header>
  );
}

// ─── Section 1: Hero — Tension + Value Prop + CTA ───────────────────────────

function HeroSection({ stats }: { stats: PublicStats | null }) {
  return (
    <section className="bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-[7.5rem] md:pt-28">
        <div className="max-w-3xl">
          {/* Urgence + Social proof */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {stats && stats.openMissions > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#FF4D1C]/20 bg-[#FF4D1C]/5 px-4 py-1.5 text-sm text-[#FF4D1C] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#FF4D1C] animate-pulse" />
                {stats.openMissions} opportunites disponibles maintenant
              </span>
            )}
            {stats && stats.activeWorkers > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/5 px-4 py-1.5 text-sm text-[#22C55E] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                {stats.activeWorkers} professionnels inscrits
              </span>
            )}
          </div>

          <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.08] tracking-tight text-[#1A1A2E]">
            Les clients cherchent votre service{" "}
            <span className="text-[#FF4D1C]">en ce moment.</span>
            <br />
            <span className="text-[#6B7280] font-semibold">Ils ne vous trouvent pas.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-[#6B7280] max-w-2xl leading-relaxed">
            WorkOn capte les intentions d&apos;achat dans votre secteur et les transforme
            en opportunites concretes &mdash; livrees directement a vous.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white h-14 px-8 text-base font-semibold rounded-xl shadow-lg shadow-[#FF4D1C]/25 transition-all hover:shadow-xl hover:shadow-[#FF4D1C]/30 hover:-translate-y-0.5" asChild>
              <Link href="/register">Recevoir mes premieres opportunites</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 text-[#1A1A2E] hover:bg-gray-50 h-14 px-8 text-base rounded-xl" asChild>
              <Link href="/pros">Voir les professionnels</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-[#6B7280]/70">
            Inscription gratuite &middot; Aucun engagement &middot; Premiere opportunite en 48h
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Probleme — 3 pain points avec tension emotionnelle ──────────

function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ),
      title: "Pas de presence commerciale",
      desc: "Votre entreprise est invisible sur le web. Les clients qui cherchent votre service tombent sur vos concurrents.",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5a10.5 10.5 0 1 1-8.25-17.325" />
        </svg>
      ),
      title: "Dependance au bouche-a-oreille",
      desc: "Quand les recommandations ralentissent, votre chiffre d'affaires ralentit avec. Pas de systeme, pas de previsibilite.",
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: "Aucun systeme en place",
      desc: "Vous n'avez ni le temps, ni les outils, ni l'equipe pour generer un flux constant de nouvelles demandes.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Le probleme que personne ne regle</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Vous etes excellent dans votre metier.
            <br />
            <span className="text-[#6B7280]">Mais votre telephone ne sonne pas assez.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10 md:gap-14">
          {problems.map((p) => (
            <div key={p.title}>
              <div className="h-14 w-14 rounded-2xl bg-[#FF4D1C]/8 flex items-center justify-center text-[#FF4D1C] mb-5">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">{p.title}</h3>
              <p className="text-[#6B7280] leading-relaxed text-[17px]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Systeme WorkOn — 4 etapes visuelles ────────────────────────

function SystemSection() {
  const steps = [
    {
      num: "01",
      title: "Inscription",
      desc: "Creez votre profil professionnel en 3 minutes. Vos realisations, votre expertise, votre zone de service.",
      accent: "border-[#FF4D1C]/20 bg-[#FF4D1C]/5 text-[#FF4D1C]",
    },
    {
      num: "02",
      title: "Votre page commerciale",
      desc: "WorkOn genere automatiquement votre page professionnelle optimisee — votre vitrine commerciale qui travaille 24/7.",
      accent: "border-blue-200 bg-blue-50 text-blue-600",
    },
    {
      num: "03",
      title: "Capture de demande",
      desc: "Notre systeme detecte et capte les intentions d'achat dans votre secteur, sur les plateformes ou vos futurs clients expriment leurs besoins.",
      accent: "border-purple-200 bg-purple-50 text-purple-600",
    },
    {
      num: "04",
      title: "Opportunites livrees",
      desc: "Chaque demande qualifiee est livree directement sur votre telephone. Vous recevez le nom, le numero et le besoin exact du client.",
      accent: "border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E]",
    },
  ];

  return (
    <section className="bg-[#F5F3EF]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Comment WorkOn fonctionne</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Un systeme qui capte la demande
            <br />
            <span className="text-[#FF4D1C]">pendant que vous travaillez.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%+0.25rem)] w-[calc(100%-2rem)] h-[2px] bg-gradient-to-r from-gray-300 to-gray-200 z-0" />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-7 shadow-sm border border-gray-100 h-full">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl border ${s.accent} font-bold text-lg mb-5`}>
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">{s.title}</h3>
                <p className="text-[15px] text-[#6B7280] leading-relaxed">{s.desc}</p>
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
      label: "Un reseau social",
      desc: "Pas de likes, pas de followers, pas de contenu a produire.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Ce qui nous differencie</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Ni une agence. Ni un repertoire.
            <br />
            <span className="text-[#6B7280]">Un systeme de captation de demande.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Ce que WorkOn n'est pas */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-widest mb-6">Ce que WorkOn n&apos;est pas</h3>
            {notItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[#6B7280] text-sm font-bold mt-0.5">&#x2715;</span>
                <div>
                  <p className="font-bold text-[#1A1A2E] line-through decoration-[#6B7280]/40">{item.label}</p>
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ce que WorkOn est */}
          <div className="flex items-center">
            <div className="rounded-2xl bg-[#1A1A2E] p-8 md:p-10 w-full">
              <div className="h-14 w-14 rounded-2xl bg-[#FF4D1C] flex items-center justify-center mb-6">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ce que WorkOn est</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Un systeme de capture de demande qui identifie les clients qui
                cherchent <span className="text-[#FF4D1C] font-semibold">activement</span> votre
                service — et qui vous les livre avant vos concurrents.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <p className="text-sm text-[#22C55E] font-medium">Systeme actif 24/7 dans votre secteur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Cas d'usage — Secteurs actifs au Quebec ─────────────────────

function UseCasesSection() {
  const cases = [
    {
      sector: "Menage residentiel",
      desc: "Les proprietaires cherchent un service fiable chaque semaine. WorkOn capte ces demandes avant qu'elles atterrissent chez la concurrence.",
      demand: "Forte demande",
      icon: "🏠",
      borderColor: "border-blue-200 hover:border-blue-300",
      tagColor: "bg-blue-100 text-blue-700",
    },
    {
      sector: "Entretien paysager",
      desc: "Le printemps genere un pic de demande massif. Votre page professionnelle est prete avant la premiere tonte.",
      demand: "Pic saisonnier",
      icon: "🌿",
      borderColor: "border-green-200 hover:border-green-300",
      tagColor: "bg-green-100 text-green-700",
    },
    {
      sector: "Services saisonniers",
      desc: "Lavage de vitres, deneigement, nettoyage de gouttieres — chaque saison amene son lot d'opportunites. WorkOn les capte pour vous.",
      demand: "Toute l'annee",
      icon: "🔧",
      borderColor: "border-orange-200 hover:border-orange-300",
      tagColor: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <section className="bg-[#F5F3EF]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Secteurs actifs au Quebec</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Des opportunites dans votre
            <br />
            <span className="text-[#FF4D1C]">secteur d&apos;activite.</span>
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
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">{c.sector}</h3>
              <p className="text-[15px] text-[#6B7280] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        {/* Urgence — Places limitees */}
        <div className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[#FF4D1C] bg-[#FF4D1C]/5 border border-[#FF4D1C]/15 rounded-full px-5 py-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Places limitees par secteur et par ville — inscrivez-vous pendant qu&apos;il est temps
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Confiance — Chiffres + Avis + Badge Quebec ─────────────────

function TrustSection({ stats, reviews }: { stats: PublicStats | null; reviews: FeaturedReview[] }) {
  const figures = [
    { value: stats?.activeWorkers?.toLocaleString("fr-CA") ?? "100+", label: "Professionnels actifs" },
    { value: stats?.completedMissions?.toLocaleString("fr-CA") ?? "500+", label: "Missions completees" },
    { value: stats?.activeCities?.toString() ?? "10+", label: "Villes couvertes au Quebec" },
    { value: "15%", label: "Commission transparente" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Confiance</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Concu au Quebec,
            <br />
            <span className="text-[#6B7280]">pour les professionnels d&apos;ici.</span>
          </h2>
          <p className="mt-5 text-lg text-[#6B7280]">
            Conformite Loi 25. Service en francais. Infrastructure canadienne.
          </p>
        </div>

        {/* Chiffres cles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {figures.map((f) => (
            <div key={f.label} className="text-center p-7 rounded-2xl bg-[#FAFAFA] border border-gray-100">
              <p className="text-3xl md:text-4xl font-bold text-[#FF4D1C] tracking-tight">{f.value}</p>
              <p className="text-sm text-[#6B7280] mt-2 font-medium">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Avis verifies */}
        {reviews.length > 0 && (
          <>
            <h3 className="text-center text-sm font-semibold text-[#6B7280] uppercase tracking-widest mb-8">Ce qu&apos;ils disent</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-7">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? "text-yellow-500 text-lg" : "text-gray-200 text-lg"}>★</span>
                    ))}
                  </div>
                  <p className="text-[15px] text-[#1A1A2E] leading-relaxed line-clamp-4">&laquo;&nbsp;{r.comment}&nbsp;&raquo;</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-[#6B7280]">
                    <span className="font-semibold">{r.authorName ?? "Client verifie"}</span>
                    {r.workerName && <span className="text-[#6B7280]/60">pour {r.workerName}</span>}
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
    <section className="bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Profils en vedette</p>
            <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E]">Professionnels disponibles</h2>
            <p className="text-[#6B7280] mt-2 text-lg">Profils verifies &middot; donnees en temps reel</p>
          </div>
          <Link href="/pros" className="hidden md:inline-flex text-sm font-semibold text-[#FF4D1C] hover:text-[#E8441A] transition-colors">
            Voir tous les profils →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {workers.map((w) => {
            const initials = `${w.firstName[0]}${w.lastName[0]}`.toUpperCase();
            return (
              <Link
                key={w.id}
                href={`/p/${w.slug}`}
                className="group block rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#FF4D1C]/40 hover:shadow-lg hover:shadow-[#FF4D1C]/5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    {w.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.photoUrl} alt={w.firstName} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-[#FF4D1C]/10 border border-[#FF4D1C]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#FF4D1C]">{initials}</span>
                      </div>
                    )}
                    {(w.trustTier === "VERIFIED" || w.trustTier === "ELITE") && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#22C55E] border-2 border-white flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-[#1A1A2E] truncate group-hover:text-[#FF4D1C] transition-colors">
                      {w.firstName} {w.lastName[0]}.
                    </p>
                    {w.sector && <p className="text-sm text-[#6B7280] mt-0.5 truncate">{w.sector}</p>}
                    {w.city && <p className="text-xs text-[#6B7280]/60 mt-0.5">{w.city}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="text-sm font-bold text-[#1A1A2E]">{w.ratingAvg > 0 ? w.ratingAvg.toFixed(1) : "Nouveau"}</span>
                    {w.ratingCount > 0 && <span className="text-sm text-[#6B7280]">({w.ratingCount})</span>}
                  </div>
                  <span className="text-sm text-[#6B7280]">{w.completedMissions} mission{w.completedMissions !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 text-center md:hidden">
          <Link href="/pros" className="text-sm font-semibold text-[#FF4D1C]">Voir tous les profils →</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Pricing transparent ─────────────────────────────────────────

function PricingSection() {
  return (
    <section className="bg-[#F5F3EF]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Tarification</p>
          <h2 className="text-3xl md:text-[2.75rem] font-bold text-[#1A1A2E] leading-tight">
            Transparent. Simple.
            <br />
            <span className="text-[#6B7280]">Vous payez quand vous gagnez.</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl bg-white border-2 border-[#FF4D1C]/20 p-8 md:p-10 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wide mb-2">Inscription gratuite</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-6xl font-bold text-[#1A1A2E] tracking-tight">15%</span>
              </div>
              <p className="text-[#6B7280] text-lg">de commission par mission completee</p>
            </div>

            <div className="mt-8 space-y-4">
              {[
                "Page professionnelle optimisee",
                "Diffusion automatique a votre clientele cible",
                "Opportunites livrees sur votre telephone",
                "Paiement securise par Stripe",
                "Aucun frais mensuel fixe",
                "Aucun contrat ni exclusivite",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-[#1A1A2E]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button className="w-full bg-[#FF4D1C] hover:bg-[#E8441A] text-white h-14 text-base font-semibold rounded-xl shadow-lg shadow-[#FF4D1C]/20" asChild>
                <Link href="/register">Creer mon profil gratuitement</Link>
              </Button>
              <p className="text-center text-xs text-[#6B7280] mt-3">
                Aucune carte de credit requise
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
        <div className="rounded-3xl bg-gradient-to-br from-[#FF4D1C]/5 via-[#FF4D1C]/8 to-[#FF4D1C]/5 border border-[#FF4D1C]/15 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-lg">
            <p className="text-sm font-semibold text-[#FF4D1C] uppercase tracking-widest mb-4">Employeurs</p>
            <h2 className="text-3xl font-bold text-[#1A1A2E]">Vous cherchez du renfort qualifie?</h2>
            <p className="mt-4 text-lg text-[#6B7280] leading-relaxed">
              Zero commission pendant le lancement. Acces a{" "}
              {stats?.activeWorkers
                ? `${stats.activeWorkers.toLocaleString("fr-CA")} travailleurs verifies`
                : "des centaines de travailleurs verifies"}{" "}
              au Quebec.
            </p>
          </div>
          <Button size="lg" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white h-14 px-10 text-base font-semibold rounded-xl flex-shrink-0 shadow-lg shadow-[#FF4D1C]/20" asChild>
            <Link href="/employeurs">Decouvrir l&apos;offre employeur →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: CTA Final — Conversion ──────────────────────────────────────

function CTASection() {
  return (
    <section className="bg-[#1A1A2E]">
      <div className="mx-auto max-w-6xl px-4 py-[7.5rem]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Commencez a recevoir des
            <br />
            opportunites <span className="text-[#FF4D1C]">cette semaine.</span>
          </h2>
          <p className="mt-8 text-xl text-white/60 max-w-xl mx-auto leading-relaxed">
            Inscription gratuite. Aucun engagement.
            <br />
            Vous payez uniquement quand une demande se transforme en contrat.
          </p>
          <div className="mt-10">
            <Button size="lg" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white h-16 px-12 text-lg font-semibold rounded-xl shadow-2xl shadow-[#FF4D1C]/30 transition-all hover:shadow-[#FF4D1C]/40 hover:-translate-y-0.5" asChild>
              <Link href="/register">Creer mon profil professionnel</Link>
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
              Paiement securise
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
    <footer className="bg-[#FAFAFA] border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#FF4D1C] flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="text-[#1A1A2E] font-bold tracking-tight">WorkOn</span>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-[#6B7280] font-medium">
            <Link href="/faq" className="hover:text-[#1A1A2E] transition-colors">FAQ</Link>
            <Link href="/pricing" className="hover:text-[#1A1A2E] transition-colors">Tarifs</Link>
            <Link href="/legal/privacy" className="hover:text-[#1A1A2E] transition-colors">Confidentialite</Link>
            <Link href="/legal/terms" className="hover:text-[#1A1A2E] transition-colors">Conditions</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <p>&copy; 2026 WorkOn Inc. Tous droits reserves.</p>
          <p>Les travailleurs sont des prestataires autonomes, non des employes de WorkOn.</p>
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
    <main className="min-h-screen bg-[#FAFAFA] text-[#1A1A2E]">
      <Header />
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
