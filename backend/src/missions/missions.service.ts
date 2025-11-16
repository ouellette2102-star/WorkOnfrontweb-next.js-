import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { MissionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListAvailableMissionsDto } from './dto/list-available-missions.dto';
import { UpdateMissionStatusDto } from './dto/update-mission-status.dto';
import { NotificationsService } from '../notifications/notifications.service';

type MissionSelect = {
  id: true;
  title: true;
  description: true;
  category: true;
  city: true;
  address: true;
  hourlyRate: true;
  startsAt: true;
  endsAt: true;
  status: true;
  employerId: true;
  workerId: true;
  priceCents: true;
  currency: true;
  createdAt: true;
  updatedAt: true;
};

type MissionRecord = Prisma.MissionGetPayload<{ select: MissionSelect }>;

const missionSelect: MissionSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  city: true,
  address: true,
  hourlyRate: true,
  startsAt: true,
  endsAt: true,
  status: true,
  employerId: true,
  workerId: true,
  priceCents: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
};

export interface MissionResponse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  hourlyRate: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: MissionStatus;
  employerId: string;
  workerId: string | null;
  priceCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMissionForEmployer(
    userId: string,
    dto: CreateMissionDto,
  ): Promise<MissionResponse> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employer) {
      throw new ForbiddenException('Vous devez être employeur pour créer une mission');
    }

    const mission = await this.prisma.mission.create({
      data: {
        employerId: employer.id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        city: dto.city,
        address: dto.address,
        hourlyRate: dto.hourlyRate ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        status: MissionStatus.CREATED,
        location: this.buildLocation(dto),
        priceCents: this.computePriceCents(dto),
      },
      select: missionSelect,
    });

    return this.mapToResponse(mission);
  }

  async getMissionsForEmployer(userId: string): Promise<MissionResponse[]> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employer) {
      throw new ForbiddenException('Accès réservé aux employeurs WorkOn');
    }

    const missions = await this.prisma.mission.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: 'desc' },
      select: missionSelect,
    });

    return missions.map((mission) => this.mapToResponse(mission));
  }

  async getAvailableMissionsForWorker(
    userId: string,
    filters: ListAvailableMissionsDto,
  ): Promise<MissionResponse[]> {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new ForbiddenException('Accès réservé aux workers WorkOn');
    }

    const missions = await this.prisma.mission.findMany({
      where: {
        status: MissionStatus.CREATED,
        city: filters.city ? { equals: filters.city, mode: 'insensitive' } : undefined,
        category: filters.category
          ? { equals: filters.category, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      select: missionSelect,
    });

    return missions.map((mission) => this.mapToResponse(mission));
  }

  async updateMissionStatus(
    userId: string,
    missionId: string,
    dto: UpdateMissionStatusDto,
  ): Promise<MissionResponse> {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: {
        id: true,
        user: {
          select: {
            clerkId: true,
          },
        },
      },
    });

    if (!employer) {
      throw new ForbiddenException('Accès réservé aux employeurs WorkOn');
    }

    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        ...missionSelect,
        worker: {
          select: {
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

    if (mission.employerId !== employer.id) {
      throw new ForbiddenException('Impossible de modifier une mission qui ne vous appartient pas');
    }

    // Valider la transition de statut
    this.validateStatusTransition(mission.status, dto.status);

    const oldStatus = mission.status;
    const newStatus = dto.status;

    const updated = await this.prisma.mission.update({
      where: { id: missionId },
      data: { status: newStatus },
      select: missionSelect,
    });

    // Créer une notification pour le worker (si assigné)
    if (mission.worker?.user.clerkId) {
      await this.notificationsService.createForMissionStatusChange(
        missionId,
        oldStatus,
        newStatus,
        mission.worker.user.clerkId,
      );
    }

    return this.mapToResponse(updated);
  }

  async reserveMission(
    userId: string,
    missionId: string,
  ): Promise<MissionResponse> {
    // Vérifier que l'utilisateur est un worker
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!worker) {
      throw new ForbiddenException('Seuls les workers peuvent réserver des missions');
    }

    // Récupérer la mission
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: missionSelect,
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    // Vérifier que la mission est disponible
    if (mission.status !== MissionStatus.CREATED) {
      throw new BadRequestException(
        'Cette mission ne peut plus être réservée (statut actuel: ' +
          mission.status +
          ')',
      );
    }

    // Réserver la mission (atomique)
    const updated = await this.prisma.mission.update({
      where: {
        id: missionId,
        status: MissionStatus.CREATED, // Double check atomique
      },
      data: {
        status: MissionStatus.RESERVED,
        workerId: worker.id,
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h de réservation
      },
      select: missionSelect,
    });

    return this.mapToResponse(updated);
  }

  private validateStatusTransition(
    currentStatus: MissionStatus,
    newStatus: MissionStatus,
  ): void {
    const validTransitions: Record<MissionStatus, MissionStatus[]> = {
      [MissionStatus.CREATED]: [MissionStatus.CANCELLED],
      [MissionStatus.RESERVED]: [
        MissionStatus.IN_PROGRESS,
        MissionStatus.CANCELLED,
      ],
      [MissionStatus.IN_PROGRESS]: [MissionStatus.COMPLETED],
      [MissionStatus.COMPLETED]: [],
      [MissionStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transition invalide: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private mapToResponse(mission: MissionRecord): MissionResponse {
    return {
      id: mission.id,
      title: mission.title,
      description: mission.description ?? null,
      category: mission.category ?? null,
      city: mission.city ?? null,
      address: mission.address ?? null,
      hourlyRate: mission.hourlyRate ?? null,
      startsAt: mission.startsAt ? mission.startsAt.toISOString() : null,
      endsAt: mission.endsAt ? mission.endsAt.toISOString() : null,
      status: mission.status,
      employerId: mission.employerId,
      workerId: mission.workerId ?? null,
      priceCents: mission.priceCents,
      currency: mission.currency,
      createdAt: mission.createdAt.toISOString(),
      updatedAt: mission.updatedAt.toISOString(),
    };
  }

  private buildLocation(dto: CreateMissionDto): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify({
        lat: 0,
        lng: 0,
        city: dto.city ?? null,
        address: dto.address ?? null,
      }),
    );
  }

  private computePriceCents(dto: CreateMissionDto): number {
    if (typeof dto.hourlyRate === 'number' && Number.isFinite(dto.hourlyRate)) {
      return Math.max(0, Math.round(dto.hourlyRate * 100));
    }
    return 0;
  }
}

