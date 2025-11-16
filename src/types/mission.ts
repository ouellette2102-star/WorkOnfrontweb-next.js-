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

