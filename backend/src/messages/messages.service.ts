import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MessageSenderRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

export interface MessageResponse {
  id: string;
  missionId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  content: string;
  createdAt: string;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie que l'utilisateur a le droit d'accéder au chat de cette mission
   * Retourne { canAccess: boolean, senderRole: 'WORKER' | 'EMPLOYER' | null }
   */
  private async checkMissionAccess(
    missionId: string,
    clerkUserId: string,
  ): Promise<{ canAccess: boolean; senderRole: MessageSenderRole | null }> {
    // Récupérer la mission avec les relations nécessaires
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        employerId: true,
        workerId: true,
        employer: {
          select: {
            userId: true,
            user: {
              select: {
                clerkId: true,
              },
            },
          },
        },
        worker: {
          select: {
            userId: true,
            user: {
              select: {
                clerkId: true,
              },
            },
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    // Vérifier si l'utilisateur est l'employeur
    if (mission.employer.user.clerkId === clerkUserId) {
      return { canAccess: true, senderRole: MessageSenderRole.EMPLOYER };
    }

    // Vérifier si l'utilisateur est le worker assigné
    if (mission.worker && mission.worker.user.clerkId === clerkUserId) {
      return { canAccess: true, senderRole: MessageSenderRole.WORKER };
    }

    return { canAccess: false, senderRole: null };
  }

  async getMessagesForMission(
    missionId: string,
    clerkUserId: string,
  ): Promise<MessageResponse[]> {
    const { canAccess } = await this.checkMissionAccess(missionId, clerkUserId);

    if (!canAccess) {
      throw new ForbiddenException(
        "Vous n'avez pas accès aux messages de cette mission",
      );
    }

    const messages = await this.prisma.message.findMany({
      where: { missionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        missionId: true,
        senderId: true,
        senderRole: true,
        content: true,
        createdAt: true,
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      missionId: msg.missionId,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  async createMessage(
    missionId: string,
    clerkUserId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponse> {
    // Valider que le contenu n'est pas vide (après trim)
    const trimmedContent = dto.content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Le message ne peut pas être vide');
    }

    const { canAccess, senderRole } = await this.checkMissionAccess(
      missionId,
      clerkUserId,
    );

    if (!canAccess || !senderRole) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit d'envoyer des messages pour cette mission",
      );
    }

    // Vérifier que la mission a bien un worker assigné (pas de chat si CREATED)
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: { workerId: true },
    });

    if (!mission || !mission.workerId) {
      throw new BadRequestException(
        'Le chat n\'est disponible que lorsqu\'un worker est assigné à la mission',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        missionId,
        senderId: clerkUserId,
        senderRole,
        content: trimmedContent,
      },
      select: {
        id: true,
        missionId: true,
        senderId: true,
        senderRole: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      id: message.id,
      missionId: message.missionId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

