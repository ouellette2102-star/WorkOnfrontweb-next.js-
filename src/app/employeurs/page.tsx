import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { WhyChooseBlock } from "@/components/marketing/why-choose-block";
import { getPublicStats, getFeaturedReviews, getSectorStats, type PublicStats, type FeaturedReview, type SectorStat } from "@/lib/public-api";

export const revalidate = 120; // ISR — 2 min

// Header now lives in <MarketingHeader theme="light" /> — see PR #39.

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#EAE6DF] bg-white p-6 text-center shadow-card">
      <p className="text-3xl font-black text-[#B5382A]">{value}</p>
      <p className="text-sm font-medium mt-1 text-[#706E6A]">{label}</p>
      {sub && <p className="text-xs text-[#9C9A96] mt-0.5">{sub}</p>}
    </div>
  );
}

function ReviewCard({ r }: { r: FeaturedReview }) {
  return (
    <div className="rounded-2xl border border-[#EAE6DF] bg-white p-5 shadow-card">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < r.rating ? "text-yellow-400" : "text-[#EAE6DF]"}>★</span>
        ))}
      </div>
      <p className="text-sm text-[#1B1A18] leading-relaxed line-clamp-4">&ldquo;{r.comment}&rdquo;</p>
      <div className="mt-4 flex items-center justify-between text-xs text-[#706E6A]">
        <span>{r.authorName ?? "Employeur anonyme"}</span>
        {r.workerName && (
          <span className="text-[#B5382A]/60">Pro : {r.workerName}</span>
        )}
      </div>
    </div>
  );
}

function SectorRow({ s }: { s: SectorStat }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#EAE6DF] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-[#1B1A18]">{s.category}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-[#706E6A] flex-shrink-0">
        <span className="text-[#22C55E] font-medium">{s.workerCount} pros dispo</span>
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
    <main className="min-h-screen bg-[#F9F8F5] text-[#1B1A18]">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 border-b border-[#EAE6DF]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#134021]/20 bg-[#134021]/10 px-3 py-1 text-xs text-[#134021] mb-5">
            🚀 0% commission pendant le lancement
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Trouvez un renfort qualifié<br />
            <span className="text-[#B5382A]">en moins de 10 minutes.</span>
          </h1>
          <p className="mt-4 text-[#706E6A] text-lg leading-relaxed">
            Publiez votre mission, recevez des candidatures de travailleurs vérifiés.
            Paiement sécurisé, couverture légale incluse.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white" asChild>
              <Link href="/register?role=employer">Publier ma première mission</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-[#EAE6DF] hover:border-[#1B1A18]/20 text-[#1B1A18]" asChild>
              <Link href="/pros">Voir les travailleurs →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF] bg-white">
          <h2 className="font-heading text-xl font-bold mb-6">La plateforme en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Travailleurs actifs" value={stats.activeWorkers.toLocaleString("fr-CA")} sub="profils vérifiés" />
            <StatCard label="Missions complétées" value={stats.completedMissions.toLocaleString("fr-CA")} />
            <StatCard label="Missions ouvertes" value={stats.openMissions.toLocaleString("fr-CA")} sub="disponibles maintenant" />
            <StatCard label="Secteurs couverts" value={String(stats.sectorCount)} />
          </div>
        </section>
      )}

      {/* Why WorkOn for employers */}
      <WhyChooseBlock
        eyebrow="Pourquoi WorkOn"
        title="Du renfort qualifié, tout de suite."
        theme="light"
        items={[
          { icon: "⚡", title: "Réponse en minutes", desc: "Publiez votre besoin et recevez des candidatures de travailleurs disponibles dans votre secteur." },
          { icon: "✅", title: "Profils vérifiés", desc: "Les tiers VERIFIED+ passent une vérification d'identité. Vous voyez avis et missions complétées." },
          { icon: "🔒", title: "Paiement sécurisé", desc: "Votre budget est bloqué en escrow Stripe. Libéré uniquement quand la mission est confirmée." },
          { icon: "📋", title: "Contrat automatique", desc: "Chaque mission génère un contrat de service autonome. Couverture légale complète." },
          { icon: "📊", title: "Suivi en temps réel", desc: "Tableau de bord pour suivre vos missions actives, l'historique et les paiements." },
          { icon: "💬", title: "Communication directe", desc: "Chat intégré avec le travailleur avant et pendant la mission." },
        ]}
      />

      {/* Sectors available */}
      {sectors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-bold">Secteurs disponibles</h2>
            <span className="text-xs text-[#9C9A96]">Mis à jour en temps réel</span>
          </div>
          <div className="rounded-2xl border border-[#EAE6DF] bg-white px-5 py-2 shadow-card">
            {sectors.map((s) => <SectorRow key={s.category} s={s} />)}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF] bg-[#F0EDE8]">
        <h2 className="font-heading text-xl font-bold mb-2">Tarification transparente</h2>
        <p className="text-sm text-[#706E6A] mb-6">Pas d'abonnement. Vous payez seulement pour les missions complétées.</p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-[#134021]/25 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Lancement</h3>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#134021]/10 text-[#134021] border border-[#134021]/20">Actif maintenant</span>
            </div>
            <p className="text-4xl font-black text-[#B5382A]">0%</p>
            <p className="text-sm text-[#706E6A] mt-1">de commission sur chaque mission</p>
            <ul className="mt-4 space-y-2 text-sm text-[#1B1A18]/70">
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Missions illimitées</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Accès tous les travailleurs</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Contrats automatiques</li>
              <li className="flex items-center gap-2"><span className="text-[#22C55E]">✓</span> Support prioritaire</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#EAE6DF] bg-white p-6 shadow-card opacity-60">
            <h3 className="font-bold text-lg mb-4">Post-lancement</h3>
            <p className="text-4xl font-black text-[#B5382A]">15%</p>
            <p className="text-sm text-[#706E6A] mt-1">de commission sur chaque mission</p>
            <p className="text-xs text-[#9C9A96] mt-4">
              Uniquement sur les missions complétées. Aucune charge si la mission n&apos;aboutit pas.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF] bg-[#F9F8F5]">
          <h2 className="font-heading text-xl font-bold mb-1">Témoignages</h2>
          <p className="text-sm text-[#706E6A] mb-6">Avis réels de missions complétées</p>
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-10 border-b border-[#EAE6DF] bg-white">
        <h2 className="font-heading text-xl font-bold mb-6">Questions fréquentes</h2>
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
            <details key={item.q} className="group rounded-2xl border border-[#EAE6DF] bg-white p-4 shadow-card">
              <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between text-[#1B1A18]">
                {item.q}
                <span className="text-[#9C9A96] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-[#706E6A] leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 bg-[#F0EDE8]">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold mb-3">Prêt à publier votre mission ?</h2>
          <p className="text-[#706E6A] mb-6">0% commission pendant le lancement. Inscription en 2 minutes.</p>
          <Button size="lg" className="bg-[#134021] hover:bg-[#0F3319] text-white" asChild>
            <Link href="/register?role=employer">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#EAE6DF] bg-[#F9F8F5]">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-xs text-[#9C9A96]">
          <Link href="/" className="hover:text-[#706E6A]">WorkOn</Link>
          <p>Les travailleurs sont des prestataires autonomes, non des employés de WorkOn.</p>
          <Link href="/pros" className="hover:text-[#706E6A]">Côté travailleur →</Link>
        </div>
      </footer>
    </main>
  );
}
