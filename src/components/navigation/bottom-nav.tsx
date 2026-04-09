"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Phone, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/**
 * Bottom navigation (mobile shell).
 *
 * Layout matches the target mockups:
 *   [Accueil] [Chercher]  <FAB>  [Messages] [Profil]
 *
 * The center slot is a raised orange phone FAB ("Réserver"),
 * reinforcing the "ligne directe vers le travail instantané"
 * positioning. The FAB links to /search which is the canonical
 * entry point to browse and reserve a worker.
 */

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
};

const leftTabs: Tab[] = [
  { href: "/home",   label: "Accueil",  icon: Home },
  { href: "/search", label: "Chercher", icon: Search },
];

const rightTabs: Tab[] = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile",  label: "Profil",   icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
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
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
          active ? "text-[#FF4D1C]" : "text-white/50 hover:text-white/80",
        )}
      >
        <div className="relative">
          <Icon className="h-5 w-5" />
          {tab.href === "/messages" && unread && unread.count > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-[#FF4D1C] text-[10px] font-bold text-white flex items-center justify-center">
              {unread.count > 99 ? "99+" : unread.count}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">{tab.label}</span>
      </Link>
    );
  };

  const fabActive = isActive("/search") || isActive("/reserve");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-neutral-900/95 backdrop-blur-lg safe-area-bottom">
      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto">
        {leftTabs.map(renderTab)}

        {/* Center: raised FAB "Réserver" */}
        <div className="flex-1 flex items-start justify-center">
          <Link
            href="/search"
            aria-label="Réserver un pro"
            className={cn(
              "flex items-center justify-center h-14 w-14 -mt-6 rounded-full transition-all",
              "bg-[#FF4D1C] text-white",
              "shadow-lg shadow-[#FF4D1C]/40 hover:shadow-xl hover:shadow-[#FF4D1C]/50",
              "ring-4 ring-neutral-900",
              fabActive && "scale-105",
            )}
          >
            <Phone className="h-6 w-6" />
          </Link>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
