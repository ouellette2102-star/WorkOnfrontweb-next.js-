"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { safeLocalStorage } from "@/lib/safe-storage";
import { ReviewPromptModal } from "./review-prompt-modal";

const DISMISSED_STORAGE_KEY = "workon.review-prompt.dismissed";

function getDismissedRaw(): string {
  return safeLocalStorage.getItem(DISMISSED_STORAGE_KEY) ?? "[]";
}

function parseDismissed(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(set: Set<string>) {
  safeLocalStorage.setItem(
    DISMISSED_STORAGE_KEY,
    JSON.stringify(Array.from(set)),
  );
}

function subscribeDismissed(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === DISMISSED_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/**
 * ReviewPromptProvider — polls `/reviews/pending-for-me` after auth
 * resolves and shows the review modal for the first pending mission
 * the user hasn't dismissed this session.
 *
 * "Plus tard" (skip) marks the mission as dismissed in localStorage so
 * we don't re-prompt on every nav; the server still knows it's pending
 * and will surface it again on next login.
 */
export function ReviewPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const dismissedRaw = useSyncExternalStore(
    subscribeDismissed,
    getDismissedRaw,
    () => "[]",
  );
  const storedDismissed = useMemo(
    () => parseDismissed(dismissedRaw),
    [dismissedRaw],
  );
  const [dismissedOverride, setDismissedOverride] = useState<Set<string> | null>(null);
  const dismissed = dismissedOverride ?? storedDismissed;

  const { data: pending, refetch } = useQuery({
    queryKey: ["reviews-pending-for-me"],
    queryFn: () => api.getPendingReviews(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 60_000,
    // Don't force a refetch on window focus — the prompt is already intrusive.
    refetchOnWindowFocus: false,
  });

  const active = useMemo(() => {
    if (!pending || pending.length === 0) return null;
    return (
      pending.find((p) => !dismissed.has(p.missionId)) ?? null
    );
  }, [pending, dismissed]);

  const markDismissed = useCallback((missionId: string) => {
    setDismissedOverride((prev) => {
      const next = new Set(prev ?? dismissed);
      next.add(missionId);
      persistDismissed(next);
      return next;
    });
  }, [dismissed]);

  const handleSubmitted = useCallback(
    async (missionId: string) => {
      // Already submitted; mark locally and refetch from backend to drop it.
      markDismissed(missionId);
      await refetch();
    },
    [markDismissed, refetch],
  );

  return (
    <>
      {children}
      {active && (
        <ReviewPromptModal
          open
          pending={active}
          onSubmitted={handleSubmitted}
          onSkip={markDismissed}
          onClose={() => markDismissed(active.missionId)}
        />
      )}
    </>
  );
}
