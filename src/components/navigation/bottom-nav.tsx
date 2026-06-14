"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMode } from "@/contexts/mode-context";
import { api } from "@/lib/api-client";
import {
  BOTTOM_NAV_FAB,
  BOTTOM_NAV_LEFT,
  BOTTOM_NAV_RIGHT,
  type NavItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICON_OVERRIDES: Record<string, typeof Home> = {
  home: Home,
  map: Map,
};

export function BottomNav() {
  const pathname = usePathname();
  const { mode } = useMode();

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
          "flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors",
          active
            ? "text-workon-primary"
            : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink",
        )}
      >
        <div className="relative">
          <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.7} />
          {tab.id === "messages" && unread && unread.count > 0 && (
            <span className="absolute -right-2.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-workon-copper px-0.5 text-[8px] font-bold text-white shadow-sm">
              {unread.count > 9 ? "9+" : unread.count}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold leading-none">{tab.label}</span>
        <span
          className={cn(
            "h-1 w-1 rounded-full transition-opacity",
            active ? "bg-workon-primary opacity-100" : "opacity-0",
          )}
        />
      </Link>
    );
  };

  const fab = BOTTOM_NAV_FAB[mode];
  const FabIcon = fab.icon;
  const fabActive = isActive(fab.href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom lg:hidden">
      <div className="mx-auto max-w-lg px-3 pb-3">
        <div className="relative flex h-[70px] items-end justify-around rounded-[24px] border border-workon-border/90 bg-workon-surface/92 px-3 pb-3 pt-1 shadow-[0_18px_45px_rgba(27,26,24,0.16)] backdrop-blur-xl">
          {BOTTOM_NAV_LEFT.map(renderTab)}

          <div className="flex min-w-[58px] -translate-y-2 flex-col items-center">
            <Link
              href={fab.href}
              data-testid={`nav-${fab.id}`}
              aria-label={
                mode === "pro"
                  ? "Parcourir les missions ouvertes"
                  : "Publier une nouvelle mission"
              }
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full text-white transition-all",
                mode === "pro"
                  ? "bg-workon-primary shadow-[0_10px_24px_rgba(19,64,33,0.30)] hover:bg-workon-primary-hover"
                  : "bg-workon-copper shadow-[0_10px_24px_rgba(185,107,67,0.30)] hover:bg-workon-copper-hover",
                fabActive && "scale-105",
              )}
            >
              <FabIcon className="h-6 w-6" />
            </Link>
            <span
              className={cn(
                "mt-1 text-[10px] font-bold leading-none",
                fabActive
                  ? mode === "pro"
                    ? "text-workon-primary"
                    : "text-workon-copper"
                  : "text-workon-stone",
              )}
            >
              {fab.label}
            </span>
          </div>

          {BOTTOM_NAV_RIGHT.map(renderTab)}
        </div>
      </div>
    </nav>
  );
}
