import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

/**
 * Honest pricing page.
 *
 * The previous version advertised PRO at $29/mois and PREMIUM at $79/mois
 * with features (Auto-leadgen silencieux, Pages vitrines SEO, CRM avancé…)
 * that do not exist in the product. Shipping a pricing page for a SaaS
 * tier we cannot deliver is a consumer-protection risk.
 *
 * Replaced with the actual commercial model documented in
 * /employeurs and in WORKON_PRODUCT_CANON.md: 0% commission during
 * launch, 15% post-launch, charged only on completed missions.
 */

export const metadata = {
  title: "Tarifs — WorkOn",
  description:
    "0% de commission pendant le lancement. Payez uniquement sur les missions complétées.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F9F8F5] text-[#1B1A18]">
      <section className="mx-auto max-w-4xl px-4 py-16">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#134021]/30 bg-[#134021]/10 px-3 py-1 text-xs text-[#134021] mb-5">
            🚀 0% commission pendant le lancement
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading">
            Tarification transparente
          </h1>
          <p className="mt-4 text-[#706E6A] text-lg">
            Pas d&apos;abonnement. Pas de frais cachés. Vous payez seulement
            pour les missions complétées.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Current — launch */}
          <div className="rounded-3xl border border-[#134021]/25 bg-[#134021]/5 p-7 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl font-heading">Lancement</h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#134021]/15 text-[#134021] border border-[#134021]/30">
                Actif maintenant
              </span>
            </div>
            <p className="text-5xl font-bold text-[#134021]">0%</p>
            <p className="text-sm text-[#706E6A] mt-1">
              de commission sur chaque mission
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#1B1A18]">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span>Missions illimitées</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span>Accès à tous les travailleurs vérifiés</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span>Paiement sécurisé via Stripe (escrow)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span>Contrat de service généré automatiquement</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                <span>Support prioritaire pendant la période de lancement</span>
              </li>
            </ul>
            <Button asChild variant="hero" size="hero" className="w-full mt-7">
              <Link href="/register?role=employer">Commencer gratuitement</Link>
            </Button>
          </div>

          {/* Post-launch */}
          <div className="rounded-3xl bg-white border border-[#EAE6DF] p-7 shadow-card opacity-80">
            <h2 className="font-bold text-xl mb-4 font-heading">Post-lancement</h2>
            <p className="text-5xl font-bold">15%</p>
            <p className="text-sm text-[#706E6A] mt-1">
              de commission sur chaque mission
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#706E6A]">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#9C9A96] flex-shrink-0 mt-0.5" />
                <span>Mêmes fonctionnalités que la période de lancement</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#9C9A96] flex-shrink-0 mt-0.5" />
                <span>Facturé uniquement sur les missions complétées</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#9C9A96] flex-shrink-0 mt-0.5" />
                <span>
                  Aucune charge si la mission n&apos;aboutit pas
                </span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-[#9C9A96] leading-relaxed">
              Le passage au modèle 15% sera annoncé au moins 30 jours à
              l&apos;avance. Les utilisateurs inscrits pendant la période de
              lancement conservent leurs conditions actuelles sur une période
              de transition.
            </p>
          </div>
        </div>

        {/* Worker note */}
        <div className="mt-10 rounded-3xl bg-white border border-[#EAE6DF] p-6 text-sm text-[#706E6A]">
          <p className="font-semibold text-[#1B1A18] mb-1">Pour les travailleurs</p>
          <p>
            L&apos;inscription est et restera <strong>gratuite</strong>. Aucun
            abonnement. Le paiement est transféré via Stripe dès la
            confirmation de la mission.{" "}
            <Link href="/pros" className="text-[#B5382A] hover:underline">
              En savoir plus →
            </Link>
          </p>
        </div>

        {/* Footer nav */}
        <div className="mt-10 text-center text-xs text-[#9C9A96]">
          <Link href="/" className="hover:text-[#706E6A]">
            Retour à l&apos;accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
