/**
 * Mission Status Helpers
 * Centralized status management for missions
 */

import { MissionStatus } from "@/types/mission";

export const STATUS_LABELS: Record<MissionStatus, string> = {
  CREATED: "Créée",
  RESERVED: "Réservée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const STATUS_COLORS: Record<MissionStatus, string> = {
  CREATED: "bg-gray-500/20 text-gray-400",
  RESERVED: "bg-purple-500/20 text-purple-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

export const STATUS_ICONS: Record<MissionStatus, string> = {
  CREATED: "📝",
  RESERVED: "🔒",
  IN_PROGRESS: "⏳",
  COMPLETED: "🎉",
  CANCELLED: "❌",
};

export function getStatusLabel(status: MissionStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: MissionStatus): string {
  return STATUS_COLORS[status] ?? "bg-gray-500/20 text-gray-400";
}

export function getStatusIcon(status: MissionStatus): string {
  return STATUS_ICONS[status] ?? "📋";
}

export function isCompleted(status: MissionStatus): boolean {
  return status === MissionStatus.COMPLETED;
}

export function canAccessChat(status: MissionStatus): boolean {
  return [MissionStatus.RESERVED, MissionStatus.IN_PROGRESS, MissionStatus.COMPLETED].includes(status);
}

export function canBePaid(status: MissionStatus): boolean {
  return status === MissionStatus.COMPLETED;
}

export function canBeReviewed(status: MissionStatus): boolean {
  return status === MissionStatus.COMPLETED;
}
