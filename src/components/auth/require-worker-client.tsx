"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Client-side guard that only renders children when the current user has
 * the `worker` role. Non-workers are redirected to their own dashboard;
 * unauthenticated users are redirected to /login.
 *
 * Uses `useAuth()` directly (backed by `/auth/me` via same-origin proxy),
 * NOT the defunct `useCurrentProfile` hook which called the 404 endpoint
 * `/profile/me`. Server-side pages continue to use `requireWorker()` from
 * `lib/server-auth.ts` — this client guard is only needed on pages that
 * live outside the `(app)` server-gated layout.
 */
export function RequireWorkerClient({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "employer") {
      router.push("/employer/dashboard");
      return;
    }

    if (user.role !== "worker") {
      router.push("/home");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== "worker") {
    return null;
  }

  return <>{children}</>;
}
