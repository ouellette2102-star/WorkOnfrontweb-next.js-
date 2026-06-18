import Link from "next/link";
import {
  Phone,
  MapPin,
  ArrowRight,
  Check,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Sparkles,
  Bell,
  Search,
  Send,
  EyeOff,
  UtensilsCrossed,
  Home as HomeIcon,
  Leaf,
  Star,
  Wallet,
} from "lucide-react";
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
import { filterDisplayableReviews, shouldDisplayStat } from "@/lib/public-display-rules";

export const revalidate = 300; // ISR — 5 min

// ─── Palette identité RedPhone ───────────────────────────────────────────────
// Marine #0B1B2E · Halo bleu #2E7DFF · Rouge action #F0392B · Blanc · Sections claires #F6F8FB

// ─── Header ──────────────────────────────────────────────────────────────────

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1B3147] bg-[#0B1B2E]/[0.85] backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link href="/" className="text-white">
          <WorkOnWordmark size="md" pinClassName="text-[#F0392B]" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-[#9DB0C6]">
          <Link href="/pros" className="hover:text-white transition-colors">Travailleurs</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Clients</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link href="/login" className="text-white transition-opacity hover:opacity-80">Connexion</Link>
          <Link
            href="/register"
            className="rounded-[10px] bg-[#F0392B] px-4 py-2 font-medium text-white transition-colors hover:bg-[#D62E22]"
          >
            S&apos;inscrire
          </Link>
        </nav>
        <Link
          href="/register"
          className="md:hidden rounded-[10px] bg-[#F0392B] px-4 py-2 text-sm font-medium text-white"
        >
          S&apos;inscrire
        </Link>
      </div>
    </header>
  );
}

// ─── Hero — identité + aperçu produit ────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B1B2E]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px 460px at 82% 28%, rgba(46,125,255,0.16), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-24 md:pt-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#24405C] bg-[#0E2236] px-4 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#F0392B] opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F0392B]" />
              </span>
              Une ligne directe vers le travail instantané
            </span>

            <h1 className="mt-7 font-heading text-[2.9rem] leading-[1.02] tracking-[-0.035em] font-bold text-white md:text-[3.7rem]">
              Le travail
              <br />
              vient <span className="text-[#F0392B]">à toi.</span>
            </h1>

            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-[#A8BACD]">
              WorkOn relie les travailleurs autonomes du Québec aux clients qui
              cherchent leur service — en temps réel. Tu reçois les demandes, tu
              choisis. Tu gardes <span className="font-medium text-white">100&nbsp;%</span>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F0392B] px-7 py-4 text-[15px] font-medium text-white shadow-[0_14px_30px_-10px_rgba(240,57,43,0.6)] transition-all hover:bg-[#D62E22] hover:-translate-y-0.5"
              >
                Créer mon profil gratuit <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
              <Link
                href="/pros"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2E5680] bg-white/[0.04] px-6 py-4 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                Voir les pros
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3.5 flex-wrap">
              <div className="flex">
                {["bg-[#1E6FE0]", "bg-[#13273D]", "bg-[#243B54]"].map((bg, i) => (
                  <span
                    key={i}
                    className={`-ml-2.5 first:ml-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0B1B2E] ${bg} text-xs font-medium text-white`}
                  >
                    {["M", "G", "F"][i]}
                  </span>
                ))}
                <span className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0B1B2E] bg-[#F0392B] text-[13px] font-medium text-white">
                  +
                </span>
              </div>
              <p className="text-[13px] leading-tight text-[#9DB0C6]">
                Rejoins les premiers pros du Québec.
                <br />
                <span className="text-[#6E8299]">Conçu ici · Loi 25 · Paiement protégé.</span>
              </p>
            </div>
          </div>

          {/* Aperçu produit */}
          <div className="relative flex-shrink-0">
            <div className="absolute -top-3 right-2 z-10 inline-flex items-center gap-2.5 rounded-xl border border-[#2E5680] bg-[#0E2236] px-3.5 py-2.5 shadow-[0_16px_30px_-12px_rgba(0,0,0,0.7)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#34D27B]/[0.15]">
                <Check className="h-[15px] w-[15px] text-[#34D27B]" />
              </span>
              <span className="text-[12px] leading-tight text-white">
                Mission acceptée
                <br />
                <span className="font-medium text-[#34D27B]">+ 140&nbsp;$</span> · escrow
              </span>
            </div>

            <div className="w-[252px] rounded-[36px] border border-[#2E5680] bg-[#0A1726] p-2.5 shadow-[0_36px_70px_-24px_rgba(0,0,0,0.75)]">
              <div className="overflow-hidden rounded-[28px] border border-[#16304A] bg-[#0B1B2E]">
                <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9DB0C6]">
                    <MapPin className="h-3.5 w-3.5 text-[#F0392B]" /> Laval, QC
                  </span>
                  <span className="inline-flex items-center gap-2.5 text-[#9DB0C6]">
                    <Bell className="h-[15px] w-[15px]" />
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E6FE0] text-[11px] font-medium text-white">
                      M
                    </span>
                  </span>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-[16px] font-bold tracking-[-0.01em] text-white">3 demandes pour toi</p>
                  <p className="mt-0.5 text-[11.5px] text-[#6E8299]">à moins de 10 km · aujourd&apos;hui</p>
                </div>

                <div className="mx-3 mb-2.5 rounded-2xl border border-[#24405C] bg-[#13273D] p-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F0392B]/[0.15]">
                        <Sparkles className="h-3.5 w-3.5 text-[#F0392B]" />
                      </span>
                      Ménage résidentiel
                    </span>
                    <span className="text-[14px] font-bold text-white">140&nbsp;$</span>
                  </div>
                  <p className="mb-3 text-[11.5px] leading-snug text-[#9DB0C6]">
                    Grand ménage 3½ · samedi am · client vérifié
                  </p>
                  <div className="flex gap-2">
                    <span className="flex-1 rounded-[9px] bg-[#F0392B] py-2 text-center text-[12px] font-medium text-white">
                      Accepter
                    </span>
                    <span className="rounded-[9px] border border-[#2E5680] bg-white/[0.05] px-4 py-2 text-center text-[12px] text-[#cfe3ff]">
                      Voir
                    </span>
                  </div>
                </div>

                <div className="mx-3 mb-3 rounded-2xl border border-[#1B3147] bg-[#0E2236] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2E7DFF]/[0.16]">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-[#7FB0FF]" />
                      </span>
                      Aide-cuisine
                    </span>
                    <span className="text-[14px] font-bold text-white">110&nbsp;$</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-[#6E8299]">
                    Repentigny · vendredi soir · 5&nbsp;h
                  </p>
                </div>

                <div className="flex items-center justify-around border-t border-[#16304A] px-4 pt-2.5 pb-3.5">
                  <HomeIcon className="h-[18px] w-[18px] text-[#6E8299]" />
                  <MapPin className="h-[18px] w-[18px] text-[#6E8299]" />
                  <span className="-mt-5 flex h-[38px] w-[38px] items-center justify-center rounded-full border-4 border-[#0B1B2E] bg-[#F0392B] shadow-[0_8px_18px_-6px_rgba(240,57,43,0.7)]">
                    <Phone className="h-[18px] w-[18px] text-white" />
                  </span>
                  <Bell className="h-[18px] w-[18px] text-[#6E8299]" />
                  <span className="h-[18px] w-[18px] rounded-full border-2 border-[#6E8299]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de confiance */}
      <div className="relative border-t border-[#16304A] bg-[#0A1726]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-9 gap-y-3 px-5 py-5 text-[13px] text-[#9DB0C6]">
          <span className="text-[11px] uppercase tracking-[0.12em] text-[#56708C]">Conçu au Québec</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#34D27B]" /> Conforme Loi 25</span>
          <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-[#7FB0FF]" /> Argent protégé (escrow)</span>
          <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#F0392B]" /> Identité vérifiée</span>
        </div>
      </div>
    </section>
  );
}

// ─── Problème (section claire) ───────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    { icon: EyeOff, title: "Tu es invisible en ligne", desc: "Les clients qui cherchent ton service tombent sur tes concurrents. Pas toi." },
    { icon: Phone, title: "Le bouche-à-oreille s'essouffle", desc: "Quand les références ralentissent, tes revenus ralentissent. Aucune prévisibilité." },
    { icon: Wallet, title: "Le coût de la vie monte", desc: "Tu as le talent et le temps libre — il te manque juste un flux constant de contrats payants." },
  ];
  return (
    <section className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F0392B]">Le vrai problème</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-[#0E1B2A] md:text-[2.6rem]">
            Tu es excellent dans ton métier.
            <br />
            <span className="text-[#5A6B7E]">Ton téléphone ne sonne juste pas assez.</span>
          </h2>
        </div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {problems.map((p) => (
            <div key={p.title}>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0392B]/[0.08] text-[#F0392B]">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2.5 text-[19px] font-bold text-[#0E1B2A]">{p.title}</h3>
              <p className="text-[16px] leading-relaxed text-[#5A6B7E]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comment ça marche (section sombre) ──────────────────────────────────────

function HowItWorks() {
  const steps = [
    { num: "01", icon: BadgeCheck, title: "Crée ton profil", desc: "3 minutes. Ton métier, ta zone, tes disponibilités. Gratuit, sans carte." },
    { num: "02", icon: Search, title: "Reçois les demandes", desc: "Les clients de ta région publient leurs besoins. WorkOn te les envoie en temps réel." },
    { num: "03", icon: Send, title: "Accepte ce qui te convient", desc: "Tu choisis tes contrats. Tu fixes ton prix. Zéro patron, zéro horaire imposé." },
    { num: "04", icon: Wallet, title: "Sois payé, en sécurité", desc: "L'argent est protégé (escrow) jusqu'à la fin. Tu gardes 100 % de ton montant." },
  ];
  return (
    <section className="bg-[#0B1B2E]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7FB0FF]">Comment ça marche</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-white md:text-[2.6rem]">
            Du profil au paiement,
            <br />
            <span className="text-[#A8BACD]">sans friction.</span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num} className="rounded-2xl border border-[#1B3147] bg-[#0E2236] p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0392B]/[0.12] text-[#F0392B]">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-bold tracking-widest text-[#3C597A]">{s.num}</span>
              </div>
              <h3 className="mb-2.5 text-[17px] font-bold text-white">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#9DB0C6]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Différenciation (section claire) ────────────────────────────────────────

function Differentiation() {
  const notItems = [
    { label: "Une agence de placement", desc: "Tu restes 100 % autonome. Aucun lien d'emploi, aucune subordination." },
    { label: "Un annuaire en ligne", desc: "Ton profil n'est pas noyé dans une liste de 500 concurrents." },
    { label: "Un réseau social", desc: "Pas de likes, pas de followers, pas de contenu à produire." },
  ];
  return (
    <section className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F0392B]">Ce qui nous distingue</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-[#0E1B2A] md:text-[2.6rem]">
            Ni agence. Ni répertoire.
            <br />
            <span className="text-[#5A6B7E]">Un vrai marketplace de travail sur demande.</span>
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {notItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4 rounded-xl border border-[#E6EAF0] bg-white p-5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-[#9AA7B7]">
                  <EyeOff className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-bold text-[#0E1B2A] line-through decoration-[#C2CBD8]">{item.label}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#5A6B7E]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <div className="w-full rounded-2xl bg-[#0B1B2E] p-8 md:p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0392B]">
                <Phone className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-4 text-[24px] font-bold text-white">Ce que WorkOn est</h3>
              <p className="text-[18px] leading-relaxed text-[#A8BACD]">
                La ligne directe entre toi et les clients qui cherchent{" "}
                <span className="font-medium text-white">activement</span> ton service —
                et qui te les livre avant tes concurrents.
              </p>
              <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#24405C] bg-[#0E2236] px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#34D27B]" />
                <span className="text-[13px] font-medium text-[#34D27B]">Actif 24/7 dans ton secteur</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Secteurs (section sombre) ───────────────────────────────────────────────

function Sectors() {
  const cases = [
    { sector: "Ménage résidentiel", icon: Sparkles, tag: "Forte demande", desc: "Les propriétaires cherchent un service fiable chaque semaine. Capte ces demandes avant la concurrence." },
    { sector: "Aide-restauration", icon: UtensilsCrossed, tag: "En ce moment", desc: "Plonge, aide-cuisine, service : les restos manquent de bras les soirs achalandés." },
    { sector: "Entretien & petits travaux", icon: Leaf, tag: "Toute l'année", desc: "Pelouse, lavage, déneigement l'hiver, homme à tout faire — chaque saison amène ses contrats." },
  ];
  return (
    <section className="bg-[#0B1B2E]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7FB0FF]">Secteurs actifs au Québec</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-white md:text-[2.6rem]">
            Des contrats dans
            <br />
            <span className="text-[#A8BACD]">ton domaine.</span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {cases.map((c) => (
            <div key={c.sector} className="rounded-2xl border border-[#1B3147] bg-[#0E2236] p-7 transition-colors hover:border-[#2E5680]">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0392B]/[0.12] text-[#F0392B]">
                  <c.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#13273D] px-3 py-1 text-[11.5px] font-medium text-[#7FB0FF]">{c.tag}</span>
              </div>
              <h3 className="mb-2.5 text-[18px] font-bold text-white">{c.sector}</h3>
              <p className="text-[14px] leading-relaxed text-[#9DB0C6]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Profils en vedette (section claire) ─────────────────────────────────────

function WorkersSection({ workers }: { workers: FeaturedWorker[] }) {
  if (workers.length === 0) return null;
  return (
    <section className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F0392B]">Profils en vedette</p>
            <h2 className="font-heading text-[2rem] font-bold tracking-[-0.02em] text-[#0E1B2A] md:text-[2.4rem]">
              Des pros prêts à travailler
            </h2>
          </div>
          <Link href="/pros" className="hidden text-[14px] font-semibold text-[#F0392B] transition-opacity hover:opacity-80 md:inline-flex">
            Voir tous les profils →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {workers.map((w) => (
            <HeroWorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Confiance + avis (section sombre) ───────────────────────────────────────

function TrustSection({ stats, reviews }: { stats: PublicStats | null; reviews: FeaturedReview[] }) {
  const realStats: { value: string; label: string }[] = [];
  if (shouldDisplayStat(stats?.activeCities, "activeCities"))
    realStats.push({ value: `${stats!.activeCities}`, label: "villes au Québec" });
  if (shouldDisplayStat(stats?.openMissions, "openMissions"))
    realStats.push({ value: `${stats!.openMissions}`, label: "missions ouvertes" });
  // Faits (pas des compteurs gonflés) :
  realStats.push({ value: "100 %", label: "pour le travailleur" });
  realStats.push({ value: "15 %", label: "frais payés par le client" });

  return (
    <section className="bg-[#0B1B2E]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7FB0FF]">Confiance</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-white md:text-[2.6rem]">
            Conçu au Québec,
            <br />
            <span className="text-[#A8BACD]">pour les pros d&apos;ici.</span>
          </h2>
          <p className="mt-5 text-[17px] text-[#9DB0C6]">Conformité Loi 25 · service en français · paiement protégé.</p>
        </div>

        <div className="mb-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {realStats.map((f) => (
            <div key={f.label} className="rounded-2xl border border-[#1B3147] bg-[#0E2236] p-7 text-center">
              <p className="text-[2rem] font-bold tracking-tight text-[#F0392B] md:text-[2.4rem]">{f.value}</p>
              <p className="mt-2 text-[13.5px] font-medium text-[#9DB0C6]">{f.label}</p>
            </div>
          ))}
        </div>

        {reviews.length > 0 && (
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#1B3147] bg-[#0E2236] p-7">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-[18px] w-[18px] ${i < r.rating ? "fill-[#F6C84C] text-[#F6C84C]" : "text-[#24405C]"}`}
                    />
                  ))}
                </div>
                <p className="line-clamp-4 text-[15px] leading-relaxed text-white">«&nbsp;{r.comment}&nbsp;»</p>
                <div className="mt-5 flex items-center justify-between text-[13.5px] text-[#9DB0C6]">
                  <span className="font-semibold text-white">{r.authorName ?? "Client vérifié"}</span>
                  {r.workerName && <span className="text-[#6E8299]">pour {r.workerName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Tarification (section claire) ───────────────────────────────────────────

function Pricing() {
  const perks = [
    "Profil et page professionnelle inclus",
    "Demandes livrées en temps réel",
    "Tu fixes ton prix, tu choisis tes contrats",
    "Argent protégé jusqu'à la fin (escrow)",
    "Aucun frais mensuel · aucun contrat",
    "100 % autonome, zéro exclusivité",
  ];
  return (
    <section className="bg-[#F6F8FB]">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F0392B]">Tarification</p>
          <h2 className="font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-[#0E1B2A] md:text-[2.6rem]">
            Tu gardes 100 %.
            <br />
            <span className="text-[#5A6B7E]">Le client paie les frais de service.</span>
          </h2>
        </div>
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border-2 border-[#0B1B2E]/10 bg-white p-8 md:p-10">
            <div className="text-center">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#34A06A]">Inscription gratuite</p>
              <div className="mb-2 flex items-end justify-center">
                <span className="font-heading text-[4rem] font-bold leading-none tracking-tight text-[#0E1B2A]">0&nbsp;$</span>
              </div>
              <p className="text-[17px] text-[#5A6B7E]">pour toi. Les frais de service de 15&nbsp;% sont payés par le client.</p>
            </div>
            <div className="mt-8 space-y-3.5">
              {perks.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#34D27B]/[0.12]">
                    <Check className="h-3 w-3 text-[#2BA968]" />
                  </span>
                  <span className="text-[15px] text-[#0E1B2A]">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#F0392B] py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#D62E22]"
            >
              Créer mon profil gratuitement
            </Link>
            <p className="mt-3 text-center text-[12px] text-[#8A98A8]">Aucune carte de crédit requise</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Clients + CTA final (sombre) ────────────────────────────────────────

function EmployerCTA() {
  return (
    <section className="bg-[#0B1B2E]">
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-12">
        <div className="flex flex-col items-center justify-between gap-8 rounded-3xl border border-[#1B3147] bg-[#0E2236] p-10 md:flex-row md:p-14">
          <div className="max-w-lg">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7FB0FF]">Clients & entreprises</p>
            <h2 className="font-heading text-[1.9rem] font-bold text-white">Besoin de renfort qualifié&nbsp;?</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#9DB0C6]">
              Publie ton besoin gratuitement. Accède à des travailleurs autonomes vérifiés
              au Québec. Zéro commission côté client pendant le lancement.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#F0392B] px-9 py-4 text-[15px] font-medium text-white transition-colors hover:bg-[#D62E22]"
          >
            Publier un besoin <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#0B1B2E]">
      <div className="mx-auto max-w-6xl px-5 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl border border-[#2E5680] bg-[#0A1726] px-6 py-16 text-center"
          style={{ background: "radial-gradient(600px 300px at 50% 0%, rgba(46,125,255,0.18), #0A1726 70%)" }}
        >
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0392B] shadow-[0_16px_36px_-10px_rgba(240,57,43,0.6)]">
            <Phone className="h-8 w-8 text-white" />
          </span>
          <h2 className="mx-auto max-w-2xl font-heading text-[2rem] font-bold leading-tight tracking-[-0.02em] text-white md:text-[2.8rem]">
            Ton téléphone est sur le point
            <br />
            de <span className="text-[#F0392B]">sonner.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[18px] leading-relaxed text-[#A8BACD]">
            Inscription gratuite, aucun engagement. Tu paies seulement quand une demande
            devient un contrat — et tu gardes 100 %.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F0392B] px-10 py-5 text-[17px] font-medium text-white shadow-[0_18px_40px_-12px_rgba(240,57,43,0.6)] transition-all hover:bg-[#D62E22] hover:-translate-y-0.5"
          >
            Créer mon profil professionnel <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-[#6E8299]">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#34D27B]" /> Gratuit pour commencer</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#34D27B]" /> Aucun contrat</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#34D27B]" /> Paiement protégé</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[#16304A] bg-[#0A1726]">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="text-white">
            <WorkOnWordmark size="md" pinClassName="text-[#F0392B]" />
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-[14px] font-medium text-[#9DB0C6]">
            <Link href="/faq" className="transition-colors hover:text-white">FAQ</Link>
            <Link href="/pricing" className="transition-colors hover:text-white">Tarifs</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-white">Confidentialité</Link>
            <Link href="/legal/terms" className="transition-colors hover:text-white">Conditions</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#16304A] pt-6 text-[12px] text-[#6E8299] md:flex-row">
          <p>© 2026 WorkOn Inc. Tous droits réservés.</p>
          <p>Les travailleurs sont des prestataires autonomes, non des employés de WorkOn.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [statsRes, workersRes, reviewsRes] = await Promise.allSettled([
    getPublicStats(),
    getFeaturedWorkers(6),
    getFeaturedReviews(3),
  ]);

  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
  const workers = workersRes.status === "fulfilled" ? workersRes.value : [];
  const reviews = filterDisplayableReviews(
    reviewsRes.status === "fulfilled" ? reviewsRes.value : [],
  );

  return (
    <main className="min-h-screen bg-[#0B1B2E] text-white">
      <SiteHeader />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Differentiation />
      <Sectors />
      <WorkersSection workers={workers} />
      <TrustSection stats={stats} reviews={reviews} />
      <Pricing />
      <EmployerCTA />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}
