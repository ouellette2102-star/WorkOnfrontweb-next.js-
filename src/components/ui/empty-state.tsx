"use client";

import Link from "next/link";
import { UI_MESSAGES } from "@/lib/ui/messages";

interface EmptyStateProps {
  /** Titre principal */
  title?: string;
  /** Description secondaire */
  description?: string;
  /** Icône personnalisée (sinon une icône par défaut est affichée) */
  icon?: React.ReactNode;
  /** Lien d'action principal */
  actionHref?: string;
  /** Texte du bouton d'action */
  actionLabel?: string;
  /** Callback pour le bouton d'action */
  onAction?: () => void;
  /** Afficher le bouton "Retour à l'accueil" */
  showHomeLink?: boolean;
}

/**
 * Empty State - Composant réutilisable pour les états vides
 * 
 * Usage:
 *   <EmptyState title="Aucun résultat" description="Essayez une autre recherche" />
 *   <EmptyState title="Aucune mission" actionLabel="Créer une mission" actionHref="/missions/new" />
 */
export function EmptyState({
  title = UI_MESSAGES.NO_DATA,
  description,
  icon,
  actionHref,
  actionLabel,
  onAction,
  showHomeLink = false,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-sm space-y-6 text-center">
        {/* Icône */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          {icon ?? (
            <svg
              className="h-8 w-8 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          )}
        </div>

        {/* Texte */}
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-white/60">{description}</p>
          )}
        </div>

        {/* Actions */}
        {(actionHref || onAction || showHomeLink) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {(actionHref || onAction) && actionLabel && (
              actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
                >
                  {actionLabel}
                </Link>
              ) : (
                <button
                  onClick={onAction}
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
                >
                  {actionLabel}
                </button>
              )
            )}
            {showHomeLink && (
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                {UI_MESSAGES.GO_HOME}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Error State - Composant pour les états d'erreur
 */
export function ErrorState({
  title = UI_MESSAGES.ERROR_GENERIC,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
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
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Texte */}
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-white/60">{description}</p>
          )}
        </div>

        {/* Actions */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {UI_MESSAGES.TRY_AGAIN}
          </button>
        )}
      </div>
    </div>
  );
}

