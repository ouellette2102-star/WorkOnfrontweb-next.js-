/**
 * Hook pour afficher des notifications de changement de statut mission
 * Utilise sonner (déjà installé) pour les toasts
 * PR-24: Notifications & Statuts Mission E2E
 */

"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { getMissionStatusMessage, type StatusChangeInfo } from "@/lib/notification-messages";

type NotifyStatusChangeOptions = {
  fromStatus?: string;
  toStatus: string;
  missionId: string;
  missionTitle?: string;
  isWorker?: boolean;
};

/**
 * Hook pour notifier les changements de statut de mission
 */
export function useStatusNotification() {
  /**
   * Notifier un changement de statut avec toast approprié
   */
  const notifyStatusChange = useCallback(
    ({ fromStatus, toStatus, missionId, missionTitle, isWorker = false }: NotifyStatusChangeOptions) => {
      const info = getMissionStatusMessage(
        fromStatus,
        toStatus,
        missionId,
        missionTitle,
        isWorker
      );

      showToast(info);
    },
    []
  );

  /**
   * Afficher un toast de succès générique
   */
  const notifySuccess = useCallback((title: string, message?: string) => {
    toast.success(title, {
      description: message,
      duration: 4000,
    });
  }, []);

  /**
   * Afficher un toast d'erreur
   */
  const notifyError = useCallback((title: string, message?: string) => {
    toast.error(title, {
      description: message,
      duration: 5000,
    });
  }, []);

  /**
   * Afficher un toast d'info
   */
  const notifyInfo = useCallback((title: string, message?: string) => {
    toast.info(title, {
      description: message,
      duration: 4000,
    });
  }, []);

  return {
    notifyStatusChange,
    notifySuccess,
    notifyError,
    notifyInfo,
  };
}

/**
 * Afficher un toast basé sur StatusChangeInfo
 */
function showToast(info: StatusChangeInfo) {
  const options = {
    description: info.message,
    duration: 5000,
    action: info.action
      ? {
          label: info.action.label,
          onClick: () => {
            window.location.href = info.action!.href;
          },
        }
      : undefined,
  };

  const toastTitle = `${info.icon} ${info.title}`;

  switch (info.variant) {
    case "success":
      toast.success(toastTitle, options);
      break;
    case "warning":
      toast.warning(toastTitle, options);
      break;
    case "error":
      toast.error(toastTitle, options);
      break;
    case "info":
    default:
      toast.info(toastTitle, options);
      break;
  }
}

/**
 * Fonction utilitaire pour notifier sans hook (pour les actions serveur)
 */
export function notifyMissionStatus(
  fromStatus: string | undefined,
  toStatus: string,
  missionId: string,
  missionTitle?: string,
  isWorker: boolean = false
) {
  const info = getMissionStatusMessage(
    fromStatus,
    toStatus,
    missionId,
    missionTitle,
    isWorker
  );
  showToast(info);
}



