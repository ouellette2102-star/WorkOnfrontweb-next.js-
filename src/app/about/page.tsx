import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/navigation/marketing-header";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "À propos — WorkOn",
  description:
    "WorkOn connecte les entreprises québécoises et les travailleurs autonomes pour combler les besoins de main-d'œuvre temporaire. Plateforme conçue au Québec, conforme Loi 25.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F9F8F5] text-[#1B1A18]">
      <MarketingHeader />

      <section className="bg-[#F9F8F5]">
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 md:pt-28">
          <p className="text-sm font-semibold text-workon-accent uppercase tracking-widest mb-4">
            À propos
          </p>
          <h1 className="font-heading text-[2.5rem] md:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-[#1B1A18]">
            Le travail sur demande,
            <br />
            <span className="text-workon-accent">structuré pour le Québec.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-[#706E6A] max-w-2xl leading-relaxed">
            WorkOn relie les entreprises québécoises qui ont un besoin de
            main-d&apos;œuvre temporaire aux travailleurs autonomes qualifiés,
            disponibles et vérifiés &mdash; sans agence, sans engagement, sans
            complexité administrative.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#1B1A18] mb-6">
            Notre mission
          </h2>
          <div className="prose prose-lg max-w-none text-[#1B1A18]">
            <p className="text-[17px] text-[#1B1A18] leading-relaxed">
              Le Québec compte près de <strong>500&nbsp;000 travailleurs
              autonomes</strong>. Pourtant, la majorité d&apos;entre eux
              n&apos;ont pas d&apos;outil structuré pour trouver du travail
              récurrent, et les entreprises qui cherchent un renfort ponctuel
              passent par des agences coûteuses ou des listes de contacts
              personnels.
            </p>
            <p className="mt-5 text-[17px] text-[#1B1A18] leading-relaxed">
              WorkOn offre une alternative : un système de capture de demande
              et de mise en relation qui respecte l&apos;autonomie des
              travailleurs, la conformité réglementaire québécoise, et la
              simplicité d&apos;usage attendue par les PME.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F0EDE8]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#1B1A18] mb-8">
            Ce qui nous distingue
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Conformité Loi 25 &amp; CNESST",
                desc: "Conçue dès le départ pour respecter les règles québécoises sur la vie privée et la classification des travailleurs.",
              },
              {
                title: "Paiement sécurisé par escrow",
                desc: "Les fonds sont retenus par Stripe jusqu&apos;à la confirmation de la mission. Ni l&apos;entreprise ni le travailleur n&apos;assume le risque seul.",
              },
              {
                title: "Notation bidirectionnelle",
                desc: "Les travailleurs et les entreprises se notent mutuellement. La confiance se construit sur les deux côtés.",
              },
              {
                title: "Service francophone natif",
                desc: "Interface, contrats, support : tout est en français, pour des utilisateurs québécois. Infrastructure canadienne.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white border border-[#EAE6DF] p-7"
              >
                <h3
                  className="text-lg font-bold text-[#1B1A18] mb-3"
                  dangerouslySetInnerHTML={{ __html: item.title }}
                />
                <p
                  className="text-[15px] text-[#706E6A] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.desc }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#1B1A18] mb-6">
            Nous joindre
          </h2>
          <p className="text-[17px] text-[#706E6A] leading-relaxed">
            Questions, partenariats, presse : écrivez-nous à{" "}
            <a
              href="mailto:hello@workon.ca"
              className="text-workon-accent font-semibold hover:underline"
            >
              hello@workon.ca
            </a>
            . Nous répondons dans les 24 heures ouvrables.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-[#134021] hover:bg-[#0F3319] text-white h-14 px-8 text-base font-semibold rounded-xl"
              asChild
            >
              <Link href="/register">Créer un compte gratuit</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-[#EAE6DF] text-[#1B1A18] hover:bg-[#F9F8F5] h-14 px-8 text-base rounded-xl"
              asChild
            >
              <Link href="/pros">Voir les professionnels</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#F9F8F5] border-t border-[#EAE6DF]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <WorkOnWordmark size="md" />
            <nav className="flex flex-wrap items-center gap-6 text-sm text-[#706E6A] font-medium">
              <Link href="/" className="hover:text-[#1B1A18] transition-colors">
                Accueil
              </Link>
              <Link
                href="/faq"
                className="hover:text-[#1B1A18] transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/pricing"
                className="hover:text-[#1B1A18] transition-colors"
              >
                Tarifs
              </Link>
              <Link
                href="/legal/privacy"
                className="hover:text-[#1B1A18] transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href="/legal/terms"
                className="hover:text-[#1B1A18] transition-colors"
              >
                Conditions
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
