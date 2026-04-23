"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Map,
  MessageCircle,
  Briefcase,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/**
 * Bottom navigation — Convergence design (5 tabs + Express FAB).
 *
 * Layout:
 *   [Accueil] [Pros]  📞 Appeler  [Carte] [Messages]
 *
 * The center slot is a raised terracotta phone FAB ("Appeler"),
 * linking to /express — the core Express Dispatch feature that
 * sends an instant GPS-based request to nearby professionals.
 *
 * The Messages tab shows a live unread-count badge (polls every 20s).
 */

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
};

const leftTabs: Tab[] = [
  { href: "/home", label: "Accueil", icon: Home },
  { href: "/swipe", label: "Pros", icon: Users },
];

const rightTabs: Tab[] = [
  { href: "/map", label: "Carte", icon: Map },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { mode } = useMode();
  const isWorker = mode === "pro";

  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderTab = (tab: Tab) => {
    const active = isActive(tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition-colors",
          active ? "text-workon-ink" : "text-workon-muted hover:text-workon-gray",
        )}
      >
        <div className="relative">
          <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 1.5} />
          {tab.href === "/messages" && unread && unread.count > 0 && (
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

  // FAB is the primary call-to-action, role-aware:
  // - Pro (worker)  → /missions/mine (mes affectations / opportunités)
  // - Client        → /missions/new  (publier une demande)
  const fabHref = isWorker ? "/missions/mine" : "/missions/new";
  const fabLabel = isWorker ? "Missions" : "Publier";
  const fabActive = isActive(fabHref);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-workon-border bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="relative flex items-end justify-around h-16 max-w-lg mx-auto px-4 pb-4 pt-0">
        {leftTabs.map(renderTab)}

        {/* Center: raised FAB — role-aware */}
        <div className="flex flex-col items-center -mt-5 min-w-[52px]">
          <Link
            href={fabHref}
            aria-label={isWorker ? "Voir les missions disponibles" : "Publier une nouvelle mission"}
            className={cn(
              "flex items-center justify-center h-14 w-14 rounded-full transition-all",
              "bg-workon-accent text-white",
              "shadow-[0_4px_16px_rgba(201,102,70,0.3)]",
              "hover:shadow-[0_4px_24px_rgba(201,102,70,0.45)]",
              fabActive && "shadow-[0_4px_20px_rgba(201,102,70,0.4)]",
            )}
          >
            {isWorker ? (
              <Briefcase className="h-7 w-7" />
            ) : (
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            )}
          </Link>
          <span
            className={cn(
              "text-[10px] mt-1 font-semibold",
              fabActive ? "text-workon-accent" : "text-workon-gray",
            )}
          >
            {fabLabel}
          </span>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
