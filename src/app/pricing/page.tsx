"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { TaxDisclaimer } from "@/components/ui/tax-disclaimer";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Pricing page — Free Entry + Paid Acceleration.
 *
 * Free: 3 missions/month, chat after match, 15% commission on payouts.
 * Client Pro ($39): unlimited missions, priority, badge, leads 5/mo.
 * Worker Pro ($19): verified badge, boost, priority alerts, leads alerts.
 * Client Business ($99): leads unlimited, multi-seats, CSM.
 */

type PaidPlan = "CLIENT_PRO" | "WORKER_PRO" | "CLIENT_BUSINESS";

function useCheckout() {
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const go = async (plan: PaidPlan) => {
    try {
      setLoading(plan);
      const { url } = await api.createSubscriptionCheckout(plan, {
        successUrl: `${window.location.origin}/settings/subscription?ok=1`,
        cancelUrl: `${window.location.origin}/pricing?canceled=1`,
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      if (/401|Authorization/i.test(msg)) {
        window.location.href = `/login?next=/pricing`;
        return;
      }
      toast.error("Impossible de démarrer le paiement", { description: msg });
      setLoading(null);
    }
  };
  return { loading, go };
}

function PlanCard({
  name,
  price,
  priceAmount,
  tagline,
  features,
  cta,
  onClick,
  loading,
  highlight,
  footnote,
}: {
  name: string;
  /** Display price, e.g. "19 $" or "0 $". Tax disclaimer is hidden for "0 $". */
  price: string;
  /** Decimal pre-tax amount (e.g. 19) used to compute the TTC hint. Optional. */
  priceAmount?: number;
  tagline: string;
  features: string[];
  cta: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
  footnote?: string;
}) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-card flex flex-col ${
        highlight
          ? "border border-workon-primary/35 bg-workon-primary/5"
          : "bg-white border border-workon-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg font-heading text-workon-ink">{name}</h2>
        {highlight && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-workon-primary/10 text-workon-primary border border-workon-primary/30">
            Populaire
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-4xl font-bold text-workon-ink">{price}</p>
        <p className="text-sm text-workon-gray mt-1">{tagline}</p>
        {priceAmount !== undefined && priceAmount > 0 ? (
          <TaxDisclaimer preTaxAmount={priceAmount} className="mt-1 block" />
        ) : null}
      </div>
      <ul className="mt-5 space-y-2.5 text-sm text-workon-ink flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-workon-primary flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {onClick ? (
        <Button
          onClick={onClick}
          disabled={loading}
          variant={highlight ? "hero" : "default"}
          size="hero"
          className="w-full mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirection…
            </>
          ) : (
            cta
          )}
        </Button>
      ) : (
        <Button asChild variant="default" size="hero" className="w-full mt-6">
          <Link href="/register">{cta}</Link>
        </Button>
      )}
      {footnote && (
        <p className="mt-3 text-xs text-workon-muted">{footnote}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const { loading, go } = useCheckout();

  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink">
      <MarketingHeader />

      <section className="mx-auto max-w-6xl px-4 py-14">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading">
            Des prix qui accélèrent ton travail
          </h1>
          <p className="mt-4 text-workon-gray text-lg max-w-2xl mx-auto">
            Gratuit pour essayer. Payant pour aller plus vite, gagner en
            visibilité et décrocher plus de contrats. Commission de 15 % sur
            les transactions complétées, peu importe le plan.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            name="Gratuit"
            price="0 $"
            tagline="/mois — pour commencer"
            features={[
              "3 missions par mois",
              "Profil complet + galerie",
              "Chat débloqué après match",
              "Paiement sécurisé Stripe",
              "Support communautaire",
            ]}
            cta="Créer un compte"
          />

          <PlanCard
            name="Worker Pro"
            price="19 $"
            priceAmount={19}
            tagline="/mois CAD"
            features={[
              "Badge vérifié",
              "Boost de visibilité",
              "Apparition prioritaire (swipe)",
              "Alertes jobs rapides",
              "Stats de profil avancées",
              "Plus de candidatures possibles",
            ]}
            cta="S'abonner"
            onClick={() => go("WORKER_PRO")}
            loading={loading === "WORKER_PRO"}
          />

          <PlanCard
            name="Client Pro"
            price="39 $"
            priceAmount={39}
            tagline="/mois CAD"
            features={[
              "Missions illimitées",
              "Priorité d'affichage",
              "Badge entreprise",
              "5 leads entrants/mois",
              "Support prioritaire",
              "Favoris travailleurs",
            ]}
            cta="S'abonner"
            onClick={() => go("CLIENT_PRO")}
            loading={loading === "CLIENT_PRO"}
            highlight
          />

          <PlanCard
            name="Client Business"
            price="99 $"
            priceAmount={99}
            tagline="/mois CAD"
            features={[
              "Tout du Client Pro",
              "Leads entrants illimités",
              "Comptes multi-sièges (bientôt)",
              "Reporting avancé",
              "CSM dédié",
            ]}
            cta="S'abonner"
            onClick={() => go("CLIENT_BUSINESS")}
            loading={loading === "CLIENT_BUSINESS"}
          />
        </div>

        {/* Boosts à la carte */}
        <div className="mt-12">
          <h3 className="text-xl font-bold font-heading text-workon-ink mb-3">
            Boosts ponctuels (à la carte)
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white border border-workon-border p-5 shadow-card">
              <p className="text-sm text-workon-gray">Mission urgente</p>
              <p className="text-2xl font-bold text-workon-ink mt-1">9 $</p>
              <TaxDisclaimer preTaxAmount={9} className="mt-1 block" />
              <p className="text-xs text-workon-muted mt-2">
                Push prioritaire aux pros à proximité, badge &laquo;&nbsp;urgent&nbsp;&raquo;.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-workon-border p-5 shadow-card">
              <p className="text-sm text-workon-gray">Top visibilité 48 h</p>
              <p className="text-2xl font-bold text-workon-ink mt-1">14 $</p>
              <TaxDisclaimer preTaxAmount={14} className="mt-1 block" />
              <p className="text-xs text-workon-muted mt-2">
                Profil ou mission en tête de liste et carte pendant 48 h.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-workon-border p-5 shadow-card">
              <p className="text-sm text-workon-gray">Vérification express</p>
              <p className="text-2xl font-bold text-workon-ink mt-1">19 $</p>
              <TaxDisclaimer preTaxAmount={19} className="mt-1 block" />
              <p className="text-xs text-workon-muted mt-2">
                Vérification identité sous 24 h (au lieu de 72 h).
              </p>
            </div>
          </div>
          <p className="text-xs text-workon-muted mt-3">
            Les boosts seront activés dans ton tableau de bord après le lancement
            du module de paiement à la carte.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-white border border-workon-border p-6 text-sm text-workon-gray shadow-card">
          <p className="font-semibold text-workon-ink mb-1">
            Commission plateforme
          </p>
          <p>
            15 % prélevés sur chaque transaction réussie, tous plans confondus.
            Aucun abonnement n&apos;est nécessaire pour encaisser ou dépenser —
            les plans débloquent volume, visibilité et leads.
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-workon-muted">
          <Link href="/" className="hover:text-workon-gray">
            Retour à l&apos;accueil
          </Link>{" "}
          ·{" "}
          <Link href="/settings/subscription" className="hover:text-workon-gray">
            Mon abonnement
          </Link>
        </div>
      </section>
    </main>
  );
}
