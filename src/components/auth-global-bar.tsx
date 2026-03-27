"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationBadge } from "@/components/notifications/notification-badge";

/**
 * Floating auth bar (top-right) — client component.
 * Uses client-side Clerk hooks (no CLERK_SECRET_KEY needed).
 */
export function AuthGlobalBar() {
  return (
    <SignedIn>
      <div className="pointer-events-none fixed right-4 top-3 z-50 flex items-center justify-end">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur">
          <NotificationBadge />
          <span className="hidden text-sm text-white/70 md:inline px-2">
            Mon espace
          </span>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "ring-2 ring-red-600",
                userButtonPopoverCard:
                  "bg-neutral-900 border border-white/10 text-white",
                userButtonPopoverActionButtonIcon: "text-white/80",
                userButtonPopoverActionButtonText: "text-white/80",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </SignedIn>
  );
}
