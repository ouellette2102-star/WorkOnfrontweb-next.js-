"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Global Error Boundary — Next.js App Router.
 *
 * Captures errors thrown during render of the root layout. MUST
 * include its own <html> and <body> because it runs OUTSIDE the
 * root layout scope.
 *
 * Reports the error to Sentry (no-op when SENTRY_DSN is unset).
 * Security: never exposes stack traces or server details in prod.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry FIRST so even if the console.error is suppressed
    // in the user's browser, the issue still lands in our dashboard.
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.error("[WorkOn Global Error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="fr-CA">
      <body className="bg-[#F9F8F5] text-[#1B1A18] antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Icon - Critical error */}
            <div className="mx-auto w-24 h-24 rounded-full bg-workon-accent/10 border-2 border-workon-accent/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-workon-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold font-heading text-[#1B1A18]">
                Erreur critique
              </h1>
              <p className="text-[#706E6A] leading-relaxed">
                L&apos;application a rencontré une erreur inattendue.
                <br />
                Veuillez réessayer ou recharger la page.
              </p>
            </div>

            {/* Error digest */}
            {error.digest && (
              <p className="text-xs text-[#9C9A96] font-mono">
                Référence: {error.digest}
              </p>
            )}

            {/* Dev only */}
            {isDev && (
              <div className="p-4 rounded-2xl bg-workon-accent/5 border border-workon-accent/25 text-left">
                <p className="text-sm font-mono text-workon-accent break-all">
                  {error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => reset()}
                className="w-full px-6 py-4 rounded-xl bg-[#134021] hover:bg-[#0F3319] text-white font-semibold transition-colors shadow-lg shadow-[#134021]/30"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-4 rounded-xl bg-[#F0EDE8] hover:bg-[#EAE6DF] border border-[#EAE6DF] text-[#1B1A18] font-semibold transition-colors"
              >
                Recharger la page
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Link ne fonctionne pas dans global-error (pas de context router) */}
              <a
                href="/"
                className="w-full px-6 py-4 rounded-xl bg-transparent text-[#706E6A] hover:text-[#1B1A18] font-medium transition-colors"
              >
                Retour à l&apos;accueil
              </a>
            </div>

            {/* Branding */}
            <div className="pt-8 border-t border-[#EAE6DF]">
              <p className="text-sm text-[#9C9A96]">
                WorkOn — Marketplace de services
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

