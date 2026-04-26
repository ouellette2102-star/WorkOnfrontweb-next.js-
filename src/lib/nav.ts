/**
 * Centralized navigation contract.
 *
 * Single source of truth for the bottom-nav FAB, the bottom-nav tabs,
 * and the hamburger menu. Each entry carries an explicit role gate
 * (`visibleFor`) so we never have to repeat `mode === "pro"` ternaries
 * across components.
 *
 * The Phase 3 fix for bugs #10 / #11 lives here:
 *   - #10 — the pro FAB now points at `/missions` (browse open work,
 *     a real action) instead of `/missions/mine` (a passive list view).
 *   - #11 — "Mes affectations" / "Mes missions" is moved into the
 *     hamburger so the FAB slot stays an action button.
 *
 * `route-contract.test.ts` walks `src/app/**` to assert every `href`
 * here resolves to a real Next.js route file. That guard catches the
 * "orphan link" class of bugs the audit catalogued as pattern E.
 */

import {
  Briefcase,
  ClipboardList,
  CreditCard,
  FileCheck,
  HelpCircle,
  Home,
  Inbox,
  Map as MapIcon,
  MessageCircle,
  Plus,
  Settings,
  Star,
  User,
  Users,
  Wallet,
  Wrench,
  Crown,
  AlertTriangle,
  FileText,
  Calendar,
  type LucideIcon,
} from "lucide-react";

export type NavMode = "pro" | "client";
export type NavRole = "worker" | "employer" | "client" | "admin";

export interface NavItem {
  /** Stable client-side identifier — used as React key + test id. */
  id: string;
  /** Display label (FR). */
  label: string;
  /** Next.js route. Must exist in `src/app/`. */
  href: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /**
   * Role / mode gates. If omitted, the item shows for everyone signed in.
   *  - `modes`: which marketplace mode (Pro/Client toggle in the topbar)
   *  - `roles`: which backend `LocalUser.role` value
   * Both are AND-ed when both present. An item shows when *all* declared
   * gates pass.
   */
  visibleIn?: {
    modes?: NavMode[];
    roles?: NavRole[];
  };
  /** Free-form contract description used in the route-exists test. */
  intent: string;
}

/**
 * Hamburger menu — slow lane. Universal items first, then mode-specific.
 *
 * Bug #11: "Mes missions" is added here for both modes so the user can
 * always reach their assignment / publication list without hijacking
 * the FAB.
 */
export const HAMBURGER_ITEMS: NavItem[] = [
  {
    id: "profile",
    label: "Mon profil",
    href: "/profile",
    icon: User,
    intent: "Edit personal + worker card profile",
  },
  // #11 — "Mes missions" lives in the hamburger from Phase 3 onward.
  // Worker label = "Mes affectations" (assigned work), Client label =
  // "Mes publications" (published demands). Same /missions/mine route
  // because the page already filters by user from the JWT.
  {
    id: "missions-mine-pro",
    label: "Mes affectations",
    href: "/missions/mine",
    icon: ClipboardList,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: list of missions the worker is assigned to",
  },
  {
    id: "missions-mine-client",
    label: "Mes publications",
    href: "/missions/mine",
    icon: ClipboardList,
    visibleIn: { modes: ["client"] },
    intent: "Client: list of missions the user has created",
  },

  // Pro-only (revenue + ops).
  {
    id: "earnings",
    label: "Mes revenus",
    href: "/earnings",
    icon: CreditCard,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: history of paid mission amounts",
  },
  {
    id: "worker-payments",
    label: "Mes paiements",
    href: "/worker/payments",
    icon: Wallet,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: Stripe Connect onboarding + account status",
  },
  {
    id: "leads",
    label: "Mes leads",
    href: "/leads/mine",
    icon: Inbox,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: leads delivered through the platform",
  },
  {
    id: "bookings",
    label: "Mes réservations",
    href: "/bookings",
    icon: ClipboardList,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: bookings the worker has accepted",
  },
  {
    id: "calendar",
    label: "Disponibilités",
    href: "/calendar",
    icon: Calendar,
    visibleIn: { modes: ["pro"] },
    intent: "Pro: weekly availability editor",
  },

  // Client-only.
  {
    id: "invoices",
    label: "Mes factures",
    href: "/invoices",
    icon: FileText,
    visibleIn: { modes: ["client"] },
    intent: "Client: invoices issued for the user's missions",
  },

  // Universal trust + admin.
  {
    id: "contracts",
    label: "Mes contrats",
    href: "/contracts",
    icon: FileCheck,
    intent: "All: contracts where the user is employer or worker",
  },
  {
    id: "reviews",
    label: "Mes évaluations",
    href: "/reviews",
    icon: Star,
    intent: "All: reviews received by the user",
  },
  {
    id: "disputes",
    label: "Litiges",
    href: "/disputes",
    icon: AlertTriangle,
    intent: "All: dispute history",
  },
  {
    id: "subscription",
    label: "Mon abonnement",
    href: "/settings/subscription",
    icon: Crown,
    intent: "All: subscription tier + billing",
  },
  {
    id: "support",
    label: "Aide & support",
    href: "/support",
    icon: HelpCircle,
    intent: "All: support tickets",
  },
  {
    id: "settings",
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    intent: "All: account settings",
  },
  {
    id: "admin",
    label: "Administration",
    href: "/admin",
    icon: Wrench,
    visibleIn: { roles: ["admin"] },
    intent: "Admin: platform admin dashboard",
  },
];

/**
 * Bottom nav — fast lane (5 slots: Home, Pros, FAB, Map, Messages).
 * Order matters; arrays are rendered as-is.
 */
export const BOTTOM_NAV_LEFT: NavItem[] = [
  {
    id: "home",
    label: "Accueil",
    href: "/home",
    icon: Home,
    intent: "Home feed",
  },
  {
    id: "swipe",
    label: "Pros",
    href: "/swipe",
    icon: Users,
    intent: "Tinder-style discovery (worker for clients, client for pros)",
  },
];

export const BOTTOM_NAV_RIGHT: NavItem[] = [
  {
    id: "map",
    label: "Carte",
    href: "/map",
    icon: MapIcon,
    intent: "Map of nearby pros/missions",
  },
  {
    id: "messages",
    label: "Messages",
    href: "/messages",
    icon: MessageCircle,
    intent: "Conversations with matches/clients/workers",
  },
];

/**
 * FAB — center slot of the bottom nav. ONE entry per mode.
 *
 * #10 fix: pro FAB used to point at `/missions/mine`, which is a
 * passive list view, not an action. The user explicitly asked for
 * "un bouton d'action". We now route to `/missions` (the public
 * open-mission feed) because the worker's primary action is "find
 * work to take", not "look at what I already have".
 *
 * Client FAB stays on `/missions/new` (publish a demand) — already an
 * action.
 */
export const BOTTOM_NAV_FAB: Record<NavMode, NavItem> = {
  pro: {
    id: "fab-pro",
    label: "Missions",
    href: "/missions",
    icon: Briefcase,
    visibleIn: { modes: ["pro"] },
    intent: "Pro action — browse open missions (primary CTA)",
  },
  client: {
    id: "fab-client",
    label: "Publier",
    href: "/missions/new",
    icon: Plus,
    visibleIn: { modes: ["client"] },
    intent: "Client action — publish a new demand (primary CTA)",
  },
};

/** Flat list used by the route-exists test. */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...HAMBURGER_ITEMS,
  ...BOTTOM_NAV_LEFT,
  ...BOTTOM_NAV_RIGHT,
  ...Object.values(BOTTOM_NAV_FAB),
];

/** Helper used by both nav components. */
export function isNavItemVisible(
  item: NavItem,
  ctx: { mode: NavMode; role?: string },
): boolean {
  const gates = item.visibleIn;
  if (!gates) return true;
  if (gates.modes && !gates.modes.includes(ctx.mode)) return false;
  if (gates.roles && (!ctx.role || !gates.roles.includes(ctx.role as NavRole))) {
    return false;
  }
  return true;
}

