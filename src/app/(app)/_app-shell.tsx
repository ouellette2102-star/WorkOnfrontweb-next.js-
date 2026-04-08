"use client";

import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Client wrapper for the (app) route group.
 *
 * The server layout (./layout.tsx) is the source of truth for auth gating.
 * This component handles post-hydration UX: showing a loading spinner while
 * the client auth context boots, then rendering the persistent shell
 * (header + BottomNav) around children.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Defensive fallback: server gate should already have redirected, but
    // if the cookie was cleared client-side after the page loaded, send
    // the user back to /login.
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Top header */}
      <header className="sticky top-0 z-40 flex items-center justify-center h-14 border-b border-white/5 bg-neutral-900/95 backdrop-blur-lg">
        <div className="flex items-center gap-0.5 text-xl font-bold">
          <span>Work</span>
          <MapPin className="h-5 w-5 text-red-accent" />
          <span>n</span>
        </div>
      </header>

      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
