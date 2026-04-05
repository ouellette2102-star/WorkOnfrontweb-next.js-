"use client";

import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { MapPin, Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Middleware should handle redirect, but just in case
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
