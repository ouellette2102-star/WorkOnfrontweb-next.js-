/**
 * Mission Status Utilities
 * Source de vérité centralisée pour les labels, couleurs et helpers de statut mission.
 *
 * PR-21: Verrouillage du statut COMPLETED + cohérence UI
 */

import { MissionStatus } from "@/types/mission";

/**
 * Labels UI pour chaque statut
 * Utilisé dans les badges, listes, et affichages
 */
export const STATUS_LABELS: Record<MissionStatus, string> = {
  [MissionStatus.CREATED]: "Disponible",
  [MissionStatus.RESERVED]: "Réservée",
  [MissionStatus.IN_PROGRESS]: "En cours",
  [MissionStatus.COMPLETED]: "Terminée",
  [MissionStatus.CANCELLED]: "Annulée",
};

/**
 * Classes Tailwind pour chaque statut (badges)
 */
export const STATUS_COLORS: Record<MissionStatus, string> = {
  [MissionStatus.CREATED]: "bg-green-500/10 text-green-400 border-green-500/20",
  [MissionStatus.RESERVED]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  [MissionStatus.IN_PROGRESS]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  [MissionStatus.COMPLETED]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  [MissionStatus.CANCELLED]: "bg-red-500/10 text-red-400 border-red-500/20",
};

/**
 * Icônes/emojis pour chaque statut
 */
export const STATUS_ICONS: Record<MissionStatus, string> = {
  [MissionStatus.CREATED]: "🟢",
  [MissionStatus.RESERVED]: "🟡",
  [MissionStatus.IN_PROGRESS]: "🔵",
  [MissionStatus.COMPLETED]: "✅",
  [MissionStatus.CANCELLED]: "❌",
};

/**
 * Obtenir le label UI d'un statut (avec fallback)
 */
export function getStatusLabel(status: MissionStatus | string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as MissionStatus];
  }
  return status; // Fallback: retourne le statut brut
}

/**
 * Obtenir les classes CSS d'un statut (avec fallback)
 */
export function getStatusColor(status: MissionStatus | string): string {
  if (status in STATUS_COLORS) {
    return STATUS_COLORS[status as MissionStatus];
  }
  return "bg-gray-500/10 text-gray-400 border-gray-500/20"; // Fallback
}

/**
 * Obtenir l'icône d'un statut (avec fallback)
 */
export function getStatusIcon(status: MissionStatus | string): string {
  if (status in STATUS_ICONS) {
    return STATUS_ICONS[status as MissionStatus];
  }
  return "⚪"; // Fallback
}

/**
 * Vérifier si une mission est terminée
 */
export function isCompleted(status: MissionStatus | string): boolean {
  return status === MissionStatus.COMPLETED;
}

/**
 * Vérifier si une mission est active (en cours ou réservée)
 */
export function isActive(status: MissionStatus | string): boolean {
  return (
    status === MissionStatus.RESERVED ||
    status === MissionStatus.IN_PROGRESS
  );
}

/**
 * Vérifier si une mission peut être payée
 */
export function canBePaid(status: MissionStatus | string): boolean {
  return status === MissionStatus.COMPLETED;
}

/**
 * Vérifier si une mission peut recevoir un avis
 */
export function canBeReviewed(status: MissionStatus | string): boolean {
  return status === MissionStatus.COMPLETED;
}

/**
 * Vérifier si le chat est disponible
 */
export function canAccessChat(status: MissionStatus | string): boolean {
  return (
    status === MissionStatus.RESERVED ||
    status === MissionStatus.IN_PROGRESS ||
    status === MissionStatus.COMPLETED
  );
}

