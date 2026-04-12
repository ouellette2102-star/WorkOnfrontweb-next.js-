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
 * Vintage rotary phone icon — full desk phone with handset on top
 * and rotary dial, matching the WorkOn brand ad.
 * Base + cadran + combiné = one unit.
 */
function VintagePhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Phone base — rounded rectangle */}
      <rect x="4" y="14" width="24" height="14" rx="3" opacity="0.9" />
      {/* Rotary dial circle */}
      <circle cx="16" cy="21" r="5" fill="currentColor" />
      <circle cx="16" cy="21" r="3.2" fill="white" opacity="0.25" />
      <circle cx="16" cy="21" r="1.5" fill="currentColor" />
      {/* Dial holes — small circles around the dial */}
      <circle cx="16" cy="17" r="0.6" fill="white" opacity="0.4" />
      <circle cx="19.2" cy="18" r="0.6" fill="white" opacity="0.4" />
      <circle cx="20.5" cy="21" r="0.6" fill="white" opacity="0.4" />
      <circle cx="19.2" cy="24" r="0.6" fill="white" opacity="0.4" />
      <circle cx="16" cy="25" r="0.6" fill="white" opacity="0.4" />
      <circle cx="12.8" cy="24" r="0.6" fill="white" opacity="0.4" />
      <circle cx="11.5" cy="21" r="0.6" fill="white" opacity="0.4" />
      <circle cx="12.8" cy="18" r="0.6" fill="white" opacity="0.4" />
      {/* Handset / combiné — resting on top of the base */}
      <path
        d="M7 14C7 14 7 10 7 8.5C7 6.5 8.5 5 10 5H11C11.8 5 12 5.8 12 6.5V9C12 9.5 11.5 10 11 10H10.5C10 10 9.5 10.5 9.5 11V12C9.5 12.5 10 13 10.5 13H21.5C22 13 22.5 12.5 22.5 12V11C22.5 10.5 22 10 21.5 10H21C20.5 10 20 9.5 20 9V6.5C20 5.8 20.2 5 21 5H22C23.5 5 25 6.5 25 8.5C25 10 25 14 25 14"
        fill="currentColor"
      />
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
