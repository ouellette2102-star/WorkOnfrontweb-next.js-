"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { HAMBURGER_ITEMS, isNavItemVisible, type NavItem } from "@/lib/nav";
import { WorkOnWordmark } from "@/components/brand/workon-wordmark";
import { cn } from "@/lib/utils";
import {
  Bell,
  Briefcase,
  ChevronRight,
  FileCheck,
  LogOut,
  MapPin,
  Menu,
  Scale,
  ShieldCheck,
  WalletCards,
  Users,
  X,
} from "lucide-react";

const MENU_GROUPS: Array<{ label: string; ids: string[] }> = [
  {
    label: "Compte",
    ids: [
      "profile",
      "trust-center",
      "missions-mine-pro",
      "missions-mine-client",
    ],
  },
  {
    label: "Argent et paiements",
    ids: ["earnings", "worker-payments", "invoices", "subscription"],
  },
  {
    label: "Opérations",
    ids: ["leads", "bookings", "calendar", "contracts"],
  },
  {
    label: "Confiance",
    ids: ["reviews", "disputes"],
  },
  {
    label: "Support",
    ids: ["support", "settings", "admin"],
  },
];
const ACCOUNT_MENU_ID = "workon-account-menu";

function groupMenuItems(items: NavItem[]) {
  return MENU_GROUPS.map((group) => ({
    label: group.label,
    items: group.ids
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is NavItem => Boolean(item)),
  })).filter((group) => group.items.length > 0);
}

function countActiveContracts(
  contracts?: Array<{ status?: string | null }>,
): number {
  return (contracts ?? []).filter((contract) =>
    ["PENDING", "ACCEPTED"].includes(contract.status ?? ""),
  ).length;
}

function countActiveDisputes(disputes?: Array<{ status?: string | null }>): number {
  return (disputes ?? []).filter((dispute) =>
    ["OPEN", "IN_MEDIATION"].includes(dispute.status ?? ""),
  ).length;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useMode();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const { data: notifCount } = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: () => api.getNotificationUnreadCount(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  const { data: menuContracts } = useQuery({
    queryKey: ["menu-contracts"],
    queryFn: () => api.getMyContracts(),
    enabled: menuOpen && !!user,
    retry: false,
    staleTime: 45_000,
  });

  const { data: menuDisputes } = useQuery({
    queryKey: ["menu-disputes"],
    queryFn: () => api.getMyDisputes(),
    enabled: menuOpen && !!user,
    retry: false,
    staleTime: 45_000,
  });

  const { data: menuEarnings } = useQuery({
    queryKey: ["menu-earnings-summary"],
    queryFn: () => api.getEarningsSummary(),
    enabled: menuOpen && mode === "pro" && !!user,
    retry: false,
    staleTime: 45_000,
  });

  const unread = notifCount?.count ?? 0;
  const currentRoleLabel = mode === "pro" ? "Pro" : "Client";
  const contractCount = countActiveContracts(menuContracts);
  const disputeCount = countActiveDisputes(menuDisputes);
  const pendingMoney = menuEarnings?.totalPending ?? 0;

  const menuItems = useMemo(
    () =>
      HAMBURGER_ITEMS.filter((item) =>
        isNavItemVisible(item, { mode, role: user?.role }),
      ),
    [mode, user?.role],
  );

  const groupedMenuItems = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-[70] border-b border-workon-line bg-workon-surface/90 shadow-[0_10px_30px_rgba(27,26,24,0.05)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/home" className="flex min-w-0 flex-col gap-0.5 text-workon-ink">
              <WorkOnWordmark size="md" />
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-workon-stone min-[380px]:block">
                Local sécurisé
              </span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={`Mode actuel : ${currentRoleLabel}. Cliquer pour changer.`}
                aria-controls={ACCOUNT_MENU_ID}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                data-testid="mode-pill"
                data-mode={mode}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors",
                  mode === "pro"
                    ? "border-workon-primary/25 bg-workon-primary/10 text-workon-primary hover:bg-workon-primary/15"
                    : "border-workon-copper/25 bg-workon-copper/10 text-workon-copper hover:bg-workon-copper/15",
                )}
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

          <div className="flex items-center gap-2">
            {user?.city && (
              <span className="hidden items-center gap-1 rounded-full border border-workon-border bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-workon-stone min-[420px]:inline-flex">
                <MapPin className="h-3 w-3 text-workon-copper" />
                {user.city}
              </span>
            )}

            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-workon-gray transition-colors hover:border-workon-border hover:bg-white hover:text-workon-ink"
              aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-workon-copper px-1 text-[10px] font-bold text-white shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-workon-border bg-white/80 text-workon-ink shadow-sm transition-colors hover:bg-workon-bg-cream"
              aria-label="Menu"
              aria-controls={ACCOUNT_MENU_ID}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              data-testid="topbar-menu-button"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[55] bg-workon-graphite/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={ACCOUNT_MENU_ID}
            role="dialog"
            aria-label="Menu du compte WorkOn"
            className="fixed left-0 right-0 top-16 z-[60] max-h-[76vh] overflow-y-auto border-b border-workon-border bg-workon-surface/95 shadow-[0_24px_70px_rgba(27,26,24,0.18)] backdrop-blur-xl"
          >
            <div className="workon-dark-panel border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-workon-primary text-sm font-bold text-white shadow-sm">
                  {initials || "WO"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-white/70">
                    <ShieldCheck className="h-3.5 w-3.5 text-workon-trust-green" />
                    Profil {currentRoleLabel} protégé
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Link
                  href={mode === "pro" ? "/earnings" : "/invoices"}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15"
                >
                  <WalletCards className="mb-2 h-4 w-4 text-workon-gold" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                    Argent
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {mode === "pro" ? `${pendingMoney.toFixed(0)} $` : "Factures"}
                  </p>
                </Link>
                <Link
                  href="/contracts"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15"
                >
                  <FileCheck className="mb-2 h-4 w-4 text-workon-gold" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                    Contrats
                  </p>
                  <p className="mt-1 text-sm font-black">{contractCount}</p>
                </Link>
                <Link
                  href="/disputes"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15"
                >
                  <Scale className="mb-2 h-4 w-4 text-workon-gold" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                    Litiges
                  </p>
                  <p className="mt-1 text-sm font-black">{disputeCount}</p>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center border-b border-workon-border px-4 py-3">
              <div className="flex rounded-full border border-workon-border bg-workon-bg p-0.5">
                <button
                  onClick={() => setMode("pro")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    mode === "pro"
                      ? "bg-workon-primary text-white shadow-sm"
                      : "text-workon-muted hover:text-workon-ink",
                  )}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Pro
                </button>
                <button
                  onClick={() => setMode("client")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    mode === "client"
                      ? "bg-workon-copper text-white shadow-sm"
                      : "text-workon-muted hover:text-workon-ink",
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  Client
                </button>
              </div>
            </div>

            <nav className="space-y-4 px-3 py-4">
              {groupedMenuItems.map((group) => (
                <div key={group.label}>
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-workon-stone">
                    {group.label}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-workon-border bg-white/80">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-testid={`menu-${item.id}`}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 border-b border-workon-border/70 px-3 py-3 transition-colors last:border-b-0",
                            active
                              ? "bg-workon-primary-subtle text-workon-primary"
                              : "text-workon-ink hover:bg-workon-bg-cream",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              active
                                ? "bg-workon-primary text-white"
                                : "bg-workon-bg text-workon-stone",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 text-sm font-semibold">
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-workon-muted" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-workon-border px-3 py-3">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-workon-accent transition-colors hover:bg-workon-accent-subtle"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-workon-accent-subtle">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
