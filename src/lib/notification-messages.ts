/**
 * Messages de notification orientés action pour les changements de statut
 * PR-24: Notifications & Statuts Mission E2E
 */

import { MissionStatus } from "@/types/mission";
import { NotificationType } from "@/types/notification";

export type StatusChangeInfo = {
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  icon: string;
  variant: "info" | "success" | "warning" | "error";
};

/**
 * Obtenir un message orienté action pour un changement de statut
 * @param fromStatus Statut précédent
 * @param toStatus Nouveau statut
 * @param missionId ID de la mission
 * @param missionTitle Titre de la mission (optionnel)
 * @param isWorker True si le destinataire est le worker
 */
export function getMissionStatusMessage(
  fromStatus: string | undefined,
  toStatus: string,
  missionId: string,
  missionTitle?: string,
  isWorker: boolean = false
): StatusChangeInfo {
  const title = missionTitle ? `"${missionTitle}"` : "Mission";

  // Transitions pour le WORKER
  if (isWorker) {
    switch (toStatus) {
      case MissionStatus.RESERVED:
        return {
          title: "Mission réservée !",
          message: `Vous avez réservé ${title}. Préparez-vous pour le jour J.`,
          action: { label: "Voir la mission", href: `/missions/${missionId}` },
          icon: "🎯",
          variant: "success",
        };

      case MissionStatus.IN_PROGRESS:
        return {
          title: "Mission en cours",
          message: `${title} est maintenant en cours. Bon travail !`,
          action: { label: "Ouvrir le chat", href: `/missions/${missionId}/chat` },
          icon: "🚀",
          variant: "info",
        };

      case MissionStatus.COMPLETED:
        return {
          title: "Mission terminée !",
          message: `${title} est complétée. Le paiement sera bientôt traité.`,
          action: { label: "Voir les détails", href: `/missions/${missionId}` },
          icon: "✅",
          variant: "success",
        };

      case MissionStatus.CANCELLED:
        return {
          title: "Mission annulée",
          message: `${title} a été annulée par l'employeur.`,
          action: { label: "Voir d'autres missions", href: "/missions/available" },
          icon: "❌",
          variant: "warning",
        };

      default:
        return {
          title: "Statut mis à jour",
          message: `${title} : ${fromStatus ?? "?"} → ${toStatus}`,
          icon: "📋",
          variant: "info",
        };
    }
  }

  // Transitions pour l'EMPLOYER
  switch (toStatus) {
    case MissionStatus.RESERVED:
      return {
        title: "Un worker a réservé !",
        message: `${title} vient d'être réservée. Contactez-le pour confirmer.`,
        action: { label: "Ouvrir le chat", href: `/missions/${missionId}/chat` },
        icon: "🙋",
        variant: "success",
      };

    case MissionStatus.IN_PROGRESS:
      return {
        title: "Travail en cours",
        message: `Le worker a commencé ${title}.`,
        action: { label: "Suivre la mission", href: `/missions/${missionId}` },
        icon: "⚡",
        variant: "info",
      };

    case MissionStatus.COMPLETED:
      return {
        title: "Mission terminée !",
        message: `${title} est complétée. Procédez au paiement et laissez un avis.`,
        action: { label: "Payer & évaluer", href: `/missions/${missionId}/pay` },
        icon: "🎉",
        variant: "success",
      };

    case MissionStatus.CANCELLED:
      return {
        title: "Mission annulée",
        message: `${title} a été annulée.`,
        icon: "🚫",
        variant: "warning",
      };

    default:
      return {
        title: "Statut mis à jour",
        message: `${title} : ${fromStatus ?? "?"} → ${toStatus}`,
        icon: "📋",
        variant: "info",
      };
  }
}

/**
 * Obtenir un message court pour une notification (utilisé dans la liste)
 */
export function getNotificationShortMessage(
  type: NotificationType,
  missionTitle?: string,
  statusBefore?: string,
  statusAfter?: string
): string {
  const title = missionTitle ?? "Mission";

  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return `💬 Nouveau message sur "${title}"`;

    case NotificationType.MISSION_STATUS_CHANGED:
      if (statusAfter === MissionStatus.COMPLETED) {
        return `✅ "${title}" est terminée — laissez un avis`;
      }
      if (statusAfter === MissionStatus.RESERVED) {
        return `🎯 "${title}" a été réservée`;
      }
      if (statusAfter === MissionStatus.IN_PROGRESS) {
        return `🚀 "${title}" est en cours`;
      }
      if (statusAfter === MissionStatus.CANCELLED) {
        return `❌ "${title}" a été annulée`;
      }
      return `📋 "${title}" : ${statusBefore ?? "?"} → ${statusAfter ?? "?"}`;

    case NotificationType.MISSION_TIME_EVENT:
      if (statusBefore === "CHECK_IN") {
        return `⏰ Le worker s'est enregistré sur "${title}"`;
      }
      if (statusBefore === "CHECK_OUT") {
        return `⏱️ Le worker a terminé sur "${title}"`;
      }
      return `⏰ Événement temps sur "${title}"`;

    default:
      return "Nouvelle notification";
  }
}

/**
 * Obtenir la couleur de fond selon le variant
 */
export function getVariantStyles(variant: StatusChangeInfo["variant"]): string {
  switch (variant) {
    case "success":
      return "bg-green-500/10 border-green-500/20 text-green-400";
    case "warning":
      return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
    case "error":
      return "bg-red-500/10 border-red-500/20 text-red-400";
    case "info":
    default:
      return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  }
}

