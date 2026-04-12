"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Map,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vintage rotary desk phone — optimised for 28×28 px render inside 56 px FAB.
 * Design: chunky base with visible dial ring + simplified handset on cradle.
 * All shapes use whole-pixel coordinates for crisp rendering at small sizes.
 */
function VintagePhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Base ── rounded box, bottom 60% of the icon */}
      <rect x="3" y="12" width="22" height="13" rx="3.5" />

      {/* ── Dial ring ── the signature rotary circle */}
      <circle cx="14" cy="18.5" r="4.8" fill="white" opacity="0.2" />
      <circle cx="14" cy="18.5" r="3" fill="currentColor" />
      <circle cx="14" cy="18.5" r="1.2" fill="white" opacity="0.35" />

      {/* ── Handset ── two ear cups connected by a thick bar on the cradle */}
      {/* Left ear cup */}
      <rect x="4.5" y="5" width="5" height="8" rx="2.5" />
      {/* Right ear cup */}
      <rect x="18.5" y="5" width="5" height="8" rx="2.5" />
      {/* Handle bar connecting the two cups */}
      <rect x="8" y="7.5" width="12" height="3" rx="1.5" />
    </svg>
  );
}
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
  { href: "/search", label: "Pros", icon: Users },
];

const rightTabs: Tab[] = [
  { href: "/map", label: "Carte", icon: Map },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();

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
          active ? "text-[#1B1A18]" : "text-[#9C9A96] hover:text-[#706E6A]",
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
        {active && <div className="w-1 h-1 rounded-full bg-[#1B1A18] mt-0.5" />}
      </Link>
    );
  };

  const fabActive = isActive("/express");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EAE6DF] bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="relative flex items-end justify-around h-16 max-w-lg mx-auto px-4 pb-4 pt-0">
        {leftTabs.map(renderTab)}

        {/* Center: raised Express FAB "Appeler" */}
        <div className="flex flex-col items-center -mt-5 min-w-[52px]">
          <Link
            href="/express"
            aria-label="Appeler un pro — dispatch express"
            className={cn(
              "flex items-center justify-center h-14 w-14 rounded-full transition-all",
              "bg-workon-accent text-white",
              "shadow-[0_4px_16px_rgba(201,102,70,0.3)]",
              "hover:shadow-[0_4px_24px_rgba(201,102,70,0.45)]",
              fabActive && "shadow-[0_4px_20px_rgba(201,102,70,0.4)]",
            )}
          >
            <VintagePhoneIcon className="h-7 w-7" />
          </Link>
          <span
            className={cn(
              "text-[10px] mt-1 font-semibold",
              fabActive ? "text-workon-accent" : "text-workon-gray",
            )}
          >
            Appeler
          </span>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
