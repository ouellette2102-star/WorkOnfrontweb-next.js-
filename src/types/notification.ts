/**
 * Types pour les notifications WorkOn
 */

export enum NotificationType {
  NEW_MESSAGE = "NEW_MESSAGE",
  MISSION_STATUS_CHANGED = "MISSION_STATUS_CHANGED",
}

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  missionId: string;
  messageId?: string;
  statusBefore?: string;
  statusAfter?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  mission?: {
    id: string;
    title: string;
  };
};

