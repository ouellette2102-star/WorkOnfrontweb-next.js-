"use client";

import { useRef, useCallback, useState } from "react";

/**
 * Hook to prevent double-submission on mutations.
 * Returns a wrapped function that ignores calls while the previous one is still running.
 *
 * Usage:
 *   const { execute, isPending } = useMutationLock();
 *   const handleReserve = () => execute(async () => {
 *     await api.acceptMission(id);
 *   });
 *   <Button disabled={isPending} onClick={handleReserve}>Reserve</Button>
 */
export function useMutationLock() {
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(async (fn: () => Promise<void>) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsPending(true);
    try {
      await fn();
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }, []);

  return { execute, isPending };
}
