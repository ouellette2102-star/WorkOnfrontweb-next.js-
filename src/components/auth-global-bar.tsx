"use client";

/**
 * Floating auth bar (top-right) — client component.
 * Uses custom JWT auth instead of Clerk.
 *
 * Legacy Clerk version archived at: src/legacy/clerk/auth-global-bar.tsx
 */

import { useAuth } from "@/contexts/auth-context";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import Link from "next/link";

export function AuthGlobalBar() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="pointer-events-none fixed right-4 top-3 z-50 flex items-center justify-end">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur">
        <NotificationBadge />
        <span className="hidden text-sm text-white/70 md:inline px-2">
          Mon espace
        </span>
        <div className="group relative">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white ring-2 ring-red-600">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={initials}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </button>
          {/* Dropdown */}
          <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-2xl group-hover:visible">
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-white/50">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Mon profil
            </Link>
            <button
              onClick={logout}
              className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
