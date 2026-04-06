"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MapPin, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const tabs = [
  { href: "/home", label: "Accueil", icon: Home },
  { href: "/search", label: "Chercher", icon: Search },
  { href: "/map", label: "Carte", icon: MapPin, center: true },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 60_000, // 60s instead of 30s to reduce server load
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
    staleTime: 30_000,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-neutral-900/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-red-accent" : "text-white/50 hover:text-white/70",
              )}
            >
              {tab.center ? (
                <div
                  className={cn(
                    "flex items-center justify-center h-11 w-11 -mt-4 rounded-full",
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "bg-neutral-800 text-white/60",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.href === "/messages" && unread && unread.count > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
                      {unread.count > 99 ? "99+" : unread.count}
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
