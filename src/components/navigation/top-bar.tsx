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
  Crown,
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
  Wallet,
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

  const currentRoleLabel = mode === "pro" ? "Pro" : "Client";

  // Hamburger menu — 5 essentiels + admin (si applicable).
  // Les autres actions sont sur /home (feed contextuel), dans la BottomNav
  // (missions/chat/pros/carte), ou dans /profile (détails compte).
  const menuItems = [
    { href: "/profile", label: "Mon profil", icon: User },
    ...(mode === "pro"
      ? [
          { href: "/earnings", label: "Mes revenus", icon: CreditCard },
          // "Mes paiements" (Stripe Connect) — distinct de "Mes revenus".
          // Mes revenus = historique des montants payés par mission.
          // Mes paiements = onboarding Stripe Connect + statut du compte.
          // Sans cet item, un worker ne peut pas accéder à son onboarding
          // autrement qu'en tapant l'URL — bloquant pour le revenu.
          { href: "/worker/payments", label: "Mes paiements", icon: Wallet },
          // R3 orphans revealed — pages built, backends consumed, no nav
          // before this PR. Pro-side: leads delivered, bookings received,
          // availability calendar.
          { href: "/leads/mine", label: "Mes leads", icon: Inbox },
          { href: "/bookings", label: "Mes réservations", icon: ClipboardList },
          { href: "/calendar", label: "Disponibilités", icon: Calendar },
        ]
      : [{ href: "/invoices", label: "Mes factures", icon: FileText }]),
    // Universal — both pro and client care about their contracts, reviews,
    // and dispute history.
    { href: "/contracts", label: "Mes contrats", icon: FileCheck },
    { href: "/reviews", label: "Mes évaluations", icon: Star },
    { href: "/disputes", label: "Litiges", icon: AlertTriangle },
    { href: "/settings/subscription", label: "Mon abonnement", icon: Crown },
    { href: "/support", label: "Aide & support", icon: HelpCircle },
    { href: "/settings", label: "Paramètres", icon: Settings },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Administration", icon: Wrench }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-workon-border/50 bg-white/70 backdrop-blur-xl">
        {/* Logo + always-visible mode pill so users know which side of the
            marketplace they are looking at — the biggest source of confusion
            before this change was discovering the Pro/Client toggle buried
            inside the hamburger menu. */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/home"
            className="flex items-center gap-0.5 text-xl font-bold font-heading"
          >
            <span className="text-workon-ink">Work</span>
            <MapPin className="h-5 w-5 text-workon-accent" />
            <span className="text-workon-ink">n</span>
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={`Mode actuel : ${currentRoleLabel}. Cliquer pour changer.`}
              data-testid="mode-pill"
              data-mode={mode}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                mode === "pro"
                  ? "border-workon-primary/30 bg-workon-primary/10 text-workon-primary hover:bg-workon-primary/15"
                  : "border-workon-accent/30 bg-workon-accent/10 text-workon-accent hover:bg-workon-accent/15"
              }`}
            >
              {mode === "pro" ? (
                <Briefcase className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              {currentRoleLabel}
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-workon-bg-cream transition-colors"
            aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
          >
            <Bell className="h-5 w-5 text-workon-gray hover:text-workon-ink transition-colors" />
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
              <X className="h-5 w-5 text-workon-gray hover:text-workon-ink transition-colors" />
            ) : (
              <Menu className="h-5 w-5 text-workon-gray hover:text-workon-ink transition-colors" />
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
              <p className="text-xs text-workon-muted">{currentRoleLabel}</p>
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
