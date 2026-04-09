/**
 * Page-level Error Boundary (route segment scope).
 *
 * Captures errors inside any route segment below this file — lighter
 * than `global-error.tsx` because it stays inside the root layout,
 * keeping the header and shell visible while the errored segment
 * recovers.
 *
 * Also reports to Sentry (no-op when DSN is unset). Security: never
 * exposes stack traces in production.
 */

"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
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
    // Report to Sentry first so it lands in our dashboard regardless
    // of whether the user has a console open.
    Sentry.captureException(error, {
      tags: { source: "page-error-boundary" },
    });
    logger.error("ErrorBoundary", "Page error caught", {
      message: error.message,
      digest: error.digest ?? "none",
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FF4D1C]/15 border border-[#FF4D1C]/25 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#FF4D1C]" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Quelque chose s&apos;est mal passé
          </h2>
          <p className="text-white/60 text-sm">
            Cette page a rencontré une erreur. Vous pouvez réessayer ou
            revenir à l&apos;accueil.
          </p>
        </div>

        {/* Error reference */}
        {error.digest && (
          <p className="text-xs text-white/40 font-mono">
            Réf : {error.digest}
          </p>
        )}

        {/* Dev only: error details */}
        {isDev && (
          <div className="p-3 rounded-2xl bg-[#FF4D1C]/5 border border-[#FF4D1C]/25 text-left">
            <p className="text-xs font-mono text-[#FF4D1C] break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={reset} variant="hero" size="hero" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
          <Button asChild variant="outline" size="hero" className="flex-1">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
