"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";

export function NotificationBadge() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: () => api.getNotificationUnreadCount(),
    enabled: !authLoading && isAuthenticated,
    refetchInterval: 30_000,
    retry: false,
  });

  const unreadCount = data?.count ?? 0;

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center rounded-full p-2 text-white transition hover:bg-white/10"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
    >
      <Bell className="h-6 w-6" />

      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
