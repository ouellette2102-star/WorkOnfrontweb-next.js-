import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s — WorkOn",
    default: "Informations juridiques — WorkOn",
  },
  description:
    "Conditions d'utilisation et politique de confidentialité de WorkOn, plateforme de mise en relation pour travailleurs autonomes au Québec.",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-workon-bg text-workon-ink">
      {/* Top bar */}
      <nav className="border-b border-workon-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-workon-primary hover:text-workon-primary-hover transition-colors"
          >
            WorkOn
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link
              href="/legal/terms"
              className="text-workon-gray hover:text-workon-ink transition-colors"
            >
              Conditions
            </Link>
            <Link
              href="/legal/privacy"
              className="text-workon-gray hover:text-workon-ink transition-colors"
            >
              Confidentialit&eacute;
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-workon-border">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-workon-muted">
          <span>&copy; {new Date().getFullYear()} WorkOn Technologies Inc.</span>
          <div className="flex gap-4">
            <Link
              href="/legal/terms"
              className="hover:text-workon-ink transition-colors"
            >
              Conditions
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-workon-ink transition-colors"
            >
              Confidentialit&eacute;
            </Link>
            <Link
              href="/faq"
              className="hover:text-workon-ink transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
