import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";

export const metadata: Metadata = {
  title: "Page introuvable — WorkOn",
  robots: { index: false, follow: false },
};

/**
 * Branded 404 — catches any URL not explicitly handled.
 *
 * Replaces Next.js's default plain-text 404, which looked like a broken
 * deploy from outside the app. This page keeps the visitor inside the
 * brand and offers the 4 obvious destinations (home, pros, login,
 * register) instead of a dead end.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-workon-bg text-workon-ink flex flex-col">
      <header className="sticky top-0 z-50 border-b border-workon-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <WorkOnWordmark size="md" />
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-sm font-semibold text-workon-accent uppercase tracking-widest mb-6">
            Erreur 404
          </p>
          <h1 className="font-heading text-[2.5rem] md:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-workon-ink">
            Cette page n&apos;existe pas
            <br />
            <span className="text-workon-gray">(ou plus).</span>
          </h1>
          <p className="mt-6 text-lg text-workon-gray leading-relaxed">
            Le lien que vous avez suivi est peut-être obsolète. Voici où aller
            ensuite.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-workon-primary hover:bg-workon-primary-hover text-white h-14 px-8 text-base font-semibold rounded-xl"
              asChild
            >
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-workon-border text-workon-ink hover:bg-white h-14 px-8 text-base rounded-xl"
              asChild
            >
              <Link href="/pros">Voir les professionnels</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-workon-gray">
            <Link
              href="/login"
              className="hover:text-workon-ink transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="hover:text-workon-ink transition-colors"
            >
              Inscription
            </Link>
            <Link
              href="/pricing"
              className="hover:text-workon-ink transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/faq"
              className="hover:text-workon-ink transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              className="hover:text-workon-ink transition-colors"
            >
              À propos
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-workon-bg border-t border-workon-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-workon-gray">
          <p>&copy; 2026 WorkOn Inc. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
