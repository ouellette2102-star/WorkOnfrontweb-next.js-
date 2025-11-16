import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationResponse {
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
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une notification pour un nouveau message dans une mission
   */
  async createForNewMessage(
    missionId: string,
    messageId: string,
    receiverUserId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: receiverUserId,
        type: NotificationType.NEW_MESSAGE,
        missionId,
        messageId,
      },
    });
  }

  /**
   * Créer une notification pour un changement de statut de mission
   */
  async createForMissionStatusChange(
    missionId: string,
    statusBefore: string,
    statusAfter: string,
    receiverUserId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: receiverUserId,
        type: NotificationType.MISSION_STATUS_CHANGED,
        missionId,
        statusBefore,
        statusAfter,
      },
    });
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getNotifications(
    userId: string,
    unreadOnly = false,
  ): Promise<NotificationResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notif) => ({
      id: notif.id,
      userId: notif.userId,
      type: notif.type,
      missionId: notif.missionId,
      messageId: notif.messageId ?? undefined,
      statusBefore: notif.statusBefore ?? undefined,
      statusAfter: notif.statusAfter ?? undefined,
      isRead: notif.isRead,
      createdAt: notif.createdAt.toISOString(),
      readAt: notif.readAt?.toISOString(),
      mission: notif.mission,
    }));
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Vérifier que la notification appartient bien à l'utilisateur
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Compter les notifications non lues d'un utilisateur
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}

