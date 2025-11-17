"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

/**
 * Page temporaire pour les messages
 * Redirige vers /missions/mine pour l'instant
 * À implémenter: système de messagerie centralisé
 */
export default function MessagesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Pour l'instant, rediriger vers les missions
    // Le chat est accessible via /missions/[id]/chat
    router.push("/notifications");
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
        <p className="text-white/70">Redirection...</p>
      </div>
    </div>
  );
}

