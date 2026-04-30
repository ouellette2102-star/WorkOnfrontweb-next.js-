"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode } from "@/contexts/mode-context";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  BOTTOM_NAV_FAB,
  BOTTOM_NAV_LEFT,
  BOTTOM_NAV_RIGHT,
  type NavItem,
} from "@/lib/nav";

/**
 * Bottom navigation — Convergence design (5 slots).
 *
 * Layout:
 *   [Accueil] [Pros]  ⬢ FAB  [Carte] [Messages]
 *
 * Tabs + FAB now come from the centralized `nav` contract
 * (src/lib/nav.ts) so labels, hrefs and role gates live in one
 * place and a route-exists test can guard them.
 *
 * Bug #10 fix: Pro FAB points at `/missions` (browse open work,
 * an action) instead of `/missions/mine` (a passive list — moved
 * to the hamburger as part of #11).
 */

// Bottom nav uses two icons not declared in the contract (Home + Map are
// component-bound for the active-state tweak below). Resolve them here.
const ICON_OVERRIDES: Record<string, typeof Home> = {
  home: Home,
  map: Map,
};

export function BottomNav() {
  const pathname = usePathname();
  const { mode } = useMode();

  // Unread messages badge — polled at the same 30s cadence as the
  // notification badge in TopBar so the two background fetches stagger
  // predictably and we don't double-tax the API in the same 20s window.
  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderTab = (tab: NavItem) => {
    const active = isActive(tab.href);
    const Icon = ICON_OVERRIDES[tab.id] ?? tab.icon;
    return (
      <Link
        key={tab.id}
        href={tab.href}
        data-testid={`nav-${tab.id}`}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition-colors",
          active ? "text-workon-ink" : "text-workon-muted hover:text-workon-gray",
        )}
      >
        <div className="relative">
          <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 1.5} />
          {tab.id === "messages" && unread && unread.count > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-workon-accent text-[8px] font-bold text-white flex items-center justify-center">
              {unread.count > 9 ? "9+" : unread.count}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">{tab.label}</span>
        {active && <div className="w-1 h-1 rounded-full bg-workon-ink mt-0.5" />}
      </Link>
    );
  };

  // FAB definition — picked from the contract by the current mode.
  const fab = BOTTOM_NAV_FAB[mode];
  const FabIcon = fab.icon;
  const fabActive = isActive(fab.href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-workon-border bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="relative flex items-end justify-around h-16 max-w-lg mx-auto px-4 pb-4 pt-0">
        {BOTTOM_NAV_LEFT.map(renderTab)}

        {/* Center: raised FAB — role-aware (pro: browse missions, client: publish). */}
        <div className="flex flex-col items-center -mt-5 min-w-[52px]">
          <Link
            href={fab.href}
            data-testid={`nav-${fab.id}`}
            aria-label={
              mode === "pro"
                ? "Parcourir les missions ouvertes"
                : "Publier une nouvelle mission"
            }
            className={cn(
              "flex items-center justify-center h-14 w-14 rounded-full transition-all",
              "bg-workon-accent text-white",
              "shadow-[0_4px_16px_rgba(201,102,70,0.3)]",
              "hover:shadow-[0_4px_24px_rgba(201,102,70,0.45)]",
              fabActive && "shadow-[0_4px_20px_rgba(201,102,70,0.4)]",
            )}
          >
            <FabIcon className="h-7 w-7" />
          </Link>
          <span
            className={cn(
              "text-[10px] mt-1 font-semibold",
              fabActive ? "text-workon-accent" : "text-workon-gray",
            )}
          >
            {fab.label}
          </span>
        </div>

        {BOTTOM_NAV_RIGHT.map(renderTab)}
      </div>
    </nav>
  );
}
