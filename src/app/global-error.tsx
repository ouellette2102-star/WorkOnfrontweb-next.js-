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
      <body className="bg-workon-bg text-workon-ink antialiased">
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
              <h1 className="text-3xl font-bold font-heading text-workon-ink">
                Erreur critique
              </h1>
              <p className="text-workon-gray leading-relaxed">
                L&apos;application a rencontré une erreur inattendue.
                <br />
                Veuillez réessayer ou recharger la page.
              </p>
            </div>

            {/* Error digest */}
            {error.digest && (
              <p className="text-xs text-workon-muted font-mono">
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
                className="w-full px-6 py-4 rounded-xl bg-workon-primary hover:bg-workon-primary-hover text-white font-semibold transition-colors shadow-lg shadow-workon-primary/30"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-4 rounded-xl bg-workon-bg-cream hover:bg-workon-border border border-workon-border text-workon-ink font-semibold transition-colors"
              >
                Recharger la page
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Link ne fonctionne pas dans global-error (pas de context router) */}
              <a
                href="/"
                className="w-full px-6 py-4 rounded-xl bg-transparent text-workon-gray hover:text-workon-ink font-medium transition-colors"
              >
                Retour à l&apos;accueil
              </a>
            </div>

            {/* Branding */}
            <div className="pt-8 border-t border-workon-border">
              <p className="text-sm text-workon-muted">
                WorkOn — Marketplace de services
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

