/**
 * i18n-labels — canonical FR display labels for backend enums and role codes.
 *
 * Why this file exists:
 * WorkOn FE historically mixed 4 vocabularies for the same concept
 * (worker/Worker/Travailleur/"Je cherche des missions"). This one file
 * is the single source of truth for how internal codes render in the UI.
 *
 * Rules:
 * - Import `roleLabel`, `modeLabel`, `missionStatusLabel` wherever a user-
 *   facing label is shown. Do NOT hardcode "Travailleur" / "Worker" etc.
 * - When backend gains a new status, add it here before landing the FE.
 */

// ─── Roles (Pro / Client only, kept intentionally binary) ───────────
export const ROLE_LABEL = {
  worker: "Pro",
  employer: "Client",
  residential_client: "Client",
  admin: "Admin",
} as const;

export function roleLabel(role?: string | null): string {
  if (!role) return "";
  return (ROLE_LABEL as Record<string, string>)[role] ?? role;
}

// ─── Mode context (pro vs client) ───────────────────────────────────
export const MODE_LABEL = {
  pro: "Pro",
  client: "Client",
} as const;

export function modeLabel(mode?: string | null): string {
  if (!mode) return "";
  return (MODE_LABEL as Record<string, string>)[mode] ?? mode;
}

// ─── Mission status (LocalMissionStatus enum — backend canonical) ───
export const MISSION_STATUS_LABEL = {
  open: "Ouverte",
  assigned: "Assignée",
  in_progress: "En cours",
  completed: "Terminée",
  paid: "Payée",
  cancelled: "Annulée",
} as const;

export type MissionStatus = keyof typeof MISSION_STATUS_LABEL;

export function missionStatusLabel(status?: string | null): string {
  if (!status) return "";
  const key = status.toLowerCase();
  return (
    (MISSION_STATUS_LABEL as Record<string, string>)[key] ?? status
  );
}

// Status → color tokens (for badges)
export const MISSION_STATUS_COLOR: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export function missionStatusColor(status?: string | null): string {
  if (!status) return MISSION_STATUS_COLOR.completed;
  return MISSION_STATUS_COLOR[status.toLowerCase()] ?? MISSION_STATUS_COLOR.completed;
}

// ─── Offer status ───────────────────────────────────────────────────
export const OFFER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  DECLINED: "Refusée",
};

export function offerStatusLabel(status?: string | null): string {
  if (!status) return "";
  return OFFER_STATUS_LABEL[status] ?? status;
}

// ─── Subscription plan ──────────────────────────────────────────────
export const PLAN_LABEL: Record<string, string> = {
  FREE: "Gratuit",
  PRO: "Pro",
  PREMIUM: "Premium",
  CLIENT_PRO: "Client Pro",
  WORKER_PRO: "Pro",
  CLIENT_BUSINESS: "Client Business",
};

export function planLabel(plan?: string | null): string {
  if (!plan) return PLAN_LABEL.FREE;
  return PLAN_LABEL[plan] ?? plan;
}

// ─── Subscription status ────────────────────────────────────────────
export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actif",
  TRIALING: "Essai",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Annulé",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
  INCOMPLETE: "Incomplet",
};

export function subscriptionStatusLabel(s?: string | null): string {
  if (!s) return "";
  return SUBSCRIPTION_STATUS_LABEL[s] ?? s;
}

// ─── Lead status ────────────────────────────────────────────────────
export const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  CONVERTED: "Converti",
  LOST: "Perdu",
};

export function leadStatusLabel(s?: string | null): string {
  if (!s) return "";
  return LEAD_STATUS_LABEL[s] ?? s;
}

// ─── Role default mode (when an explicit mode isn't set) ────────────
export function defaultModeFromRole(role?: string): "pro" | "client" {
  return role === "worker" ? "pro" : "client";
}
