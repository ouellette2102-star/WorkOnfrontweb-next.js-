/**
 * Error Boundary - Page Level
 * PR-28: Ops & monitoring minimum
 *
 * Capture les erreurs dans les segments de route (pas le root layout).
 * Plus léger que global-error.tsx.
 *
 * SÉCURITÉ: Ne jamais afficher de stack traces en production.
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Log error with context
    logger.error("ErrorBoundary", "Page error caught", {
      message: error.message,
      digest: error.digest ?? "none",
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Quelque chose s&apos;est mal passé
          </h2>
          <p className="text-white/60 text-sm">
            Cette page a rencontré une erreur. Vous pouvez réessayer ou revenir à l&apos;accueil.
          </p>
        </div>

        {/* Error reference */}
        {error.digest && (
          <p className="text-xs text-white/40 font-mono">
            Réf: {error.digest}
          </p>
        )}

        {/* Dev only: error details */}
        {isDev && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/30 text-left">
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={reset}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
