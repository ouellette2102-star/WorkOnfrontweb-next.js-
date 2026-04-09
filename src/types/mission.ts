/**
 * Types pour les missions WorkOn
 * Alignés avec le backend NestJS + Prisma
 * 
 * CREATED: Mission créée, en attente de worker
 * RESERVED: Un worker a réservé la mission
 * IN_PROGRESS: Mission en cours d'exécution
 * COMPLETED: Mission terminée avec succès
 * CANCELLED: Mission annulée par l'employeur
 */

export enum MissionStatus {
  CREATED = "CREATED",
  RESERVED = "RESERVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type Mission = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  address?: string;
  hourlyRate?: number;
  startsAt?: string;
  endsAt?: string;
  employerId: string;
  workerId?: string;
  status: MissionStatus;
  priceCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type CreateMissionPayload = {
  title: string;
  description?: string;
  category?: string;
  city?: string;
  address?: string;
  hourlyRate?: number;
  startsAt?: string;
  endsAt?: string;
};

export type ListMissionsFilters = {
  city?: string;
  category?: string;
};

export type UpdateMissionStatusPayload = {
  status: MissionStatus;
};

export type ReserveMissionResponse = Mission;

/**
 * Type pour le feed de missions incluant la distance et les infos de l'employeur
 */
export type MissionFeedItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  hourlyRate: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  employerId: string;
  employerName: string | null;
  priceCents: number;
  currency: string;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type MissionFeedFilters = {
  category?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
};

// ─── Mappers ────────────────────────────────────────────────────────────────
//
// The canonical backend shape is `MissionResponse` (api-client.ts:55) with
// lowercase statuses ("open" | "assigned" | "in_progress" | ...) and a flat
// `price` number. Legacy worker dashboard cards still expect the `Mission`
// shape above with uppercase `MissionStatus` enum and `priceCents`. This
// mapper bridges the two so the cards can route through the canonical
// `api.getMyAssignments()` / `api.getNearbyMissions()` instead of the
// broken missions-api shim.
//
// One-way transform (backend → legacy). When the cards are rewritten
// against `MissionResponse` directly, this mapper can be deleted along
// with the legacy `Mission` type.

interface MissionResponseLike {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "paid" | "cancelled";
  price: number;
  city: string;
  address: string | null;
  createdByUserId: string;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<MissionResponseLike["status"], MissionStatus> = {
  open: MissionStatus.CREATED,
  assigned: MissionStatus.RESERVED,
  in_progress: MissionStatus.IN_PROGRESS,
  completed: MissionStatus.COMPLETED,
  paid: MissionStatus.COMPLETED,
  cancelled: MissionStatus.CANCELLED,
};

/**
 * Same idea as `missionResponseToMission`, but produces the legacy
 * `MissionFeedItem` shape used by the swipe / list / map views in
 * /worker/missions. `MissionResponse` carries `distanceKm` and
 * `latitude`/`longitude` directly from /missions-local/nearby, which
 * cover the feed item's needs. `employerName` is not on the canonical
 * payload — we fill `null` until a dedicated feed endpoint ships.
 */
export function missionResponseToFeedItem(
  r: MissionResponseLike & {
    distanceKm?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  },
): MissionFeedItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    category: r.category ?? null,
    city: r.city ?? null,
    address: r.address ?? null,
    hourlyRate: null,
    startsAt: null,
    endsAt: null,
    status: r.status,
    employerId: r.createdByUserId,
    employerName: null,
    priceCents: Math.round((r.price ?? 0) * 100),
    currency: "CAD",
    distance: r.distanceKm ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    createdAt: r.createdAt,
  };
}

export function missionResponseToMission(r: MissionResponseLike): Mission {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    city: r.city,
    address: r.address ?? undefined,
    employerId: r.createdByUserId,
    workerId: r.assignedToUserId ?? undefined,
    status: STATUS_MAP[r.status] ?? MissionStatus.CREATED,
    priceCents: Math.round((r.price ?? 0) * 100),
    currency: "CAD",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

