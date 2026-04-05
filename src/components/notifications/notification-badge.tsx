"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import Link from "next/link";
import { fetchUnreadCount } from "@/lib/notifications-api";

export function NotificationBadge() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const token = getAccessToken();
        if (!token) return;

        const count = await fetchUnreadCount(token);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error loading unread count:", error);
      }
    };

    loadUnreadCount();

    // Polling toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center rounded-full p-2 text-white transition hover:bg-white/10"
      aria-label="Notifications"
    >
      {/* Icône cloche */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge avec compte */}
      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

