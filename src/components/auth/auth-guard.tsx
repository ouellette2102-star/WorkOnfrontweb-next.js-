"use client";

import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { UI_MESSAGES } from "@/lib/ui/messages";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Composant de chargement personnalisé */
  loading?: React.ReactNode;
  /** Afficher le fallback inline au lieu de plein écran */
  inline?: boolean;
}

/**
 * Auth Guard - Composant Client
 * 
 * Affiche un état de chargement pendant la vérification auth,
 * puis affiche soit les enfants (si connecté) soit un fallback UI clair.
 * 
 * Usage:
 *   <AuthGuard><ContenuProtégé /></AuthGuard>
 *   <AuthGuard inline><ContenuProtégé /></AuthGuard>
 */
export function AuthGuard({ children, loading, inline = false }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useUser();

  // État de chargement
  if (!isLoaded) {
    return (
      loading ?? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-white/60">{UI_MESSAGES.LOADING}</div>
        </div>
      )
    );
  }

  // Non connecté - afficher le fallback
  if (!isSignedIn) {
    return <AuthFallback inline={inline} />;
  }

  // Connecté - afficher les enfants
  return <>{children}</>;
}

/**
 * Fallback UI quand l'utilisateur n'est pas authentifié
 */
function AuthFallback({ inline = false }: { inline?: boolean }) {
  const containerClasses = inline
    ? "rounded-2xl border border-white/10 bg-neutral-900/60 p-8 text-center"
    : "flex min-h-[60vh] items-center justify-center p-6";

  return (
    <div className={containerClasses}>
      <div className="max-w-sm space-y-6 text-center">
        {/* Icône */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Texte */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            {UI_MESSAGES.AUTH_REQUIRED}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {UI_MESSAGES.AUTH_REQUIRED_DESC}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
              {UI_MESSAGES.SIGN_IN}
            </button>
          </SignInButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {UI_MESSAGES.GO_HOME}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Message "auth requise" standalone (sans dépendance Clerk)
 * Pour utilisation dans les composants serveur ou quand Clerk n'est pas disponible
 */
export function AuthRequiredMessage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {UI_MESSAGES.AUTH_REQUIRED}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {UI_MESSAGES.AUTH_REQUIRED_DESC}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {UI_MESSAGES.SIGN_IN}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {UI_MESSAGES.GO_HOME}
          </Link>
        </div>
      </div>
    </div>
  );
}

