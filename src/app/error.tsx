"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error Boundary Next.js App Router
 * 
 * Capture les erreurs runtime dans les segments de route.
 * Affiche une UI de fallback avec options de récupération.
 * 
 * SÉCURITÉ: Ne jamais afficher de stack traces ou détails techniques en production.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur côté client (pour Sentry ou monitoring)
    console.error("[WorkOn Error Boundary]", error);
    
    // TODO: Envoyer à Sentry si configuré
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">
            Une erreur est survenue
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Nous sommes désolés, quelque chose s&apos;est mal passé.
            <br />
            Vous pouvez réessayer ou retourner à l&apos;accueil.
          </p>
        </div>

        {/* Error digest (production) - Référence pour le support */}
        {error.digest && (
          <p className="text-xs text-white/40 font-mono">
            Référence: {error.digest}
          </p>
        )}

        {/* Dev only: Show error details */}
        {isDev && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs font-mono text-red-300/60 overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-900/30"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Support link */}
        <p className="text-xs text-white/40">
          Besoin d&apos;aide?{" "}
          <a
            href="mailto:support@workon.app"
            className="text-red-400 hover:text-red-300 underline"
          >
            Contacter le support
          </a>
        </p>
      </div>
    </div>
  );
}

