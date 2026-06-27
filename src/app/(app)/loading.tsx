/**
 * Loading UI au niveau du groupe `(app)` — fallback Suspense instantané
 * pendant la navigation / le rendu serveur de TOUTE page authentifiée.
 *
 * Comble le trou « 0 loading.tsx » : avant, une navigation vers une page
 * `(app)` n'affichait rien jusqu'au prêt. Les erreurs sont déjà couvertes
 * par le boundary racine `src/app/error.tsx` (Sentry + reset).
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-workon-primary border-t-transparent" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
