"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  MapPin,
  Bell,
  Menu,
  X,
  Home,
  User,
  Briefcase,
  Heart,
  Target,
  BarChart3,
  Calendar,
  CreditCard,
  Receipt,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Star,
  Settings,
  FileText,
  AlertTriangle,
  Gauge,
  Wrench,
  Users,
  ClipboardList,
  Inbox,
  Handshake,
  FileCheck,
} from "lucide-react";

/**
 * Top navigation bar — Convergence design.
 *
 * Features:
 * - WorkOn logo (Work[pin]n)
 * - Notification bell with unread count badge
 * - Hamburger menu with role-aware items
 */
export function TopBar() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useMode();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifCount } = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: () => api.getNotificationUnreadCount(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const unread = notifCount?.count ?? 0;

  const roleLabel = mode === "pro" ? "Mode Pro" : "Mode Client";

  const menuItems = [
    { href: "/home", label: "Tableau de bord", icon: Home },
    { href: "/profile", label: "Mon profil", icon: User },
    { href: "/search", label: "Opportunités", icon: Briefcase },
    { href: "/missions", label: "Mes missions", icon: ClipboardList },
    { href: "/offers", label: "Mes offres", icon: Inbox },
    { href: "/matches", label: "Matches", icon: Handshake },
    { href: "/reviews", label: "Mes avis", icon: Star },
    ...(mode === "pro"
      ? [
          { href: "/leads/mine", label: "Leads entrants", icon: Inbox },
          { href: "/leads", label: "Mes clients (leads)", icon: Target },
          { href: "/worker/availability", label: "Disponibilités", icon: BarChart3 },
          { href: "/calendar", label: "Calendrier", icon: Calendar },
          { href: "/earnings", label: "Mes revenus", icon: CreditCard },
          { href: "/receipts", label: "Reçus", icon: FileCheck },
        ]
      : [
          { href: "/leads/mine", label: "Leads entrants", icon: Inbox },
          { href: "/bookings", label: "Mes réservations", icon: Receipt },
        ]),
    { href: "/contracts", label: "Contrats", icon: FileText },
    { href: "/invoices", label: "Factures", icon: FileCheck },
    { href: "/disputes", label: "Litiges", icon: AlertTriangle },
    { href: "/operator", label: "Centre de commande", icon: Gauge },
    { href: "/settings", label: "Paramètres", icon: Settings },
    { href: "/support", label: "Aide & support", icon: HelpCircle },
    { href: "/profile/verify", label: "Vérification", icon: Shield },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Administration", icon: Wrench }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-workon-border/50 bg-white/70 backdrop-blur-xl">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-0.5 text-xl font-bold font-heading">
          <span className="text-[#1B1A18]">Work</span>
          <MapPin className="h-5 w-5 text-workon-accent" />
          <span className="text-[#1B1A18]">n</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-workon-bg-cream transition-colors"
            aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
          >
            <Bell className="h-5 w-5 text-[#706E6A] hover:text-[#1B1A18] transition-colors" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-workon-accent text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          {/* Menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-workon-bg-cream transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-[#706E6A] hover:text-[#1B1A18] transition-colors" />
            ) : (
              <Menu className="h-5 w-5 text-[#706E6A] hover:text-[#1B1A18] transition-colors" />
            )}
          </button>
        </div>
      </header>

      {/* Dropdown menu overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-14 right-0 left-0 z-40 bg-white/95 backdrop-blur-xl border-b border-workon-border/50 shadow-lg max-h-[70vh] overflow-y-auto">
            {/* User identity */}
            <div className="px-4 py-3 border-b border-workon-border">
              <p className="font-semibold text-workon-ink">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-workon-muted">{roleLabel}</p>
            </div>

            {/* Mode toggle */}
            <div className="px-4 py-3 border-b border-workon-border flex items-center justify-center">
              <div className="bg-workon-bg rounded-full p-0.5 border border-workon-border flex">
                <button
                  onClick={() => setMode("pro")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    mode === "pro"
                      ? "bg-workon-primary text-white"
                      : "text-workon-muted"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Pro
                </button>
                <button
                  onClick={() => setMode("client")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    mode === "client"
                      ? "bg-workon-primary text-white"
                      : "text-workon-muted"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Client
                </button>
              </div>
            </div>

            {/* Menu items */}
            <nav className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? "bg-workon-primary-subtle text-workon-primary font-medium"
                        : "text-workon-ink hover:bg-workon-bg-cream"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-workon-muted" />
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-workon-border py-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-workon-accent hover:bg-workon-accent-subtle transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
