"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { ReviewPromptModal } from "./review-prompt-modal";

const DISMISSED_STORAGE_KEY = "workon.review-prompt.dismissed";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DISMISSED_STORAGE_KEY,
      JSON.stringify(Array.from(set)),
    );
  } catch {
    // Quota full / private mode — skip.
  }
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
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  // Hydrate dismissed set on mount (client only).
  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

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
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(missionId);
      persistDismissed(next);
      return next;
    });
  }, []);

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
