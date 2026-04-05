"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function UserNav() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-100" asChild>
          <Link href="/login">Connexion</Link>
        </Button>
        <Button size="sm" className="bg-[#FF4D1C] hover:bg-[#E8441A] text-white rounded-lg" asChild>
          <Link href="/register">S&apos;inscrire</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/home"
        className="rounded-lg border border-gray-200 px-4 py-1.5 text-[#1A1A2E] font-medium transition hover:bg-gray-50"
      >
        Dashboard
      </Link>
      <button
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
        className="text-[#6B7280] hover:text-[#1A1A2E] text-sm transition-colors"
      >
        Deconnexion
      </button>
    </div>
  );
}
