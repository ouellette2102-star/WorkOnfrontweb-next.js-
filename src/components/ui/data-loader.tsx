"use client";

/**
 * <DataLoader> — Unified state shell for data-driven pages.
 *
 * QA report items #15-16, #36, #M1: stop showing the brutal browser
 * "Failed to fetch" string in 9+ pages and conflating "no data yet"
 * with "network error". This component is the canonical wrapper:
 *
 *   - loading  → skeleton (passed by caller)
 *   - error    → human-readable message + retry button
 *   - empty    → pedagogical empty state (passed by caller)
 *   - success  → render children
 *
 * Usage:
 *   <DataLoader
 *     query={query}
 *     skeleton={<MissionsSkeleton />}
 *     empty={<EmptyState ... />}
 *   >
 *     {(data) => <MissionList data={data} />}
 *   </DataLoader>
 *
 * The wrapper accepts a TanStack-Query-shaped object so it works
 * with `useQuery` out of the box. For raw fetches, pass an object
 * matching the same shape.
 */

import { ReactNode } from "react";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DataLoaderQuery<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  /** Optional flag: if true, treat empty data array as "empty" not "success" */
  isEmpty?: boolean;
}

interface DataLoaderProps<T> {
  query: DataLoaderQuery<T>;
  /** Custom loading UI. Default: centered spinner. */
  skeleton?: ReactNode;
  /** Custom empty UI. Default: minimal "Aucune donnée" message. */
  empty?: ReactNode;
  /** Children render-prop receives the resolved data. */
  children: (data: T) => ReactNode;
  /** Override the error label. */
  errorTitle?: string;
  /** Override the error retry button label. */
  retryLabel?: string;
  /** Function to detect empty data. Default: data is array of length 0. */
  isEmpty?: (data: T) => boolean;
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: unknown }).items;
    return Array.isArray(items) && items.length === 0;
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Browser fetch failure → friendly French message
    if (
      error.message === "Failed to fetch" ||
      error.message === "NetworkError when attempting to fetch resource."
    ) {
      return "Connexion impossible. Vérifie ton internet et réessaie.";
    }
    return error.message;
  }
  return "Une erreur est survenue.";
}

export function DataLoader<T>({
  query,
  skeleton,
  empty,
  children,
  errorTitle = "Erreur de chargement",
  retryLabel = "Réessayer",
  isEmpty,
}: DataLoaderProps<T>) {
  if (query.isLoading) {
    return (
      <>
        {skeleton ?? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
          </div>
        )}
      </>
    );
  }

  if (query.isError) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-md rounded-2xl border border-workon-border bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-workon-bg-cream">
          <WifiOff className="h-5 w-5 text-workon-muted" />
        </div>
        <h3 className="mb-1 font-semibold text-workon-ink">{errorTitle}</h3>
        <p className="mb-4 text-sm text-workon-muted">
          {getErrorMessage(query.error)}
        </p>
        <Button
          onClick={() => query.refetch()}
          variant="outline"
          className="rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      </div>
    );
  }

  if (query.data === undefined || query.data === null) {
    // Defensive: success state but no data — treat as empty.
    return <>{empty ?? <DefaultEmptyState />}</>;
  }

  const empty_check = isEmpty ?? defaultIsEmpty;
  if (empty_check(query.data)) {
    return <>{empty ?? <DefaultEmptyState />}</>;
  }

  return <>{children(query.data)}</>;
}

function DefaultEmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-workon-border bg-white p-8 text-center">
      <p className="text-sm text-workon-muted">Aucune donnée à afficher.</p>
    </div>
  );
}
