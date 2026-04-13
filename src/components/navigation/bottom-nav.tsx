"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Map,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

/**
 * Vintage rotary desk phone — optimised for 56 px FAB at 2× density.
 * Silhouette: rounded base + dial ring + curved handset resting on cradle.
 */
function VintagePhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Base body ── */}
      <rect x="8" y="26" width="40" height="22" rx="6" />

      {/* ── Rotary dial ── */}
      <circle cx="28" cy="37" r="8" fill="white" opacity="0.18" />
      <circle cx="28" cy="37" r="5" fill="currentColor" />
      <circle cx="28" cy="37" r="2.2" fill="white" opacity="0.3" />

      {/* ── Handset on cradle ── single curved path */}
      <path
        d="M12 27 C12 27 12 18 12 15 C12 11 14.5 8 18 8 L20 8 C21.5 8 22 9.5 22 11 L22 17 C22 18.5 21 19.5 19.5 19.5 L19 19.5 C18 19.5 17 20.5 17 21.5 L17 23 C17 24 18 25 19 25 L37 25 C38 25 39 24 39 23 L39 21.5 C39 20.5 38 19.5 37 19.5 L36.5 19.5 C35 19.5 34 18.5 34 17 L34 11 C34 9.5 34.5 8 36 8 L38 8 C41.5 8 44 11 44 15 C44 18 44 27 44 27"
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
  { href: "/swipe", label: "Pros", icon: Users },
];

const rightTabs: Tab[] = [
  { href: "/map", label: "Carte", icon: Map },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isWorker = user?.role === "worker";

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

  const fabHref = isWorker ? "/search" : "/express";
  const fabLabel = isWorker ? "Missions" : "Appeler";
  const fabActive = isActive(fabHref);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EAE6DF] bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="relative flex items-end justify-around h-16 max-w-lg mx-auto px-4 pb-4 pt-0">
        {leftTabs.map(renderTab)}

        {/* Center: raised FAB — role-aware */}
        <div className="flex flex-col items-center -mt-5 min-w-[52px]">
          <Link
            href={fabHref}
            aria-label={isWorker ? "Voir les missions disponibles" : "Appeler un pro — dispatch express"}
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
              <VintagePhoneIcon className="h-7 w-7" />
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
