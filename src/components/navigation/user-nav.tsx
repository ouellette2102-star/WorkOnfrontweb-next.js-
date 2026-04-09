"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

/**
 * UserNav — header auth control.
 *
 * Renders on both dark app surfaces (/pros, /employeurs, /p/[slug])
 * and the light landing page (/), so it has to look decent on both.
 * We lean on the shared Button variants (outline, hero, ghost)
 * which handle colors via currentColor and work on either background.
 */
export function UserNav() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Connexion</Link>
        </Button>
        <Button variant="hero" size="sm" asChild>
          <Link href="/register">S&apos;inscrire</Link>
        </Button>
      </div>
    );
  }

  const firstName = user?.firstName?.trim() || "Mon compte";

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button variant="outline" size="sm" asChild>
        <Link href="/home">
          <span className="hidden sm:inline">{firstName}</span>
          <span className="sm:hidden">Compte</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
      >
        Déconnexion
      </Button>
    </div>
  );
}
