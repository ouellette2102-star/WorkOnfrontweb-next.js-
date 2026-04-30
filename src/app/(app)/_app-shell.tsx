"use client";

import { useAuth } from "@/contexts/auth-context";
import { ModeProvider } from "@/contexts/mode-context";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopBar } from "@/components/navigation/top-bar";
import { ConsentProvider } from "@/components/consent-provider";
import { ReviewPromptProvider } from "@/components/review-prompt-provider";
import { PageTransition } from "@/components/page-transition";
import { useDeviceRegistration } from "@/hooks/use-device-registration";
import { Loader2 } from "lucide-react";

/**
 * Client wrapper for the (app) route group.
 *
 * The server layout (./layout.tsx) is the source of truth for auth gating.
 * This component handles post-hydration UX: showing a loading spinner while
 * the client auth context boots, then rendering the persistent shell
 * (header + BottomNav) around children.
 *
 * `ConsentProvider` wraps every authenticated route so the Loi 25 / GDPR
 * consent modal can block any navigation when a required document
 * (TERMS, PRIVACY) has not been accepted at the current active version.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  useDeviceRegistration();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-workon-bg">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <ConsentProvider>
      <ReviewPromptProvider>
        <ModeProvider>
          <div className="min-h-dvh pb-20 bg-workon-bg">
            <TopBar />
            <main>
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav />
          </div>
        </ModeProvider>
      </ReviewPromptProvider>
    </ConsentProvider>
  );
}
